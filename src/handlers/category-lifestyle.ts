import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Lifestyle", data: "category:lifestyle", order: 30 });

const composer = new Composer<Ctx>();

const LIFESTYLE_PROMPT = "Lifestyle";

const LIFESTYLE_MESSAGE = "🌿 Lifestyle style selected!\n\nSend me your selfie and I'll generate a lifestyle version.";

composer.callbackQuery("category:lifestyle", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  ctx.session.activeCategory = LIFESTYLE_PROMPT;
  ctx.session.step = "awaiting_selfie";
  
  await ctx.reply(LIFESTYLE_MESSAGE, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
