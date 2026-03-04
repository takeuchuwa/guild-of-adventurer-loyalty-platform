import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

// Loyalty trigger constants and types
export const loyaltyTriggers = {
    level_change: "level_change",
} as const

export type LoyaltyTriggerKey = keyof typeof loyaltyTriggers

/* ============================= */
/* MEMBERS (Telegram-sourced) */
/* ============================= */
export const members = sqliteTable("members", {
    memberId: text("member_id").primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    phone: text("phone"),
    telegramUserId: text("telegram_user_id"),
    joinedAt: integer("joined_at").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    pointsBalance: integer("points_balance").notNull().default(0),
    levelId: text("level_id")
        .notNull()
        .references(() => levelsTiers.levelId),
    referredBy: text("referred_by").references((): any => members.memberId, { onDelete: "set null" }),
    updatedAt: integer("updated_at").notNull(),
})

export const levelsTiers = sqliteTable(
    "levels_tiers",
    {
        levelId: text("level_id").primaryKey(), // e.g., "F", "E", "D", "C", "B", "A", "S"
        name: text("name").notNull(), // human label (mandatory)
        minPoints: integer("min_points").notNull(), // threshold (mandatory)


        defaultLevel: integer("default_level", { mode: "boolean" }).notNull().default(false), // only one can be true
        sortOrder: integer("sort_order").notNull().default(0), // for ordering levels

        createdAt: integer("created_at").notNull().default(0),
        updatedAt: integer("updated_at").notNull().default(0),
    },
    (t) => ({
        byThreshold: index("ix_levels_tiers_threshold").on(t.minPoints),
        defaultLevelIdx: index("ix_levels_default").on(t.defaultLevel), // fast read for default level
        sortOrderIdx: index("ix_levels_sort_order").on(t.sortOrder), // Added index on sortOrder for fast level ordering queries
    }),
)

export const benefits = sqliteTable(
    "benefits",
    {
        benefitId: text("benefit_id").primaryKey(), // uuid
        levelId: text("level_id")
            .notNull()
            .references(() => levelsTiers.levelId, { onDelete: "cascade" }), // CASCADE: delete benefits when level is deleted
        name: text("name").notNull(), // Benefit name/title
        description: text("description"), // Detailed description
        createdAt: integer("created_at").notNull().default(0),
        updatedAt: integer("updated_at").notNull().default(0),
    },
    (t) => ({
        levelIdx: index("ix_benefits_level").on(t.levelId),
    }),
)

export const prizes = sqliteTable(
    "prizes",
    {
        prizeId: text("prize_id").primaryKey(), // uuid
        levelId: text("level_id")
            .notNull()
            .references(() => levelsTiers.levelId, { onDelete: "cascade" }), // CASCADE: delete prizes when level is deleted
        name: text("name").notNull(), // Prize name/title
        description: text("description"), // Detailed description
        sortOrder: integer("sort_order").notNull().default(0), // For ordering multiple prizes per level
        createdAt: integer("created_at").notNull().default(0),
        updatedAt: integer("updated_at").notNull().default(0),
    },
    (t) => ({
        levelIdx: index("ix_prizes_level").on(t.levelId),
        sortOrderIdx: index("ix_prizes_sort_order").on(t.sortOrder),
    }),
)

export const categories = sqliteTable(
    "categories",
    {
        categoryId: text("category_id").primaryKey(), // uuid
        kind: text("kind", { enum: ["PRODUCT", "ACTIVITY"] }).notNull(),
        name: text("name").notNull(),
        createdAt: integer("created_at").notNull().default(0),
        updatedAt: integer("updated_at").notNull().default(0),
    },
    (t) => ({
        kindIdx: index("ix_categories_kind").on(t.kind),
        nameIdx: uniqueIndex("ix_categories_name").on(t.name), // SQLite allows unique index, use normal index if fails
    }),
)

// ADD: Games
export const games = sqliteTable(
    "games",
    {
        gameId: text("game_id").primaryKey(), // uuid
        name: text("name").notNull(), // Назва гри (D&D, Pathfinder)
        description: text("description"),
        createdAt: integer("created_at").notNull().default(0),
        updatedAt: integer("updated_at").notNull().default(0),
    },
    (t) => ({
        nameIdx: uniqueIndex("ix_games_name").on(t.name),
    }),
)

export const systems = sqliteTable(
    "systems",
    {
        systemId: text("system_id").primaryKey(),
        name: text("name").notNull(), // Наприклад: "D20 System", "BRP", "Storyteller"
        description: text("description"),
        gameId: text("game_id")
            .notNull()
            .references(() => games.gameId, { onDelete: "cascade" }),
        createdAt: integer("created_at").notNull().default(0),
        updatedAt: integer("updated_at").notNull().default(0),
    },
    (t) => ({
        gameIdx: index("ix_game_system_game").on(t.gameId),
        nameIdx: index("ix_systems_name").on(t.name),
    }),
)

