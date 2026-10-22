# Prompt for Claude Code

Paste this in the repo root, with `design_handoff_vezha_admin/` copied into it.

**Model:** use a strong model for steps 1–4 (auth, schema, query rewrites — real architecture); Sonnet is enough
for steps 5–9 (the restyle is mechanical and fully specced).

---

Read `design_handoff_vezha_admin/README.md` and `design_handoff_vezha_admin/BACKEND_SECURITY.md` first, then open
`Vezha Admin Panel.html` in a browser (the redesign: members list, member card, product form, Каса, promotion rule
builder + delete dialog). `CURRENT_ADMIN_EXPORT.md` describes the current admin and is the source of truth for
behaviour, routes and Ukrainian copy. `Vezha Brandbook.html` is the master brand book; `Vezha App Guidelines.html`
is the Telegram Mini App redesign — the admin must read as the same system.

We are doing three things to `apps/admin` (+ its API worker): **secure it**, **cut its Cloudflare row reads**, and
**restyle it from stock shadcn-neutral to Vezha**. Routes, domain model, form fields, validation rules and every
Ukrainian string stay as they are. If a refactor beyond this scope looks tempting, stop and ask me.

Work **one step per commit**, show me the diff, and wait for my confirmation before the next step.

1. **Perimeter.** Put the admin origin behind Cloudflare Access with a staff email policy; remove any public
   `workers.dev` route; lock the API worker's CORS/origin allow-list so admin endpoints are not reachable from the
   Mini App origin. No app code yet — just wrangler/Zero Trust config, documented in the PR.
2. **Auth + roles.** JWT session in HttpOnly/Secure/SameSite=Lax cookies (15–30 min access, rotating refresh),
   token version in KV so authorization costs zero DB reads. Roles `owner | admin | dm | cashier` per
   BACKEND_SECURITY §A3, enforced by middleware on **every** endpoint plus per-action checks in mutations —
   never by hiding UI. Add the `X-Vezha-Admin` header requirement and login rate limiting.
   Ask me before designing the login screen; I have the design language ready but not that screen.
3. **Server-side validation + audit log.** Run the existing zod schemas on the server (`.strict()`), add
   idempotency keys to checkout and XP adjustments, and write an append-only `audit_log` row in the same batch as
   every mutation. Wire the member card's «Хто» column to real audit data.
4. **Read budget — schema.** Add the denormalised member columns (`xp_total`, `level`, `level_threshold`,
   `last_visit_at`, `unclaimed_prizes`), the backfill migration, and the indexes in BACKEND_SECURITY §B2/§B4.
   Update every write path to maintain them in the same transaction as the ledger insert.
5. **Read budget — queries.** Keyset pagination (`LIMIT n+1`), KV-cached counts, KV-cached reference data
   (categories/rooms/games/levels), normalised `phone_digits` prefix search, single-statement barcode lookup, and
   one batched checkout transaction. Add the `rows_read` logging and the CI budget test (§B7). Target: members
   list ≤ 12 rows read per request.
6. **Design tokens.** Replace the stock shadcn neutral palette in `src/index.css` with the Vezha tokens
   (README table), dark-only — delete the light theme and do not add a toggle. `--radius: 0` globally except the
   avatar circle. Load Oswald / Manrope / JetBrains Mono. Restyle the button CVA variants (keep
   `destructiveOutline` / `ghostOutline`), inputs, dialogs and sonner toasts to the README component rules.
7. **Shell.** Sidebar at 252px: wordmark, three existing groups, geometric nav icons (square / diamond / circle —
   remove lucide from the nav), 2px gold active bar, «Каса» as the only filled gold block pinned to the bottom.
   60px top bar with mono breadcrumbs.
8. **DataTable.** Restyle to the design: `#141210` header with mono gold labels, 56px rows, square checkboxes,
   selection fill, mono footer strip, bulk actions revealed on selection with an `ОБРАНО N` counter. Wire it to the
   new cursor pagination API. Replace the hand-rolled Members pill tabs with the shadcn `Tabs` primitive styled as
   underline tabs.
9. **Screens.** Member card (tower component shared with the TMA + XP ledger register), form template with the
   sticky right rail (apply it to every entity form), Каса, promotion rule builder with the square/diamond/circle
   column coding. Level badges and XP bars in list rows come from the denormalised columns — no extra queries.

Constraints: dark only; radius 0; no gradients, shadows, blur, glow, green or orange; one filled gold element per
screen; `#7E2B21` at most once per screen; every number in JetBrains Mono; no lucide icons; no emoji; no
illustrative SVG. Ukrainian copy verbatim.

Start with step 1 and stop for my review.
