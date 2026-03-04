// @ts-ignore - Cloudflare Workers handle node:buffer natively
import { Buffer } from "node:buffer"
import { Hono } from "hono"
import { getDb } from "@loyalty/db/client"
import { loyaltyConfigs } from "@loyalty/db/schema"
import { and, eq, like, sql, lt, desc } from "drizzle-orm"
import type { Env } from "@/types/env"
import { parsePagination, parseSort, buildPagination, buildSearch } from "@/utils/query-helpers"
import { z } from "zod"
import { v7 as uuidv7 } from 'uuid';
import { generateCursor } from "drizzle-cursor";

// Zod schemas for loyalty config payloads
const LevelChangeConfig = z.object({
  targetLevel: z.string().min(1),
  pointsForReferrer: z.number().int().min(0),
  pointsForReferred: z.number().int().min(0),
  notifyReferrer: z.boolean().default(true),
  notifyReferred: z.boolean().default(true),
})

const BaseConfigBody = z.object({
  name: z.string().min(1),
  active: z.boolean().default(true),
  triggerKey: z.enum(["level_change"] as const),
})

const CreateBody = BaseConfigBody.and(
  z.object({
    config: z.union([
      z.object({ triggerKey: z.literal("level_change") }).strip().transform(() => null),
      LevelChangeConfig,
    ]).transform((val, ctx) => {
      // When triggerKey is level_change, config must be LevelChangeConfig. We depend on request structure providing config.
      return val
    }),
  })
)

const UpdateBody = z.object({
  name: z.string().min(1).optional(),
  active: z.boolean().optional(),
  // triggerKey is immutable via update for safety
  config: LevelChangeConfig.optional(),
})

export type LevelChangeConfigType = z.infer<typeof LevelChangeConfig>

export const configsRoute = new Hono<Env>()

