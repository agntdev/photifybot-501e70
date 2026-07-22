import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Secret", data: "category:secret", order: 70 });

const composer = new Composer<Ctx>();

const SECRET_PROMPT = "Secret";

const SECRET_MESSAGE = "🔮 Secret style selected!\n\nSend me your selfie and I'll generate a mysterious version.";

composer.callbackQuery("category:secret", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  ctx.session.activeCategory = SECRET_PROMPT;
  ctx.session.step = "awaiting_selfie";
  
  await ctx.reply(SECRET_MESSAGE, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
