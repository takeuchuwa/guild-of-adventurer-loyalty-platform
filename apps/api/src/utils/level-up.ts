import type { DrizzleD1Database } from "drizzle-orm/d1"
import { eq, gt, lt, asc, desc } from "drizzle-orm"
import { members, levelsTiers, loyaltyConfigs } from "@loyalty/db/schema"
import { v7 as uuidv7 } from 'uuid';

export interface LevelUpResult {
    levelChanged: boolean
    newLevelId: string | null
    newLevelName: string | null
    batchOperations: any[]
    ledgerEntries: any[]
    notifications: Array<{
        kind: "level_up" | "referral_bonus"
        body: any
    }>
}

/**
 * Find the appropriate level for a member based on their points balance.
 * Automatically determines whether to check higher or lower levels based on balance change.
 */
async function findAppropriateLevel(
    db: DrizzleD1Database<any>,
    currentLevelId: string | null,
    currentBalance: number,
    newBalance: number,
): Promise<{ levelId: string | null; levelName: string | null; changed: boolean }> {
    const currentLevel = currentLevelId
        ? await db.select().from(levelsTiers).where(eq(levelsTiers.levelId, currentLevelId)).get()
        : null

    const currentSortOrder = currentLevel?.sortOrder ?? -1

    const balanceIncreased = newBalance > currentBalance
    const balanceDecreased = newBalance < currentBalance

    let newLevelId = currentLevelId
    let newLevelName: string | null = null

    // Check for higher levels if balance increased
    if (balanceIncreased) {
        const higherLevels = await db
            .select()
            .from(levelsTiers)
            .where(gt(levelsTiers.sortOrder, currentSortOrder))
            .orderBy(asc(levelsTiers.sortOrder))
            .all()

        // Find the highest level the member qualifies for
        for (const level of higherLevels) {
            if (newBalance >= level.minPoints) {
                newLevelId = level.levelId
                newLevelName = level.name
            }
        }
    }

    // Check for lower levels if balance decreased
    if (balanceDecreased && currentLevel && newBalance < currentLevel.minPoints) {
        const lowerLevels = await db
            .select()
            .from(levelsTiers)
            .where(lt(levelsTiers.sortOrder, currentSortOrder))
            .orderBy(desc(levelsTiers.sortOrder))
            .all()

        // Find the highest level below current that member still qualifies for
        for (const level of lowerLevels) {
            if (newBalance >= level.minPoints) {
                newLevelId = level.levelId
                newLevelName = level.name
                break
            }
        }

        // If no level found, set to null (no level)
        if (newBalance < (lowerLevels[lowerLevels.length - 1]?.minPoints ?? 0)) {
            newLevelId = "F"
            newLevelName = null
        }
    }

    const changed = newLevelId !== currentLevelId

    return { levelId: newLevelId, levelName: newLevelName, changed }
}

/**
 * Create database operations for updating member's level.
 */
function updateBalanceOperations(
    db: DrizzleD1Database<any>,
    memberId: string,
    newBalance: number,
    newLevelId: string | null,
    now: number,
): any[] {
    return [db.update(members).set({ pointsBalance: newBalance, levelId: newLevelId ?? "F", updatedAt: now }).where(eq(members.memberId, memberId))]
}

/**
 * Get active loyalty configs for a specific level change.
 */
async function getActiveLevelChangeConfigs(
    db: DrizzleD1Database<any>,
    targetLevelId: string,
): Promise<
    Array<{
        configId: string
        pointsForReferrer: number
        pointsForReferred: number
        notifyReferrer: boolean
        notifyReferred: boolean
    }>
> {
    const activeConfigs = await db
        .select()
        .from(loyaltyConfigs)
        .where(eq(loyaltyConfigs.triggerKey, "level_change"))
        .all()

    return activeConfigs
        .filter((c) => {
            try {
                const cfg = JSON.parse(c.configJson || "{}")
                return c.active && cfg?.targetLevel === targetLevelId
            } catch {
                return false
            }
        })
        .map((c) => {
            const cfg = JSON.parse(c.configJson!)
            return {
                configId: c.configId,
                pointsForReferrer: Number(cfg.pointsForReferrer) || 0,
                pointsForReferred: Number(cfg.pointsForReferred) || 0,
                notifyReferrer: cfg.notifyReferrer || false,
                notifyReferred: cfg.notifyReferred || false,
            }
        })
}