export const rooms = sqliteTable(
    "rooms",
    {
        roomId: text("room_id").primaryKey(), // uuid
        name: text("name").notNull(), // Room name
        color: text("color").notNull(), // Color for calendar view (hex code)
        createdAt: integer("created_at").notNull().default(0),
        updatedAt: integer("updated_at").notNull().default(0),
    },
    (t) => ({
        nameIdx: uniqueIndex("ix_rooms_name").on(t.name),
    }),
)

/* =========================================== */
/* ACTIVITIES (admin-defined "reasons" to earn) */
/* =========================================== */
export const activities = sqliteTable(
    "activities",
    {
        activityId: text("activity_id").primaryKey(),
        name: text("name").notNull(),
        uppercaseName: text("uppercase_name"),
        description: text("description"),
        price: real("price").notNull().default(0),
        overridePoints: integer("override_points").default(0),
        createdAt: integer("created_at").notNull().default(0),
        updatedAt: integer("updated_at").notNull().default(0),
        startDate: integer("start_date").notNull().default(0),
        endDate: integer("end_date").notNull().default(0),
        gameId: text("game_id").references(() => games.gameId, { onDelete: "restrict" }), // 🔗 до games
        systemId: text("system_id").references(() => systems.systemId, { onDelete: "restrict" }),
        roomId: text("room_id").references(() => rooms.roomId, { onDelete: "restrict" }), // 🔗 до rooms (nullable)
    },
    (t) => ({
        nameIdx: index("ix_activities_name").on(t.name),
        uppercaseNameIdx: index("ix_activities_uppercase_name").on(t.uppercaseName),
        gameIdx: index("ix_activities_game").on(t.gameId),
        startDateIdx: index("ix_activities_start_date").on(t.startDate),
    }),
)

/* =========================================== */
/* PRODUCTS (admin-defined merch) */
/* - Assign default points per product (simple) */
/* =========================================== */
export const products = sqliteTable(
    "products",
    {
        productId: text("product_id").primaryKey(), // uuid
        sku: text("sku"),
        name: text("name").notNull(),
        uppercaseName: text("uppercase_name"),
        price: real("price").notNull().default(0),
        overridePoints: integer("override_points").default(0),
        active: integer("active", { mode: "boolean" }).notNull().default(true),
        createdAt: integer("created_at").notNull().default(0),
        updatedAt: integer("updated_at").notNull().default(0),
    },
    (t) => ({
        skuUnique: uniqueIndex("ux_products_sku").on(t.sku),
        activeIdx: index("ix_products_active").on(t.active),
        nameIdx: uniqueIndex("ix_products_name").on(t.name),
        uppercaseNameIdx: index("ix_products_uppercase_name").on(t.uppercaseName),
    }),
)

/* =========================================== */
/* POINTS LEDGER (user-visible history) */
/* - Tracks deltas and reasons */
/* - Idempotent per member for safe retries */
/* =========================================== */
export const pointsLedger = sqliteTable(
    "points_ledger",
    {
        entryId: text("entry_id").primaryKey(), // uuid v7
        memberId: text("member_id")
            .notNull()
            .references(() => members.memberId, { onDelete: "restrict" }),
        occurredAt: integer("occurred_at").notNull().default(0), // epoch seconds

        // +/- points and resulting balance snapshot
        delta: integer("delta").notNull(),
        balanceAfter: integer("balance_after").notNull(),

        // Reason for earning/spending (choose ONE; leave others null)
        activityId: text("activity_id").references(() => activities.activityId, { onDelete: "restrict" }), // if earned via activity
        productId: text("product_id").references(() => products.productId, { onDelete: "restrict" }), // if earned via product purchase
        promoId: text("promo_id").references(() => promotions.promoId, { onDelete: "restrict" }), // if earned via promotion
        adminNote: text("admin_note"), // if admin/manual adj.
        // Per-member idempotency (dedupe retries)
        idempotencyKey: text("idempotency_key").notNull(),
    },
    (t) => ({
        memberTimeIdx: index("ix_points_ledger_member_time").on(t.memberId, t.occurredAt),
        activityIdx: index("ix_points_ledger_activity").on(t.memberId, t.activityId),
        productIdx: index("ix_points_ledger_product").on(t.memberId, t.productId),

        // Per-member dedupe (safe for retries)
        uniqueIdemPerMember: uniqueIndex("ux_points_ledger_member_idem").on(t.memberId, t.idempotencyKey),
    }),
)

/* ============================= */
/* MEMBER PRIZES CLAIMED */
/* ============================= */
export const memberPrizesClaimed = sqliteTable(
    "member_prizes_claimed",
    {
        claimId: text("claim_id").primaryKey(), // uuid
        memberId: text("member_id")
            .notNull()
            .references(() => members.memberId, { onDelete: "restrict" }),
        levelId: text("level_id")
            .notNull()
            .references(() => levelsTiers.levelId, { onDelete: "restrict" }),
        claimedAt: integer("claimed_at").notNull().default(0),
    },
    (t) => ({
        memberLevelIdx: uniqueIndex("ux_member_prize_level").on(t.memberId, t.levelId),
    }),
)

