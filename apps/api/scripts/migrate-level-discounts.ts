/**
 * Data Migration Script: Level Discounts → Promotions
 *
 * This one-off script generates the SQL INSERT statements needed to transition
 * existing level discount data (previously stored as columns on levels_tiers) into
 * the proper `promotions` + `level_promotions` tables.
 *
 * Source data (from apps/api/schema.sql, INSERT INTO levels_tiers):
 *   INSERT INTO levels_tiers VALUES(
 *     level_id, name, min_points,
 *     discount_products, discount_activities, discount_games,
 *     fixed_products, fixed_activities, fixed_games,
 *     default_level, sort_order, created_at, updated_at
 *   )
 *
 * Promotion config shape (matches the promotions engine):
 *   {
 *     filter: { excludeCategories: [], excludeProducts: [], excludeActivities: [] },
 *     conditions: {
 *       memberConditions: { member_min_level: <sortOrder> }   ← restricts to that level+
 *     },
 *     effects: {
 *       price: { type: "percentage" | "fixed", value: <amount> }
 *     },
 *     targets: {
 *       type: "entity",
 *       entitySubType: "products" | "sessions" | "games"
 *     }
 *   }
 *
 * HOW TO USE:
 *   npx tsx apps/api/scripts/migrate-level-discounts.ts > output.sql
 *
 * Then inspect the output SQL and apply it to the target DB ONLY AFTER the
 * schema migration (0003_flat_ikaris.sql) has been applied.
 *
 * Local:
 *   wrangler d1 execute dnd-studio-db-dev --local --file=output.sql --persist-to=../../packages/db/.wrangler-shared-state
 *
 * Remote (Staging / Prod):
 *   wrangler d1 execute dnd-studio-db-staging --remote --env staging --file=output.sql
 *   wrangler d1 execute dnd-studio-db --remote --env production --file=output.sql
 *
 * DO NOT apply before the schema migration.
 */

import { v7 as uuidv7 } from "uuid"

const now = Math.floor(Date.now() / 1000)

// ------------------------------------------------------------------------------
// Level discount data sourced verbatim from apps/api/schema.sql:
//   INSERT INTO "levels_tiers" VALUES(levelId, name, minPoints,
//     discountProducts, discountActivities, discountGames,
//     fixedProducts, fixedActivities, fixedGames,
//     defaultLevel, sortOrder, createdAt, updatedAt)
// ------------------------------------------------------------------------------
const levelData = [
    // levelId  name               sortOrder  discProd  fixedProd  discAct  fixedAct  discGame  fixedGame
    { levelId: "F", name: "👋 Новачок", sortOrder: 0, discountProducts: 0, fixedProducts: false, discountActivities: 0, fixedActivities: false, discountGames: 0, fixedGames: false },
    { levelId: "E", name: "🛡️ Помічник", sortOrder: 1, discountProducts: 0, fixedProducts: false, discountActivities: 0, fixedActivities: false, discountGames: 0, fixedGames: false },
    { levelId: "D", name: "🎓 Учень", sortOrder: 2, discountProducts: 0, fixedProducts: false, discountActivities: 0, fixedActivities: false, discountGames: 0, fixedGames: true }, // fixedGames=true but value is 0 → skip
    { levelId: "C", name: "✨ Підмайстер", sortOrder: 3, discountProducts: 5, fixedProducts: false, discountActivities: 0, fixedActivities: false, discountGames: 50, fixedGames: true },
    { levelId: "B", name: "👑 Майстер", sortOrder: 4, discountProducts: 5, fixedProducts: false, discountActivities: 0, fixedActivities: false, discountGames: 50, fixedGames: true },
    { levelId: "A", name: "⚜️ Грандмайстер", sortOrder: 5, discountProducts: 7, fixedProducts: false, discountActivities: 5, fixedActivities: false, discountGames: 50, fixedGames: true },
    { levelId: "S", name: "🐦‍🔥 Легенда", sortOrder: 6, discountProducts: 10, fixedProducts: false, discountActivities: 0, fixedActivities: false, discountGames: 150, fixedGames: true },
]

interface PromoInsert {
    promoId: string
    levelId: string
    levelSortOrder: number
    name: string
    config: object
}

