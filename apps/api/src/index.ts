import { Hono } from "hono"
import { cors } from "hono/cors"
import { membersRoute } from "@/routes/members"
import { categoriesRoute } from "@/routes/categories"
import { productsRoute } from "@/routes/products"
import type { Env } from "@/types/env"
import { activitiesRoute } from "@/routes/activities"
import { gamesRoute } from "@/routes/games"
import { checkoutRoute } from "@/routes/checkout"
import { roomsRoute } from "@/routes/rooms"
import { levelsRoute } from "@/routes/levels"
import { configsRoute } from "@/routes/configs"
import { promotionsRoute } from "@/routes/promotions"

import { cartRoute } from "@/routes/cart"

const app = new Hono<Env>()

app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS", "DELETE", "PUT"] }))

app.get("/", (c) => c.json({ ok: true, service: "api", version: "0.0.3" }))

app.route("/members", membersRoute)
app.route("/categories", categoriesRoute)
app.route("/products", productsRoute)
app.route("/activities", activitiesRoute)
app.route("/games", gamesRoute)
app.route("/checkout", checkoutRoute)
app.route("/rooms", roomsRoute)
app.route("/levels", levelsRoute)
app.route("/configs", configsRoute)
app.route("/promotions", promotionsRoute)
app.route("/cart", cartRoute)

export default app
