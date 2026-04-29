import { createMiddleware } from "hono/factory"
import type { Env } from "@/types/env"
import { validate, parse } from "@tma.js/init-data-node"

export const telegramAuth = createMiddleware<Env>(async (c, next) => {
    try {
        const authHeader = c.req.header("Authorization")
        if (!authHeader || !authHeader.startsWith("tma ")) {
            return c.json({ ok: false, error: "UNAUTHORIZED", message: "Missing or invalid authorization header" }, 401)
        }

        const authData = authHeader.substring(4)
        const botToken = c.env.BOT_TOKEN

        if (!botToken) {
            console.error("Missing BOT_TOKEN in environment")
            return c.json({ ok: false, error: "INTERNAL_ERROR", message: "Server configuration error" }, 500)
        }

        try {
            validate(authData, botToken, {
                expiresIn: 3600,
            })
        } catch (e: any) {
            return c.json({ ok: false, error: "UNAUTHORIZED", message: "Invalid Telegram signature or expired token" }, 401)
        }

        const initData = parse(authData)

        if (!initData.user || !initData.user.id) {
            return c.json({ ok: false, error: "UNAUTHORIZED", message: "Invalid user data" }, 401)
        }

        c.set("tgUser", initData.user)
        await next()
    } catch (err: any) {
        console.error("[telegramAuth middleware] error", err)
        return c.json({ ok: false, error: "INTERNAL_ERROR", message: err.message }, 500)
    }
})