export const entityCategories = sqliteTable(
    "entity_categories",
    {
        entityCategoryId: text("entity_category_id").primaryKey(), // uuid
        entityType: text("entity_type").notNull(), // "activity" | "product" | "game"
        entityId: text("entity_id").notNull(),
        categoryId: text("category_id")
            .notNull()
            .references(() => categories.categoryId, { onDelete: "restrict" }),
        createdAt: integer("created_at").notNull().default(0),
    },
    (t) => ({
        entityIdx: index("ix_entity_cat_entity").on(t.entityType, t.entityId),
        categoryIdx: index("ix_entity_cat_category").on(t.categoryId),
    }),
)

/* ============================= */
/* LOYALTY CONFIGS (admin-defined) */
/* ============================= */
export const loyaltyConfigs = sqliteTable(
    "loyalty_configs",
    {
        configId: text("config_id").primaryKey(), // uuid
        triggerKey: text("trigger_key").notNull(), // LoyaltyTriggerKey
        active: integer("active", { mode: "boolean" }).notNull().default(true),
        name: text("name").notNull(),
        configJson: text("config_json").notNull(), // JSON string
        createdAt: integer("created_at").notNull().default(0),
        updatedAt: integer("updated_at").notNull().default(0),
    },
    (t) => ({
        triggerIdx: index("ix_loyalty_configs_trigger").on(t.triggerKey),
        activeIdx: index("ix_loyalty_configs_active").on(t.active),
    }),
)

/* ============================= */
/* PROMOTIONS SYSTEM */
/* ============================= */
export const promotions = sqliteTable(
    "promotions",
    {
        promoId: text("promo_id").primaryKey(), // UUID v7
        code: text("code"), // User-facing code (e.g., "SUMMER20"). Null for automatic promos.
        mode: text("mode", { enum: ["COUPON", "AUTO"] }).notNull(), // COUPON or AUTO
        name: text("name").notNull(), // Admin-facing name
        description: text("description"), // Public-facing description
        active: integer("active", { mode: "boolean" }).notNull().default(true), // Master switch
        priority: integer("priority").notNull().default(0), // Resolution order
        combinable: integer("combinable", { mode: "boolean" }).notNull().default(false), // Can stack with other promos
        version: integer("version").notNull().default(1), // Schema version for migrations
        startDate: integer("start_date").notNull().default(-1), // Epoch seconds. -1 = no start restriction (permanent)
        endDate: integer("end_date").notNull().default(-1), // Epoch seconds. -1 = no end restriction (permanent)
        usageRemaining: integer("usage_remaining"), // Atomic counter. Null = infinite.
        config: text("config", { mode: "json" }).notNull(), // Engine payload
        createdAt: integer("created_at").notNull().default(0),
        updatedAt: integer("updated_at").notNull().default(0),
    },
    (t) => ({
        codeIdx: uniqueIndex("ux_promotions_code").on(t.code),
        modeIdx: index("ix_promotions_mode").on(t.mode),
        activeIdx: index("ix_promotions_active").on(t.active),
        priorityIdx: index("ix_promotions_priority").on(t.priority),
        startDateIdx: index("ix_promotions_start_date").on(t.startDate),
        endDateIdx: index("ix_promotions_end_date").on(t.endDate),
    }),
)

/* ============================= */
/* PROMOTION ASSIGNMENTS         */
/* ============================= */
export const promotionAssignments = sqliteTable("promotion_assignments", {
    assignmentId: text("assignment_id").primaryKey(), // UUID v7
    memberId: text("member_id")
        .notNull()
        .references(() => members.memberId, { onDelete: "cascade" }),
    promoId: text("promo_id")
        .notNull()
        .references(() => promotions.promoId, { onDelete: "restrict" }),
    status: text("status", { enum: ["AVAILABLE", "USED", "EXPIRED"] }).notNull().default("AVAILABLE"),

    // Use this if you want to generate a unique code per user for the SAME promo
    // e.g. "Welcome-X8Y2" points to the generic "Welcome" promo
    uniqueCode: text("unique_code"),

    assignedAt: integer("assigned_at").notNull(),
    redeemedAt: integer("redeemed_at"),
}, (t) => ({
    // Fast lookup for "Show me my offers"
    memberStatusIdx: index("ix_promo_assign_member_status").on(t.memberId, t.status),
    // Ensure unique code lookup if used
    uniqueCodeIdx: uniqueIndex("ux_promo_assign_code").on(t.uniqueCode),
}))

export const levelPromotions = sqliteTable(
    "level_promotions",
    {
        levelId: text("level_id")
            .notNull()
            .references(() => levelsTiers.levelId, { onDelete: "cascade" }),
        promoId: text("promo_id")
            .notNull()
            .references(() => promotions.promoId, { onDelete: "cascade" }),
        createdAt: integer("created_at").notNull().default(0),
    },
    (t) => ({
        // Composite primary key prevents assigning the same promo to a level twice
        pk: primaryKey({ columns: [t.levelId, t.promoId] }),
        levelIdx: index("ix_level_promos_level").on(t.levelId),
    })
)