/**
 * Process referral rewards for a member who leveled up.
 * Awards points to both the referred member and their referrer.
 */
async function processLevelNotifications(
    db: DrizzleD1Database<any>,
    member: any,
    newLevelId: string,
    newLevelName: string | null,
    currentBalance: number,
    now: number,
): Promise<{
    ledgerEntries: any[]
    batchOperations: any[]
    notifications: any[]
}> {
    const result = {
        ledgerEntries: [] as any[],
        batchOperations: [] as any[],
        notifications: [] as any[],
    }

    if (member.telegramUserId) {
        result.notifications.push({
            kind: "level_up",
            body: {
                kind: "level_up",
                telegramUserId: member.telegramUserId,
                levelId: newLevelId,
                levelName: newLevelName
            },
        })
    }

    if (!member.referredBy) {
        return result
    }

    const configs = await getActiveLevelChangeConfigs(db, newLevelId)
    if (configs.length === 0) {
        return result
    }

    // Award points to the referred member (current member)
    let referredBalance = currentBalance
    let notifyReferredPoints = 0
    let hasNotifyReferred = false

    console.log("config", configs);
    for (const cfg of configs) {
        if (cfg.notifyReferred) {
            hasNotifyReferred = true
            notifyReferredPoints += cfg.pointsForReferred
        }

        if (cfg.pointsForReferred > 0) {
            referredBalance += cfg.pointsForReferred
            result.ledgerEntries.push({
                entryId: uuidv7(),
                memberId: member.memberId,
                occurredAt: now,
                delta: cfg.pointsForReferred,
                balanceAfter: referredBalance,
                productId: null,
                activityId: null,
                adminNote: `Реферальна програма: підняття рівня ${newLevelName ?? newLevelId}`,
                idempotencyKey: `referral-self-${cfg.configId}-${newLevelId}-${now}`,
            })
        }
    }

    console.log("add operation update balance");

    if (result.ledgerEntries.length > 0) {
        result.batchOperations.push(
            db
                .update(members)
                .set({ pointsBalance: referredBalance, updatedAt: now })
                .where(eq(members.memberId, member.memberId)),
        )
    }

    if (hasNotifyReferred) {
        const notif = result.notifications.find(n => n.kind === "level_up")
        if (notif) {
            notif.body.bonusPoints = notifyReferredPoints
        }
    }

    // Process referrer rewards
    const referrerResult = await processReferrerRewards(
        db,
        member.referredBy,
        member.memberId,
        newLevelId,
        newLevelName,
        configs,
        now,
    )

    result.ledgerEntries.push(...referrerResult.ledgerEntries)
    result.batchOperations.push(...referrerResult.batchOperations)
    result.notifications.push(...referrerResult.notifications)

    return result
}

/**
 * Process rewards for the referrer when their referral levels up.
 * Recursively checks if the referrer should also level up.
 */
