// @ts-ignore - Cloudflare Workers handle node:buffer natively
import { Buffer } from "node:buffer"
import { Hono } from "hono"
import { getDb } from "@loyalty/db/client"
import { promotions, promotionAssignments, members, levelPromotions } from "@loyalty/db/schema"
import { eq, and, desc, sql, lt } from "drizzle-orm"
import { parsePagination, parseSort, buildPagination } from "@/utils/query-helpers"
import { generateUniqueCode } from "@/utils/promo-codes"
import type { Env } from "@/types/env"
import { v7 as uuidv7 } from 'uuid';
import { generateCursor } from "drizzle-cursor";

export const promotionsRoute = new Hono<Env>()

/**
 * GET /promotions
 * Retrieves a paginated list of promotions.
 */
promotionsRoute.get("/", async (c) => {
    try {
        const url = new URL(c.req.url)
        const { cursor, pageSize, includeCount } = parsePagination(url)

        const sortParam = url.searchParams.get("sort")
        const activeParam = url.searchParams.get("active")?.trim()
        const modeParam = url.searchParams.get("mode")?.trim()

        const db = getDb(c.env)
        const baseWhereConditions = []

        if (activeParam) {
            baseWhereConditions.push(eq(promotions.active, activeParam === "true"))
        }

        if (modeParam && (modeParam === "COUPON" || modeParam === "AUTO")) {
            baseWhereConditions.push(eq(promotions.mode, modeParam as "COUPON" | "AUTO"))
        }

        const countWhereExpr = baseWhereConditions.length > 0 ? and(...baseWhereConditions) : undefined

        // 1. Extract Sorting Details
        const sortField = sortParam?.split(',')[0] || 'promoId';
        const sortDir = (sortParam?.split(',')[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
        const isCustomSort = sortField !== 'promoId';

        // 2. Configure drizzle-cursor
        const cursorConfig = generateCursor({
            cursors: isCustomSort ? [
                {
                    order: sortDir,
                    key: sortField,
                    schema: (promotions as any)[sortField] || promotions.promoId
                }
            ] : [],
            primaryCursor: {
                order: isCustomSort ? 'DESC' : sortDir,
                key: 'promoId',
                schema: promotions.promoId
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
                } else if (!('promoId' in cursorObj)) {
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

        const query = db.select().from(promotions)
        if (dataWhereExpr) query.where(dataWhereExpr)
        query.orderBy(...cursorConfig.orderBy)

        const dataQuery = query.limit(pageSize + 1)

        let itemsRaw: any[] = []
        let total: number | undefined = undefined

        if (includeCount) {
            const totalQuery = db.select({ count: sql<number>`count(*)` }).from(promotions)
            if (countWhereExpr) totalQuery.where(countWhereExpr)

            const [dataResult, countResult] = await Promise.all([dataQuery.all(), totalQuery.all()]);
            itemsRaw = dataResult;
            total = (countResult as any[])[0]?.count ?? 0;
        } else {
            itemsRaw = await dataQuery.all();
        }

        const hasNextPage = itemsRaw.length > pageSize
        const items = hasNextPage ? itemsRaw.slice(0, pageSize) : itemsRaw
        const nextCursor = hasNextPage ? cursorConfig.serialize(items[items.length - 1]) : null

        return c.json({
            ok: true,
            data: items,
            pagination: buildPagination({ pageSize, hasNextPage, nextCursor, total }),
        })
    } catch (err: any) {
        console.error("[GET /promotions] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * GET /promotions/:id
 * Retrieves a single promotion by ID.
 */
promotionsRoute.get("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const [item] = await db.select().from(promotions).where(eq(promotions.promoId, id))

        if (!item) {
            return c.json({ ok: false, error: "Promotion not found" }, 404)
        }

        const rawAssignments = await db
            .select({
                assignmentId: promotionAssignments.assignmentId,
                memberId: promotionAssignments.memberId,
                promoId: promotionAssignments.promoId,
                status: promotionAssignments.status,
                uniqueCode: promotionAssignments.uniqueCode,
                assignedAt: promotionAssignments.assignedAt,
                redeemedAt: promotionAssignments.redeemedAt,
                memberFirstName: members.firstName,
                memberLastName: members.lastName,
                memberPhone: members.phone,
            })
            .from(promotionAssignments)
            .leftJoin(members, eq(promotionAssignments.memberId, members.memberId))
            .where(eq(promotionAssignments.promoId, id))

        const assignments = rawAssignments.map(({ memberFirstName, memberLastName, memberPhone, ...a }) => ({
            ...a,
            member: {
                firstName: memberFirstName,
                lastName: memberLastName,
                phone: memberPhone,
            },
        }))

        const rawLevelPromotions = await db
            .select({ levelId: levelPromotions.levelId })
            .from(levelPromotions)
            .where(eq(levelPromotions.promoId, id))

        const levelAssignments = rawLevelPromotions.map((lp) => lp.levelId)

        return c.json({ ok: true, data: { ...item, assignments, levelAssignments } })
    } catch (err: any) {
        console.error("[GET /promotions/:id] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * POST /promotions
 * Creates a new promotion.
 */
promotionsRoute.post("/", async (c) => {
    try {
        const body = await c.req.json()
        const { name, mode, code, description, active, combinable, priority, startDate, endDate, usageRemaining, config, assignments, levelAssignments } = body

        if (!name || !mode || startDate === undefined || endDate === undefined || !config) {
            return c.json({ ok: false, error: "Missing required fields: name, mode, startDate, endDate, config" }, 400)
        }

        if (mode === "COUPON" && !code) {
            return c.json({ ok: false, error: "Code is required for COUPON mode" }, 400)
        }

        const db = getDb(c.env)
        const now = Math.floor(Date.now() / 1000)
        const promoId = uuidv7();

        await db.insert(promotions).values({
            promoId,
            name,
            mode,
            code: code || null,
            description: description || null,
            active: active ?? true,
            combinable: combinable ?? false,
            priority: priority ?? 0,
            startDate: startDate ?? -1,
            endDate: endDate ?? -1,
            usageRemaining: usageRemaining ?? null,
            config,
            createdAt: now,
            updatedAt: now
        })

        if (assignments && assignments.memberIds && assignments.memberIds.length > 0) {
            const assignmentRecords = assignments.memberIds.map((memberId: string) => {
                let uniqueCode = null;
                if (mode === "COUPON" && assignments.generateUniqueCodes) {
                    uniqueCode = generateUniqueCode(code);
                }

                return {
                    assignmentId: uuidv7(),
                    memberId,
                    promoId,
                    status: "AVAILABLE",
                    uniqueCode,
                    assignedAt: now,
                };
            });

            await db.insert(promotionAssignments).values(assignmentRecords);
        }

        if (levelAssignments && Array.isArray(levelAssignments) && levelAssignments.length > 0) {
            const levelAssignmentRecords = levelAssignments.map((levelId: string) => ({
                levelId,
                promoId,
                createdAt: now,
            }));
            await db.insert(levelPromotions).values(levelAssignmentRecords);
        }

        const [created] = await db.select().from(promotions).where(eq(promotions.promoId, promoId))

        return c.json({ ok: true, data: created }, 201)

    } catch (err: any) {
        console.error("[POST /promotions] error", err)
        if (String(err).includes("UNIQUE constraint failed") || String(err).includes("SQLITE_CONSTRAINT")) {
            return c.json({ ok: false, error: "Code already exists" }, 409)
        }
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * PUT /promotions/:id
 * Updates an existing promotion.
 */
promotionsRoute.put("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const body = await c.req.json()
        const { assignments, levelAssignments, ...restBody } = body;
        const db = getDb(c.env)

        // Check existence
        const [existing] = await db.select().from(promotions).where(eq(promotions.promoId, id))
        if (!existing) {
            return c.json({ ok: false, error: "Promotion not found" }, 404)
        }

        const now = Math.floor(Date.now() / 1000)

        const updateData: any = { updatedAt: now }
        if (restBody.name !== undefined) updateData.name = restBody.name
        if (restBody.mode !== undefined) updateData.mode = restBody.mode
        if (restBody.code !== undefined) updateData.code = restBody.code
        if (restBody.description !== undefined) updateData.description = restBody.description
        if (restBody.active !== undefined) updateData.active = restBody.active
        if (restBody.combinable !== undefined) updateData.combinable = restBody.combinable
        if (restBody.priority !== undefined) updateData.priority = restBody.priority
        if (restBody.startDate !== undefined) updateData.startDate = restBody.startDate ?? -1
        if (restBody.endDate !== undefined) updateData.endDate = restBody.endDate ?? -1
        if (restBody.usageRemaining !== undefined) updateData.usageRemaining = restBody.usageRemaining
        if (restBody.config !== undefined) updateData.config = restBody.config

        await db.update(promotions)
            .set(updateData)
            .where(eq(promotions.promoId, id))

        if (assignments && assignments.memberIds) {
            const incomingMemberIds = new Set(assignments.memberIds);

            // Get existing assignments
            const existingAssignments = await db.select()
                .from(promotionAssignments)
                .where(eq(promotionAssignments.promoId, id));

            const existingMemberIds = new Set(existingAssignments.map((a: any) => a.memberId));

            // Members to add (in incoming but not in existing)
            const membersToAdd = assignments.memberIds.filter((mId: string) => !existingMemberIds.has(mId));

            // Members to remove (in existing but not in incoming)
            const membersToRemove = existingAssignments
                .filter((a: any) => !incomingMemberIds.has(a.memberId))
                .map((a: any) => a.memberId);

            // 1. Remove missing members
            if (membersToRemove.length > 0) {
                // Drizzle doesn't have a direct 'inArray' in this version, so we can delete them with an OR or one by one
                // Or using sql\`member_id IN (...)\`
                const orConditions = membersToRemove.map((mId: string) => eq(promotionAssignments.memberId, mId));
                await db.delete(promotionAssignments)
                    .where(
                        and(
                            eq(promotionAssignments.promoId, id),
                            orConditions.length > 1 ? orConditions.reduce((acc: any, condition: any) => sql`${acc} OR ${condition}`) : orConditions[0] // naive fallback if no inArray
                        )
                    );
            }

            // 2. Add new members
            if (membersToAdd.length > 0) {
                // we need the main code and mode for generating unique codes
                const promoMode = restBody.mode !== undefined ? restBody.mode : existing.mode;
                const promoCode = restBody.code !== undefined ? restBody.code : existing.code;

                const assignmentRecords = membersToAdd.map((memberId: string) => {
                    let uniqueCode = null;
                    if (promoMode === "COUPON" && assignments.generateUniqueCodes) {
                        uniqueCode = generateUniqueCode(promoCode);
                    }

                    return {
                        assignmentId: uuidv7(),
                        memberId,
                        promoId: id,
                        status: "AVAILABLE",
                        uniqueCode,
                        assignedAt: now,
                    };
                });

                await db.insert(promotionAssignments).values(assignmentRecords);
            }
        }

        if (levelAssignments && Array.isArray(levelAssignments)) {
            await db.delete(levelPromotions).where(eq(levelPromotions.promoId, id));

            if (levelAssignments.length > 0) {
                const levelAssignmentRecords = levelAssignments.map((levelId: string) => ({
                    levelId,
                    promoId: id,
                    createdAt: now,
                }));
                await db.insert(levelPromotions).values(levelAssignmentRecords);
            }
        }

        const [updated] = await db.select().from(promotions).where(eq(promotions.promoId, id))

        return c.json({ ok: true, data: updated })

    } catch (err: any) {
        console.error("[PUT /promotions/:id] error", err)
        if (String(err).includes("UNIQUE constraint failed") || String(err).includes("SQLITE_CONSTRAINT")) {
            return c.json({ ok: false, error: "Code already exists" }, 409)
        }
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

/**
 * DELETE /promotions/:id
 * Deletes a promotion.
 */
promotionsRoute.delete("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const [existing] = await db.select().from(promotions).where(eq(promotions.promoId, id))
        if (!existing) {
            return c.json({ ok: false, error: "Promotion not found" }, 404)
        }

        await db.delete(promotions).where(eq(promotions.promoId, id))

        return c.json({ ok: true, message: "Promotion deleted successfully" })

    } catch (err: any) {
        console.error("[DELETE /promotions/:id] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})
