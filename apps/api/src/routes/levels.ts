// @ts-ignore - Cloudflare Workers handle node:buffer natively
import { Buffer } from "node:buffer"
import { Hono } from "hono"
import { getDb } from "@loyalty/db/client"
import { levelsTiers, benefits, prizes, levelPromotions, promotions, loyaltyConfigs } from "@loyalty/db/schema"
import { eq, sql, and, lt, desc, inArray } from "drizzle-orm"
import { parsePagination, parseSort, buildPagination, buildSearch } from "@/utils/query-helpers"
import type { Env } from "@/types/env"
import { z } from "zod"
import { v7 as uuidv7 } from 'uuid';
import { generateCursor } from "drizzle-cursor";

const BenefitInput = z.object({
    benefitId: z.string().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
})

const PrizeInput = z.object({
    prizeId: z.string().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
})

const LevelBody = z.object({
    levelId: z.string().min(1),
    name: z.string().min(1),
    minPoints: z.number().int().min(0),
    defaultLevel: z.boolean().optional().default(false),
    sortOrder: z.number().int().optional().default(0),
    benefits: z.array(BenefitInput).optional().default([]),
    prizes: z.array(PrizeInput).optional().default([]),
})

export const levelsRoute = new Hono<Env>()

// GET /levels - List all levels with pagination
levelsRoute.get("/", async (c) => {
    try {
        const url = new URL(c.req.url)
        const { cursor, pageSize, includeCount } = parsePagination(url)
        const q = url.searchParams.get("q")
        const sortParam = url.searchParams.get("sort") || "sortOrder"

        const db = getDb(c.env)

        const baseWhereConditions = []
        if (q) {
            baseWhereConditions.push(buildSearch(q, [levelsTiers.name, levelsTiers.levelId]))
        }

        const countWhereExpr = baseWhereConditions.length > 0 ? and(...baseWhereConditions) : undefined

        // 1. Extract Sorting Details
        const sortField = sortParam?.split(',')[0] || 'sortOrder';
        const sortDir = (sortParam?.split(',')[1]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as 'ASC' | 'DESC';
        const isCustomSort = sortField !== 'levelId';

        // 2. Configure drizzle-cursor
        const cursorConfig = generateCursor({
            cursors: isCustomSort ? [
                {
                    order: sortDir,
                    key: sortField,
                    schema: (levelsTiers as any)[sortField] || levelsTiers.levelId
                }
            ] : [],
            primaryCursor: {
                order: isCustomSort ? 'DESC' : sortDir,
                key: 'levelId',
                schema: levelsTiers.levelId
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
                } else if (!('levelId' in cursorObj)) {
                    validCursor = null;
                }
            } catch (e) {
                validCursor = null;
            }
        }

        const cursorWhereExpr = validCursor ? cursorConfig.where(validCursor) : undefined;

        const dataWhereConditions = [...baseWhereConditions]
        if (cursorWhereExpr) {
            dataWhereConditions.push(cursorWhereExpr)
        }
        const dataWhereExpr = dataWhereConditions.length > 0 ? and(...dataWhereConditions) : undefined

        const query = db.select().from(levelsTiers)
        if (dataWhereExpr) query.where(dataWhereExpr as any)
        query.orderBy(...cursorConfig.orderBy)

        const dataQuery = query.limit(pageSize + 1)

        let itemsRaw: any[] = []
        let total: number | undefined = undefined

        if (includeCount) {
            const totalQuery = db.select({ count: sql<number>`count(*)` }).from(levelsTiers)
            if (countWhereExpr) totalQuery.where(countWhereExpr as any)

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
        console.error("[GET /levels] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err?.message }, 500)
    }
})

import { telegramAuth } from "@/middleware/telegramAuth"
import { asc } from "drizzle-orm"

function safeParse(json: string | null | undefined) {
    if (!json) return null
    try {
        return JSON.parse(json)
    } catch {
        return null
    }
}

// GET /referral-rules - Public mini-app endpoint to get level change referral rules
levelsRoute.get("/referral-rules", telegramAuth, async (c) => {
    try {
        const db = getDb(c.env)
        const rows = await db
            .select()
            .from(loyaltyConfigs)
            .where(eq(loyaltyConfigs.triggerKey, "level_change"))
            .all()

        const active = rows
            .filter((r) => r.active)
            .map((r) => ({ id: r.configId, cfg: safeParse(r.configJson) }))
            .filter((x) => !!x.cfg) as Array<{ id: string; cfg: any }>

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

        if (flat.length === 0) return c.json([])

        const uniqueLevelIds = Array.from(new Set(flat.map((f) => f.levelId)))
        const levelRows = await db
            .select({ levelId: levelsTiers.levelId, name: levelsTiers.name, minPoints: levelsTiers.minPoints })
            .from(levelsTiers)
            .where(inArray(levelsTiers.levelId, uniqueLevelIds))
            .all()
            
        const levelMap = new Map(levelRows.map((l) => [l.levelId, { name: l.name, minPoints: l.minPoints }]))

        const items = flat.map((f) => {
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

        items.sort((x, y) => {
            const mx = x.minPoints ?? Number.MAX_SAFE_INTEGER
            const my = y.minPoints ?? Number.MAX_SAFE_INTEGER
            if (mx !== my) return mx - my
            return x.index - y.index
        })

        const finalItems = items.map(({ index, ...rest }) => rest)
        return c.json(finalItems)
    } catch (err: any) {
        console.error("[GET /levels/referral-rules] error", err)
        return c.json({ error: "INTERNAL_ERROR", details: String(err?.message ?? err) }, 500)
    }
})

// GET /info - Public mini-app endpoint to get all levels and their benefits/prizes
levelsRoute.get("/info", telegramAuth, async (c) => {
    try {
        const db = getDb(c.env)
        const result = await db
            .select({
                level: levelsTiers,
                benefit: benefits,
                prize: prizes,
                promotionList: {
                    promoId: promotions.promoId,
                    name: promotions.name,
                    description: promotions.description,
                    active: promotions.active,
                    mode: promotions.mode,
                    priority: promotions.priority,
                    config: promotions.config,
                    startDate: promotions.startDate,
                    endDate: promotions.endDate,
                    promoCode: promotions.code,
                }
            })
            .from(levelsTiers)
            .leftJoin(benefits, eq(levelsTiers.levelId, benefits.levelId))
            .leftJoin(prizes, eq(levelsTiers.levelId, prizes.levelId))
            .leftJoin(levelPromotions, eq(levelsTiers.levelId, levelPromotions.levelId))
            .leftJoin(promotions, eq(levelPromotions.promoId, promotions.promoId))
            .orderBy(asc(levelsTiers.sortOrder))
            .all()

        const levelsMap = new Map<string, any>()
        
        // Use a stable sort order list based on the query return order
        const orderList: string[] = []

        for (const row of result) {
            if (!levelsMap.has(row.level.levelId)) {
                levelsMap.set(row.level.levelId, {
                    ...row.level,
                    benefits: [],
                    prizes: [],
                    promotions: []
                })
                orderList.push(row.level.levelId)
            }
            const lvl = levelsMap.get(row.level.levelId)
            
            if (row.benefit && !lvl.benefits.some((b: any) => b.benefitId === row.benefit!.benefitId)) {
                lvl.benefits.push(row.benefit)
            }
            if (row.prize && !lvl.prizes.some((p: any) => p.prizeId === row.prize!.prizeId)) {
                lvl.prizes.push(row.prize)
            }
            if (row.promotionList && row.promotionList.promoId && !lvl.promotions.some((p: any) => p.promoId === row.promotionList!.promoId)) {
                lvl.promotions.push(row.promotionList)
            }
        }

        const sortedLevels = orderList.map(id => levelsMap.get(id))
        return c.json(sortedLevels)
    } catch (err: any) {
        console.error("[GET /levels/info] error", err)
        return c.json({ error: "INTERNAL_ERROR", details: String(err?.message ?? err) }, 500)
    }
})

// GET /levels/:id - Get single level
levelsRoute.get("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        // Use LEFT JOIN to fetch level with benefits, prizes, and promotions in one query
        const result = await db
            .select({
                level: levelsTiers,
                benefit: benefits,
                prize: prizes,
                promotionList: {
                    promoId: promotions.promoId,
                    name: promotions.name,
                    active: promotions.active,
                    mode: promotions.mode,
                    priority: promotions.priority,
                }
            })
            .from(levelsTiers)
            .leftJoin(benefits, eq(levelsTiers.levelId, benefits.levelId))
            .leftJoin(prizes, eq(levelsTiers.levelId, prizes.levelId))
            .leftJoin(levelPromotions, eq(levelsTiers.levelId, levelPromotions.levelId))
            .leftJoin(promotions, eq(levelPromotions.promoId, promotions.promoId))
            .where(eq(levelsTiers.levelId, id))
            .all()

        if (!result || result.length === 0) {
            return c.json({ error: "Level not found" }, 404)
        }

        // Aggregate the results
        const level = result[0].level
        const levelBenefits: any[] = []
        const levelPrizes: any[] = []
        const levelPromos: any[] = []

        // Collect unique benefits, prizes, and promotions
        const benefitIds = new Set<string>()
        const prizeIds = new Set<string>()
        const promoIds = new Set<string>()

        for (const row of result) {
            if (row.benefit && !benefitIds.has(row.benefit.benefitId)) {
                benefitIds.add(row.benefit.benefitId)
                levelBenefits.push(row.benefit)
            }
            if (row.prize && !prizeIds.has(row.prize.prizeId)) {
                prizeIds.add(row.prize.prizeId)
                levelPrizes.push(row.prize)
            }
            if (row.promotionList && row.promotionList.promoId && !promoIds.has(row.promotionList.promoId)) {
                promoIds.add(row.promotionList.promoId)
                levelPromos.push(row.promotionList)
            }
        }

        return c.json({
            ...level,
            benefits: levelBenefits,
            prizes: levelPrizes,
            promotions: levelPromos,
        })
    } catch (err: any) {
        console.error(err)
        return c.json({ error: "Invalid request", details: String(err?.message ?? err) }, 400)
    }
})

// POST /levels - Create new level
levelsRoute.post("/", async (c) => {
    try {
        const body = await c.req.json()
        const data = LevelBody.parse(body)

        const db = getDb(c.env)
        const now = Math.floor(Date.now() / 1000)

        // Check if levelId already exists
        const [existing] = await db
            .select({ id: levelsTiers.levelId })
            .from(levelsTiers)
            .where(eq(levelsTiers.levelId, data.levelId))

        if (existing) {
            return c.json({ error: "Level ID already exists" }, 409)
        }

        // If this level is set as default, unset all other defaults
        if (data.defaultLevel) {
            await db.update(levelsTiers).set({ defaultLevel: false }).where(eq(levelsTiers.defaultLevel, true))
        }

        await db.insert(levelsTiers).values({
            levelId: data.levelId,
            name: data.name,
            minPoints: data.minPoints,
            defaultLevel: data.defaultLevel,
            sortOrder: data.sortOrder,
            createdAt: now,
            updatedAt: now,
        })

        // Batch insert benefits
        if (data.benefits && data.benefits.length > 0) {
            const benefitValues = data.benefits.map((benefit) => ({
                benefitId: uuidv7(),
                levelId: data.levelId,
                name: benefit.name,
                description: benefit.description || "",
                createdAt: now,
                updatedAt: now,
            }))
            await db.insert(benefits).values(benefitValues)
        }

        // Batch insert prizes
        if (data.prizes && data.prizes.length > 0) {
            const prizeValues = data.prizes.map((prize) => ({
                prizeId: uuidv7(),
                levelId: data.levelId,
                name: prize.name,
                description: prize.description || "",
                createdAt: now,
                updatedAt: now,
            }))
            await db.insert(prizes).values(prizeValues)
        }

        // Fetch the created level with benefits and prizes using LEFT JOIN
        const result = await db
            .select({
                level: levelsTiers,
                benefit: benefits,
                prize: prizes,
            })
            .from(levelsTiers)
            .leftJoin(benefits, eq(levelsTiers.levelId, benefits.levelId))
            .leftJoin(prizes, eq(levelsTiers.levelId, prizes.levelId))
            .where(eq(levelsTiers.levelId, data.levelId))
            .all()

        const level = result[0].level
        const levelBenefits: any[] = []
        const levelPrizes: any[] = []

        const benefitIds = new Set<string>()
        const prizeIds = new Set<string>()

        for (const row of result) {
            if (row.benefit && !benefitIds.has(row.benefit.benefitId)) {
                benefitIds.add(row.benefit.benefitId)
                levelBenefits.push(row.benefit)
            }
            if (row.prize && !prizeIds.has(row.prize.prizeId)) {
                prizeIds.add(row.prize.prizeId)
                levelPrizes.push(row.prize)
            }
        }

        return c.json({ ...level, benefits: levelBenefits, prizes: levelPrizes }, 201)
    } catch (err: any) {
        return c.json({ error: "Invalid request", details: String(err?.message ?? err) }, 400)
    }
})

// PUT /levels/:id - Update level
levelsRoute.put("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const body = await c.req.json()
        const data = LevelBody.parse(body)

        const db = getDb(c.env)
        const now = Math.floor(Date.now() / 1000)

        // Check if level exists
        const [found] = await db.select().from(levelsTiers).where(eq(levelsTiers.levelId, id))

        if (!found) {
            return c.json({ error: "Level not found" }, 404)
        }

        // If levelId is changing, check for conflicts
        if (data.levelId !== id) {
            const [clash] = await db
                .select({ id: levelsTiers.levelId })
                .from(levelsTiers)
                .where(eq(levelsTiers.levelId, data.levelId))

            if (clash) {
                return c.json({ error: "Level ID already exists" }, 409)
            }
        }

        // If this level is set as default, unset all other defaults
        if (data.defaultLevel) {
            await db.update(levelsTiers).set({ defaultLevel: false }).where(eq(levelsTiers.defaultLevel, true))
        }

        await db
            .update(levelsTiers)
            .set({
                levelId: data.levelId,
                name: data.name,
                minPoints: data.minPoints,
                defaultLevel: data.defaultLevel,
                sortOrder: data.sortOrder,
                updatedAt: now,
            })
            .where(eq(levelsTiers.levelId, id))

        // Delete existing benefits and prizes
        await db.delete(benefits).where(eq(benefits.levelId, id))
        await db.delete(prizes).where(eq(prizes.levelId, id))

        // Batch insert new benefits
        if (data.benefits && data.benefits.length > 0) {
            const benefitValues = data.benefits.map((benefit) => ({
                benefitId: uuidv7(),
                levelId: data.levelId,
                name: benefit.name,
                description: benefit.description || "",
                createdAt: now,
                updatedAt: now,
            }))
            await db.insert(benefits).values(benefitValues)
        }

        // Batch insert new prizes
        if (data.prizes && data.prizes.length > 0) {
            const prizeValues = data.prizes.map((prize) => ({
                prizeId: uuidv7(),
                levelId: data.levelId,
                name: prize.name,
                description: prize.description || "",
                createdAt: now,
                updatedAt: now,
            }))
            await db.insert(prizes).values(prizeValues)
        }

        // Fetch the updated level with benefits and prizes using LEFT JOIN
        const result = await db
            .select({
                level: levelsTiers,
                benefit: benefits,
                prize: prizes,
            })
            .from(levelsTiers)
            .leftJoin(benefits, eq(levelsTiers.levelId, benefits.levelId))
            .leftJoin(prizes, eq(levelsTiers.levelId, prizes.levelId))
            .where(eq(levelsTiers.levelId, data.levelId))
            .all()

        const level = result[0].level
        const levelBenefits: any[] = []
        const levelPrizes: any[] = []

        const benefitIds = new Set<string>()
        const prizeIds = new Set<string>()

        for (const row of result) {
            if (row.benefit && !benefitIds.has(row.benefit.benefitId)) {
                benefitIds.add(row.benefit.benefitId)
                levelBenefits.push(row.benefit)
            }
            if (row.prize && !prizeIds.has(row.prize.prizeId)) {
                prizeIds.add(row.prize.prizeId)
                levelPrizes.push(row.prize)
            }
        }

        return c.json({ ...level, benefits: levelBenefits, prizes: levelPrizes })
    } catch (err: any) {
        return c.json({ error: "Invalid request", details: String(err?.message ?? err) }, 400)
    }
})

// DELETE /levels/:id - Delete level
levelsRoute.delete("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const [found] = await db.select().from(levelsTiers).where(eq(levelsTiers.levelId, id))

        if (!found) {
            return c.json({ error: "Level not found" }, 404)
        }

        // Don't allow deleting the default level
        if (found.defaultLevel) {
            return c.json({ error: "Cannot delete the default level" }, 400)
        }

        await db.delete(levelsTiers).where(eq(levelsTiers.levelId, id))

        return c.json({ ok: true, message: "Level deleted successfully" })
    } catch (err: any) {
        return c.json({ error: "Invalid request", details: String(err?.message ?? err) }, 400)
    }
})
