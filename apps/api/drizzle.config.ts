import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "../../packages/db/schema.ts",
    out: "./drizzle/migrations",
    dialect: "sqlite",          // D1 is SQLite
    strict: true,
    verbose: true,
});
