import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Culture", data: "category:culture", order: 40 });

const composer = new Composer<Ctx>();

const CULTURE_PROMPT = "Culture";

const CULTURE_MESSAGE = "🎭 Culture style selected!\n\nSend me your selfie and I'll generate a culture-themed version.";

composer.callbackQuery("category:culture", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  ctx.session.activeCategory = CULTURE_PROMPT;
  ctx.session.step = "awaiting_selfie";
  
  await ctx.reply(CULTURE_MESSAGE, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
