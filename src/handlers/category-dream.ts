import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Dream", data: "category:dream", order: 50 });

const composer = new Composer<Ctx>();

const DREAM_PROMPT = "Dream";

const DREAM_MESSAGE = "🌙 Dream style selected!\n\nSend me your selfie and I'll generate a dreamy version.";

composer.callbackQuery("category:dream", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  ctx.session.activeCategory = DREAM_PROMPT;
  ctx.session.step = "awaiting_selfie";
  
  await ctx.reply(DREAM_MESSAGE, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
