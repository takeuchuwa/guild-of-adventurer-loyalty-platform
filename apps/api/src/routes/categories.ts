// @ts-ignore - Cloudflare Workers handle node:buffer natively
import { Buffer } from "node:buffer"
import { Hono } from "hono"
import { getDb } from "@loyalty/db/client"
import { categories } from "@loyalty/db/schema"
import { eq, sql, and, lt, desc } from "drizzle-orm"
import { parsePagination, parseSort, buildPagination, buildSearch } from "@/utils/query-helpers"
import type { Env } from "@/types/env"
import { z } from "zod"
import { v7 as uuidv7 } from 'uuid';
import { generateCursor } from "drizzle-cursor";

const CategoryBody = z.object({
    kind: z.enum(["PRODUCT", "ACTIVITY"]),
    name: z.string().min(1),
})

export const categoriesRoute = new Hono<Env>()

categoriesRoute.get("/", async (c) => {
    try {
        const url = new URL(c.req.url)
        const { cursor, pageSize, includeCount } = parsePagination(url)
        const q = url.searchParams.get("q")
        const sortParam = url.searchParams.get("sort")
        const kind = url.searchParams.get("kind")

        const db = getDb(c.env)

        const baseWhereConditions = []
        if (q) {
            baseWhereConditions.push(buildSearch(q, [categories.name]))
        }
        if (kind) {
            baseWhereConditions.push(eq(categories.kind, kind as any))
        }

        const countWhereExpr = baseWhereConditions.length > 0 ? and(...baseWhereConditions) : undefined

        // 1. Extract Sorting Details
        const sortField = sortParam?.split(',')[0] || 'categoryId';
        const sortDir = (sortParam?.split(',')[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
        const isCustomSort = sortField !== 'categoryId';

        // 2. Configure drizzle-cursor
        const cursorConfig = generateCursor({
            cursors: isCustomSort ? [
                {
                    order: sortDir,
                    key: sortField,
                    schema: (categories as any)[sortField] || categories.categoryId
                }
            ] : [],
            primaryCursor: {
                order: isCustomSort ? 'DESC' : sortDir,
                key: 'categoryId',
                schema: categories.categoryId
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
                } else if (!('categoryId' in cursorObj)) {
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

        const query = db.select().from(categories)

        if (dataWhereExpr) query.where(dataWhereExpr as any)
        query.orderBy(...cursorConfig.orderBy)

        const dataQuery = query.limit(pageSize + 1)

        let itemsRaw: any[] = []
        let total: number | undefined = undefined

        if (includeCount) {
            const totalQuery = db.select({ count: sql<number>`count(*)` }).from(categories)
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
        console.error("[GET /categories] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err?.message }, 500)
    }
})

categoriesRoute.get("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const [category] = await db.select().from(categories).where(eq(categories.categoryId, id))

        if (!category) {
            return c.json({ error: "Category not found" }, 404)
        }

        return c.json(category)
    } catch (err: any) {
        console.error(err)
        return c.json({ error: "Invalid request", details: String(err?.message ?? err) }, 400)
    }
})

// --- POST /categories — create ---
categoriesRoute.post("/", async (c) => {
    try {
        const body = await c.req.json()
        const { kind, name } = CategoryBody.parse(body)

        const db = getDb(c.env)
        const now = Math.floor(Date.now() / 1000)
        const categoryId = uuidv7();

        // 🔍 Check if category name already exists
        const [existing] = await db.select({ id: categories.categoryId }).from(categories).where(eq(categories.name, name))

        if (existing) {
            return c.json({ error: "Category name already exists" }, 409)
        }

        await db.insert(categories).values({
            categoryId,
            kind,
            name,
            createdAt: now,
            updatedAt: now,
        })

        // Fetch created row (safe for D1 / SQLite)
        const [created] = await db.select().from(categories).where(eq(categories.categoryId, categoryId))

        return c.json(created, 201)
    } catch (err: any) {
        return c.json({ error: "Invalid request", details: String(err?.message ?? err) }, 400)
    }
})

categoriesRoute.put("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const body = await c.req.json()
        const updatedData = CategoryBody.parse(body) // full body

        const db = getDb(c.env)
        const now = Math.floor(Date.now() / 1000)

        // Fetch existing record
        const [found] = await db.select().from(categories).where(eq(categories.categoryId, id))

        if (!found) {
            return c.json({ error: "Category not found" }, 404)
        }

        // Only check uniqueness if name is actually changing
        if (updatedData.name !== found.name) {
            const [clash] = await db
                .select({ id: categories.categoryId })
                .from(categories)
                .where(eq(categories.name, updatedData.name))

            if (clash && clash.id !== id) {
                return c.json({ error: "Category name already exists" }, 409)
            }
        }

        await db
            .update(categories)
            .set({
                kind: updatedData.kind,
                name: updatedData.name,
                updatedAt: now,
            })
            .where(eq(categories.categoryId, id))

        const [updated] = await db.select().from(categories).where(eq(categories.categoryId, id))

        return c.json(updated)
    } catch (err: any) {
        return c.json({ error: "Invalid request", details: String(err?.message ?? err) }, 400)
    }
})