// GET /configs
configsRoute.get("/", async (c) => {
  try {
    const url = new URL(c.req.url)
    const { cursor, pageSize, includeCount } = parsePagination(url)
    const q = url.searchParams.get("q")
    const trigger = url.searchParams.get("triggerKey")
    const sortParam = url.searchParams.get("sort") || "createdAt,desc"

    const db = getDb(c.env)

    const baseWhereConditions: any[] = []
    if (q) baseWhereConditions.push(buildSearch(q, [loyaltyConfigs.name, loyaltyConfigs.triggerKey]))
    if (trigger) baseWhereConditions.push(eq(loyaltyConfigs.triggerKey, trigger))

    const countWhereExpr = baseWhereConditions.length ? and(...baseWhereConditions) : undefined

    // 1. Extract Sorting Details
    const sortField = sortParam?.split(',')[0] || 'createdAt';
    const sortDir = (sortParam?.split(',')[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
    const isCustomSort = sortField !== 'configId';

    // 2. Configure drizzle-cursor
    const cursorConfig = generateCursor({
      cursors: isCustomSort ? [
        {
          order: sortDir,
          key: sortField,
          schema: (loyaltyConfigs as any)[sortField] || loyaltyConfigs.createdAt
        }
      ] : [],
      primaryCursor: {
        order: isCustomSort ? 'DESC' : sortDir,
        key: 'configId',
        schema: loyaltyConfigs.configId
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
        } else if (!('configId' in cursorObj)) {
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

    const query = db.select().from(loyaltyConfigs)
    if (dataWhereExpr) query.where(dataWhereExpr as any)
    query.orderBy(...cursorConfig.orderBy)

    const dataQuery = query.limit(pageSize + 1)

    let itemsRaw: any[] = []
    let total: number | undefined = undefined

    if (includeCount) {
      const totalQuery = db.select({ count: sql<number>`count(*)` }).from(loyaltyConfigs)
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

    // Parse JSON for convenience
    const data = items.map((i) => ({
      ...i,
      config: safeParseJson(i.configJson),
    }))

    return c.json({ ok: true, data, pagination: buildPagination({ pageSize, hasNextPage, nextCursor, total }) })
  } catch (err: any) {
    console.error("[GET /configs] error", err)
    return c.json({ ok: false, error: "INTERNAL_ERROR", message: err?.message }, 500)
  }
})

// GET /configs/:id
configsRoute.get("/:id", async (c) => {
  try {
    const id = c.req.param("id")
    const db = getDb(c.env)
    const row = await db.select().from(loyaltyConfigs).where(eq(loyaltyConfigs.configId, id)).get()
    if (!row) return c.json({ ok: false, error: "NOT_FOUND" }, 404)
    return c.json({ ok: true, data: { ...row, config: safeParseJson(row.configJson) } })
  } catch (err: any) {
    console.error("[GET /configs/:id] error", err)
    return c.json({ ok: false, error: "INTERNAL_ERROR", message: err?.message }, 500)
  }
})

// POST /configs
configsRoute.post("/", async (c) => {
  try {
    const db = getDb(c.env)
    const body = await c.req.json()
    const parsed = CreateBody.parse(body)

    const now = Math.floor(Date.now() / 1000)
    const id = uuidv7();

    // Only supported trigger: level_change
    if (parsed.triggerKey !== "level_change") {
      return c.json({ ok: false, error: "UNSUPPORTED_TRIGGER" }, 400)
    }

    const cfg = LevelChangeConfig.parse((body as any).config)

    await db
      .insert(loyaltyConfigs)
      .values({
        configId: id,
        triggerKey: parsed.triggerKey,
        active: parsed.active,
        name: parsed.name,
        configJson: JSON.stringify(cfg),
        createdAt: now,
        updatedAt: now,
      })
      .run()

    const created = await db.select().from(loyaltyConfigs).where(eq(loyaltyConfigs.configId, id)).get()
    return c.json({ ok: true, data: { ...created, config: cfg } })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return c.json({ ok: false, error: "VALIDATION_ERROR", details: err.issues }, 400)
    }
    console.error("[POST /configs] error", err)
    return c.json({ ok: false, error: "INTERNAL_ERROR", message: err?.message }, 500)
  }
})

// PUT /configs/:id
configsRoute.put("/:id", async (c) => {
  try {
    const db = getDb(c.env)
    const id = c.req.param("id")
    const body = await c.req.json()
    const parsed = UpdateBody.parse(body)

    const existing = await db.select().from(loyaltyConfigs).where(eq(loyaltyConfigs.configId, id)).get()
    if (!existing) return c.json({ ok: false, error: "NOT_FOUND" }, 404)

    const now = Math.floor(Date.now() / 1000)

    const patch: any = { updatedAt: now }
    if (typeof parsed.name !== "undefined") patch.name = parsed.name
    if (typeof parsed.active !== "undefined") patch.active = parsed.active
    if (parsed.config) patch.configJson = JSON.stringify(parsed.config)

    await db.update(loyaltyConfigs).set(patch).where(eq(loyaltyConfigs.configId, id)).run()

    const updated = await db.select().from(loyaltyConfigs).where(eq(loyaltyConfigs.configId, id)).get()
    return c.json({ ok: true, data: { ...updated, config: safeParseJson(updated!.configJson) } })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return c.json({ ok: false, error: "VALIDATION_ERROR", details: err.issues }, 400)
    }
    console.error("[PUT /configs/:id] error", err)
    return c.json({ ok: false, error: "INTERNAL_ERROR", message: err?.message }, 500)
  }
})

// DELETE /configs/:id
configsRoute.delete("/:id", async (c) => {
  try {
    const db = getDb(c.env)
    const id = c.req.param("id")
    await db.delete(loyaltyConfigs).where(eq(loyaltyConfigs.configId, id)).run()
    return c.json({ ok: true })
  } catch (err: any) {
    console.error("[DELETE /configs/:id] error", err)
    return c.json({ ok: false, error: "INTERNAL_ERROR", message: err?.message }, 500)
  }
})

function safeParseJson(json: string | null | undefined) {
  if (!json) return null
  try { return JSON.parse(json) } catch { return null }
}
