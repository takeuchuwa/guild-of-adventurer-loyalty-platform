// @ts-ignore - Cloudflare Workers handle node:buffer natively
import { Buffer } from "node:buffer"
import { Hono } from "hono"
import { getDb } from "@loyalty/db/client"
import { rooms } from "@loyalty/db/schema"
import { eq, sql, like, lt, desc, and } from "drizzle-orm"
import { parsePagination, parseSort, buildPagination } from "@/utils/query-helpers"
import type { Env } from "@/types/env"
import { z } from "zod"
import { v7 as uuidv7 } from 'uuid';
import { generateCursor } from "drizzle-cursor";

const RoomBody = z.object({
    name: z.string().min(1),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

export const roomsRoute = new Hono<Env>()

roomsRoute.get("/", async (c) => {
    try {
        const url = new URL(c.req.url)
        const { cursor, pageSize, includeCount } = parsePagination(url)
        const q = url.searchParams.get("q")
        const sortParam = url.searchParams.get("sort")

        const db = getDb(c.env)

        const baseWhereConditions: any[] = []
        if (q) baseWhereConditions.push(like(rooms.name, `%${q}%`))

        const countWhereExpr = baseWhereConditions.length ? and(...baseWhereConditions) : undefined

        // 1. Extract Sorting Details
        const sortField = sortParam?.split(',')[0] || 'roomId';
        const sortDir = (sortParam?.split(',')[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
        const isCustomSort = sortField !== 'roomId';

        // 2. Configure drizzle-cursor
        const cursorConfig = generateCursor({
            cursors: isCustomSort ? [
                {
                    order: sortDir,
                    key: sortField,
                    schema: (rooms as any)[sortField] || rooms.name
                }
            ] : [],
            primaryCursor: {
                order: isCustomSort ? 'DESC' : sortDir,
                key: 'roomId',
                schema: rooms.roomId
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
                } else if (!('roomId' in cursorObj)) {
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

        const query = db.select().from(rooms)

        if (dataWhereExpr) query.where(dataWhereExpr as any)
        query.orderBy(...cursorConfig.orderBy)

        const dataQuery = query.limit(pageSize + 1)

        let itemsRaw: any[] = []
        let total: number | undefined = undefined

        if (includeCount) {
            const totalQuery = db.select({ count: sql<number>`count(*)` }).from(rooms)
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
        console.error("[GET /rooms] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err?.message }, 500)
    }
})

roomsRoute.get("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const [room] = await db.select().from(rooms).where(eq(rooms.roomId, id))

        if (!room) {
            return c.json({ error: "Room not found" }, 404)
        }

        return c.json({ ok: true, data: room })
    } catch (err: any) {
        console.error(err)
        return c.json({ error: "Invalid request", details: String(err?.message ?? err) }, 400)
    }
})

roomsRoute.post("/", async (c) => {
    try {
        const body = await c.req.json()
        const { name, color } = RoomBody.parse(body)

        const db = getDb(c.env)
        const now = Math.floor(Date.now() / 1000)
        const roomId = uuidv7();

        const [existing] = await db.select({ id: rooms.roomId }).from(rooms).where(eq(rooms.name, name))

        if (existing) {
            return c.json({ error: "Room name already exists" }, 409)
        }

        await db.insert(rooms).values({
            roomId,
            name,
            color,
            createdAt: now,
            updatedAt: now,
        })

        const [created] = await db.select().from(rooms).where(eq(rooms.roomId, roomId))

        return c.json(created, 201)
    } catch (err: any) {
        return c.json({ error: "Invalid request", details: String(err?.message ?? err) }, 400)
    }
})

roomsRoute.put("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const body = await c.req.json()
        const updatedData = RoomBody.parse(body)

        const db = getDb(c.env)
        const now = Math.floor(Date.now() / 1000)

        const [found] = await db.select().from(rooms).where(eq(rooms.roomId, id))

        if (!found) {
            return c.json({ error: "Room not found" }, 404)
        }

        if (updatedData.name !== found.name) {
            const [clash] = await db.select({ id: rooms.roomId }).from(rooms).where(eq(rooms.name, updatedData.name))

            if (clash && clash.id !== id) {
                return c.json({ error: "Room name already exists" }, 409)
            }
        }

        await db
            .update(rooms)
            .set({
                name: updatedData.name,
                color: updatedData.color,
                updatedAt: now,
            })
            .where(eq(rooms.roomId, id))

        const [updated] = await db.select().from(rooms).where(eq(rooms.roomId, id))

        return c.json(updated)
    } catch (err: any) {
        return c.json({ error: "Invalid request", details: String(err?.message ?? err) }, 400)
    }
})

roomsRoute.delete("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const [found] = await db.select().from(rooms).where(eq(rooms.roomId, id))

        if (!found) {
            return c.json({ error: "Room not found" }, 404)
        }

        await db.delete(rooms).where(eq(rooms.roomId, id))

        return c.json({ ok: true, message: "Room deleted successfully" })
    } catch (err: any) {
        console.error("[DELETE /rooms/:id] error", err)
        return c.json({ error: "INTERNAL_ERROR", message: String(err?.message ?? err) }, 500)
    }
})
