import { getDb } from "@loyalty/db/client"
import { activities, members, pointsLedger, products } from "@loyalty/db/schema"
import { desc, eq, sql } from "drizzle-orm"
import { keyboards } from "../keyboards"
import { texts } from "../texts"
import { BotContext, Env } from "../types"
import { InlineKeyboard } from "grammy"

const PAGE_SIZE = 5

function buildHistoryKeyboard(page: number, hasPrev: boolean, hasNext: boolean) {
  const kb = new InlineKeyboard()
  if (hasPrev) kb.text("⬅️", `hist:${page - 1}`)
  if (hasNext) kb.text("➡️", `hist:${page + 1}`)
  return kb
}

export async function showPointsHistory(ctx: BotContext, page: number = 1) {
  const env = (ctx as any).env as Env
  const db = getDb(env)

  const tgId = String(ctx.from?.id)
  const member = await db.query.members.findFirst({ where: eq(members.telegramUserId, tgId) })

  if (!member) {
    await ctx.reply(texts.not_registered)
    return
  }

  try {
    // total count
    const totalRes = await db
      .select({ cnt: sql<number>`count(*)`.as("cnt") })
      .from(pointsLedger)
      .where(eq(pointsLedger.memberId, member.memberId))

    const total = totalRes[0]?.cnt ?? 0
    if (total === 0) {
      await ctx.reply(texts.points_history_empty, { reply_markup: keyboards.main_menu })
      return
    }

    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const safePage = Math.min(Math.max(1, page), pageCount)
    const offset = (safePage - 1) * PAGE_SIZE

    const rows = await db
      .select({
        delta: pointsLedger.delta,
        balanceAfter: pointsLedger.balanceAfter,
        occurredAt: pointsLedger.occurredAt,
        adminNote: pointsLedger.adminNote,
        activityId: pointsLedger.activityId,
        activityName: activities.name,
        activityGameId: activities.gameId,
        productId: pointsLedger.productId,
        productName: products.name,
      })
      .from(pointsLedger)
      .leftJoin(activities, eq(pointsLedger.activityId, activities.activityId))
      .leftJoin(products, eq(pointsLedger.productId, products.productId))
      .where(eq(pointsLedger.memberId, member.memberId))
      .orderBy(desc(pointsLedger.occurredAt))
      .limit(PAGE_SIZE)
      .offset(offset)

    const entries = rows.map((r) => ({
      delta: r.delta,
      balanceAfter: r.balanceAfter,
      occurredAt: r.occurredAt,
      adminNote: r.adminNote,
      activity: r.activityId ? { id: r.activityId, name: r.activityName ?? r.activityId, hasGame: !!r.activityGameId } : null,
      product: r.productId ? { id: r.productId, name: r.productName ?? r.productId } : null,
    }))

    const historyText = texts.points_history(entries, safePage, pageCount)

    const hasPrev = safePage > 1
    const hasNext = safePage < pageCount

    const replyMarkup = hasPrev || hasNext ? buildHistoryKeyboard(safePage, hasPrev, hasNext) : keyboards.main_menu

    const opts: any = { parse_mode: "Markdown", reply_markup: replyMarkup }

    // If called from callback, edit; else send new message
    if (ctx.callbackQuery) {
      await ctx.editMessageText(historyText, opts)
      await ctx.answerCallbackQuery()
    } else {
      await ctx.reply(historyText, opts)
    }
  } catch (error) {
    console.error("[points_history] error:", error)
    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({ text: "Помилка", show_alert: false })
    }
    await ctx.reply(texts.error_generic)
  }
}
