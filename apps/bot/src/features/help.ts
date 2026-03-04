import { keyboards } from "../keyboards"
import { texts } from "../texts"
import { BotContext } from "../types"
import { Bot } from "grammy"

export function setupHelpHandlers(bot: Bot) {
  bot.command("help", async (ctx) => {
    await showHelp(ctx as BotContext)
  })

  bot.hears(texts.help_button, async (ctx) => {
    await showHelp(ctx as BotContext)
  })
}

export function showHelp(ctx: BotContext) {
  return ctx.reply(texts.help_text, {
    parse_mode: "Markdown",
    reply_markup: keyboards.main_menu,
  })
}
