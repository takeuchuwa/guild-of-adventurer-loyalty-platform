import { Bot } from "grammy"
import CryptoJS from "crypto-js"
import { getDb } from "@loyalty/db/client"
import { levelsTiers, members } from "@loyalty/db/schema"
import { asc, eq, or } from "drizzle-orm"
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

function generateMemberQrPayload(memberId: string, qrSecret: string): string {
    const payloadJson = JSON.stringify({ memberId });
    const encryptedPayload = CryptoJS.AES.encrypt(payloadJson, qrSecret).toString();
    return JSON.stringify({ type: "member", payload: encryptedPayload });
}

async function sendQrCode(ctx: BotContext, memberId: string, env: Env) {
    if (!env.QR_SECRET_KEY) return;
    const payload = generateMemberQrPayload(memberId, env.QR_SECRET_KEY);
    
    const encoded = encodeURIComponent(payload);
    const size = 512;
    const margin = 24;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=${margin}&data=${encoded}`;
    
    const caption = "Ваш персональний QR-код. Покажіть його при розрахунку або скануванні.";
    
    try {
        const msg = await ctx.replyWithPhoto(qrUrl, { caption });
        await ctx.api.pinChatMessage(ctx.chat!.id, msg.message_id, { disable_notification: true });
    } catch (e) {
        console.error("Failed to send or pin QR code", e);
        try {
            const fallbackMsg = await ctx.reply(caption);
            await ctx.api.pinChatMessage(ctx.chat!.id, fallbackMsg.message_id, { disable_notification: true });
        } catch (err) {
            console.error("Failed to send fallback message", err);
        }
    }
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

            await ctx.reply(texts.already_registered, { reply_markup: keyboards.main_menu(env) })
            await ctx.reply(texts.mini_app_guide, { reply_markup: keyboards.main_menu(env) })
            await sendQrCode(ctx as BotContext, existing.memberId, env);
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

        await ctx.reply(texts.registered_ok, { reply_markup: keyboards.main_menu(env) })
        await ctx.reply(texts.mini_app_guide, { reply_markup: keyboards.main_menu(env) })
        await sendQrCode(ctx as BotContext, insertValues.memberId, env);
    } catch (e) {
        console.error("[contact] handler error", e)
        await ctx.reply(texts.error_generic)
    }
}

export function setupRegistrationHandlers(bot: Bot, env: Env) {
    // /start → capture referral payload and ask for contact
    bot.command("start", async (ctx) => {
        const payload = (ctx.match as any)?.toString().trim?.() || ""
        const tgId = String(ctx.from?.id || "")
        const db = getDb(env)

        const member = await db.query.members.findFirst({
            where: eq(members.telegramUserId, tgId)
        })

        if (member) {
            // User already registered — send greeting + guide
            await ctx.reply(texts.already_registered, { reply_markup: keyboards.main_menu(env) })
            await ctx.reply(texts.mini_app_guide, { reply_markup: keyboards.main_menu(env) })
            await sendQrCode(ctx as BotContext, member.memberId, env);
            return
        }
        if (payload) {
            setReferralForUser(tgId, payload)
            console.log("[start] captured referral for", tgId, "=>", payload)
        }
        await ctx.reply(texts.welcome, { reply_markup: keyboards.share_contact })
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
