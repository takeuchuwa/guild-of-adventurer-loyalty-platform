import { Bot } from "grammy"
import { getDb } from "@loyalty/db/client"
import { levelsTiers, loyaltyConfigs, members } from "@loyalty/db/schema"
import { asc, eq, inArray, or } from "drizzle-orm"
import { keyboards } from "@/keyboards"
import { texts } from "@/texts"
import { BotContext, Env } from "@/types"
import { v7 as uuidv7 } from 'uuid';

// In-memory referral cache (MVP). Keyed by Telegram user id.
const referralCache = new Map<string, { referrerMemberId: string; expiresAt: number }>()
const REFERRAL_TTL_SECONDS = 15 * 60 // 15 minutes

function setReferralForUser(tgUserId: string, referrerMemberId: string) {
    const now = Math.floor(Date.now() / 1000)
    referralCache.set(String(tgUserId), { referrerMemberId, expiresAt: now + REFERRAL_TTL_SECONDS })
}

function getReferralForUser(tgUserId: string): string | null {
    const now = Math.floor(Date.now() / 1000)
    const entry = referralCache.get(String(tgUserId))
    if (!entry) return null
    if (entry.expiresAt < now) {
        referralCache.delete(String(tgUserId))
        return null
    }
    return entry.referrerMemberId
}

function clearReferralForUser(tgUserId: string) {
    referralCache.delete(String(tgUserId))
}

async function getDefaultLevelId(db: ReturnType<typeof getDb>): Promise<string> {
    // 1) Try explicit default
    const defaultLvl = await db.select().from(levelsTiers).where(eq(levelsTiers.defaultLevel, true as any)).limit(1).get()
    if (defaultLvl?.levelId) return defaultLvl.levelId
    // 2) Fallback to the smallest sortOrder
    const bySort = await db.select().from(levelsTiers).orderBy(asc(levelsTiers.sortOrder)).limit(1).get()
    if (bySort?.levelId) return bySort.levelId
    // 3) Last-resort fallback (ensure admin creates at least one level)
    return "F"
}

export async function registerUser(ctx: BotContext) {
    try {
        const contact = ctx.message?.contact
        if (!contact || !contact.user_id || !ctx.from || contact.user_id !== ctx.from.id) {
            await ctx.reply(texts.contact_only_self)
            return
        }

        const env = (ctx as any).env as Env
        const db = getDb(env)

        const tgId = String(ctx.from.id)
        const phone = normalizePhone(contact.phone_number)
        const now = Math.floor(Date.now() / 1000)

        // Existing member by tg or phone
        const existing = await db.query.members.findFirst({
            where: or(
                eq(members.telegramUserId, tgId),
                phone ? eq(members.phone, phone) : undefined
            )
        })

        if (existing) {
            await db
                .update(members)
                .set({
                    telegramUserId: existing.telegramUserId ?? tgId,
                    phone: existing.phone ?? phone ?? undefined,
                    firstName: existing.firstName || contact.first_name,
                    lastName: existing.lastName || contact.last_name || null,
                    active: true as any,
                    updatedAt: now,
                })
                .where(eq(members.memberId, existing.memberId))

            await ctx.reply(texts.already_registered, { reply_markup: keyboards.main_menu })
            return
        }

        // New member path: adopt referral if present and valid
        const refCandidate = getReferralForUser(tgId)
        let referredBy: string | null = null
        if (refCandidate) {
            const refMember = await db.select({ id: members.memberId }).from(members).where(eq(members.memberId, refCandidate)).get()
            if (refMember?.id) referredBy = refCandidate
        }

        const defaultLevelId = await getDefaultLevelId(db)

        const insertValues = {
            memberId: uuidv7(),
            firstName: contact.first_name,
            lastName: contact.last_name || null,
            phone: phone || null,
            telegramUserId: tgId,
            pointsBalance: 0,
            levelId: defaultLevelId,
            referredBy,
            joinedAt: now,
            updatedAt: now,
            active: true as any,
        }

        await db.insert(members).values(insertValues)

        clearReferralForUser(tgId)

        await ctx.reply(texts.registered_ok, { reply_markup: keyboards.main_menu })
    } catch (e) {
        console.error("[contact] handler error", e)
        await ctx.reply(texts.error_generic)
    }
}

type ReferralRule = {
    levelId: string;
    levelName?: string | null;
    pointsForReferrer: number;
    pointsForReferred: number;
    minPoints?: number
}

