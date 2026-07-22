import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const FASHION_PROMPT = "Fashion";
const PROMPT_TEMPLATE = "high fashion style, trendy, stylish, editorial look";

const FASHION_MESSAGE = "👗 Fashion style selected!\n\nSend me your selfie and I'll generate a fashion-forward version.";

const GENERATING = "⏳ Generating your fashion image…";

const ERROR_MESSAGE = "😅 Oops! Something went wrong with the generation. Let's try that again!";

composer.callbackQuery("category:fashion", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  ctx.session.activeCategory = FASHION_PROMPT;
  ctx.session.step = "awaiting_selfie";
  
  await ctx.reply(FASHION_MESSAGE, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
