# Handoff: Vezha Admin — redesign + auth + Cloudflare read budget

## What this bundle is
Three jobs bundled for `apps/admin` (React 18 + Vite + TS + shadcn/ui + Tailwind v4, deployed on Cloudflare Workers):

1. **Visual redesign** — Guild of Adventurer → **Vezha**. Same routes, same domains, same Ukrainian copy.
2. **Security** — the panel is currently publicly reachable and unauthenticated. It needs auth, roles, and
   server-side authorization on every endpoint.
3. **Cloudflare read budget** — list/detail screens must stop scanning rows. Denormalised counters, keyset
   pagination, cached counts, session without a DB hit.

Do them in that order of *risk*, not that order of *fun*: **security first, read budget second, restyle last**
(the restyle is the safe part and it is fully specced here).

## Files
| File | What it is |
| --- | --- |
| `Vezha Admin Panel.html` | The redesign: 5 screens at 1600px — members list, member card, product form, checkout (Каса), promotion rule builder + delete dialog. Open in a browser. Needs `AdminSidebar.dc.html`, `support.js`, `assets/` next to it. |
| `Vezha Brandbook.html` | Master brand book (logo, palette, type, borders, icons). |
| `Vezha App Guidelines.html` | The Telegram Mini App redesign — the admin must read as the same system (tower = level, same tokens). |
| `CURRENT_ADMIN_EXPORT.md` | Export of the current, as-implemented admin (routes, components, tokens). Source of truth for behaviour and copy. |
| `BACKEND_SECURITY.md` | The security + Cloudflare read-minimisation plan, with concrete schema/query changes. |
| `PROMPT.md` | Paste-into-Claude-Code prompt with the step order. |

**The HTML files are design references, not production code.** Rebuild inside the existing codebase with shadcn
components and Tailwind tokens. Do not port inline styles.

---

## Design tokens (replace the stock shadcn neutral theme)

Dark is the only mode. Do not ship a light theme or a theme toggle.

| Token | Value | Role |
| --- | --- | --- |
| `--background` | `#0E0D0C` (Смола) | app base |
| `--surface` / `--card` | `#141210`; secondary `#121110` | panels, table head, sidebar |
| `--surface-2` | `#1C1917` (Вугіль) | expanded/nested bodies |
| `--border` | `rgba(201,158,58,.22)` @1px; inside tables `rgba(201,158,58,.08)` | hairlines |
| `--ring` / active border | `2px solid #C99E3A` | focused input, active tab, selected row frame |
| `--primary` | `#C99E3A` (Золото), text on it `#0E0D0C` | one filled action per screen |
| `--accent-bright` | `#E3C46A` (Свічка) | all numeric values: XP, sums, counts |
| `--brass` | `#8A6A1E` | disabled gold, secondary marks |
| `--foreground` | `#EDE6D8` (Пергамент) | text |
| `--muted-foreground` | `rgba(237,230,216,.6)` / `.42` | secondary / tertiary text |
| `--destructive` | `#7E2B21` (Кров), text `#C0574B` | delete, negative XP, validation errors — max one per screen |
| `--radius` | **`0`** | everywhere; exceptions: avatar circle, QR frame |

