# Vezha Admin — security & Cloudflare read budget

Two problems, one pass:

- **A.** The admin panel opens for anyone who knows the URL. There is no login, no roles, no server-side
  authorization, and no audit trail of who changed a member's XP.
- **B.** The panel runs on Cloudflare Workers against a serverless DB (D1/Turso-class), where **rows read** is the
  billed and rate-limited unit. Today's list pages read far more rows than they display.

Rule for the whole document: **the UI never decides anything.** Every check below is server-side; the frontend only
mirrors the answer.

---

## A. Security

### A1. Perimeter (do this first — it is one afternoon)
Put the admin origin behind **Cloudflare Access (Zero Trust)** with an email-OTP or Google policy for the club's
staff list. That closes the open door today, before any app code changes. Keep it on afterwards: it is defence in
depth, not a substitute for A2.

Also: remove any public `*.workers.dev` route for the admin worker, and make sure the API worker does **not** accept
the admin endpoints from the Mini App origin (separate route or explicit origin allow-list, `Vary: Origin`).

### A2. Application auth
- Session = **signed JWT in an HttpOnly, Secure, SameSite=Lax cookie**, scoped to the admin host.
  Access token TTL 15–30 min, refresh token 30 days in a separate HttpOnly cookie, rotated on use.
- The access token carries `{ sub, role, ver }`. `ver` is a per-user integer bumped on password change / revoke —
  compared against a **KV** copy, not the DB, so **authorization costs zero row reads** on the hot path.
- Password login with Argon2id or scrypt (Workers-compatible) — or skip passwords entirely and rely on Access
  identity headers (`Cf-Access-Jwt-Assertion`) verified against Cloudflare's JWKS, with a local `users` row only
  for the role.
- Rate-limit login and phone search per IP (Cloudflare Rate Limiting or a Durable Object counter).
- Log out = clear cookies + bump `ver` in KV.

### A3. Roles
Minimum viable set, stored on the user row and mirrored into the token:

| Role | Can |
| --- | --- |
| `owner` | everything, incl. user management, levels, automation, delete |
| `admin` | everything except user management and destructive deletes |
| `dm` | members read, XP adjust within a cap (e.g. ±300/day), activities |
| `cashier` | Каса only + member lookup; read-only elsewhere |

Enforce with one middleware per route group (`requireRole('admin')`) plus a per-action check inside mutations.
Hiding a button is not enforcement — every list, detail, create, update, delete, and bulk endpoint gets a check.

### A4. Mutation hygiene
- Validate every request body with the **existing zod schemas on the server too** (they currently run only in the
  browser). Reject unknown keys (`.strict()`), never spread request bodies into an UPDATE.
- Idempotency key on checkout and XP adjustments (a `Idempotency-Key` header + a unique index) so a double-click or
  a scanner retry cannot double-charge or double-grant.
- CSRF: SameSite=Lax covers form posts; still require a custom header (`X-Vezha-Admin: 1`) on all mutating
  requests and reject cross-origin `Origin` values.
- **Audit log** (`audit_log`: `id, actor_id, action, entity, entity_id, diff_json, created_at`) written in the same
  batch as every mutation. This is what fills the «Хто» column on the member card — it is a designed surface, so it
  must be real. Append-only; nobody has a delete route for it.
- Telegram Mini App side: verify `initData` HMAC on every request; never trust a `user_id` from the client body.
- Secrets via `wrangler secret`, never in `vars`. Rotate the DB token when this lands.

---

## B. Cloudflare read budget

### B1. The rule
A list page must read **exactly `pageSize` rows plus one**, and nothing else. Everything a row displays must live on
that row, or be joinable with an index in the same statement — no N+1 lookups per row, no client-side filtering,
no `SELECT *`.

### B2. Denormalise what the screens show
The member row on the list screen shows: name, phone, **level**, **XP / next-level threshold**, **last visit**,
**unclaimed prizes count**. Three of those are aggregates today. Materialise them onto `members`:

