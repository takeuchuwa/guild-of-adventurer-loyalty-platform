import { DrizzleD1Database, drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type Db = DrizzleD1Database<typeof schema>;

export function getDb(env: { DB: D1Database }): Db {
    return drizzle(env.DB, { schema });
}
