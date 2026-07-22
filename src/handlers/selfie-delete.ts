import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";

const composer = new Composer<Ctx>();

const DELETE_SUCCESS = "🗑️ Selfie deleted! You can upload a new one anytime.";

const NO_SELFIE = "No selfie to delete yet — upload one first!";

composer.callbackQuery("selfie:delete", async (ctx) => {
  await ctx.answerCallbackQuery();
  
  if (!ctx.session.selfieFileId) {
    await ctx.reply(NO_SELFIE, {
      reply_markup: inlineKeyboard([
        [inlineButton("⬅️ Back to menu", "menu:main")],
      ]),
    });
    return;
  }
  
  ctx.session.selfieFileId = undefined;
  
  await ctx.reply(DELETE_SUCCESS, {
    reply_markup: inlineKeyboard([
      [inlineButton("⬅️ Back to menu", "menu:main")],
    ]),
  });
});

export default composer;
