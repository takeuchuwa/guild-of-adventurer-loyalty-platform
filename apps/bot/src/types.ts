import { Context } from "grammy"

export interface Env {
  DB: D1Database
  BOT_INFO: string
  BOT_TOKEN: string
  INTERNAL_TOKEN?: string
}

export type BotContext = Context & { env: Env }