```
members(
  id, name, phone, active,
  xp_total          INTEGER NOT NULL DEFAULT 0,   -- running balance, never SUM()ed at read time
  level             INTEGER NOT NULL DEFAULT 1,
  level_threshold   INTEGER NOT NULL,             -- copied from levels on level change
  last_visit_at     INTEGER,                      -- unix seconds, updated on checkout/visit
  unclaimed_prizes  INTEGER NOT NULL DEFAULT 0,
  updated_at        INTEGER NOT NULL
)
```

Every write path (checkout, XP adjustment, prize grant/claim, level rule run) updates these in the **same
transaction/batch** as the ledger insert. The ledger stays append-only and is read only on the member card, paged.

Same idea elsewhere: `products.stock` already exists — keep totals like promotion usage counts as a counter column,
not a `COUNT(*)` over an applications table.

### B3. Pagination
- Prefer **keyset (cursor) pagination**: `WHERE (sort_key, id) < (?, ?) ORDER BY sort_key DESC, id DESC LIMIT ?+1`.
  The extra row tells you whether a "next" page exists — no count needed for the arrows.
- If the designed footer must keep «Сторінка 1 з 129», do **not** run `COUNT(*)` per request. Cache the count in KV
  (`members:count:<filterHash>`, TTL 60–300s, invalidated on insert/deactivate). An admin list count may be a few
  seconds stale; that is fine and nobody will notice.
- Cap `pageSize` server-side at 50 (the designed options are 5/10/20/50) and reject anything larger.

### B4. Indexes (covering, in the sort order the UI uses)
```
CREATE INDEX idx_members_active_lastvisit ON members(active, last_visit_at DESC, id DESC);
CREATE INDEX idx_members_level            ON members(level, id DESC);
CREATE INDEX idx_members_phone            ON members(phone);            -- exact/prefix only
CREATE INDEX idx_ledger_member_created    ON points_ledger(member_id, created_at DESC, id DESC);
CREATE INDEX idx_products_active_name     ON products(active, name);
```
Phone search: normalise to digits on write (`phone_digits`) and query with `=` or `LIKE '380671234%'` — a leading
`%` wildcard scans the table and is the single most expensive thing the current search can do. The masked input in
the design already forces a full/prefix number, so keep it.

### B5. Cache the small, boring things
Categories, rooms, game systems, levels, and the filter dropdowns change a few times a year and are read on every
page. Serve them from **KV** (or the Workers Cache API) with a long TTL and a version key bumped on mutation.
`Cache-Control: private, max-age=60` on list GETs plus SWR on the client kills most repeat reads from tab switching.

### B6. Каса (checkout) specifics
- Search-by-scan resolves **one product by barcode with a unique index** — never a list query filtered client-side.
- The whole sale is one batch: insert `order` + `order_items`, decrement stock, insert ledger row, update
  `members.xp_total / level / last_visit_at / unclaimed_prizes`, insert `audit_log`. One round trip, one
  idempotency key.
- Promotion evaluation runs on the server against the cart payload, using the cached rules — not by loading all
  promotions per keystroke. The «Прогноз: 312» estimate on the promo builder is an **explicit button / debounced
  600ms** call, cached 5 min: it is the one intentionally expensive query in the panel.

### B7. Guardrails so this doesn't regress
- Log `rows_read` (D1 `meta.rows_read`) per request in the Worker; add a dev-mode header showing it.
- A budget test in CI: members list page = ≤ 12 rows read, member card = ≤ 40, checkout sale = ≤ 15.
- Ban `SELECT *` and unbounded `LIMIT`-less queries in review.

---

## Suggested order
1. Cloudflare Access in front of the admin (today).
2. Sessions + roles + server-side zod + audit log.
3. Denormalised member columns + backfill migration + indexes.
4. Keyset pagination + cached counts + KV reference data.
5. Checkout batching and idempotency.
6. The visual redesign (`README.md` + `PROMPT.md`).
