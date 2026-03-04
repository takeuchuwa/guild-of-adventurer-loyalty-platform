// @ts-ignore - Cloudflare Workers handle node:buffer natively but types may not be installed
import { Buffer } from "node:buffer"
import { Hono } from "hono"
import { getDb } from "@loyalty/db/client"
import {
    benefits as benefitsTable,
    levelsTiers,
    memberPrizesClaimed,
    members,
    pointsLedger,
    promotions,
    activities,
    products,
    prizes as prizesTable,
} from "@loyalty/db/schema"
import { and, asc, eq, sql, lte, isNull, desc, lt } from "drizzle-orm"
import { alias } from "drizzle-orm/sqlite-core"
import { buildPagination, buildSearch, parsePagination, parseSort } from "@/utils/query-helpers"
import type { Env } from "@/types/env"
import z from "zod"
import { checkAndProcessLevelUp } from "@/utils/level-up"
import { v7 as uuidv7 } from 'uuid';
import { generateCursor } from 'drizzle-cursor';

const MemberUpdateBody = z.object({
    firstName: z.string().trim().min(1, "Ім'я обов'язкове").max(255).nullable(),
    lastName: z.string().trim().min(1, "Прізвище обов'язкове").max(255).nullable(),
})

const PointsAdjustmentBody = z.object({
    points: z.number().int("Бали мають бути цілим числом"),
    reason: z.string().trim().min(1, "Причина обов'язкова").max(500),
})

export const membersRoute = new Hono<Env>()

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
            console.log(levelUpResult.notifications);
            try {
                const headers: any = { "content-type": "application/json" }
                const token = (c.env as any).INTERNAL_TOKEN || "dummy_token"
                headers["authorization"] = `Bearer ${token}`

                const tasks: Promise<any>[] = []

                for (const item of levelUpResult.notifications) {
                    const body = JSON.stringify(item.body)
                    console.log(`[admin-adjust] Sending ${item.kind} notification:`, body)

                    const p = c.env.BOT.fetch("https://internal/bot/notify", { method: "POST", headers, body })
                        .then(async (res) => {
                            console.log(`[admin-adjust] ${item.kind} notification response:`, res.status)
                            return res.json()
                        })
                        .catch((e) => {
                            console.error(`[admin-adjust] ${item.kind} notification error:`, e)
                        })
                    tasks.push(p)
                }

                // Fire-and-forget
                // @ts-ignore Cloudflare runtime
                c.executionCtx?.waitUntil(Promise.all(tasks))
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
