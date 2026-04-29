// @ts-ignore - Cloudflare Workers handle node:buffer natively but types may not be installed
import { Buffer } from "node:buffer"
import { Hono } from "hono"
import { getDb } from "@loyalty/db/client"
import {
    benefits as benefitsTable,
    levelsTiers,
    memberPrizesClaimed,
    members,
    memberSettings,
    pointsLedger,
    promotions,
    activities,
    products,
    prizes as prizesTable,
    levelPromotions,
    promotionAssignments,
    memberPromotionUsages,
    games
} from "@loyalty/db/schema"
import { and, asc, eq, sql, lte, isNull, desc, lt, gte, or, inArray } from "drizzle-orm"
import { alias } from "drizzle-orm/sqlite-core"
import { buildPagination, buildSearch, parsePagination, parseSort } from "@/utils/query-helpers"
import type { Env } from "@/types/env"
import z from "zod"
import { checkAndProcessLevelUp } from "@/utils/level-up"
import { v7 as uuidv7 } from 'uuid';
import { generateCursor } from 'drizzle-cursor';
import CryptoJS from "crypto-js";
import { sendBatchNotifications } from "@/utils/notify";
import { generateMemberQrPayload } from "@/utils/qr";

const NAME_REGEX = /^[\p{L}\s\-']+$/u
const NICKNAME_REGEX = /^[\p{L}\p{N}_\-]+$/u
const MIN_BIRTH_YEAR = 1924
const MAX_BIRTH_YEAR = new Date().getFullYear() - 16

const MemberUpdateBody = z.object({
    firstName: z.string().trim().min(1, "Ім'я обов'язкове").max(255)
        .regex(NAME_REGEX, "Ім'я може містити лише літери, пробіли, дефіси та апострофи")
        .nullable(),
    lastName: z.string().trim().min(1, "Прізвище обов'язкове").max(255)
        .regex(NAME_REGEX, "Прізвище може містити лише літери, пробіли, дефіси та апострофи")
        .nullable(),
    nickname: z.string().trim().min(2, "Нікнейм має бути не менше 2 символів").max(32)
        .regex(NICKNAME_REGEX, "Нікнейм може містити лише літери, цифри, дефіси та підкреслення")
        .refine(val => !/^\d/.test(val), { message: "Нікнейм не може починатися з цифри" })
        .optional().nullable(),
    birthDate: z.string().optional().nullable().refine((val) => {
        if (!val) return true
        const year = new Date(val).getFullYear()
        return !isNaN(year) && year >= MIN_BIRTH_YEAR && year <= MAX_BIRTH_YEAR
    }, { message: `Мінімальний вік — 16 років. Дата народження має бути між ${MIN_BIRTH_YEAR} та ${MAX_BIRTH_YEAR} роком` }),
})

const PointsAdjustmentBody = z.object({
    points: z.number().int("Бали мають бути цілим числом"),
    reason: z.string().trim().min(1, "Причина обов'язкова").max(500),
})

export const membersRoute = new Hono<Env>()

import { telegramAuth } from "@/middleware/telegramAuth"
import { fetchPromoTargetNames, filterValidPromosForMember } from "@/utils/promotions"

membersRoute.get("/@self", telegramAuth, async (c) => {
    try {
        const tgUser = c.get("tgUser")
        const db = getDb(c.env)

        const member = await db.select({
            memberId: members.memberId,
            firstName: members.firstName,
            lastName: members.lastName,
            nickname: members.nickname,
            phone: members.phone,
            pointsBalance: members.pointsBalance,
            levelId: members.levelId,
            birthDate: members.birthDate,
            referredBy: members.referredBy,
            joinedAt: members.joinedAt,
            statistics: members.statistics,
        })
            .from(members)
            .where(eq(members.telegramUserId, String(tgUser.id)))
            .get()

        if (!member) {
            return c.json({ ok: false, error: "NOT_FOUND", message: "Member not found" }, 404)
        }

        const targetLevel = alias(levelsTiers, "target_level")
        const nowSeconds = Math.floor(Date.now() / 1000)

        const [unclaimedLevelsData, activeLevelPromosRaw, activeMemberPromosRaw] = await db.batch([
            db.select({
                levelId: targetLevel.levelId,
                levelName: targetLevel.name,
                prizes: sql<string>`group_concat(${prizesTable.name}, ', ')`
            })
                .from(members)
                .innerJoin(levelsTiers, eq(members.levelId, levelsTiers.levelId))
                .innerJoin(targetLevel, lte(targetLevel.sortOrder, levelsTiers.sortOrder))
                .innerJoin(prizesTable, eq(prizesTable.levelId, targetLevel.levelId))
                .leftJoin(memberPrizesClaimed, and(
                    eq(memberPrizesClaimed.memberId, members.memberId),
                    eq(memberPrizesClaimed.levelId, targetLevel.levelId)
                ))
                .where(and(
                    eq(members.memberId, member.memberId),
                    isNull(memberPrizesClaimed.claimId)
                ))
                .groupBy(targetLevel.levelId)
                .orderBy(asc(targetLevel.sortOrder)),

            db.select({ promo: promotions }).from(levelPromotions)
                .innerJoin(promotions, eq(promotions.promoId, levelPromotions.promoId))
                .where(and(eq(levelPromotions.levelId, member.levelId), eq(promotions.active, true), or(eq(promotions.startDate, -1), lte(promotions.startDate, nowSeconds)), or(eq(promotions.endDate, -1), gte(promotions.endDate, nowSeconds)), or(isNull(promotions.usageRemaining), gte(promotions.usageRemaining, 1)))),

            db.select({ promo: promotions }).from(promotionAssignments)
                .innerJoin(promotions, eq(promotions.promoId, promotionAssignments.promoId))
                .where(and(eq(promotionAssignments.memberId, member.memberId), eq(promotionAssignments.status, "AVAILABLE"), eq(promotions.active, true), or(eq(promotions.startDate, -1), lte(promotions.startDate, nowSeconds)), or(eq(promotions.endDate, -1), gte(promotions.endDate, nowSeconds)), or(isNull(promotions.usageRemaining), gte(promotions.usageRemaining, 1))))
        ])

        const unclaimedPrizes = unclaimedLevelsData.map((d: any) => ({
            levelId: d.levelId,
            levelName: d.levelName,
            prizesString: d.prizes || ""
        }))

        // Promo logic
        const rawLvlPromos = activeLevelPromosRaw.map((r: any) => r.promo);
        const rawMemberPromos = activeMemberPromosRaw.map((r: any) => r.promo);
        const allPromosRaw = [...rawLvlPromos, ...rawMemberPromos];

        let usagesMap: Record<string, number[]> = {};
        if (allPromosRaw.length > 0) {
            const pIds = allPromosRaw.map(p => p.promoId);
            const usages = await db.select({ promoId: memberPromotionUsages.promoId, usedAt: memberPromotionUsages.usedAt })
                .from(memberPromotionUsages)
                .where(and(eq(memberPromotionUsages.memberId, member.memberId), inArray(memberPromotionUsages.promoId, pIds)))

            for (const u of usages) {
                if (!usagesMap[u.promoId]) usagesMap[u.promoId] = [];
                usagesMap[u.promoId].push(u.usedAt);
            }
        }

        const validLevelPromos = filterValidPromosForMember(rawLvlPromos, member, usagesMap)
        const validMemberPromos = filterValidPromosForMember(rawMemberPromos, member, usagesMap)
        const allPromos = [...validLevelPromos, ...validMemberPromos]

        let promoMap = new Map();
        if (allPromos.length > 0) {
            promoMap = await fetchPromoTargetNames(db, allPromos);
        }

        const resultPromotions = allPromos.map(p => {
            let config = typeof p.config === 'string' ? JSON.parse(p.config) : (p.config || {});

            const isPersonal = validMemberPromos.some((vp: any) => vp.promoId === p.promoId);

            return {
                promoId: p.promoId,
                name: p.name,
                description: p.description,
                promoCode: p.promoCode,
                startDate: p.startDate,
                endDate: p.endDate,
                config,
                isPersonal
            };
        });

        const targetsMap = Object.fromEntries(promoMap);

        const qrSecret = c.env.QR_SECRET_KEY;
        const qrCodeString = generateMemberQrPayload(member.memberId, qrSecret);

        return c.json({ ok: true, data: { ...member, qrcode: qrCodeString, photoUrl: tgUser?.photoUrl ?? tgUser?.photo_url ?? null, unclaimedPrizes, promotions: resultPromotions, targetsMap } }, 200)
    } catch (err: any) {
        console.error("[GET /members/@self] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

membersRoute.get("/@self/history", telegramAuth, async (c) => {
    try {
        const tgUser = c.get("tgUser")
        const db = getDb(c.env)

        const member = await db.select({
            memberId: members.memberId,
        })
            .from(members)
            .where(eq(members.telegramUserId, String(tgUser.id)))
            .get()

        if (!member) {
            return c.json({ ok: false, error: "NOT_FOUND", message: "Member not found" }, 404)
        }

        const url = new URL(c.req.url)
        const { cursor, pageSize } = parsePagination(url)

        const cursorConfig = generateCursor({
            cursors: [
                {
                    order: 'DESC',
                    key: 'occurredAt',
                    schema: pointsLedger.occurredAt
                }
            ],
            primaryCursor: {
                order: 'DESC',
                key: 'entryId',
                schema: pointsLedger.entryId
            }
        });

        let validCursor = cursor;
        if (cursor) {
            try {
                const decodedJson = Buffer.from(cursor, 'base64').toString('utf-8');
                const cursorObj = JSON.parse(decodedJson);
                if (!('occurredAt' in cursorObj) || !('entryId' in cursorObj)) {
                    validCursor = null;
                }
            } catch (e) {
                validCursor = null;
            }
        }

        const cursorWhereExpr = validCursor ? cursorConfig.where(validCursor) : undefined;

        const dataWhereConditions: any[] = [eq(pointsLedger.memberId, member.memberId)]
        if (cursorWhereExpr) {
            dataWhereConditions.push(cursorWhereExpr)
        }
        const dataWhereExpr = and(...dataWhereConditions)

        const query = db.select({
            entryId: pointsLedger.entryId,
            occurredAt: pointsLedger.occurredAt,
            delta: pointsLedger.delta,
            balanceAfter: pointsLedger.balanceAfter,
            adminNote: pointsLedger.adminNote,
            activityName: activities.name,
            gameId: activities.gameId,
            gameName: games.name,
            productName: products.name,
            promoName: promotions.name,
        })
            .from(pointsLedger)
            .leftJoin(promotions, eq(pointsLedger.promoId, promotions.promoId))
            .leftJoin(activities, eq(pointsLedger.activityId, activities.activityId))
            .leftJoin(games, eq(activities.gameId, games.gameId))
            .leftJoin(products, eq(pointsLedger.productId, products.productId))
            .where(dataWhereExpr)

        query.orderBy(...cursorConfig.orderBy)

        const actualPageSize = pageSize || 20
        const dataQuery = query.limit(actualPageSize + 1)

        const itemsRaw = await dataQuery.all();

        const hasNextPage = itemsRaw.length > actualPageSize
        const items = hasNextPage ? itemsRaw.slice(0, actualPageSize) : itemsRaw
        const nextCursor = hasNextPage ? cursorConfig.serialize(items[items.length - 1]) : null

        const formattedItems = items.map(item => {
            let activity = null;
            if (item.activityName) {
                activity = {
                    name: item.activityName,
                    hasGame: !!item.gameId
                };
            }
            let game = null;
            if (item.gameName) {
                game = {
                    name: item.gameName
                };
            }

            return {
                entryId: item.entryId,
                delta: item.delta,
                balanceAfter: item.balanceAfter,
                occurredAt: item.occurredAt,
                activity,
                game,
                product: item.productName ? { name: item.productName } : null,
                promo: item.promoName ? { name: item.promoName } : null,
                adminNote: item.adminNote
            };
        });

        const pagination = buildPagination({ pageSize: actualPageSize, hasNextPage, nextCursor })

        return c.json({ ok: true, data: formattedItems, pagination })
    } catch (err: any) {
        console.error("[GET /members/@self/history] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

const SelfUpdateBody = z.object({
    firstName: z.string().trim().min(1, "Ім'я обов'язкове").max(255)
        .regex(NAME_REGEX, "Ім'я може містити лише літери, пробіли, дефіси та апострофи"),
    lastName: z.string().trim().max(255)
        .regex(NAME_REGEX, "Прізвище може містити лише літери, пробіли, дефіси та апострофи")
        .nullable().optional(),
    nickname: z.string().trim().min(2, "Нікнейм має бути не менше 2 символів").max(32)
        .regex(NICKNAME_REGEX, "Нікнейм може містити лише літери, цифри, дефіси та підкреслення")
        .refine(s => !/^\d/.test(s), "Псевдонім не може починатися з цифри")
        .nullable().optional(),
    birthDate: z.number().nullable().optional()
        .refine((val) => {
            if (val === null || val === undefined) return true
            const year = new Date(val * 1000).getFullYear()
            return !isNaN(year) && year >= MIN_BIRTH_YEAR && year <= MAX_BIRTH_YEAR
        }, { message: `Мінімальний вік — 16 років. Дата народження має бути між ${MIN_BIRTH_YEAR} та ${MAX_BIRTH_YEAR} роком` })
})


const SettingsUpdateBody = z.array(z.object({
    name: z.string(),
    value: z.string()
}))

membersRoute.put("/@self", telegramAuth, async (c) => {
    try {
        const tgUser = c.get("tgUser")
        const db = getDb(c.env)
        const body = await c.req.json()
        const parsed = SelfUpdateBody.parse(body)

        const member = await db.select().from(members).where(eq(members.telegramUserId, String(tgUser.id))).get()
        if (!member) return c.json({ ok: false, error: "NOT_FOUND" }, 404)

        const currentYear = new Date().getFullYear();
        if (parsed.birthDate !== undefined && parsed.birthDate !== member.birthDate) {
            // Allow change if the current birthdate is invalid (out of valid range)
            const currentBirthYear = member.birthDate ? new Date(member.birthDate * 1000).getFullYear() : null
            const currentBirthDateInvalid = !currentBirthYear || currentBirthYear < MIN_BIRTH_YEAR || currentBirthYear > MAX_BIRTH_YEAR

            if (!currentBirthDateInvalid && member.birthDateChangedAt) {
                const changedYear = new Date(member.birthDateChangedAt * 1000).getFullYear();
                if (changedYear === currentYear) {
                    return c.json({ ok: false, error: "BIRTHDATE_LOCKED", message: "Дату народження можна змінити лише один раз на рік" }, 400)
                }
            }
        }

        const now = Math.floor(Date.now() / 1000)
        const updates: any = {
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            nickname: parsed.nickname,
            updatedAt: now,
        }

        if (parsed.birthDate !== undefined && parsed.birthDate !== member.birthDate) {
            updates.birthDate = parsed.birthDate
            updates.birthDateChangedAt = now
        }

        await db.update(members).set(updates).where(eq(members.memberId, member.memberId)).run()
        const updated = await db.select().from(members).where(eq(members.memberId, member.memberId)).get()

        return c.json({ ok: true, data: updated })
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return c.json({ ok: false, error: "VALIDATION_ERROR", details: err.issues }, 400)
        }
        console.error("[PUT /members/@self] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

membersRoute.get("/@self/settings", telegramAuth, async (c) => {
    try {
        const tgUser = c.get("tgUser")
        const db = getDb(c.env)

        const member = await db.select({ memberId: members.memberId }).from(members).where(eq(members.telegramUserId, String(tgUser.id))).get()
        if (!member) return c.json({ ok: false, error: "NOT_FOUND" }, 404)

        const settings = await db.select().from(memberSettings).where(eq(memberSettings.memberId, member.memberId)).all()
        return c.json({ ok: true, data: settings })
    } catch (err: any) {
        console.error("[GET /members/@self/settings] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

membersRoute.put("/@self/settings", telegramAuth, async (c) => {
    try {
        const tgUser = c.get("tgUser")
        const db = getDb(c.env)
        const body = await c.req.json()
        const parsed = SettingsUpdateBody.parse(body)

        const member = await db.select({ memberId: members.memberId }).from(members).where(eq(members.telegramUserId, String(tgUser.id))).get()
        if (!member) return c.json({ ok: false, error: "NOT_FOUND" }, 404)

        const now = Math.floor(Date.now() / 1000)
        const existingSettings = await db.select().from(memberSettings).where(eq(memberSettings.memberId, member.memberId)).all()

        for (const setting of parsed) {
            const exists = existingSettings.find(s => s.name === setting.name)
            if (exists) {
                await db.update(memberSettings).set({ value: setting.value, updatedAt: now }).where(eq(memberSettings.id, exists.id)).run()
            } else {
                await db.insert(memberSettings).values({
                    id: uuidv7(),
                    memberId: member.memberId,
                    name: setting.name,
                    value: setting.value,
                    updatedAt: now
                }).run()
            }
        }

        const updatedSettings = await db.select().from(memberSettings).where(eq(memberSettings.memberId, member.memberId)).all()
        return c.json({ ok: true, data: updatedSettings })
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return c.json({ ok: false, error: "VALIDATION_ERROR", details: err.issues }, 400)
        }
        console.error("[PUT /members/@self/settings] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

membersRoute.get("/leaderboard", telegramAuth, async (c) => {
    try {
        const url = new URL(c.req.url)
        const { cursor, pageSize } = parsePagination(url)

        const tgUser = c.get("tgUser")
        const db = getDb(c.env)

        const cursorConfig = generateCursor({
            cursors: [{ order: 'DESC', key: 'pointsBalance', schema: members.pointsBalance }],
            primaryCursor: { order: 'DESC', key: 'memberId', schema: members.memberId }
        })

        let validCursor = cursor;
        if (cursor) {
            try {
                const decodedJson = Buffer.from(cursor, 'base64').toString('utf-8');
                const cursorObj = JSON.parse(decodedJson);
                if (!('pointsBalance' in cursorObj) || !('memberId' in cursorObj)) {
                    validCursor = null;
                }
            } catch (e) {
                validCursor = null;
            }
        }

        const cursorWhereExpr = validCursor ? cursorConfig.where(validCursor) : undefined;

        const dataWhereExpr = and(
            eq(members.active, true),
            cursorWhereExpr
        );

        const query = db.select({
            memberId: members.memberId,
            telegramUserId: members.telegramUserId,
            firstName: members.firstName,
            lastName: members.lastName,
            nickname: members.nickname,
            pointsBalance: members.pointsBalance,
            levelId: levelsTiers.levelId,
            levelName: levelsTiers.name,
            leaderboardVisibility: memberSettings.value,
        })
            .from(members)
            .innerJoin(levelsTiers, eq(members.levelId, levelsTiers.levelId))
            .leftJoin(memberSettings, and(
                eq(memberSettings.memberId, members.memberId),
                eq(memberSettings.name, "leaderboard_visibility")
            ))
            .where(dataWhereExpr)

        query.orderBy(...cursorConfig.orderBy)
        query.limit(pageSize + 1)

        const itemsRaw = await query.all()
        const hasNextPage = itemsRaw.length > pageSize
        const items = hasNextPage ? itemsRaw.slice(0, pageSize) : itemsRaw
        const nextCursor = hasNextPage ? cursorConfig.serialize(items[items.length - 1]) : null

        const mappedItems = items.map(item => {
            const isVisible = item.leaderboardVisibility === "true";
            let displayName = "Анонімний шукач пригод";

            if (isVisible) {
                displayName = item.nickname || `${item.firstName} ${item.lastName || ""}`.trim();
            }

            return {
                memberId: item.memberId,
                displayName,
                pointsBalance: item.pointsBalance,
                levelId: item.levelId,
                levelName: item.levelName,
                isAnonymous: !isVisible,
                isCurrentUser: item.telegramUserId === String(tgUser.id)
            };
        });

        const pagination = buildPagination({ pageSize, hasNextPage, nextCursor })

        return c.json({ ok: true, data: mappedItems, pagination })
    } catch (err: any) {
        console.error("[GET /leaderboard] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

membersRoute.post("/verify", async (c) => {
    try {
        const body = await c.req.json()
        const { type, payload } = body

        if (!type || !payload) {
            return c.json({ ok: false, error: "BAD_REQUEST", message: "Відсутній тип або payload" }, 400)
        }

        if (type !== "member") {
            return c.json({ ok: false, error: "BAD_REQUEST", message: "Невірний тип QR коду" }, 400)
        }

        const qrSecret = c.env.QR_SECRET_KEY || "dev_secret_key";
        let decryptedString = "";
        try {
            const bytes = CryptoJS.AES.decrypt(payload, qrSecret);
            decryptedString = bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            return c.json({ ok: false, error: "INVALID_QR", message: "Неможливо розшифрувати QR код" }, 400)
        }

        if (!decryptedString) {
            return c.json({ ok: false, error: "INVALID_QR", message: "Неможливо розшифрувати QR код" }, 400)
        }

        let parsedPayload;
        try {
            parsedPayload = JSON.parse(decryptedString);
        } catch (e) {
            return c.json({ ok: false, error: "INVALID_QR", message: "Невірний формат даних" }, 400)
        }

        const extractedMemberId = parsedPayload.memberId;
        if (!extractedMemberId) {
            return c.json({ ok: false, error: "INVALID_QR", message: "Відсутній memberId в QR коді" }, 400)
        }

        const db = getDb(c.env)
        const member = await db.select().from(members).where(eq(members.memberId, extractedMemberId)).get()

        if (!member) {
            return c.json({ ok: false, error: "NOT_FOUND", message: "Учасника не знайдено" }, 404)
        }

        return c.json({ ok: true, data: member }, 200)

    } catch (err: any) {
        console.error("[POST /members/verify] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

membersRoute.get("/unclaimed-prizes", async (c) => {
    try {
        const url = new URL(c.req.url)
        const { cursor, pageSize, includeCount } = parsePagination(url)
        const q = url.searchParams.get("q")
        const sortParam = url.searchParams.get("sort")

        const db = getDb(c.env)

        const targetLevel = alias(levelsTiers, "target_level")

        const baseWhereConds = [
            eq(members.active, true),
            isNull(memberPrizesClaimed.claimId)
        ]
        if (q) {
            baseWhereConds.push(buildSearch(q, [members.phone, members.firstName, members.lastName]) as any)
        }

        const countWhereConds = [...baseWhereConds]

        // 1. Extract Sorting Details
        const sortField = sortParam?.split(',')[0] || 'memberId';
        const sortDir = (sortParam?.split(',')[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';

        const cursors: any[] = [];
        if (sortField === 'firstName') {
            cursors.push({ order: sortDir, key: 'firstName', schema: members.firstName });
            cursors.push({ order: sortDir, key: 'lastName', schema: members.lastName });
        } else if (sortField === 'levelName') {
            cursors.push({ order: sortDir, key: 'levelNameSortOrder', schema: targetLevel.sortOrder });
        }

        // 2. Configure drizzle-cursor
        const cursorConfig = generateCursor({
            cursors,
            primaryCursor: {
                // memberId is intrinsically unique enough for this dataset's tie-breaker
                order: sortField === 'memberId' ? sortDir : 'DESC',
                key: 'memberId',
                schema: members.memberId
            }
        });

        // 3. Validate base64 cursor from frontend
        let validCursor = cursor;
        if (cursor) {
            try {
                const decodedJson = Buffer.from(cursor, 'base64').toString('utf-8');
                const cursorObj = JSON.parse(decodedJson);

                if (sortField === 'firstName' && (!('firstName' in cursorObj) || !('lastName' in cursorObj))) {
                    validCursor = null;
                } else if (sortField === 'levelName' && !('levelNameSortOrder' in cursorObj)) {
                    validCursor = null;
                } else if (!('memberId' in cursorObj)) {
                    validCursor = null;
                }
            } catch (e) {
                validCursor = null;
            }
        }

        const cursorWhereExpr = validCursor ? cursorConfig.where(validCursor) : undefined;

        const dataWhereConds = [...baseWhereConds]
        if (cursorWhereExpr) {
            dataWhereConds.push(cursorWhereExpr)
        }

        const countQuery = db.select({ count: sql<number>`count(distinct ${members.memberId} || '-' || ${targetLevel.levelId})` })
            .from(members)
            .innerJoin(levelsTiers, eq(members.levelId, levelsTiers.levelId))
            .innerJoin(targetLevel, lte(targetLevel.sortOrder, levelsTiers.sortOrder))
            .innerJoin(prizesTable, eq(prizesTable.levelId, targetLevel.levelId))
            .leftJoin(memberPrizesClaimed, and(
                eq(memberPrizesClaimed.memberId, members.memberId),
                eq(memberPrizesClaimed.levelId, targetLevel.levelId)
            ))
            .where(and(...countWhereConds))

        const query = db.select({
            memberId: members.memberId,
            firstName: members.firstName,
            lastName: members.lastName,
            phone: members.phone,
            birthDate: members.birthDate,
            levelId: targetLevel.levelId,
            levelName: targetLevel.name,
            levelNameSortOrder: targetLevel.sortOrder,
            prizesString: sql<string>`group_concat(${prizesTable.name}, ', ')`
        })
            .from(members)
            .innerJoin(levelsTiers, eq(members.levelId, levelsTiers.levelId))
            .innerJoin(targetLevel, lte(targetLevel.sortOrder, levelsTiers.sortOrder))
            .innerJoin(prizesTable, eq(prizesTable.levelId, targetLevel.levelId))
            .leftJoin(memberPrizesClaimed, and(
                eq(memberPrizesClaimed.memberId, members.memberId),
                eq(memberPrizesClaimed.levelId, targetLevel.levelId)
            ))
            .where(and(...dataWhereConds))
            .groupBy(members.memberId, targetLevel.levelId)

        query.orderBy(...cursorConfig.orderBy)

        const dataQuery = query.limit(pageSize + 1)

        let itemsRaw: any[] = []
        let total: number | undefined = undefined

        if (includeCount) {
            const [dataResult, countResult] = await Promise.all([dataQuery.all(), countQuery.all()]);
            itemsRaw = dataResult;
            total = (countResult as any[])[0]?.count ?? 0;
        } else {
            itemsRaw = await dataQuery.all();
        }

        const hasNextPage = itemsRaw.length > pageSize
        const items = hasNextPage ? itemsRaw.slice(0, pageSize) : itemsRaw
        const nextCursor = hasNextPage ? cursorConfig.serialize(items[items.length - 1]) : null

        const pagination = buildPagination({ pageSize, hasNextPage, nextCursor, total })

        return c.json({ ok: true, data: items, pagination })
    } catch (err: any) {
        console.error("[GET /unclaimed-prizes] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err?.message }, 500)
    }
})

membersRoute.get("/", async (c) => {
    try {
        const url = new URL(c.req.url)
        const { cursor, pageSize, includeCount } = parsePagination(url)
        const q = url.searchParams.get("q")
        const sortParam = url.searchParams.get("sort") // e.g., 'pointsBalance.desc'

        const db = getDb(c.env)

        // 1. Build Base Filter Conditions (Search, etc.)
        const baseWhereConditions = []
        if (q) {
            baseWhereConditions.push(buildSearch(q, [members.phone]))
        }
        const countWhereExpr = baseWhereConditions.length > 0 ? and(...baseWhereConditions) : undefined

        // 2. Extract Sorting Details
        // We assume sortParam looks something like "pointsBalance.desc"
        const sortField = sortParam?.split(',')[0] || 'memberId';
        const sortDir = (sortParam?.split(',')[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
        const sortColumn = (members as any)[sortField] || members.memberId;

        // 3. Configure drizzle-cursor
        const isCustomSort = sortField !== 'memberId';
        const cursorConfig = generateCursor({
            // If custom sorting, use that column as the main cursor
            cursors: isCustomSort ? [
                {
                    order: sortDir,
                    key: sortField, // This key MUST match the property name in your returned object
                    schema: sortColumn
                }
            ] : [],
            // Always require a unique primary cursor (tie-breaker)
            primaryCursor: {
                order: isCustomSort ? 'DESC' : sortDir, // Usually DESC for ID tie-breakers
                key: 'memberId',
                schema: members.memberId
            }
        });

        // 4. Validate and Generate the WHERE clause from the frontend cursor string
        let validCursor = cursor;
        if (cursor) {
            try {
                const decodedJson = Buffer.from(cursor, 'base64').toString('utf-8');
                const cursorObj = JSON.parse(decodedJson);
                // Validate that the cursor object contains all required keys for the current sort
                if (isCustomSort && !(sortField in cursorObj)) {
                    validCursor = null;
                } else if (!('memberId' in cursorObj)) {
                    validCursor = null;
                }
            } catch (e) {
                validCursor = null;
            }
        }

        const cursorWhereExpr = validCursor ? cursorConfig.where(validCursor) : undefined;

        // Combine base search filters with the cursor logic
        const dataWhereExpr = and(
            countWhereExpr,
            cursorWhereExpr
        );

        const referrer = alias(members, "referrer")

        // 5. Build the Query Builder
        const query = db
            .select({
                memberId: members.memberId,
                firstName: members.firstName,
                lastName: members.lastName,
                phone: members.phone,
                birthDate: members.birthDate,
                telegramUserId: members.telegramUserId,
                joinedAt: members.joinedAt,
                active: members.active,
                pointsBalance: members.pointsBalance,
                levelId: members.levelId,
                referredBy: members.referredBy,
                updatedAt: members.updatedAt,
                referredByMember: {
                    memberId: referrer.memberId,
                    firstName: referrer.firstName,
                    lastName: referrer.lastName,
                },
            })
            .from(members)
            .leftJoin(referrer, eq(referrer.memberId, members.referredBy))

        // 6. Apply drizzle-cursor logic to the query
        if (dataWhereExpr) query.where(dataWhereExpr)

        // drizzle-cursor provides the exact ORDER BY array needed
        query.orderBy(...cursorConfig.orderBy)
        query.limit(pageSize + 1)

        let itemsRaw: any[] = []
        let total: number | undefined = undefined

        if (includeCount) {
            const totalQuery = db.select({ count: sql<number>`count(*)` }).from(members)
            if (countWhereExpr) totalQuery.where(countWhereExpr)

            const [dataResult, countResult] = await Promise.all([query.all(), totalQuery.all()]);
            itemsRaw = dataResult;
            total = (countResult as any[])[0]?.count ?? 0;
        } else {
            itemsRaw = await query.all();
        }

        // 7. Handle Output and Generate Next Cursor
        const hasNextPage = itemsRaw.length > pageSize
        const items = hasNextPage ? itemsRaw.slice(0, pageSize) : itemsRaw

        // Let drizzle-cursor automatically serialize the last item into a base64 string!
        const nextCursor = hasNextPage ? cursorConfig.serialize(items[items.length - 1]) : null

        const pagination = buildPagination({ pageSize, hasNextPage, nextCursor, total })

        return c.json({ ok: true, data: items, pagination })
    } catch (err: any) {
        console.error("[GET /members] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err?.message }, 500)
    }
})

membersRoute.get("/loyalty/:memberId", async (c) => {
    try {
        const memberId = c.req.param("memberId")

        const db = getDb(c.env)

        // Find member by ID
        const member = await db.select().from(members).where(eq(members.memberId, memberId)).get()

        if (!member) {
            return c.json({ ok: false, error: "NOT_FOUND", message: "Учасника не знайдено" }, 404)
        }

        // Get member's level with discounts
        let level = null
        if (member.levelId) {
            level = await db.select().from(levelsTiers).where(eq(levelsTiers.levelId, member.levelId)).get()
        }

        return c.json({
            ok: true,
            data: {
                member,
                level,
            },
        })
    } catch (err: any) {
        console.error("[GET /members/loyalty/:memberId] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err?.message }, 500)
    }
})

membersRoute.get("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const member = await db.select().from(members).where(eq(members.memberId, id)).get()

        if (!member) return c.json({ ok: false, error: "NOT_FOUND" }, 404)

        return c.json({ ok: true, data: member })
    } catch (err: any) {
        console.error("[GET /members/:id] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

membersRoute.put("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)
        const body = await c.req.json()
        const parsed = MemberUpdateBody.parse(body)

        // Check member exists
        const existing = await db.select({ id: members.memberId }).from(members).where(eq(members.memberId, id)).get()

        if (!existing) return c.json({ ok: false, error: "NOT_FOUND" }, 404)

        // Perform update
        const now = Math.floor(Date.now() / 1000)
        const updates = {
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            updatedAt: now,
        } as any

        await db.update(members).set(updates).where(eq(members.memberId, id)).run()

        // Return updated record
        const updated = await db.select().from(members).where(eq(members.memberId, id)).get()

        return c.json({ ok: true, data: updated })
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return c.json(
                {
                    ok: false,
                    error: "VALIDATION_ERROR",
                    details: err.issues,
                },
                400,
            )
        }
        console.error("[PUT /members/:id] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

membersRoute.post("/:id/adjust-points", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)
        const body = await c.req.json()
        const parsed = PointsAdjustmentBody.parse(body)

        // Check member exists and get current balance
        const member = await db.select().from(members).where(eq(members.memberId, id)).get()

        if (!member) return c.json({ ok: false, error: "NOT_FOUND" }, 404)

        const now = Math.floor(Date.now() / 1000)
        const newBalance = member.pointsBalance + parsed.points

        // Prevent negative balance
        if (newBalance < 0) {
            return c.json(
                {
                    ok: false,
                    error: "INVALID_BALANCE",
                    message: "Баланс не може бути від'ємним",
                },
                400,
            )
        }

        const levelUpResult = await checkAndProcessLevelUp(db, id, member.pointsBalance, newBalance, now, "admin adjustment")

        const batchOps: any[] = []

        // Add adjustment ledger entry
        const entryId = uuidv7();
        const idempotencyKey = `admin-adjust-${entryId}`
        batchOps.push(
            db.insert(pointsLedger).values({
                entryId,
                memberId: id,
                occurredAt: now,
                delta: parsed.points,
                balanceAfter: newBalance,
                activityId: null,
                productId: null,
                adminNote: parsed.reason,
                idempotencyKey,
            }),
        )

        // Add level-up ledger entries (includes referral bonuses)
        if (levelUpResult.ledgerEntries.length > 0) {
            batchOps.push(db.insert(pointsLedger).values(levelUpResult.ledgerEntries))
        }

        // Add all member updates (level changes, balance updates from cascading level-ups)
        if (levelUpResult.batchOperations.length > 0) {
            batchOps.push(...levelUpResult.batchOperations)
        }

        await db.batch(batchOps as any)

        if (levelUpResult.notifications.length > 0) {
            console.log("[admin-adjust] scheduling notifications")
            try {
                // @ts-ignore Cloudflare runtime
                c.executionCtx?.waitUntil(sendBatchNotifications(db, c.env, levelUpResult.notifications as any))
            } catch (e) {
                console.warn("[admin-adjust] notification scheduling failed", e)
            }
        }

        // Get updated member
        const updated = await db.select().from(members).where(eq(members.memberId, id)).get()

        return c.json({ ok: true, data: updated })
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            return c.json(
                {
                    ok: false,
                    error: "VALIDATION_ERROR",
                    details: err.issues,
                },
                400,
            )
        }
        console.error("[POST /members/:id/adjust-points] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

// New GET endpoint for member points ledger with pagination
// Aggregate level info for a member (discounts, benefits, prizes, claim status)
membersRoute.get("/:id/level-info", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const member = await db.select().from(members).where(eq(members.memberId, id)).get()
        if (!member) return c.json({ ok: false, error: "NOT_FOUND", message: "Учасника не знайдено" }, 404)

        const level = await db.select().from(levelsTiers).where(eq(levelsTiers.levelId, member.levelId)).get()
        if (!level) return c.json({ ok: false, error: "LEVEL_NOT_FOUND", message: "Рівень учасника не знайдено" }, 404)

        const benefits = await db
            .select({ name: benefitsTable.name, description: benefitsTable.description })
            .from(benefitsTable)
            .where(eq(benefitsTable.levelId, member.levelId))
            .orderBy(asc(benefitsTable.name))
            .all()

        const prizes = await db
            .select({ name: prizesTable.name, description: prizesTable.description })
            .from(prizesTable)
            .where(eq(prizesTable.levelId, member.levelId))
            .orderBy(asc(prizesTable.sortOrder))
            .all()

        const claimed = await db
            .select({ claimedAt: memberPrizesClaimed.claimedAt })
            .from(memberPrizesClaimed)
            .where(and(eq(memberPrizesClaimed.memberId, id), eq(memberPrizesClaimed.levelId, member.levelId)))
            .get()

        const targetLevel = alias(levelsTiers, "target_level")
        const unclaimedLevelsData = await db
            .select({
                levelId: targetLevel.levelId,
                levelName: targetLevel.name,
                prizes: sql<string>`group_concat(${prizesTable.name}, ', ')`
            })
            .from(targetLevel)
            .innerJoin(prizesTable, eq(prizesTable.levelId, targetLevel.levelId))
            .leftJoin(memberPrizesClaimed, and(
                eq(memberPrizesClaimed.memberId, id),
                eq(memberPrizesClaimed.levelId, targetLevel.levelId)
            ))
            .where(and(
                lte(targetLevel.sortOrder, level.sortOrder),
                isNull(memberPrizesClaimed.claimId)
            ))
            .groupBy(targetLevel.levelId)
            .orderBy(asc(targetLevel.sortOrder))
            .all()

        const unclaimedLevelPrizes = unclaimedLevelsData.map(d => ({
            levelId: d.levelId,
            levelName: d.levelName,
            prizesString: d.prizes || ""
        }))

        return c.json({
            ok: true,
            data: {
                member: {
                    memberId: member.memberId,
                    firstName: member.firstName,
                    lastName: member.lastName,
                    birthDate: member.birthDate,
                    pointsBalance: member.pointsBalance,
                    levelId: member.levelId,
                },
                level: {
                    levelId: level.levelId,
                    name: level.name,
                },
                benefits,
                prizes,
                claim: {
                    claimed: !!claimed,
                    claimedAt: claimed?.claimedAt || null,
                },
                unclaimedLevelPrizes,
            },
        })
    } catch (err: any) {
        console.error("[GET /members/:id/level-info] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

// Claim prize for member's specific level (idempotent)
membersRoute.post("/:id/claim", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const body = await c.req.json().catch(() => ({}))
        const levelIdToClaim = body.levelId

        // Ensure member exists
        const member = await db.select().from(members).where(eq(members.memberId, id)).get()
        if (!member) return c.json({ ok: false, error: "NOT_FOUND", message: "Учасника не знайдено" }, 404)

        const targetLevelId = levelIdToClaim || member.levelId

        // Check existing claim for (memberId, levelId)
        const existing = await db
            .select({ claimedAt: memberPrizesClaimed.claimedAt })
            .from(memberPrizesClaimed)
            .where(and(eq(memberPrizesClaimed.memberId, id), eq(memberPrizesClaimed.levelId, targetLevelId)))
            .get()

        if (existing) {
            return c.json({ ok: true, data: { claimed: true, claimedAt: existing.claimedAt } })
        }

        const claimId = uuidv7();
        const now = Math.floor(Date.now() / 1000)

        await db
            .insert(memberPrizesClaimed)
            .values({ claimId, memberId: id, levelId: targetLevelId, claimedAt: now })
            .run()

        return c.json({ ok: true, data: { claimed: true, claimedAt: now, levelId: targetLevelId } })
    } catch (err: any) {
        console.error("[POST /members/:id/claim] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

membersRoute.get("/:id/points-ledger", async (c) => {
    try {
        const id = c.req.param("id")
        const url = new URL(c.req.url)
        const { cursor, pageSize, includeCount } = parsePagination(url)
        const sortParam = url.searchParams.get("sort")

        const db = getDb(c.env)

        // Check member exists
        const member = await db.select({ id: members.memberId }).from(members).where(eq(members.memberId, id)).get()

        if (!member) return c.json({ ok: false, error: "NOT_FOUND" }, 404)

        const countWhereExpr = eq(pointsLedger.memberId, id)

        // 1. Extract Sorting Details
        const sortField = sortParam?.split(',')[0] || 'occurredAt';
        const sortDir = (sortParam?.split(',')[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
        const isCustomSort = sortField !== 'entryId';

        // 2. Configure drizzle-cursor
        const cursorConfig = generateCursor({
            cursors: isCustomSort ? [
                {
                    order: sortDir,
                    key: sortField,
                    schema: (pointsLedger as any)[sortField] || pointsLedger.occurredAt
                }
            ] : [],
            primaryCursor: {
                order: isCustomSort ? 'DESC' : sortDir,
                key: 'entryId',
                schema: pointsLedger.entryId
            }
        });

        // 3. Validate base64 cursor from frontend
        let validCursor = cursor;
        if (cursor) {
            try {
                const decodedJson = Buffer.from(cursor, 'base64').toString('utf-8');
                const cursorObj = JSON.parse(decodedJson);
                if (isCustomSort && !(sortField in cursorObj)) {
                    validCursor = null;
                } else if (!('entryId' in cursorObj)) {
                    validCursor = null;
                }
            } catch (e) {
                validCursor = null;
            }
        }

        const cursorWhereExpr = validCursor ? cursorConfig.where(validCursor) : undefined;

        const dataWhereConditions: any[] = [eq(pointsLedger.memberId, id)]
        if (cursorWhereExpr) {
            dataWhereConditions.push(cursorWhereExpr)
        }
        const dataWhereExpr = and(...dataWhereConditions)

        // Fetch paginated ledger entries
        const query = db.select({
            entryId: pointsLedger.entryId,
            memberId: pointsLedger.memberId,
            occurredAt: pointsLedger.occurredAt,
            delta: pointsLedger.delta,
            balanceAfter: pointsLedger.balanceAfter,
            activityId: pointsLedger.activityId,
            activityName: activities.name,
            productId: pointsLedger.productId,
            productName: products.name,
            promoId: pointsLedger.promoId,
            adminNote: pointsLedger.adminNote,
            idempotencyKey: pointsLedger.idempotencyKey,
            promoName: promotions.name,
        })
            .from(pointsLedger)
            .leftJoin(promotions, eq(pointsLedger.promoId, promotions.promoId))
            .leftJoin(activities, eq(pointsLedger.activityId, activities.activityId))
            .leftJoin(products, eq(pointsLedger.productId, products.productId))
            .where(dataWhereExpr)

        query.orderBy(...cursorConfig.orderBy)

        const dataQuery = query.limit(pageSize + 1)

        let itemsRaw: any[] = []
        let total: number | undefined = undefined

        if (includeCount) {
            const totalQuery = db.select({ count: sql<number>`count(*)` }).from(pointsLedger).where(countWhereExpr)

            const [dataResult, countResult] = await Promise.all([dataQuery.all(), totalQuery.all()]);
            itemsRaw = dataResult;
            total = (countResult as any[])[0]?.count ?? 0;
        } else {
            itemsRaw = await dataQuery.all();
        }

        const hasNextPage = itemsRaw.length > pageSize
        const items = hasNextPage ? itemsRaw.slice(0, pageSize) : itemsRaw
        const nextCursor = hasNextPage ? cursorConfig.serialize(items[items.length - 1]) : null

        const pagination = buildPagination({ pageSize, hasNextPage, nextCursor, total })

        return c.json({ ok: true, data: items, pagination })
    } catch (err: any) {
        console.error("[GET /members/:id/points-ledger] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})
