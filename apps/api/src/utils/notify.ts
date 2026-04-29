import type { DrizzleD1Database } from "drizzle-orm/d1"
import { inArray, and, eq } from "drizzle-orm"
import { memberSettings } from "@loyalty/db/schema"
import type { Env } from "@/types/env"

export interface NotificationPayload {
    memberId?: string
    kind: string
    body: any
}

export async function sendBatchNotifications(
    db: DrizzleD1Database<any>,
    env: Env,
    notifications: NotificationPayload[]
): Promise<void> {
    if (notifications.length === 0) return

    const memberIds = [...new Set(notifications.map(n => n.memberId).filter(Boolean))] as string[]

    let disabledMemberIds = new Set<string>()
    if (memberIds.length > 0) {
        try {
            const settings = await db.select()
                .from(memberSettings)
                .where(and(
                    eq(memberSettings.name, "notifications"),
                    inArray(memberSettings.memberId, memberIds),
                    eq(memberSettings.value, "false")
                ))
                .all()
            
            disabledMemberIds = new Set(settings.map(s => s.memberId))
        } catch (e) {
            console.error("Failed to fetch member settings for notifications", e)
        }
    }

    const filteredNotifies = notifications.filter(n => !n.memberId || !disabledMemberIds.has(n.memberId))

    if (filteredNotifies.length === 0) return

    const headers: any = { "content-type": "application/json" }
    const token = (env as any).INTERNAL_TOKEN || "dummy_token"
    headers["authorization"] = `Bearer ${token}`

    const tasks = filteredNotifies.map(item => {
        const body = JSON.stringify(item.body)
        return env.BOT.fetch("https://internal/bot/notify", { method: "POST", headers, body })
            .catch(e => console.error("Notify error", e))
    })

    try {
        await Promise.all(tasks)
    } catch (e) {
        console.error("Failed to send batch notifications", e)
    }
}