No gradients (the app's single background gradient does not apply to the admin). No shadows, no blur, no glow,
no `rounded-*`, no green, no orange, no emoji, no lucide.

## Typography
- **Oswald** 600/700 — page titles (36–40px), section and button labels. UPPERCASE, letter-spacing .03–.14em.
- **Manrope** 400/600 — body, field values, descriptions. 14–15px, line-height 1.5.
- **JetBrains Mono** 400/700 — every number, date, phone, SKU, ID, level, sum, and every overline
  (10–11px, ls .16–.24em, uppercase, gold). Mono badges `white-space: nowrap`.

## Density (this is a work tool, not the app)
Table row 56px · table header 44px · input/button height 42–46px · page padding 28–32px · gap rhythm 10/16/20/26.
Sidebar 252px, item 34px tall. Top bar 60px with mono breadcrumbs.

## Component rules
- **Sidebar** — logo + «ВЕЖА / АДМІНІСТРАЦІЯ», three groups with their existing Ukrainian labels, «Каса» as the only
  filled gold block, pinned to the bottom with an `F2` hint. Nav icons are **geometric shapes, not lucide**:
  square = Класифікація, diamond (rotated square) = Клуб, circle = Програма лояльності. Active item = 2px gold left
  bar + `rgba(201,158,58,.10)` fill + filled shape. `Завдання` keeps a mono `SOON` tag.
- **DataTable** — 1px gold hairline frame, `#141210` header with mono gold column labels, 56px rows, square 14px
  checkboxes (no rounded-full radio look), row hover `rgba(201,158,58,.05)`, selected row = same fill + gold
  checkbox. Footer strip `#121110`, everything mono. Sort chevrons stay.
  **Bulk actions appear in the toolbar right side only when a selection exists**, with a mono `ОБРАНО N` counter.
- **Buttons** — filled gold = primary (one per screen); `1px rgba(201,158,58,.45)` + `#E3C46A` = secondary;
  `1px rgba(237,230,216,.2)` = neutral/cancel; `1px rgba(126,43,33,.7)` + `#C0574B` = destructive outline.
  All labels Oswald uppercase, ls .1em. Keep the existing `destructiveOutline` / `ghostOutline` CVA variants,
  just restyle them.
- **Inputs** — radius 0, `#121110` fill, 1px hairline; focus = 2px `#C99E3A` with no ring/offset; error = 1px
  `rgba(126,43,33,.8)` + `#C0574B` helper text. Labels are mono overlines above the field, required `*` in `#C0574B`.
- **Chips** (related entities) — square, `1px rgba(201,158,58,.4)` + `rgba(201,158,58,.07)` fill, mono `×` remover;
  the add affordance is a dashed hairline «+ ДОДАТИ».
- **Dialogs** — 82% dim `rgba(10,9,8,.72)`, plate `#121110` with a 1px gold border, mono warning overline with a
  CSS triangle for destructive ones. The type-«видалити»-to-confirm pattern stays exactly as it is; the confirm
  button is disabled-red until the word matches.
- **Tabs** — underline tabs (Oswald uppercase, 2px gold underline on active), replacing the hand-rolled
  `bg-muted p-1 rounded-md` pill on the Members page. Use the shadcn `Tabs` primitive.
- **Toasts (sonner)** — square, `#141210`, 2px gold left edge; destructive gets `#7E2B21`. Copy unchanged.

## Screens (all in `Vezha Admin Panel.html`)
1. **Підкорювачі / list** — title + mono stat line (`1 284 · АКТИВНИХ 947 · НОВИХ ЗА ТИЖДЕНЬ +23`), underline tabs
   (Усі / Незабрані призи · N / Деактивовані), toolbar (masked phone search, level filter, visit filter, bulk
   actions right), table with **level badge + a 3px XP bar per row** and an «N НЕЗАБРАНО» mono badge.
2. **Картка підкорювача** — left rail: avatar + identity, **the tower** (same primitive as the TMA: one floor per
   level, current floor bright, completed hatched/filled, locked hairline) with XP-to-next, a 2×2 mono stat grid,
   and unclaimed prizes with a gold «Видати». Right: tabs (Історія XP / Покупки / Активності) over a dense ledger
   register — date · event · **signed delta in gold or Кров** · balance · who did it. The «Хто» column is the
   audit trail; it must be real data, not a label (see `BACKEND_SECURITY.md`).
3. **Форма (товар)** — the template for every entity form: content column + a sticky right rail (`#121110`) holding
   loyalty settings, toggles, and the three actions (Створити / Створити та в кошик / Скасувати). Validation state
   shown on the price field. Toggle = 42×22 square track, no pill.
4. **Каса** — scanner-first: a 2px gold search bar with a mono «СКАНЕР ГОТОВИЙ» badge, category tabs, a 4-up
   product grid of flat `#141210` tiles (name / gold price / mono stock), and a 460px cart rail: attached member
   with lvl + discount, quantity steppers, then the money block — subtotal, level discount, **XP to be granted**,
   large gold total, Готівка / Картка, and one filled gold «ПРОВЕСТИ · F9».
5. **Промоакція / конструктор** — three columns coded by the icon system: **square = Умови**, **diamond = Ефекти**,
   **circle = Цілі та охоплення**, each a stack of hairline rule cards with a dashed «+» at the end. The targets
   column carries level chips, a live «Прогноз: 312 підкорювачів» estimate, and the app-facing promo copy.
   The screen is shown with the delete dialog open — that's the dialog spec.

## Not designed yet (ask before inventing)
- **Login screen** and the user/roles management page — needed for the security work. Say the word and I'll design
  them in this language (a single centred plate on `#0E0D0C`, logo, one gold action).
- Автоматизація (configs / AI instructions) and Рівні лояльності screens — they follow the form template above.

## Do not touch
Routes, domain model, Ukrainian strings, the type-to-confirm delete keyword, the hardware scanner hook, the
`[5,10,20,50]` page sizes, the sidebar cookie behaviour, and all existing toast copy.
