// @ts-ignore - Cloudflare Workers handle node:buffer natively
import { Buffer } from "node:buffer"
import { Hono } from "hono"
import { getDb } from "@loyalty/db/client"
import { games, systems } from "@loyalty/db/schema"
import { sql, eq, inArray, and, lt, desc } from "drizzle-orm"
import {
    parsePagination,
    parseSort,
    buildPagination,
    buildSearch,
} from "@/utils/query-helpers"
import type { Env } from "@/types/env"
import { z } from "zod";
import { v7 as uuidv7 } from 'uuid';
import { generateCursor } from "drizzle-cursor";

export const gamesRoute = new Hono<Env>()

const GameBody = z.object({
    name: z.string().min(1),
    description: z.string().optional().nullable(),
})
/**
 * GET /games?page=0&pageSize=20&sort=name,asc&q=dnd
 * Returns paginated list of games with linked systems.
 */
gamesRoute.get("/", async (c) => {
    try {
        const url = new URL(c.req.url)
        const { cursor, pageSize, includeCount } = parsePagination(url)
        const q = url.searchParams.get("q")
        const sortParam = url.searchParams.get("sort")

        const db = getDb(c.env)

        const baseWhereConditions: any[] = []
        if (q) baseWhereConditions.push(buildSearch(q, [games.name]))

        const countWhereExpr = baseWhereConditions.length ? and(...baseWhereConditions) : undefined

        // 1. Extract Sorting Details
        const sortField = sortParam?.split(',')[0] || 'gameId';
        const sortDir = (sortParam?.split(',')[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
        const isCustomSort = sortField !== 'gameId';

        // 2. Configure drizzle-cursor
        const cursorConfig = generateCursor({
            cursors: isCustomSort ? [
                {
                    order: sortDir,
                    key: sortField,
                    schema: (games as any)[sortField] || games.name
                }
            ] : [],
            primaryCursor: {
                order: isCustomSort ? 'DESC' : sortDir,
                key: 'gameId',
                schema: games.gameId
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
                } else if (!('gameId' in cursorObj)) {
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
        const dataWhereExpr = dataWhereConditions.length ? and(...dataWhereConditions) : undefined

        // 📦 Fetch paginated games
        const gameQuery = db
            .select({
                gameId: games.gameId,
                name: games.name,
                description: games.description,
                createdAt: games.createdAt,
                updatedAt: games.updatedAt,
            })
            .from(games)

        if (dataWhereExpr) gameQuery.where(dataWhereExpr as any)
        gameQuery.orderBy(...cursorConfig.orderBy)

        const dataQuery = gameQuery.limit(pageSize + 1)

        let itemsRaw: any[] = []
        let total: number | undefined = undefined

        if (includeCount) {
            const totalQuery = db.select({ count: sql<number>`count(*)` }).from(games)
            if (countWhereExpr) totalQuery.where(countWhereExpr as any)

            const [dataResult, countResult] = await Promise.all([dataQuery.all(), totalQuery.all()]);
            itemsRaw = dataResult;
            total = (countResult as any[])[0]?.count ?? 0;
        } else {
            itemsRaw = await dataQuery.all();
        }

        const hasNextPage = itemsRaw.length > pageSize
        const gamesList = hasNextPage ? itemsRaw.slice(0, pageSize) : itemsRaw
        const nextCursor = hasNextPage ? cursorConfig.serialize(gamesList[gamesList.length - 1]) : null

        const gameIds = gamesList.map((g) => g.gameId)

        // ⚙️ Fetch all systems linked to these games
        const systemRows = gameIds.length
            ? await db
                .select({
                    systemId: systems.systemId,
                    name: systems.name,
                    description: systems.description,
                    gameId: systems.gameId,
                    createdAt: systems.createdAt,
                    updatedAt: systems.updatedAt,
                })
                .from(systems)
                .where(inArray(systems.gameId, gameIds))
                .all()
            : []

        // 🧠 Group systems by game
        const systemMap: Record<string, typeof systemRows> = {}
        for (const sys of systemRows) {
            if (!systemMap[sys.gameId]) systemMap[sys.gameId] = []
            systemMap[sys.gameId].push(sys)
        }

        // 🧱 Merge systems into each game
        const data = gamesList.map((g) => ({
            ...g,
            systems: systemMap[g.gameId] ?? [],
        }))

        const pagination = buildPagination({ pageSize, hasNextPage, nextCursor, total })
        return c.json({ ok: true, data, pagination })
    } catch (err: any) {
        console.error("[GET /games] error", err)
        return c.json(
            {
                ok: false,
                error: "INTERNAL_ERROR",
                message: err?.message || "Unknown error",
            },
            500
        )
    }
})


// --- POST /games — create ---
gamesRoute.post('/', async (c) => {
    try {
        const body = await c.req.json()
        const parsed = GameBody.parse(body)

        const db = getDb(c.env)
        const now = Math.floor(Date.now() / 1000)
        const gameId = uuidv7();

        // 🔍 Check if game name already exists
        const [existing] = await db
            .select({ id: games.gameId })
            .from(games)
            .where(eq(games.name, parsed.name))

        if (existing) {
            return c.json({ error: 'Game name already exists' }, 409)
        }

        await db.insert(games).values({
            gameId,
            name: parsed.name,
            description: parsed.description ?? null,
            createdAt: now,
            updatedAt: now,
        })

        const [created] = await db
            .select()
            .from(games)
            .where(eq(games.gameId, gameId))

        return c.json(created, 201)
    } catch (err: any) {
        return c.json(
            { error: 'Invalid request', details: String(err?.message ?? err) },
            400,
        )
    }
})


// PUT /games/:id — update by id
gamesRoute.put('/:id', async (c) => {
    try {
        const id = c.req.param('id')
        const body = await c.req.json()
        const parsed = GameBody.parse(body)

        const now = Math.floor(Date.now() / 1000)
        const db = getDb(c.env)

        // Fetch current game
        const [found] = await db
            .select()
            .from(games)
            .where(eq(games.gameId, id))

        if (!found) {
            return c.json({ error: 'Game not found' }, 404)
        }

        // 🔍 Only check uniqueness if name changed
        if (parsed.name !== found.name) {
            const [clash] = await db
                .select({ id: games.gameId })
                .from(games)
                .where(eq(games.name, parsed.name))

            if (clash && clash.id !== id) {
                return c.json({ error: 'Game name already exists' }, 409)
            }
        }

        await db
            .update(games)
            .set({
                name: parsed.name,
                description: parsed.description ?? null,
                updatedAt: now,
            })
            .where(eq(games.gameId, id))

        const [updated] = await db
            .select()
            .from(games)
            .where(eq(games.gameId, id))

        return c.json(updated)
    } catch (err: any) {
        return c.json(
            { error: 'Invalid request', details: String(err?.message ?? err) },
            400,
        )
    }
})


// GET /games/:id — fetch one game by id
gamesRoute.get('/:id', async (c) => {
    try {
        const id = c.req.param('id')
        const db = getDb(c.env);
        const [game] = await db
            .select()
            .from(games)
            .where(eq(games.gameId, id))

        if (!game) {
            return c.json({ error: 'Game not found' }, 404)
        }

        return c.json(game)
    } catch (err: any) {
        return c.json({ error: 'Invalid request', details: String(err?.message ?? err) }, 400)
    }
})

const SystemBody = z.object({
    name: z.string().min(1),
    description: z.string().optional().nullable(),
})

// ----------------------------------------
// GET /games/:id/systems — list all systems for a game
// ----------------------------------------
gamesRoute.get("/:id/systems", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const items = await db
            .select()
            .from(systems)
            .where(eq(systems.gameId, id))
            .all()

        return c.json({ ok: true, data: items })
    } catch (err: any) {
        console.error("[GET /games/:id/systems] error", err)
        return c.json(
            { ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) },
            500
        )
    }
})

// ----------------------------------------
// POST /games/:id/systems — create system
// ----------------------------------------
gamesRoute.post("/:id/systems", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)
        const body = await c.req.json()
        const { name, description } = SystemBody.parse(body)

        const now = Math.floor(Date.now() / 1000)
        const systemId = uuidv7();

        await db.insert(systems).values({
            systemId,
            name,
            description: description ?? null,
            gameId: id,
            createdAt: now,
            updatedAt: now,
        })

        const [created] = await db
            .select()
            .from(systems)
            .where(eq(systems.systemId, systemId))

        return c.json({ ok: true, data: created }, 201)
    } catch (err: any) {
        console.error("[POST /games/:id/systems] error", err)
        return c.json(
            { ok: false, error: "INVALID_REQUEST", message: String(err?.message ?? err) },
            400
        )
    }
})

