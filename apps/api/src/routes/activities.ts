// @ts-ignore - Cloudflare Workers handle node:buffer natively
import { Buffer } from "node:buffer"
import { Hono } from "hono"
import { getDb } from "@loyalty/db/client"
import { activities, games, systems, entityCategories, categories, rooms } from "@loyalty/db/schema"
import { sql, eq, and, inArray, lt, desc } from "drizzle-orm"
import { parsePagination, parseSort, buildPagination, buildSearch } from "@/utils/query-helpers"
import type { Env } from "@/types/env"
import { v7 as uuidv7 } from 'uuid';
import { generateCursor } from "drizzle-cursor";

export const activitiesRoute = new Hono<Env>()

/**
 * GET /activities?startDate=...&endDate=...&cursor=...&pageSize=20&sort=name,asc&q=session
 * Returns paginated list of activities with joined categories, games, systems, and rooms.
 */
activitiesRoute.get("/", async (c) => {
    try {
        const url = new URL(c.req.url)
        const { cursor, pageSize, includeCount } = parsePagination(url)

        const startDateParam = url.searchParams.get("startDate")?.trim() || null
        const endDateParam = url.searchParams.get("endDate")?.trim() || null
        const q = url.searchParams.get("q")?.trim() || null

        console.log("[v0] Activities GET - query param 'q':", q)

        const sortParam = url.searchParams.get("sort")
        const categoryId = url.searchParams.get("categoryId")?.trim() || null

        const db = getDb(c.env)

        const baseWhereConditions = []

        // Date range filter (uses index on startDate)
        if (startDateParam) {
            const startTimestamp = Number.parseInt(startDateParam, 10)
            if (!isNaN(startTimestamp)) {
                baseWhereConditions.push(sql`${activities.startDate} >= ${startTimestamp}`)
            }
        }

        if (endDateParam) {
            const endTimestamp = Number.parseInt(endDateParam, 10)
            if (!isNaN(endTimestamp)) {
                baseWhereConditions.push(sql`${activities.startDate} <= ${endTimestamp}`)
            }
        }

        if (q) {
            const searchExpr = buildSearch(q.toUpperCase(), [activities.uppercaseName])
            if (searchExpr) {
                baseWhereConditions.push(searchExpr)
            }
        }

        const countWhereExpr = baseWhereConditions.length > 0 ? and(...baseWhereConditions) : undefined

        // 🔗 Optional category filter — only if truly provided and valid
        let filteredIds: string[] | null = null
        if (categoryId) {
            const rels = await db
                .select({ entityId: entityCategories.entityId })
                .from(entityCategories)
                .where(and(eq(entityCategories.entityType, "activity"), eq(entityCategories.categoryId, categoryId)))
                .all()
            filteredIds = rels.map((r) => r.entityId)
        }

        // 1. Extract Sorting Details
        const sortField = sortParam?.split(',')[0] || 'activityId';
        const sortDir = (sortParam?.split(',')[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
        const isCustomSort = sortField !== 'activityId';

        // 2. Configure drizzle-cursor
        const cursorConfig = generateCursor({
            cursors: isCustomSort ? [
                {
                    order: sortDir,
                    key: sortField,
                    schema: (activities as any)[sortField] || activities.activityId
                }
            ] : [],
            primaryCursor: {
                order: isCustomSort ? 'DESC' : sortDir,
                key: 'activityId',
                schema: activities.activityId
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
                } else if (!('activityId' in cursorObj)) {
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

        // 📦 Base query: LEFT JOINs everywhere
        const query = db
            .select({
                activityId: activities.activityId,
                name: activities.name,
                description: activities.description,
                overridePoints: activities.overridePoints,
                price: activities.price,
                startDate: activities.startDate,
                endDate: activities.endDate,
                createdAt: activities.createdAt,
                updatedAt: activities.updatedAt,
                gameId: activities.gameId,
                gameName: games.name,
                systemId: activities.systemId,
                systemName: systems.name,
                roomId: activities.roomId,
                roomName: rooms.name,
                roomColor: rooms.color,
            })
            .from(activities)
            .leftJoin(games, eq(activities.gameId, games.gameId))
            .leftJoin(systems, eq(activities.systemId, systems.systemId))
            .leftJoin(rooms, eq(activities.roomId, rooms.roomId))

        if (filteredIds && filteredIds.length > 0) {
            query.where(inArray(activities.activityId, filteredIds))
        } else if (dataWhereExpr) {
            query.where(dataWhereExpr as any)
        }

        query.orderBy(...cursorConfig.orderBy)

        const dataQuery = query.limit(pageSize + 1)

        let itemsRaw: any[] = []
        let total: number | undefined = undefined

        if (includeCount) {
            const totalQuery = db.select({ count: sql<number>`count(*)` }).from(activities)
            if (filteredIds && filteredIds.length > 0) {
                totalQuery.where(inArray(activities.activityId, filteredIds))
            } else if (countWhereExpr) {
                totalQuery.where(countWhereExpr as any)
            }

            const [dataResult, countResult] = await Promise.all([dataQuery.all(), totalQuery.all()]);
            itemsRaw = dataResult;
            total = (countResult as any[])[0]?.count ?? 0;
        } else {
            itemsRaw = await dataQuery.all();
        }

        const hasNextPage = itemsRaw.length > pageSize
        const items = hasNextPage ? itemsRaw.slice(0, pageSize) : itemsRaw
        const nextCursor = hasNextPage ? cursorConfig.serialize(items[items.length - 1]) : null

        // 🧩 LEFT JOIN categories (optional)
        const ids = items.map((i) => i.activityId)
        const categoryLinks = ids.length
            ? await db
                .select({
                    activityId: entityCategories.entityId,
                    categoryId: categories.categoryId,
                    categoryName: categories.name,
                    categoryKind: categories.kind,
                })
                .from(entityCategories)
                .leftJoin(categories, eq(categories.categoryId, entityCategories.categoryId))
                .where(and(eq(entityCategories.entityType, "activity"), inArray(entityCategories.entityId, ids)))
                .all()
            : []

        // 🧠 Group categories
        const categoryMap: Record<string, { categoryId: string; name: string | null; kind: string | null }[]> = {}
        for (const link of categoryLinks) {
            if (!link.activityId || !link.categoryId) continue
            if (!categoryMap[link.activityId]) categoryMap[link.activityId] = []
            categoryMap[link.activityId].push({
                categoryId: link.categoryId,
                name: link.categoryName,
                kind: link.categoryKind,
            })
        }

        // 🧱 Merge all data
        const data = items.map((a) => ({
            activityId: a.activityId,
            name: a.name,
            description: a.description,
            price: a.price,
            overridePoints: a.overridePoints,
            startDate: a.startDate,
            endDate: a.endDate,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
            game: a.gameId ? { gameId: a.gameId, name: a.gameName } : null,
            system: a.systemId ? { systemId: a.systemId, name: a.systemName } : null,
            room: a.roomId ? { roomId: a.roomId, name: a.roomName, color: a.roomColor } : null,
            categories: categoryMap[a.activityId] ?? [],
        }))

        return c.json({
            ok: true,
            data,
            pagination: buildPagination({ pageSize, hasNextPage, nextCursor, total }),
        })
    } catch (err: any) {
        console.error("[GET /activities] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

activitiesRoute.get("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const [activity] = await db
            .select({
                activityId: activities.activityId,
                name: activities.name,
                description: activities.description,
                overridePoints: activities.overridePoints,
                price: activities.price,
                startDate: activities.startDate,
                endDate: activities.endDate,
                createdAt: activities.createdAt,
                updatedAt: activities.updatedAt,
                gameId: activities.gameId,
                gameName: games.name,
                systemId: activities.systemId,
                systemName: systems.name,
                roomId: activities.roomId,
                roomName: rooms.name,
                roomColor: rooms.color,
            })
            .from(activities)
            .leftJoin(games, eq(activities.gameId, games.gameId))
            .leftJoin(systems, eq(activities.systemId, systems.systemId))
            .leftJoin(rooms, eq(activities.roomId, rooms.roomId))
            .where(eq(activities.activityId, id))

        if (!activity) {
            return c.json({ ok: false, error: "Activity not found" }, 404)
        }

        // Get categories
        const categoryLinks = await db
            .select({
                categoryId: categories.categoryId,
                categoryName: categories.name,
                categoryKind: categories.kind,
            })
            .from(entityCategories)
            .leftJoin(categories, eq(categories.categoryId, entityCategories.categoryId))
            .where(and(eq(entityCategories.entityType, "activity"), eq(entityCategories.entityId, id)))
            .all()

        const data = {
            activityId: activity.activityId,
            name: activity.name,
            description: activity.description,
            price: activity.price,
            overridePoints: activity.overridePoints,
            startDate: activity.startDate,
            endDate: activity.endDate,
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt,
            game: activity.gameId ? { gameId: activity.gameId, name: activity.gameName } : null,
            system: activity.systemId ? { systemId: activity.systemId, name: activity.systemName } : null,
            room: activity.roomId ? { roomId: activity.roomId, name: activity.roomName, color: activity.roomColor } : null,
            categories: categoryLinks.map((c) => ({
                categoryId: c.categoryId,
                name: c.categoryName,
                kind: c.categoryKind,
            })),
        }

        return c.json({ ok: true, data })
    } catch (err: any) {
        console.error("[GET /activities/:id] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

activitiesRoute.post("/", async (c) => {
    try {
        const body = await c.req.json()
        const { name, description, price, overridePoints, startDate, endDate, gameId, systemId, roomId, categoryIds } = body

        if (!name || price === undefined || !startDate || !endDate) {
            return c.json({ ok: false, error: "Missing required fields: name, price, startDate, endDate" }, 400)
        }

        if (!categoryIds || categoryIds.length === 0) {
            return c.json({ ok: false, error: "At least one category is required" }, 400)
        }

        const db = getDb(c.env)
        const now = Math.floor(Date.now() / 1000)
        const activityId = uuidv7();

        const statements: any[] = [
            // Insert activity
            db
                .insert(activities)
                .values({
                    activityId,
                    name,
                    uppercaseName: name.toUpperCase(),
                    description: description || null,
                    price,
                    overridePoints: overridePoints || null,
                    startDate,
                    endDate,
                    gameId: gameId || null,
                    systemId: systemId || null,
                    roomId: roomId || null,
                    createdAt: now,
                    updatedAt: now,
                }),
        ]

        // Insert category relationships
        if (categoryIds && categoryIds.length > 0) {
            statements.push(
                db.insert(entityCategories).values(
                    categoryIds.map((catId: string) => ({
                        entityCategoryId: uuidv7(),
                        entityType: "activity" as const,
                        entityId: activityId,
                        categoryId: catId,
                        createdAt: now,
                    })),
                ),
            )
        }

        await db.batch(statements as any)

        // Fetch created activity
        const [created] = await db.select().from(activities).where(eq(activities.activityId, activityId))

        return c.json({ ok: true, data: created }, 201)
    } catch (err: any) {
        console.error("[POST /activities] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

activitiesRoute.put("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const body = await c.req.json()
        const { name, description, price, overridePoints, startDate, endDate, gameId, systemId, roomId, categoryIds } = body

        if (!name || price === undefined || !startDate || !endDate) {
            return c.json({ ok: false, error: "Missing required fields: name, price, startDate, endDate" }, 400)
        }

        if (!categoryIds || categoryIds.length === 0) {
            return c.json({ ok: false, error: "At least one category is required" }, 400)
        }

        const db = getDb(c.env)
        const now = Math.floor(Date.now() / 1000)

        // Check if activity exists
        const [found] = await db.select().from(activities).where(eq(activities.activityId, id))

        if (!found) {
            return c.json({ ok: false, error: "Activity not found" }, 404)
        }

        const statements: any[] = [
            // Update activity
            db
                .update(activities)
                .set({
                    name,
                    uppercaseName: name.toUpperCase(),
                    description: description || null,
                    price,
                    overridePoints: overridePoints || null,
                    startDate,
                    endDate,
                    gameId: gameId || null,
                    systemId: systemId || null,
                    roomId: roomId || null,
                    updatedAt: now,
                })
                .where(eq(activities.activityId, id)),
            // Delete existing category relationships
            db
                .delete(entityCategories)
                .where(and(eq(entityCategories.entityType, "activity"), eq(entityCategories.entityId, id))),
        ]

        // Insert new category relationships
        if (categoryIds && categoryIds.length > 0) {
            statements.push(
                db.insert(entityCategories).values(
                    categoryIds.map((catId: string) => ({
                        entityCategoryId: uuidv7(),
                        entityType: "activity" as const,
                        entityId: id,
                        categoryId: catId,
                        createdAt: now,
                    })),
                ),
            )
        }

        await db.batch(statements as any)

        // Fetch updated activity
        const [updated] = await db.select().from(activities).where(eq(activities.activityId, id))

        return c.json({ ok: true, data: updated })
    } catch (err: any) {
        console.error("[PUT /activities/:id] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})

activitiesRoute.delete("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        // Check if activity exists
        const [found] = await db.select().from(activities).where(eq(activities.activityId, id))

        if (!found) {
            return c.json({ ok: false, error: "Activity not found" }, 404)
        }

        await db.batch([
            // Delete category relationships first
            db
                .delete(entityCategories)
                .where(and(eq(entityCategories.entityType, "activity"), eq(entityCategories.entityId, id))),
            // Delete activity
            db
                .delete(activities)
                .where(eq(activities.activityId, id)),
        ])

        return c.json({ ok: true, message: "Activity deleted successfully" })
    } catch (err: any) {
        console.error("[DELETE /activities/:id] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})
