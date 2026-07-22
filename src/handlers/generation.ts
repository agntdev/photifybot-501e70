import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const GENERATING = "⏳ Generating your image…";

const SUCCESS_MESSAGE = "✨ Here's your new look!";

const ERROR_MESSAGE = "😅 Oops! Something went wrong with the generation. Let's try that again!";

const CANCEL_MESSAGE = "Generation cancelled.";

const CATEGORY_PROMPTS: Record<string, string> = {
  Love: "romantic love style, hearts, warm colors, soft lighting",
  Fashion: "high fashion style, trendy, stylish, editorial look",
};

composer.on("message:photo", async (ctx) => {
  if (ctx.session.step !== "awaiting_selfie") {
    return;
  }
  
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  ctx.session.selfieFileId = photo.file_id;
  ctx.session.step = "generating";
  
  const category = ctx.session.activeCategory ?? "custom";
  const prompt = CATEGORY_PROMPTS[category] ?? category;
  
  const progressMsg = await ctx.reply(GENERATING, {
    reply_markup: inlineKeyboard([
      [inlineButton("Cancel", `cancel:${ctx.from.id}`)],
    ]),
  });
  
  try {
    const result = await generateImage(photo.file_id, prompt);
    
    if (result.status === "success" && result.url) {
      await ctx.replyWithPhoto(result.url, {
        caption: SUCCESS_MESSAGE,
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      });
    } else if (result.status === "illegal") {
      await ctx.reply("⚠️ This image couldn't be processed due to content restrictions. Try a different photo.", {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      });
    } else {
      throw new Error("Generation failed");
    }
  } catch (error) {
    await ctx.reply(ERROR_MESSAGE, {
      reply_markup: inlineKeyboard([
        [inlineButton("🔄 Try again", `retry:${ctx.from.id}`)],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
  } finally {
    ctx.session.step = "idle";
  }
});

composer.on("message:text", async (ctx, next) => {
  if (!ctx.session.selfieFileId) {
    return next();
  }

  const text = ctx.message.text.trim();

  if (text.startsWith("/")) {
    return next();
  }

  if (!text) {
    await ctx.reply("Type a style description — for example: \"cyberpunk neon glow\" or \"retro 80s aesthetic\".");
    return;
  }

  ctx.session.step = "generating";

  const progressMsg = await ctx.reply(GENERATING, {
    reply_markup: inlineKeyboard([
      [inlineButton("Cancel", `cancel:${ctx.from.id}`)],
    ]),
  });

  try {
    const result = await generateImage(ctx.session.selfieFileId, text);

    if (result.status === "success" && result.url) {
      await ctx.replyWithPhoto(result.url, {
        caption: SUCCESS_MESSAGE,
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      });
    } else if (result.status === "illegal") {
      await ctx.reply("⚠️ This image couldn't be processed due to content restrictions. Try a different photo.", {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      });
    } else {
      throw new Error("Generation failed");
    }
  } catch (error) {
    await ctx.reply(ERROR_MESSAGE, {
      reply_markup: inlineKeyboard([
        [inlineButton("🔄 Try again", `retry:${ctx.from.id}`)],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
  } finally {
    ctx.session.step = "idle";
  }
});

composer.callbackQuery(/^retry:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = parseInt(ctx.match[1], 10);
  
  if (ctx.from.id !== userId) {
    return;
  }
  
  if (!ctx.session.selfieFileId) {
    await ctx.reply("No selfie to retry with — upload a new one first!");
    return;
  }
  
  ctx.session.step = "generating";
  
  const category = ctx.session.activeCategory ?? "custom";
  const prompt = CATEGORY_PROMPTS[category] ?? category;
  
  const progressMsg = await ctx.reply(GENERATING, {
    reply_markup: inlineKeyboard([
      [inlineButton("Cancel", `cancel:${ctx.from.id}`)],
    ]),
  });
  
  try {
    const result = await generateImage(ctx.session.selfieFileId, prompt);
    
    if (result.status === "success" && result.url) {
      await ctx.replyWithPhoto(result.url, {
        caption: SUCCESS_MESSAGE,
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      });
    } else {
      throw new Error("Generation failed");
    }
  } catch (error) {
    await ctx.reply(ERROR_MESSAGE, {
      reply_markup: inlineKeyboard([
        [inlineButton("🔄 Try again", `retry:${ctx.from.id}`)],
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
  } finally {
    ctx.session.step = "idle";
  }
});

composer.callbackQuery(/^cancel:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const userId = parseInt(ctx.match[1], 10);
  
  if (ctx.from.id !== userId) {
    return;
  }
  
  ctx.session.step = "idle";
  ctx.session.generationJobId = undefined;
  
  await ctx.editMessageText(CANCEL_MESSAGE, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

async function generateImage(
  fileId: string,
  prompt: string,
): Promise<{ status: "success" | "failed" | "illegal"; url?: string }> {
  const apiEndpoint = process.env.FACEFUSION_API_ENDPOINT;
  const apiKey = process.env.FACEFUSION_API_KEY;
  
  if (!apiEndpoint || !apiKey) {
    return { status: "failed" };
  }
  
  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        source_image: fileId,
        prompt: prompt,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 400 && (errorData as any).error?.includes("illegal")) {
        return { status: "illegal" };
      }
      
      return { status: "failed" };
    }
    
    const data = await response.json() as { image_url: string };
    
    return {
      status: "success",
      url: data.image_url,
    };
  } catch (error) {
    return { status: "failed" };
  }
}

export default composer;