// ----------------------------------------
// PUT /games/:id/systems/:systemId — update system
// ----------------------------------------
gamesRoute.put("/:id/systems/:systemId", async (c) => {
    try {
        const gameId = c.req.param("id")
        const systemId = c.req.param("systemId")
        const db = getDb(c.env)
        const body = await c.req.json()
        const partial = SystemBody.partial().parse(body)

        const now = Math.floor(Date.now() / 1000)

        const [found] = await db
            .select({ id: systems.systemId })
            .from(systems)
            .where(eq(systems.systemId, systemId))

        if (!found) {
            return c.json({ ok: false, error: "NOT_FOUND", message: "System not found" }, 404)
        }

        await db
            .update(systems)
            .set({
                ...partial,
                updatedAt: now,
            })
            .where(eq(systems.systemId, systemId))

        const [updated] = await db
            .select()
            .from(systems)
            .where(eq(systems.systemId, systemId))

        return c.json({ ok: true, data: updated })
    } catch (err: any) {
        console.error("[PUT /games/:id/systems/:systemId] error", err)
        return c.json(
            { ok: false, error: "INVALID_REQUEST", message: String(err?.message ?? err) },
            400
        )
    }
})

// ----------------------------------------
// DELETE /games/:id/systems/:systemId — delete system
// ----------------------------------------
gamesRoute.delete("/:id/systems/:systemId", async (c) => {
    try {
        const systemId = c.req.param("systemId")
        const db = getDb(c.env)

        await db.delete(systems).where(eq(systems.systemId, systemId))

        return c.json({ ok: true })
    } catch (err: any) {
        console.error("[DELETE /games/:id/systems/:systemId] error", err)
        return c.json(
            { ok: false, error: "INTERNAL_ERROR", message: String(err?.message ?? err) },
            500
        )
    }
})
