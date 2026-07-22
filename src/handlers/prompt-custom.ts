import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const CUSTOM_MESSAGE = "✏️ Custom prompt mode!\n\nType your own style description — for example: \"cyberpunk neon glow\" or \"retro 80s aesthetic\".";

const AWAITING_PROMPT = "Type your custom prompt below:";

composer.callbackQuery("prompt:custom", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  ctx.session.activeCategory = "custom";
  ctx.session.step = "awaiting_custom_prompt";
  
  await ctx.reply(CUSTOM_MESSAGE, {
    reply_markup: {
      force_reply: true,
      selective: false,
    },
  });
});

composer.on("message:text", async (ctx, next) => {
  if (ctx.session.step !== "awaiting_custom_prompt") {
    return next();
  }
  
  const prompt = ctx.message.text.trim();
  if (prompt.length < 2) {
    await ctx.reply("Prompt is too short — try again with more detail.");
    return;
  }
  
  ctx.session.activeCategory = prompt;
  ctx.session.step = "awaiting_selfie";
  
  await ctx.reply(`✨ Prompt set: "${prompt}"\n\nSend me your selfie and I'll generate something special!`, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
