import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const GENERATING = "⏳ Generating your image…";

const SUCCESS_MESSAGE = "✨ Here's your new look!";

const ERROR_MESSAGE = "😅 Oops! Something went wrong with the generation. Let's try that again!";

const CANCEL_MESSAGE = "Generation cancelled.";

const ILLEGAL_MESSAGE = "⚠️ This image couldn't be processed due to content restrictions. Try a different photo.";

const SELFIE_STORED_MESSAGE = "Selfie stored! Now pick a style from the menu or type your own prompt.";

const CATEGORY_PROMPTS: Record<string, string> = {
  Love: "romantic love style, hearts, warm colors, soft lighting",
  Fashion: "high fashion style, trendy, stylish, editorial look",
  Lifestyle: "lifestyle photography, natural, authentic, everyday beauty",
  Culture: "cultural art style, traditional patterns, rich heritage",
  Dream: "dreamy ethereal style, soft focus, magical atmosphere",
  "Social Media": "social media influencer style, vibrant, eye-catching, polished",
  Secret: "mysterious secret agent style, dramatic lighting, enigmatic",
};

composer.on("message:photo", async (ctx) => {
  if (ctx.session.step === "generating") return;

  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  ctx.session.selfieFileId = photo.file_id;

  if (ctx.session.activeCategory) {
    ctx.session.step = "generating";
    const category = ctx.session.activeCategory;
    const prompt = CATEGORY_PROMPTS[category] ?? category;

    const progressMsg = await ctx.reply(GENERATING, {
      reply_markup: inlineKeyboard([
        [inlineButton("Cancel", `cancel:${ctx.from.id}`)],
      ]),
    });

    try {
      const result = await generateImage(ctx, photo.file_id, prompt);

      if (result.status === "success" && result.url) {
        await ctx.replyWithPhoto(result.url, {
          caption: SUCCESS_MESSAGE,
          reply_markup: inlineKeyboard([
            [inlineButton("⬅️ Back to menu", "menu:main")],
          ]),
        });
      } else if (result.status === "illegal") {
        await ctx.reply(ILLEGAL_MESSAGE, {
          reply_markup: inlineKeyboard([
            [inlineButton("⬅️ Back to menu", "menu:main")],
          ]),
        });
      } else {
        throw new Error("Generation failed");
      }
    } catch (error) {
      console.error("[generation] Error:", error);
      await ctx.reply(ERROR_MESSAGE, {
        reply_markup: inlineKeyboard([
          [inlineButton("🔄 Try again", `retry:${ctx.from.id}`)],
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      });
    } finally {
      ctx.session.step = "idle";
    }
  } else {
    ctx.session.step = "awaiting_selfie";
    await ctx.reply(SELFIE_STORED_MESSAGE, {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
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
    const result = await generateImage(ctx, ctx.session.selfieFileId, text);

    if (result.status === "success" && result.url) {
      await ctx.replyWithPhoto(result.url, {
        caption: SUCCESS_MESSAGE,
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      });
    } else if (result.status === "illegal") {
      await ctx.reply(ILLEGAL_MESSAGE, {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      });
    } else {
      throw new Error("Generation failed");
    }
  } catch (error) {
    console.error("[generation] Error:", error);
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
    await ctx.reply("No selfie to retry with — upload a new one first!", {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
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
    const result = await generateImage(ctx, ctx.session.selfieFileId, prompt);

    if (result.status === "success" && result.url) {
      await ctx.replyWithPhoto(result.url, {
        caption: SUCCESS_MESSAGE,
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      });
    } else if (result.status === "illegal") {
      await ctx.reply(ILLEGAL_MESSAGE, {
        reply_markup: inlineKeyboard([
          [inlineButton("⬅️ Back to menu", "menu:main")],
        ]),
      });
    } else {
      throw new Error("Generation failed");
    }
  } catch (error) {
    console.error("[generation] Retry error:", error);
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

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;
const API_TIMEOUT_MS = 30_000;

function validateApiCredentials(): { ok: true; endpoint: string; key: string } | { ok: false } {
  const endpoint = process.env.FACEFUSION_API_ENDPOINT;
  const key = process.env.FACEFUSION_API_KEY;
  if (!endpoint || !key) {
    console.error("[generation] FACEFUSION_API_ENDPOINT or FACEFUSION_API_KEY not set — image generation is disabled");
    return { ok: false };
  }
  return { ok: true, endpoint, key };
}

function isRetryableError(error: unknown): boolean {
  const msg = (error as Error).message ?? String(error);
  if (msg.includes("ECONNRESET") || msg.includes("ETIMEDOUT") || msg.includes("fetch failed")) {
    return true;
  }
  if (msg.includes("network") || msg.includes("Network")) {
    return true;
  }
  return false;
}

async function generateImage(
  ctx: Ctx,
  fileId: string,
  prompt: string,
): Promise<{ status: "success" | "failed" | "illegal"; url?: string }> {
  const creds = validateApiCredentials();
  if (!creds.ok) {
    return { status: "failed" };
  }

  const start = Date.now();

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const file = await ctx.api.getFile(fileId);
      if (!file || !file.file_path) {
        throw new Error("Failed to get file info from Telegram");
      }

      const botToken = ctx.api.token;
      const photoUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;
      const photoResponse = await fetch(photoUrl);
      if (!photoResponse.ok) {
        throw new Error(`Failed to download photo: ${photoResponse.status}`);
      }
      const photoBlob = await photoResponse.blob();

      const formData = new FormData();
      formData.append("source_image", photoBlob, "selfie.jpg");
      formData.append("prompt", prompt);

      const response = await fetch(creds.endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${creds.key}`,
        },
        body: formData,
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error(`[generation] API error: ${response.status} ${errorText} (attempt ${attempt}/${MAX_RETRIES})`);

        if (response.status === 400 && errorText.includes("illegal")) {
          return { status: "illegal" };
        }

        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * attempt));
          continue;
        }

        return { status: "failed" };
      }

      const data = (await response.json()) as { image_url?: string; url?: string; result?: string };
      const imageUrl = data.image_url ?? data.url ?? data.result;
      if (!imageUrl) {
        console.error("[generation] No image URL in response:", JSON.stringify(data).slice(0, 200));
        return { status: "failed" };
      }

      const duration = Date.now() - start;
      console.log(`[generation] Success in ${duration}ms (attempt ${attempt})`);

      return { status: "success", url: imageUrl };
    } catch (error) {
      const msg = (error as Error).message ?? String(error);
      console.error(`[generation] Error: ${msg} (attempt ${attempt}/${MAX_RETRIES})`);

      if (attempt < MAX_RETRIES && isRetryableError(error)) {
        await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * attempt));
        continue;
      }

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY_MS * attempt));
        continue;
      }

      return { status: "failed" };
    }
  }

  return { status: "failed" };
}

export default composer;