async function loadReferralRules(env: Env): Promise<ReferralRule[]> {
    const db = getDb(env)
    const rows = await db
        .select()
        .from(loyaltyConfigs)
        .where(eq(loyaltyConfigs.triggerKey, "level_change"))
        .all()

    // Keep ALL active configs (do not collapse by level)
    const active = rows
        .filter((r) => r.active)
        .map((r) => ({ id: r.configId, cfg: safeParse(r.configJson) }))
        .filter((x) => !!x.cfg) as Array<{ id: string; cfg: any }>

    // Prepare a flat list of configs with their target level and points; preserve original order
    const flat = active
        .map((x, idx) => {
            const lvl = String(x.cfg?.targetLevel || "")
            if (!lvl) return null
            const a = Number(x.cfg?.pointsForReferrer || 0)
            const b = Number(x.cfg?.pointsForReferred || 0)
            return { index: idx, levelId: lvl, pointsForReferrer: a, pointsForReferred: b }
        })
        .filter(Boolean) as Array<{
            index: number;
            levelId: string;
            pointsForReferrer: number;
            pointsForReferred: number
        }>

    if (flat.length === 0) return []

    // Fetch level names/minPoints via IN (acts like left join for existing levels)
    const uniqueLevelIds = Array.from(new Set(flat.map((f) => f.levelId)))
    const levelRows = await db
        .select({ levelId: levelsTiers.levelId, name: levelsTiers.name, minPoints: levelsTiers.minPoints })
        .from(levelsTiers)
        .where(inArray(levelsTiers.levelId, uniqueLevelIds))
        .all()
    const levelMap = new Map(levelRows.map((l) => [l.levelId, { name: l.name, minPoints: l.minPoints }]))

    const items: (ReferralRule & { index: number })[] = flat.map((f) => {
        const meta = levelMap.get(f.levelId)
        return {
            index: f.index,
            levelId: f.levelId,
            levelName: meta?.name ?? null,
            minPoints: meta?.minPoints,
            pointsForReferrer: f.pointsForReferrer,
            pointsForReferred: f.pointsForReferred,
        }
    })

    // Sort by minPoints asc (unknowns last), then by original index to keep stable order for same level
    items.sort((x, y) => {
        const mx = x.minPoints ?? Number.MAX_SAFE_INTEGER
        const my = y.minPoints ?? Number.MAX_SAFE_INTEGER
        if (mx !== my) return mx - my
        return x.index - y.index
    })

    // Drop helper index
    return items.map(({ index, ...rest }) => rest)
}

function safeParse(json: string | null | undefined) {
    if (!json) return null
    try {
        return JSON.parse(json)
    } catch {
        return null
    }
}

async function sendReferralWithQr(ctx: any, env: Env) {
    const db = getDb(env)
    const tgId = String(ctx.from?.id)
    const me = await db.query.members.findFirst({ where: eq(members.telegramUserId, tgId) })
    if (!me) {
        await ctx.reply(texts.please_register_first, { reply_markup: keyboards.share_contact })
        return
    }
    let username = ""
    try {
        const info = JSON.parse(env.BOT_INFO || "{}")
        username = info?.username || ""
    } catch {
    }
    const link = username ? `https://t.me/${username}?start=${me.memberId}` : `https://t.me/<your_bot_username>?start=${me.memberId}`

    // Load referral rules and build message
    const rules = await loadReferralRules(env)
    const rulesText = texts.referral_rules(rules as any)

    // Generate QR code image URL using a public QR service (no extra deps)
    const encoded = encodeURIComponent(link)
    const size = 512
    const margin = 24 // add quiet zone around the QR
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=${margin}&data=${encoded}`

    const caption = `${rulesText}\n\n${texts.your_ref_link}\n${link}`

    // Send QR as a photo with caption; fallback to text if sending fails
    try {
        await ctx.replyWithPhoto(qrUrl, { caption, reply_markup: keyboards.main_menu })
    } catch (err) {
        console.warn("[ref] Failed to send QR image, falling back to text:", err)
        await ctx.reply(caption, { reply_markup: keyboards.main_menu })
    }
}

export function setupReferralHandlers(bot: Bot, env: Env) {
    // /start → capture referral payload and ask for contact
    bot.command("start", async (ctx) => {
        const payload = (ctx.match as any)?.toString().trim?.() || ""
        const tgId = String(ctx.from?.id || "")
        const db = getDb(env)

        const member = await db.query.members.findFirst({
            where: eq(members.telegramUserId, tgId)
        })

        if (member) {
            // User already registered — ignore or send greeting
            return ctx.reply("👋 Ви вже зареєстровані! Продовжуйте користуватися ботом.", { reply_markup: keyboards.main_menu })
        }
        if (payload) {
            setReferralForUser(tgId, payload)
            console.log("[start] captured referral for", tgId, "=>", payload)
        }
        await ctx.reply(texts.welcome, { reply_markup: keyboards.share_contact })
    })

    // /ref → show personal referral link with QR code
    bot.command("ref", async (ctx) => {
        await sendReferralWithQr(ctx, env)
    })

    // Button press: referral
    bot.hears(texts.ref_button, async (ctx) => {
        await sendReferralWithQr(ctx, env)
    })

    // Handle contact share
    bot.on("message:contact", async (ctx) => {
        await registerUser(ctx as BotContext)
    })
}

function normalizePhone(p?: string | null): string | null {
    if (!p) return null
    const digits = p.replace(/[^\d+]/g, "")
    return digits.startsWith("+") ? digits : "+" + digits.replace(/^0+/, "")
}
