import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Social", data: "category:social", order: 60 });

const composer = new Composer<Ctx>();

const SOCIAL_PROMPT = "Social Media";

const SOCIAL_MESSAGE = "📱 Social Media style selected!\n\nSend me your selfie and I'll generate a social media-ready version.";

composer.callbackQuery("category:social", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  ctx.session.activeCategory = SOCIAL_PROMPT;
  ctx.session.step = "awaiting_selfie";
  
  await ctx.reply(SOCIAL_MESSAGE, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
