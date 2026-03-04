import { getDb } from "@loyalty/db/client"
import { levelsTiers, members, benefits as benefitsTable, prizes as prizesTable, memberPrizesClaimed } from "@loyalty/db/schema"
import { asc, eq, gt, and } from "drizzle-orm"
import { texts } from "../texts"
import { BotContext, Env } from "../types"
import { keyboards } from "@/keyboards";

export async function showLevel(ctx: BotContext) {
  const env = (ctx as any).env as Env
  const db = getDb(env)

  const tgId = String(ctx.from?.id)
  const member = await db.query.members.findFirst({ where: eq(members.telegramUserId, tgId) })

  if (!member) {
    await ctx.reply(texts.not_registered)
    return
  }

  // Fetch current level
  const current = await db.select().from(levelsTiers).where(eq(levelsTiers.levelId, member.levelId)).get()
  if (!current) {
    await ctx.reply(texts.level_not_found)
    return
  }

  // Find next level with higher threshold, ordered by sortOrder
  const next = await db
    .select()
    .from(levelsTiers)
    .where(gt(levelsTiers.minPoints, current.minPoints))
    .orderBy(asc(levelsTiers.sortOrder))
    .limit(1)
    .get()

  // Fetch benefits for the current level
  const perks = await db
    .select({ name: benefitsTable.name, description: benefitsTable.description })
    .from(benefitsTable)
    .where(eq(benefitsTable.levelId, member.levelId))
    .orderBy(asc(benefitsTable.name))
    .all()

  let text = ""
  if (next) {
    const progress = member.pointsBalance - current.minPoints
    const needed = next.minPoints - current.minPoints
    const remaining = Math.max(0, next.minPoints - member.pointsBalance)

    text += texts.level_progress(current.name, member.pointsBalance, progress, needed, next.name, remaining)
  } else {
    text += texts.level_max(current.name, member.pointsBalance)
  }

  // Append discounts and benefits
  text += "\n\n" + texts.level_discounts({
    discountProducts: current.discountProducts ?? 0,
    discountActivities: current.discountActivities ?? 0,
    discountGames: current.discountGames ?? 0,
    fixedProducts: current.fixedProducts ?? false,
    fixedActivities: current.fixedActivities ?? false,
    fixedGames: current.fixedGames ?? false,
  })

  text += "\n\n" + texts.level_benefits(perks)

  // Check claimable prizes for this level (if not yet claimed)
  const prizes = await db
    .select({ name: prizesTable.name, description: prizesTable.description })
    .from(prizesTable)
    .where(eq(prizesTable.levelId, member.levelId))
    .orderBy(asc(prizesTable.sortOrder))
    .all()

  const claimedRow = await db
    .select({ levelId: memberPrizesClaimed.levelId })
    .from(memberPrizesClaimed)
    .where(and(eq(memberPrizesClaimed.memberId, member.memberId), eq(memberPrizesClaimed.levelId, member.levelId)))
    .get()

  if (!claimedRow && prizes.length > 0) {
    text += "\n" + texts.claimable_prizes_notice(prizes.length)
    text += "\n" + texts.level_prizes(prizes)
  }

  await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboards.main_menu })
}
