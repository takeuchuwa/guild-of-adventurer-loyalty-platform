import { Bot, InlineKeyboard } from "grammy"
import { getDb } from "@loyalty/db/client"
import { benefits as benefitsTable, levelsTiers, prizes as prizesTable } from "@loyalty/db/schema"
import { asc, eq } from "drizzle-orm"
import { texts } from "../texts"
import { Env } from "../types"

export function setupLoyaltyHandlers(bot: Bot, env: Env) {
  // Hears button in main menu
  bot.hears(texts.loyalty_details_button, async (ctx) => {
    await showLoyaltyIntro(ctx as any, env, false)
  })

  // Command shortcut
  bot.command("loyalty", async (ctx) => {
    await showLoyaltyIntro(ctx as any, env, false)
  })

  // Back to intro callback
  bot.callbackQuery("loyalty:intro", async (ctx) => {
    await showLoyaltyIntro(ctx as any, env, true)
    if (ctx.answerCallbackQuery) await ctx.answerCallbackQuery()
  })

  // Per-level callback: lvl:<levelId>
  bot.callbackQuery(/^lvl:(.+)$/i, async (ctx) => {
    const m = ctx.match as RegExpExecArray
    const levelId = m[1]
    await showLevelDetails(ctx as any, env, levelId, true)
  })
}

async function showLoyaltyIntro(ctx: any, env: Env, fromCallback: boolean) {
  const db = getDb(env)
  const levels = await db
    .select({ id: levelsTiers.levelId, name: levelsTiers.name })
    .from(levelsTiers)
    .orderBy(asc(levelsTiers.sortOrder))

  const kb = new InlineKeyboard()
  for (const l of levels) {
    kb.text(l.name, `lvl:${l.id}`)
    kb.row()
  }

  const text = texts.loyalty_details_intro
  const opts: any = { parse_mode: "Markdown", reply_markup: kb }
  if (fromCallback && ctx.editMessageText) {
    await ctx.editMessageText(text, opts)
  } else {
    await ctx.reply(text, opts)
  }
}

export async function showLevelDetails(ctx: any, env: Env, levelId: string, fromCallback: boolean) {
  const db = getDb(env)
  const level = await db.select().from(levelsTiers).where(eq(levelsTiers.levelId, levelId)).get()
  if (!level) {
    if (fromCallback && ctx.answerCallbackQuery) await ctx.answerCallbackQuery({ text: "Рівень не знайдено" })
    await ctx.reply("⚠️ Рівень не знайдено")
    return
  }

  const benefits = await db
    .select({ name: benefitsTable.name, description: benefitsTable.description })
    .from(benefitsTable)
    .where(eq(benefitsTable.levelId, level.levelId))
    .orderBy(asc(benefitsTable.name))
    .all()

  const prizes = await db
    .select({ name: prizesTable.name, description: prizesTable.description })
    .from(prizesTable)
    .where(eq(prizesTable.levelId, level.levelId))
    .orderBy(asc(prizesTable.sortOrder))
    .all()

    let text = `${texts.level_details_title(level.name)}\n\n`

    const discountsText = texts.level_discounts({
        discountProducts: level.discountProducts ?? 0,
        discountActivities: level.discountActivities ?? 0,
        discountGames: level.discountGames ?? 0,
        fixedProducts: level.fixedProducts ?? false,
        fixedActivities: level.fixedActivities ?? false,
        fixedGames: level.fixedGames ?? false,
    })

    text += discountsText

    const benefitsText = texts.level_benefits(benefits)
    if (benefitsText && benefitsText.trim() !== "") {
        text += `\n\n${benefitsText}`
    }

    const prizesText = texts.level_prizes(prizes)
    if (prizesText && prizesText.trim() !== "") {
        text += `\n\n${prizesText}`
    }

  const kb = new InlineKeyboard()
  kb.text("⬅️ Назад", "loyalty:intro")

  const opts: any = { parse_mode: "Markdown", reply_markup: kb }
  if (fromCallback && ctx.editMessageText) {
    await ctx.editMessageText(text, opts)
    if (ctx.answerCallbackQuery) await ctx.answerCallbackQuery()
  } else {
    await ctx.reply(text, opts)
  }
}