const promos: PromoInsert[] = []

for (const level of levelData) {
    // ── Products discount ────────────────────────────────────────────────────────
    if (level.discountProducts > 0) {
        const promoId = uuidv7()
        promos.push({
            promoId,
            levelId: level.levelId,
            levelSortOrder: level.sortOrder,
            name: `${level.name} — знижка на товари`,
            config: {
                filter: { excludeCategories: [], excludeProducts: [], excludeActivities: [] },
                effects: {
                    price: {
                        type: level.fixedProducts ? "fixed" : "percentage",
                        value: level.discountProducts,
                    },
                },
                targets: {
                    type: "entity",
                    entitySubType: "products",
                },
            },
        })
    }

    // ── Activities discount ──────────────────────────────────────────────────────
    if (level.discountActivities > 0) {
        const promoId = uuidv7()
        promos.push({
            promoId,
            levelId: level.levelId,
            levelSortOrder: level.sortOrder,
            name: `${level.name} — знижка на сесії`,
            config: {
                filter: { excludeCategories: [], excludeProducts: [], excludeActivities: [] },
                effects: {
                    price: {
                        type: level.fixedActivities ? "fixed" : "percentage",
                        value: level.discountActivities,
                    },
                },
                targets: {
                    type: "entity",
                    entitySubType: "sessions",
                },
            },
        })
    }

    // ── Games discount ───────────────────────────────────────────────────────────
    if (level.discountGames > 0) {
        const promoId = uuidv7()
        promos.push({
            promoId,
            levelId: level.levelId,
            levelSortOrder: level.sortOrder,
            name: `${level.name} — знижка на ігри`,
            config: {
                filter: { excludeCategories: [], excludeProducts: [], excludeActivities: [] },
                effects: {
                    price: {
                        type: level.fixedGames ? "fixed" : "percentage",
                        value: level.discountGames,
                    },
                },
                targets: {
                    type: "entity",
                    entitySubType: "games",
                },
            },
        })
    }
}

// ------------------------------------------------------------------------------
// Build SQL output
// ------------------------------------------------------------------------------
const lines: string[] = []
lines.push("-- ================================================================")
lines.push("-- Data Migration: Level Discounts → promotions + level_promotions")
lines.push("-- Apply ONLY after 0003_flat_ikaris.sql schema migration has run.")
lines.push("--")
lines.push("-- Generated at: " + new Date().toISOString())
lines.push(`-- Total promotions to create: ${promos.length}`)
lines.push("-- ================================================================")
lines.push("")
lines.push("")

for (const p of promos) {
    const configJson = JSON.stringify(p.config).replace(/'/g, "''")
    const promoName = p.name.replace(/'/g, "''")

    lines.push(`-- Level ${p.levelId} (sortOrder=${p.levelSortOrder}): "${p.name}"`)
    lines.push(`INSERT INTO promotions`)
    lines.push(`  (promo_id, code, mode, name, description, active, priority, combinable, version,`)
    lines.push(`   start_date, end_date, usage_remaining, config, created_at, updated_at)`)
    lines.push(`VALUES`)
    lines.push(`  ('${p.promoId}', NULL, 'AUTO', '${promoName}', NULL,`)
    lines.push(`   1, 0, 1, 1,`)
    lines.push(`   -1, -1, NULL,`)          // start_date=NULL, end_date=NULL → permanent / infinite
    lines.push(`   '${configJson}', ${now}, ${now});`)
    lines.push("")
    lines.push(`INSERT INTO level_promotions (level_id, promo_id, created_at)`)
    lines.push(`VALUES ('${p.levelId}', '${p.promoId}', ${now});`)
    lines.push("")
}

lines.push("")

const levelsWithDiscounts = levelData.filter(
    (l) => l.discountProducts > 0 || l.discountActivities > 0 || l.discountGames > 0,
)
lines.push(
    `-- Generated ${promos.length} promotion(s) from ${levelsWithDiscounts.length} level(s) with non-zero discounts.`,
)
lines.push(`-- Affected levels: ${levelsWithDiscounts.map((l) => l.levelId).join(", ")}`)

console.log(lines.join("\n"))
