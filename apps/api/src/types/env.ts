export type Env = {
    Bindings: {
        DB: D1Database
        INTERNAL_TOKEN?: string
        BOT_TOKEN?: string
        BOT: Fetcher
        KV_POS_CART: KVNamespace
        QR_SECRET_KEY: string
    }
    Variables: {
        tgUser: any
    }
}
