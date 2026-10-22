import { useCallback, useEffect, useState } from "react"

import { fetchLevels } from "@/components/levels/api/level-api"
import type { Level } from "@/components/levels/types/level-types"

/**
 * The level ladder is reference data: it changes rarely and every list row, badge
 * and filter needs it. It is cached in localStorage so a page load costs no
 * request at all, shared in memory so mounted components stay in sync, and
 * refreshed explicitly from the levels page (or automatically once the entry
 * ages past the TTL).
 */
const STORAGE_KEY = "goa_levels_cache_v1"
/** Levels are edited a few times a year; a day-old ladder is still correct enough. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface CachedLevels {
    levels: Level[]
    cachedAt: number
}

const byLadderOrder = (a: Level, b: Level) => a.sortOrder - b.sortOrder

function readStoredLevels(): Level[] | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null

        const parsed = JSON.parse(raw) as CachedLevels
        if (!Array.isArray(parsed?.levels) || typeof parsed.cachedAt !== "number") return null
        if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null

        return parsed.levels
    } catch {
        // Corrupt or unavailable storage just means we fetch as before.
        return null
    }
}

function writeStoredLevels(levels: Level[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ levels, cachedAt: Date.now() } satisfies CachedLevels))
    } catch (error) {
        console.error("Failed to cache levels:", error)
    }
}

let cachedLevels: Level[] | null = readStoredLevels()
let inflight: Promise<Level[]> | null = null

/** Every mounted `useLevels`, so a refresh anywhere updates badges everywhere. */
const subscribers = new Set<(levels: Level[]) => void>()

function publish(levels: Level[]) {
    cachedLevels = levels
    subscribers.forEach((notify) => notify(levels))
}

function loadLevels(): Promise<Level[]> {
    if (cachedLevels) return Promise.resolve(cachedLevels)

    if (!inflight) {
        inflight = fetchLevels({ pagination: { pageSize: 100 } })
            .then((result) => {
                const levels = [...(result.levels || [])].sort(byLadderOrder)
                writeStoredLevels(levels)
                publish(levels)
                return levels
            })
            .finally(() => {
                inflight = null
            })
    }

    return inflight
}

/**
 * Drops the cached ladder and pulls a fresh one, pushing it to every mounted
 * consumer. Call it after creating, editing or deleting a level, and from the
 * «Оновити кеш» button on the levels page.
 */
export function refreshLevels(): Promise<Level[]> {
    cachedLevels = null
    inflight = null
    try {
        localStorage.removeItem(STORAGE_KEY)
    } catch {
        // Nothing to clear.
    }
    return loadLevels()
}

export interface LevelProgress {
    level?: Level
    /** 1-based position on the ladder. */
    ordinal?: number
    nextLevel?: Level
    /** XP still needed for the next level; undefined on the top level. */
    pointsToNext?: number
    /** 0–1 progress through the current level. */
    progress: number
}

export function useLevels() {
    const [levels, setLevels] = useState<Level[]>(cachedLevels ?? [])
    const [isLoading, setIsLoading] = useState(!cachedLevels)

    useEffect(() => {
        let active = true
        const notify = (next: Level[]) => {
            if (active) setLevels(next)
        }
        subscribers.add(notify)

        if (!cachedLevels) {
            loadLevels()
                .catch((error) => {
                    console.error("Error loading levels:", error)
                })
                .finally(() => {
                    if (active) setIsLoading(false)
                })
        } else {
            setLevels(cachedLevels)
        }

        return () => {
            active = false
            subscribers.delete(notify)
        }
    }, [])

    const refresh = useCallback(async () => {
        setIsLoading(true)
        try {
            await refreshLevels()
        } catch (error) {
            console.error("Error refreshing levels:", error)
            throw error
        } finally {
            setIsLoading(false)
        }
    }, [])

    /** Resolve a member's position on the ladder from their level id, falling back to their XP. */
    const getProgress = (levelId: string | undefined, points: number): LevelProgress => {
        if (levels.length === 0) return { progress: 0 }

        let index = levelId ? levels.findIndex((level) => level.levelId === levelId) : -1
        if (index === -1) {
            index = levels.reduce((best, level, i) => (points >= level.minPoints ? i : best), 0)
        }

        const level = levels[index]
        const nextLevel = levels[index + 1]
        const floor = level?.minPoints ?? 0

        if (!nextLevel) {
            return { level, ordinal: index + 1, progress: 1 }
        }

        const span = nextLevel.minPoints - floor
        const progress = span > 0 ? Math.min(1, Math.max(0, (points - floor) / span)) : 1

        return {
            level,
            ordinal: index + 1,
            nextLevel,
            pointsToNext: Math.max(0, nextLevel.minPoints - points),
            progress,
        }
    }

    return { levels, isLoading, refresh, getProgress }
}
