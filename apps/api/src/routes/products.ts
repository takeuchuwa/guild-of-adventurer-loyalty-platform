// @ts-ignore - Cloudflare Workers handle node:buffer natively
import { Buffer } from "node:buffer"
import { Hono } from "hono"
import { getDb } from "@loyalty/db/client"
import { products, entityCategories, categories } from "@loyalty/db/schema"
import { sql, eq, and, inArray, lt, lte, gt, gte, desc } from "drizzle-orm"
import { parsePagination, parseSort, buildPagination, buildSearch } from "@/utils/query-helpers"
import type { Env } from "@/types/env"
import z from "zod"
import { v7 as uuidv7 } from 'uuid';
import { generateCursor } from "drizzle-cursor";

// ✅ Define Zod schema for product validation
export const ProductBody = z.object({
    sku: z
        .string()
        .trim()
        .regex(/^\d{11}$/, "SKU має містити рівно 11 цифр")
        .optional(),
    name: z.string().trim().min(1, "Назва обов'язкова").max(255),
    price: z.number().min(0).default(0),
    overridePoints: z.number().min(0).nullable().default(null),
    active: z.boolean().default(true),
    inventory: z.number().int().min(-1, "Інвентар не може бути менше -1").default(-1),
    categoryIds: z.array(z.string()).min(1, "Оберіть хоча б одну категорію"),
})

// Partial schema for updates
const ProductBodyPartial = ProductBody.partial()

export const productsRoute = new Hono<Env>()

/** Upper bound on the `ids` filter so one request can never fan out unbounded. */
const MAX_IDS = 50

/**
 * GET /products?page=0&pageSize=20&sort=name,asc&q=куб
 * Returns paginated products list with joined categories.
 */
