import { Hono } from 'hono'
const app = new Hono()

app.post('/bot/webhook', async (c) => {
    // placeholder — will integrate grammY in Sprint E1
    return c.json({ ok: true, handled: true })
})

export default app
