import { Hono } from "hono"
import { webhookCallback, Bot, InputFile } from "grammy"
import { texts } from "./texts"
import type { Env } from "./types"
import { setupRegistrationHandlers } from "./features/registration"

const app = new Hono<{ Bindings: Env }>()

function createBot(env: Env) {
    console.log("env.BOT_TOKEN", env.BOT_TOKEN)
    console.log("env.BOT_INFO", env.BOT_INFO)
    const clientOpts = env.BOT_ENV === "test" || env.BOT_ENV === "dev" ? { environment: "test" as const } : undefined
    const bot = new Bot(env.BOT_TOKEN, { botInfo: JSON.parse(env.BOT_INFO), client: clientOpts })

    // Inject env + db per update
    bot.use(async (ctx, next) => {
        ; (ctx as any).env = env
        await next()
    })

    // Set up bot commands for the menu (cleaned up)
    bot.api.setMyCommands([
        { command: "start", description: "🚀 Почати роботу з ботом" },
    ])

    // Feature: registration and start
    setupRegistrationHandlers(bot, env)

    bot.on("message", (ctx) => {
        console.log("TG message:", JSON.stringify(ctx.message, null, 2))
    })

    return bot
}

// Hono route that handles Telegram webhook POSTs
app.post("/bot/webhook", async (c) => {
    const bot = createBot(c.env)
    const handle = webhookCallback(bot, "hono")
    return handle(c)
})

// Internal notify endpoint (from API)
app.post("/bot/notify", async (c) => {
    try {
        const token = c.req.header("authorization")?.replace("Bearer ", "")
        const expected = c.env.INTERNAL_TOKEN
        if (expected && token !== expected) {
            return c.json({ ok: false, error: "UNAUTHORIZED" }, 401)
        }
        const body = await c.req.json()
        const bot = createBot(c.env)
        const kind = body?.kind as string
        const tgId: string | undefined = body?.to?.telegramUserId || body?.telegramUserId
        if (!tgId) return c.json({ ok: true, skipped: true })

        let text: string | null = null
        if (kind === "level_up") {
            const levelName: string | undefined = body?.levelName
            const levelId: string | undefined = body?.levelId
            const bonus: number | undefined = body?.bonusPoints
            text = texts.level_up(levelName || levelId || "?")
            if (bonus && bonus > 0) {
                text += "\n\n" + texts.referral_referred_bonus(bonus)
            }
        } else if (kind === "referral_bonus") {
            const levelName: string | undefined = body?.levelName
            const levelId: string | undefined = body?.levelId
            const points: number = Number(body?.points || 0)
            text = texts.referral_referrer(levelName || levelId || "?", points)
        } else if (kind === "checkout_points") {
            const points: number = Number(body?.points || 0)
            text = texts.checkout_points_earned(points)
        }

        if (!text) return c.json({ ok: true, skipped: true })

        try {
            await bot.api.sendMessage(tgId, text, { parse_mode: "Markdown" })
        } catch (e) {
            console.error("[bot notify] send error", e)
            // don't fail
        }
        return c.json({ ok: true })
    } catch (e: any) {
        console.error("[bot notify] error", e)
        return c.json({ ok: true })
    }
})

// Internal send-message endpoint (from API or script)
app.post("/bot/send-message", async (c) => {
    try {
        const token = c.req.header("authorization")?.replace("Bearer ", "")
        const expected = c.env.INTERNAL_TOKEN || "dummy_token"
        if (token !== expected) {
            return c.json({ ok: false, error: "UNAUTHORIZED" }, 401)
        }

        const body = await c.req.json()
        const tgId: string | undefined = body?.telegramUserId
        const text: string | undefined = body?.text
        const photoUrls: string[] | undefined = body?.photoUrls

        if (!tgId) {
            return c.json({ ok: false, error: "MISSING_TELEGRAM_USER_ID" }, 400)
        }
        if (!text) {
            return c.json({ ok: false, error: "MISSING_TEXT" }, 400)
        }

        const bot = createBot(c.env)

        const warnings: string[] = []
        let photosSent = 0

        // Handle photo attachments
        if (photoUrls && photoUrls.length > 0) {
            const urls = Array.isArray(photoUrls) ? photoUrls : [photoUrls]
            const mediaList: { type: "photo"; media: string | InputFile }[] = []

            for (const item of urls.slice(0, 10)) {
                if (item.startsWith("http://") || item.startsWith("https://")) {
                    mediaList.push({ type: "photo" as const, media: item })
                } else if (c.env.BUCKET) {
                    try {
                        const object = await c.env.BUCKET.get(item)
                        if (object) {
                            const buf = await object.arrayBuffer()
                            const ext = item.split('.').pop() || "png"
                            mediaList.push({
                                type: "photo" as const,
                                media: new InputFile(new Uint8Array(buf), `photo.${ext}`)
                            })
                        } else {
                            const msg = `R2 object not found for key: ${item}`
                            console.warn(msg)
                            warnings.push(msg)
                        }
                    } catch (e: any) {
                        const msg = `Failed to fetch ${item} from R2 bucket: ${e.message}`
                        console.error(msg, e)
                        warnings.push(msg)
                    }
                } else {
                    const msg = `R2 bucket not bound, cannot fetch path: ${item}`
                    console.warn(msg)
                    warnings.push(msg)
                }
            }

            photosSent = mediaList.length

            if (mediaList.length === 1) {
                await bot.api.sendPhoto(tgId, mediaList[0].media)
            } else if (mediaList.length > 1) {
                await bot.api.sendMediaGroup(tgId, mediaList)
            }
        }

        // Convert markdown to safe Telegram HTML
        const htmlText = text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
            .replace(/^\*\s+/gm, "• ")
            .replace(/`(.*?)`/g, "<code>$1</code>")

        // Send the formatted release notes text
        await bot.api.sendMessage(tgId, htmlText, { parse_mode: "HTML" })

        return c.json({ ok: true, photosSent, warnings })
    } catch (e: any) {
        console.error("[bot send-message] error", e)
        return c.json({ ok: false, error: "BOT_SEND_ERROR", message: e.message }, 500)
    }
})

// Optional GET for quick health-check
app.get("/bot/webhook", (c) => c.text("OK: use POST for updates"))

export default app