productsRoute.get("/", async (c) => {
    try {
        const url = new URL(c.req.url)
        const { cursor, pageSize, includeCount } = parsePagination(url)
        const q = url.searchParams.get("q")

        console.log("[v0] Products GET - query param 'q':", q)

        const sortParam = url.searchParams.get("sort")
        const categoryId = url.searchParams.get("categoryId")
        const idsParam = url.searchParams.get("ids")
        const priceValParam = url.searchParams.get("priceVal")
        const priceOpParam = url.searchParams.get("priceOp")
        const pointsValParam = url.searchParams.get("pointsVal")
        const pointsOpParam = url.searchParams.get("pointsOp")

        const db = getDb(c.env)

        const baseWhereConditions = []
        if (q) {
            baseWhereConditions.push(buildSearch(q.toUpperCase(), [products.uppercaseName]))
        }

        // 🎯 Explicit id set. Lets a client revalidate a known handful of products
        // (the Каса "recently used" strip) in one read instead of one read each.
        if (idsParam) {
            const ids = idsParam
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, MAX_IDS)
            if (ids.length === 0) {
                return c.json({
                    ok: true,
                    data: [],
                    pagination: buildPagination({ pageSize, hasNextPage: false, nextCursor: null, total: 0 }),
                })
            }
            baseWhereConditions.push(inArray(products.productId, ids))
        }

        if (priceValParam) {
            const priceVal = parseFloat(priceValParam)
            if (!isNaN(priceVal)) {
                if (priceOpParam === "lt") {
                    baseWhereConditions.push(lt(products.price, priceVal))
                } else if (priceOpParam === "lte") {
                    baseWhereConditions.push(lte(products.price, priceVal))
                } else if (priceOpParam === "eq") {
                    baseWhereConditions.push(eq(products.price, priceVal))
                } else if (priceOpParam === "gte") {
                    baseWhereConditions.push(gte(products.price, priceVal))
                } else if (priceOpParam === "gt") {
                    baseWhereConditions.push(gt(products.price, priceVal))
                }
            }
        }

        if (pointsValParam) {
            const pointsVal = parseFloat(pointsValParam)
            if (!isNaN(pointsVal)) {
                if (pointsOpParam === "lt") {
                    baseWhereConditions.push(lt(products.overridePoints, pointsVal))
                } else if (pointsOpParam === "lte") {
                    baseWhereConditions.push(lte(products.overridePoints, pointsVal))
                } else if (pointsOpParam === "eq") {
                    baseWhereConditions.push(eq(products.overridePoints, pointsVal))
                } else if (pointsOpParam === "gte") {
                    baseWhereConditions.push(gte(products.overridePoints, pointsVal))
                } else if (pointsOpParam === "gt") {
                    baseWhereConditions.push(gt(products.overridePoints, pointsVal))
                }
            }
        }

        // 🔗 Optional category filter
        let filteredProductIds: string[] | undefined
        if (categoryId) {
            const relations = await db
                .select({ entityId: entityCategories.entityId })
                .from(entityCategories)
                .where(and(eq(entityCategories.entityType, "product"), eq(entityCategories.categoryId, categoryId)))
                .all()
            filteredProductIds = relations.map((r) => r.entityId)
            if (filteredProductIds.length === 0) {
                return c.json({
                    ok: true,
                    data: [],
                    pagination: buildPagination({ pageSize, hasNextPage: false, nextCursor: null, total: 0 }),
                })
            }
            baseWhereConditions.push(inArray(products.productId, filteredProductIds))
        }

        const countWhereExpr = baseWhereConditions.length > 0 ? and(...baseWhereConditions) : undefined

        const sortField = sortParam?.split(',')[0] || 'productId';
        const sortDir = (sortParam?.split(',')[1]?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
        const isCustomSort = sortField !== 'productId';

        let sortColumn;
        let cursorKey = sortField;
        let productCategoryMinName: any = null;

        if (sortField === "categories") {
            productCategoryMinName = db
                .select({
                    productId: entityCategories.entityId,
                    minCategoryName: sql<string>`min(${categories.name})`.as("minCategoryName"),
                })
                .from(entityCategories)
                .innerJoin(categories, eq(categories.categoryId, entityCategories.categoryId))
                .where(eq(entityCategories.entityType, "product"))
                .groupBy(entityCategories.entityId)
                .as("pc_min");
            sortColumn = productCategoryMinName.minCategoryName;
            cursorKey = "categoryName";
        } else {
            sortColumn = (products as any)[sortField] || products.productId;
        }

        // 2. Configure drizzle-cursor
        const cursorConfig = generateCursor({
            cursors: isCustomSort ? [
                {
                    order: sortDir,
                    key: cursorKey,
                    schema: sortColumn
                }
            ] : [],
            primaryCursor: {
                order: isCustomSort ? 'DESC' : sortDir,
                key: 'productId',
                schema: products.productId
            }
        });

        // 3. Validate base64 cursor from frontend
        let validCursor = cursor;
        if (cursor) {
            try {
                const decodedJson = Buffer.from(cursor, 'base64').toString('utf-8');
                const cursorObj = JSON.parse(decodedJson);
                if (isCustomSort && !(cursorKey in cursorObj)) {
                    validCursor = null;
                } else if (!('productId' in cursorObj)) {
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

        const query = db
            .select({
                productId: products.productId,
                sku: products.sku,
                name: products.name,
                uppercaseName: products.uppercaseName,
                price: products.price,
                overridePoints: products.overridePoints,
                active: products.active,
                inventory: products.inventory,
                createdAt: products.createdAt,
                updatedAt: products.updatedAt,
                categoryName: sortField === "categories" ? productCategoryMinName.minCategoryName : sql<string | null>`NULL`,
            })
            .from(products);

        if (sortField === "categories" && productCategoryMinName) {
            query.leftJoin(productCategoryMinName, eq(products.productId, productCategoryMinName.productId));
        }

        if (dataWhereExpr) query.where(dataWhereExpr as any)
        query.orderBy(...cursorConfig.orderBy)

        const dataQuery = query.limit(pageSize + 1)

        let itemsRaw: any[] = []
        let total: number | undefined = undefined

        if (includeCount) {
            const totalQuery = db.select({ count: sql<number>`count(*)` }).from(products)
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

        const productIds = items.map((p) => p.productId)

        // 🧩 Fetch related categories (only PRODUCT kind)
        const categoryLinks = productIds.length > 0 ? await db
            .select({
                productId: entityCategories.entityId,
                categoryId: entityCategories.categoryId,
                kind: categories.kind,
                name: categories.name,
            })
            .from(entityCategories)
            .innerJoin(categories, eq(categories.categoryId, entityCategories.categoryId))
            .where(and(eq(entityCategories.entityType, "product"), inArray(entityCategories.entityId, productIds)))
            .all() : []

        // 🧠 Group categories by product
        const categoryMap: Record<string, { categoryId: string; name: string; kind: string }[]> = {}
        for (const link of categoryLinks) {
            if (!categoryMap[link.productId]) categoryMap[link.productId] = []
            categoryMap[link.productId].push({
                categoryId: link.categoryId,
                name: link.name,
                kind: link.kind,
            })
        }

        // 🧱 Merge products with their categories
        const data = items.map((p) => ({
            ...p,
            categories: categoryMap[p.productId] ?? [],
        }))

        const pagination = buildPagination({ pageSize, hasNextPage, nextCursor, total })
        return c.json({ ok: true, data, pagination })
    } catch (err: any) {
        console.error("[GET /products] error", err)
        return c.json(
            {
                ok: false,
                error: "INTERNAL_ERROR",
                message: err?.message || "Unknown error",
            },
            500,
        )
    }
})

// ==================================================
// 🟢 GET /products/:id
// ==================================================
productsRoute.get("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const product = await db.select().from(products).where(eq(products.productId, id)).get()

        if (!product) return c.json({ ok: false, error: "NOT_FOUND" }, 404)

        const categoryLinks = await db
            .select({
                categoryId: categories.categoryId,
                categoryName: categories.name,
                categoryKind: categories.kind,
            })
            .from(entityCategories)
            .innerJoin(categories, eq(categories.categoryId, entityCategories.categoryId))
            .where(and(eq(entityCategories.entityType, "product"), eq(entityCategories.entityId, id)))
            .all()

        const data = {
            ...product,
            categories: categoryLinks.map((c) => ({
                categoryId: c.categoryId,
                name: c.categoryName,
                kind: c.categoryKind,
            })),
        }

        return c.json({ ok: true, data })
    } catch (err: any) {
        console.error("[GET /products/:id] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

// ==================================================
// 🟡 POST /products
// ==================================================
productsRoute.post("/", async (c) => {
    try {
        const db = getDb(c.env)
        const body = await c.req.json()

        if (body.sku === "" || body.sku === null) {
            body.sku = undefined
        }

        const parsed = ProductBody.parse(body)

        const now = Math.floor(Date.now() / 1000)
        const uuid = uuidv7();

        const sku = parsed.sku && parsed.sku.trim() !== "" ? parsed.sku : generateSKU()

        const newProduct = {
            productId: uuid,
            sku,
            name: parsed.name,
            uppercaseName: parsed.name.toUpperCase(),
            price: parsed.price,
            overridePoints: parsed.overridePoints,
            active: parsed.active,
            inventory: parsed.inventory,
            createdAt: now,
            updatedAt: now,
        }

        const statements: any[] = [db.insert(products).values(newProduct)]

        if (parsed.categoryIds && parsed.categoryIds.length > 0) {
            statements.push(
                db.insert(entityCategories).values(
                    parsed.categoryIds.map((catId: string) => ({
                        entityCategoryId: uuidv7(),
                        entityType: "product",
                        entityId: uuid,
                        categoryId: catId,
                        createdAt: now,
                    })),
                ),
            )
        }

        await db.batch(statements as any)

        return c.json({ ok: true, data: newProduct })
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
        if (err.message?.includes("UNIQUE")) {
            return c.json({ ok: false, error: "DUPLICATE_NAME_OR_SKU" }, 400)
        }
        console.error("[POST /products] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

// ==================================================
// 🟠 PUT /products/:id
// ==================================================
productsRoute.put("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)
        const body = await c.req.json()

        if (body.sku === "" || body.sku === null) {
            body.sku = undefined
        }

        const parsed = ProductBody.parse(body)

        // ✅ 1. Check product exists
        const existing = await db
            .select({ id: products.productId, sku: products.sku })
            .from(products)
            .where(eq(products.productId, id))
            .get()

        if (!existing) return c.json({ ok: false, error: "NOT_FOUND" }, 404)

        // ✅ 2. Perform update
        const now = Math.floor(Date.now() / 1000)

        const sku = parsed.sku && parsed.sku.trim() !== "" ? parsed.sku : existing.sku || generateSKU()

        const updates = {
            sku,
            name: parsed.name,
            uppercaseName: parsed.name.toUpperCase(),
            price: parsed.price,
            overridePoints: parsed.overridePoints,
            active: parsed.active,
            inventory: parsed.inventory,
            updatedAt: now,
        }

        console.log(updates);

        const statements: any[] = [
            db.update(products).set(updates).where(eq(products.productId, id)),
            db
                .delete(entityCategories)
                .where(and(eq(entityCategories.entityType, "product"), eq(entityCategories.entityId, id))),
        ]

        if (parsed.categoryIds && parsed.categoryIds.length > 0) {
            statements.push(
                db.insert(entityCategories).values(
                    parsed.categoryIds.map((catId: string) => ({
                        entityCategoryId: uuidv7(),
                        entityType: "product",
                        entityId: id,
                        categoryId: catId,
                        createdAt: now,
                    })),
                ),
            )
        }

        await db.batch(statements as any)

        // ✅ 3. Return updated record
        const updated = await db.select().from(products).where(eq(products.productId, id)).get()

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
        if (err.message?.includes("UNIQUE")) {
            return c.json({ ok: false, error: "DUPLICATE_NAME_OR_SKU" }, 400)
        }
        console.error("[PUT /products/:id] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

// ==================================================
// 🟠 POST /products/bulk-update
// ==================================================
export const ProductBulkUpdateBody = z.object({
    ids: z.array(z.string()).min(1, "Оберіть хоча б один товар"),
    price: z.number().min(0).optional(),
    overridePoints: z.number().min(0).nullable().optional(),
})

productsRoute.post("/bulk-update", async (c) => {
    try {
        const db = getDb(c.env)
        const body = await c.req.json()
        const parsed = ProductBulkUpdateBody.parse(body)

        const now = Math.floor(Date.now() / 1000)

        const updates: any = {
            updatedAt: now,
        }
        if (parsed.price !== undefined) {
            updates.price = parsed.price
        }
        if (parsed.overridePoints !== undefined) {
            updates.overridePoints = parsed.overridePoints
        }

        if (parsed.price === undefined && parsed.overridePoints === undefined) {
            return c.json({ ok: false, error: "VALIDATION_ERROR", message: "Не вказано полів для оновлення" }, 400)
        }

        await db.update(products).set(updates).where(inArray(products.productId, parsed.ids))

        return c.json({ ok: true, message: "Товари успішно оновлено" })
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
        console.error("[POST /products/bulk-update] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})

// ==================================================
// 🔴 DELETE /products/:id
// ==================================================
productsRoute.delete("/:id", async (c) => {
    try {
        const id = c.req.param("id")
        const db = getDb(c.env)

        const ids = id.split(",")

        const existing = await db.select().from(products).where(inArray(products.productId, ids)).all()

        if (existing.length === 0) return c.json({ ok: false, error: "NOT_FOUND" }, 404)

        const foundIds = existing.map(p => p.productId)

        await db.batch([
            db
                .delete(entityCategories)
                .where(and(eq(entityCategories.entityType, "product"), inArray(entityCategories.entityId, foundIds))),
            db.delete(products).where(inArray(products.productId, foundIds)),
        ])

        return c.json({ ok: true })
    } catch (err: any) {
        console.error("[DELETE /products/:id] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})


function generateSKU(): string {
    // Generate 11-digit SKU based on timestamp and random digits
    const timestamp = Date.now().toString().slice(-7) // Last 7 digits of timestamp
    const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0") // 4 random digits
    return timestamp + random
}
