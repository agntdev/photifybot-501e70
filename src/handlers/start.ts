import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { mainMenuKeyboard, registerMainMenuItem } from "../toolkit/index.js";

registerMainMenuItem({ label: "Love", data: "category:love", order: 10 });
registerMainMenuItem({ label: "Fashion", data: "category:fashion", order: 20 });
registerMainMenuItem({ label: "Custom prompt", data: "prompt:custom", order: 30 });
registerMainMenuItem({ label: "Delete selfie", data: "selfie:delete", order: 40 });

const composer = new Composer<Ctx>();

const WELCOME = "👋 Welcome! Tap a button below to get started.";

composer.command("start", async (ctx) => {
  await ctx.reply(WELCOME, { reply_markup: mainMenuKeyboard() });
});

composer.callbackQuery("menu:main", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME, { reply_markup: mainMenuKeyboard() });
});

export default composer;
