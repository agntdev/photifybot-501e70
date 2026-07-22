import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const LOVE_PROMPT = "Love";
const PROMPT_TEMPLATE = "romantic love style, hearts, warm colors, soft lighting";

const LOVE_MESSAGE = "💕 Love style selected!\n\nSend me your selfie and I'll generate a love-themed version.";

const GENERATING = "⏳ Generating your love-themed image…";

const ERROR_MESSAGE = "😅 Oops! Something went wrong with the generation. Let's try that again!";

composer.callbackQuery("category:love", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  ctx.session.activeCategory = LOVE_PROMPT;
  ctx.session.step = "awaiting_selfie";
  
  await ctx.reply(LOVE_MESSAGE, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
