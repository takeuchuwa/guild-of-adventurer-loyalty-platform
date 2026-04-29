import { Context } from "grammy"

export interface Env {
  DB: D1Database
  BOT_INFO: string
  BOT_TOKEN: string
  MINI_APP_URL: string
  QR_SECRET_KEY: string
  INTERNAL_TOKEN?: string
  BOT_ENV?: string
}

export type BotContext = Context & { env: Env }