async function processReferrerRewards(
    db: DrizzleD1Database<any>,
    referrerId: string,
    referredMemberId: string,
    newLevelId: string,
    newLevelName: string | null,
    configs: Array<{ configId: string; pointsForReferrer: number; notifyReferrer: boolean }>,
    now: number,
): Promise<{
    ledgerEntries: any[]
    batchOperations: any[]
    notifications: any[]
}> {
    const result = {
        ledgerEntries: [] as any[],
        batchOperations: [] as any[],
        notifications: [] as any[],
    }

    const referrer = await db.select().from(members).where(eq(members.memberId, referrerId)).get()
    if (!referrer) {
        return result
    }

    let referrerBalance = referrer.pointsBalance
    let notifyReferrerPoints = 0
    let hasNotifyReferrer = false

    for (const cfg of configs) {
        if (cfg.notifyReferrer) {
            hasNotifyReferrer = true
            notifyReferrerPoints += cfg.pointsForReferrer
        }

        if (cfg.pointsForReferrer > 0) {
            referrerBalance += cfg.pointsForReferrer
            result.ledgerEntries.push({
                entryId: uuidv7(),
                memberId: referrer.memberId,
                occurredAt: now,
                delta: cfg.pointsForReferrer,
                balanceAfter: referrerBalance,
                productId: null,
                activityId: null,
                adminNote: `Реферальна програма: друг отримав рівень ${newLevelName ?? newLevelId}`,
                idempotencyKey: `referral-ref-${cfg.configId}-${referredMemberId}-${newLevelId}-${now}`,
            })
        }
    }

    if (result.ledgerEntries.length === 0) {
        return result
    }

    result.batchOperations.push(
        db
            .update(members)
            .set({ pointsBalance: referrerBalance, updatedAt: now })
            .where(eq(members.memberId, referrer.memberId)),
    )

    // Add notification for referrer
    if (hasNotifyReferrer && referrer.telegramUserId) {
        result.notifications.push({
            kind: "referral_bonus",
            body: {
                kind: "referral_bonus",
                to: { telegramUserId: referrer.telegramUserId },
                levelId: newLevelId,
                levelName: newLevelName,
                points: notifyReferrerPoints,
            },
        })
    }

    console.log(
        `[RECURSIVE CHECK] Checking referrer ${referrer.memberId} with balance ${referrer.pointsBalance} -> ${referrerBalance}`,
    )
    const referrerLevelUpResult = await checkAndProcessLevelUp(
        db,
        referrer.memberId,
        referrer.pointsBalance,
        referrerBalance,
        now,
        `referral from ${referredMemberId}`,
    )

    result.batchOperations.push(...referrerLevelUpResult.batchOperations)
    result.ledgerEntries.push(...referrerLevelUpResult.ledgerEntries)
    result.notifications.push(...referrerLevelUpResult.notifications)

    return result
}

/**
 * Check and process level changes for a member based on their new balance.
 * This function is recursive - if a referrer receives points and levels up,
 * their referrer will also be checked, creating a cascade effect.
 *
 * Automatically determines whether to check for higher or lower levels:
 * - If newBalance > currentBalance: checks for level UP
 * - If newBalance < currentBalance: checks for level DOWN (demotion)
 *
 * IMPORTANT: This function does NOT execute database operations.
 * It collects all operations and returns them for batch execution.
 *
 * @param db - Database instance
 * @param memberId - Member to check for level change
 * @param currentBalance - Member's current points balance (before change)
 * @param newBalance - Member's new points balance (after change)
 * @param now - Current timestamp
 * @param reason - Reason for the level change (for logging)
 * @returns LevelUpResult with all operations to execute in a batch
 */
export async function checkAndProcessLevelUp(
    db: DrizzleD1Database<any>,
    memberId: string,
    currentBalance: number,
    newBalance: number,
    now: number,
    reason = "checkout",
): Promise<LevelUpResult> {
    const result: LevelUpResult = {
        levelChanged: false,
        newLevelId: null,
        newLevelName: null,
        batchOperations: [],
        ledgerEntries: [],
        notifications: [],
    }

    // Get member with current level
    const member = await db.select().from(members).where(eq(members.memberId, memberId)).get()
    if (!member) {
        console.log(`[checkAndProcessLevelUp] Member ${memberId} not found`)
        return result
    }

    const levelChange = await findAppropriateLevel(db, member.levelId, currentBalance, newBalance)
    result.batchOperations.push(...updateBalanceOperations(db, memberId, newBalance, levelChange.levelId, now))

    if (!levelChange.changed) {
        return result
    }

    console.log(
        `[LEVEL CHANGE] Member ${memberId} level changed from ${member.levelId} to ${levelChange.levelId} (${levelChange.levelName}) - Reason: ${reason}`,
    )

    // Update result
    result.levelChanged = true
    result.newLevelId = levelChange.levelId
    result.newLevelName = levelChange.levelName

    // Create level change operations
    console.log(`result.batchOperations: ${result.batchOperations.length} operations`)

    // Process referral rewards (only for level ups, not demotions)
    if (levelChange.levelId && newBalance > currentBalance) {
        console.log(`[LEVEL CHANGE] Processing referral rewards for ${memberId}`)
        const referralResult = await processLevelNotifications(
            db,
            member,
            levelChange.levelId,
            levelChange.levelName,
            newBalance,
            now,
        )

        result.ledgerEntries.push(...referralResult.ledgerEntries)
        result.batchOperations.push(...referralResult.batchOperations)
        result.notifications.push(...referralResult.notifications)
    }

    return result
}
