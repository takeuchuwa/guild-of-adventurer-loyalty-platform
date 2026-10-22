# Admin App — Design & Component Export

Exported for use as reference input to a redesign task: rebrand "Guild of Adventurer" (Гільдія Авантюриста) → **"Вежа" (Vezha)**.

This document describes the **current, as-implemented** state of `apps/admin` — a React 18 + Vite + TypeScript admin dashboard for club managers, built with shadcn/ui (`new-york` style) on Radix primitives and Tailwind CSS v4.

> **Important note on current brand state:** `CLAUDE.md` at the repo root specifies an intended brand direction (deep black `#161616` background, gold/parchment accent gradient `#f4e5c4` → `#c8a679`, OKLCH premium dark mode, RPG/fantasy-influenced "guild hall" aesthetic). **None of that has been implemented yet in code.** The actual CSS theme (`src/index.css`) is still the **unmodified stock shadcn "neutral" base-color theme** — no gold, no custom OKLCH brand palette, no dark-mode-by-default. Separately, a partial rename from "Guild of Adventurer" branding to **"Вежа" (Tower)** branding is already in progress: the page `<title>`, sidebar header text, and app logo SVG (a stylized "Вежа" wordmark/tower glyph) already say "Вежа", but the underlying design system (colors, tokens) has not been redesigned to match. This document captures the current, un-restyled UI so a redesign pass can be planned deliberately.

---

## 1. Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18.2, Vite 7, TypeScript 5.9 |
| Routing | react-router-dom v7 (`BrowserRouter`) |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`, no `tailwind.config` — config lives inline in CSS via `@theme`) + `tw-animate-css` |
| Component system | shadcn/ui, style = `new-york`, base color = `neutral`, CSS variables enabled, no class prefix |
| Icons | `lucide-react` |
| Primitives | Radix UI (`@radix-ui/react-*` + the `radix-ui` umbrella package) |
| Forms | `react-hook-form` + `@hookform/resolvers` + `zod` (schema validation) — though several forms use plain `useState` instead (see §6) |
| Tables | `@tanstack/react-table` v8 (headless), wrapped in a custom `DataTable` |
| Notifications | `sonner` (toast) |
| Dates | `date-fns`, `react-day-picker` |
| Class merging | `clsx` + `tailwind-merge` via `cn()` helper, `class-variance-authority` (CVA) for variants |
| Input masking | `react-input-mask` (used for phone search) |
| Deployment | Cloudflare Workers via `wrangler` |

No CSS-in-JS, no styled-components, no custom design-token build step — everything is Tailwind utility classes + CSS custom properties.

---

## 2. Design Tokens (current, as-implemented)

Defined in `src/index.css` using Tailwind v4's `@theme inline` block, mapped from CSS custom properties on `:root` and `.dark`. Color space is **OKLCH** throughout (this part already matches the intended direction — only the actual hues/lightness don't).

### 2.1 Radius
```css
--radius: 0.3rem;              /* base */
--radius-sm: calc(var(--radius) - 4px);
--radius-md: calc(var(--radius) - 2px);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) + 4px);
```
Fairly tight/squared corners (0.3rem base) — not the softer, more rounded look often paired with fantasy/parchment UI.

### 2.2 Color tokens — Light mode (`:root`, current default)
| Token | OKLCH value | Approx. meaning |
|---|---|---|
| `--background` | `oklch(1 0 0)` | pure white |
| `--foreground` | `oklch(0.141 0.005 285.823)` | near-black, cool neutral |
| `--card` / `--popover` | `oklch(1 0 0)` | white |
| `--primary` | `oklch(0.21 0.006 285.885)` | near-black |
| `--primary-foreground` | `oklch(0.985 0 0)` | near-white |
| `--secondary` / `--muted` / `--accent` | `oklch(0.967 0.001 286.375)` | light neutral grey |
| `--muted-foreground` | `oklch(0.552 0.016 285.938)` | mid grey |
| `--destructive` | `oklch(0.577 0.245 27.325)` | red |
| `--border` / `--input` | `oklch(0.92 0.004 286.32)` | light grey |
| `--ring` | `oklch(0.705 0.015 286.067)` | grey focus ring |
| `--chart-1..5` | orange / teal / blue / yellow / amber | default shadcn chart palette, unused in brand-relevant UI |
| `--sidebar*` | near-white bg, near-black fg | mirrors main palette |

### 2.3 Color tokens — Dark mode (`.dark` class, **not currently activated by default**)
| Token | OKLCH value |
|---|---|
| `--background` | `oklch(0.141 0.005 285.823)` (near-black) |
| `--foreground` | `oklch(0.985 0 0)` (near-white) |
| `--card` / `--popover` | `oklch(0.21 0.006 285.885)` |
| `--primary` | `oklch(0.92 0.004 286.32)` (light grey, inverted) |
| `--secondary` / `--muted` / `--accent` | `oklch(0.274 0.006 286.033)` |
| `--border` | `oklch(1 0 0 / 10%)` |
| `--input` | `oklch(1 0 0 / 15%)` |

**Every hue in the palette above is achromatic/near-neutral** (chroma values of 0–0.016 except `destructive` and the unused chart colors). There is currently **zero gold/amber brand accent** and **no dark-mode-by-default** — `next-themes` is a dependency but no `ThemeProvider`/toggle is wired up anywhere in `App.tsx`/`main.tsx`, and `.dark` is never applied. This is the single biggest gap versus the CLAUDE.md brand spec (deep black `#161616` + gold/parchment gradient `#f4e5c4`→`#c8a679`) and the "Вежа" rebrand.

### 2.4 Typography
No custom font is loaded — `index.html` has no `<link>` to any font, and no `font-family` override appears in `index.css`. The app renders in the browser's default sans-serif stack (Tailwind's default). **No display/heading font, no serif accent for a "tavern" feel exists yet.**

### 2.5 Layout constants
```
SIDEBAR_WIDTH        = 16rem
SIDEBAR_WIDTH_MOBILE  = 18rem
SIDEBAR_WIDTH_ICON    = 3rem
SIDEBAR_COOKIE_NAME   = "sidebar_state"  (persists collapsed/expanded state 7 days)
```

---

## 3. Brand Assets

- **App title** (`index.html` `<title>`): `Вежа | Адміністрація`
- **Favicon**: `/logo.svg`
- **Sidebar wordmark**: "Вежа" (bold) + "Адміністрація" (small, secondary text) next to the logo mark
- **Logo component** (`src/components/logo.tsx`): an inline SVG (viewBox `372.94 148 209.06 628.05`), a single-path glyph — appears to be a stylized letterform/tower-like mark, monochrome (inherits `currentColor`/`fill` from context, no embedded color). Rendered at `h-12 w-auto` in the sidebar header.
- No separate app icon set (no PWA manifest icons, no OG image) found under `public/`.

---

## 4. Layout & Navigation Structure

### 4.1 Shell (`Layout` component, `src/components/layout/layout.tsx`)
- Uses shadcn's `SidebarProvider` + `AppSidebar` + `SidebarInset` pattern (the standard shadcn "sidebar-07"-style dashboard shell).
- Fixed 64px (`h-16`) top header inside the inset: sidebar trigger (hamburger) → vertical separator → breadcrumb trail.
- Breadcrumbs: always start with "Головна" (Home, linked to `/`), then caller-supplied `{label, path}` crumbs. Last crumb renders as plain text (`BreadcrumbPage`), others as links.
- Main content area is unconstrained (`<main>{children}</main>`) — individual pages apply their own `container mx-auto py-10` wrapper.

### 4.2 Sidebar (`AppSidebar`, `src/components/layout/app-sidebar.tsx`)
- **Header**: logo + "Вежа" / "Адміністрація" two-line wordmark, links to `/`.
- **Content**: grouped nav, three sections with Ukrainian labels:
  1. **"Класифікація"** (Classification) — Категорії (Categories, `ListIcon`), Кімнати (Rooms, `DoorClosedIcon`), Ігрові системи (Game systems, `Dice5Icon`)
  2. **"Клуб"** (Club) — Товари (Products, `ScanBarcodeIcon`), Активності (Activities, `Calendar1Icon`), Промоакції (Promotions, `BadgePercentIcon`)
  3. **"Програма лояльності"** (Loyalty program) — Підкорювачі (Members, lit. "Conquerors/Subjugators", `UsersIcon`), Рівні лояльності (Loyalty levels, `ArrowBigUpIcon`), Автоматизація (Automation/configs, `SettingsIcon`), Завдання — в розробці (Tasks — in development, `ListCheckIcon`, disabled)
- **Footer**: single prominent "Каса" (Checkout/POS) button with a shopping-cart icon, always visible, routes to `/checkout`.
- Collapsible (icon-only collapse mode is the shadcn default; state persisted via cookie).

### 4.3 Routing map (`App.tsx`)
Flat `react-router-dom` v7 routes, all client-side, no nested layouts beyond the shared `Layout` wrapper each page applies itself:
```
/                       → redirect to /members
/categories, /categories/create, /categories/:id
/rooms, /rooms/create, /rooms/:id
/members, /members/:id
/products, /products/create, /products/:id
/activities, /activities/create, /activities/:id
/games, /games/create, /games/:id
/levels, /levels/create, /levels/:id
/configs, /configs/create, /configs/:id
/promotions, /promotions/create, /promotions/:id
/checkout
```
Consistent **list / create / edit-by-id** pattern per resource. No nested/detail-tab routing except Members (which uses in-page tabs, see §5).

---

## 5. Page-Level Composition Pattern

Every list page (`src/pages/**/*.tsx`) follows the same recipe:
1. Wrap in `<Layout breadcrumbs={[...]}>`.
2. `<div className="container mx-auto py-10 flex flex-col gap-6">`.
3. Optional custom pill/segmented tab control built by hand (not a shadcn `Tabs` primitive) — see Members page: a `bg-muted p-1 rounded-md` pill container with manually-styled active/inactive buttons (`bg-background shadow` for active).
4. A resource-specific `<XTable>` component wrapping the shared `DataTable` (§6), with `columns`, `title`, `searchPlaceholder`, `actions[]` (row actions: edit/adjust/delete, each with icon + label + `variant`), and optional `filters[]`.
5. Row-level action flows route to `/resource/:id` for edit, or open a confirmation/adjustment `Dialog` in place.
6. Toasts (`sonner`) confirm success/failure of mutations, in Ukrainian ("успішно деактивовано", "Помилка при...").

Create/Edit pages are separate routed pages (not modals) that render a `<XForm mode="create|edit">` inside `Layout`.

---

## 6. Core Shared Components

### 6.1 `DataTable` (`src/components/table/data-table.tsx`)
The workhorse component reused across every resource (products, members, activities, categories, rooms, games, levels, configs, promotions). Built on `@tanstack/react-table`.

Features:
- Optional title (`text-2xl font-bold`).
- Toolbar row: left = bulk-action buttons (only enabled when rows selected; default `variant="outline"`, `size="sm"`), right = search box (plain `Input` or masked `react-input-mask` input for phone search) with an inline search-icon `Button`.
- Optional filter row below toolbar (arbitrary injected components, e.g. `LevelFilter`).
- Selection modes: `none | single | multiple`, rendered as `Checkbox` column (rounded-full styling for single-select radio-like behavior).
- Sortable column headers with `ChevronUp`/`ChevronDown` (lucide) indicating sort direction, faint dual-chevron on hover when unsorted.
- Row click toggles selection (ignoring clicks on links/`[data-no-select]`), `hover:bg-muted/50` row highlight.
- Loading state: semi-transparent overlay (`bg-background/50`) + centered spinning `Loader2`.
- Empty state: centered message row.
- Server-side pagination (`TablePagination`) with page-size options `[5, 10, 20, 50]`.
- Table container: `rounded-md border`.

### 6.2 Shared dialogs (`src/components/shared/dialogs/`)
All built on the shadcn `Dialog` primitive (`DialogContent` / `DialogHeader` / `DialogTitle` / `DialogDescription` / `DialogFooter`):
- `delete-confirmation-dialog.tsx` — type-to-confirm pattern: user must type the literal word **"видалити"** (delete) into an `Input` before the destructive `Button variant="destructive"` enables. Shows the target item name/count in bold.
- `bulk-update-dialog.tsx`, `points-adjustment-dialog.tsx`, `points-adjustment-warning-dialog.tsx` — multi-step confirm flows (warning → action).
- `*-selection-dialog.tsx` (category, game, member, product, room, activity) — reusable "pick related entities" pickers, presumably wrapping a mini `DataTable` with single/multiple selection.

### 6.3 Shared filters (`src/components/shared/filters/`)
Small controlled dropdown/select components (`category-filter`, `game-filter`, `level-filter`, `numeric-filter`, `promo-filter`) injected into `DataTable`'s `filters` prop.

### 6.4 Forms
Pattern seen in `product-form.tsx` (representative — most resource forms follow this, not `react-hook-form` despite it being a dependency):
- Plain `useState` for form data + a **zod schema** (`XSchema.parse`) run manually inside a `validateForm()` function, mapping `ZodError.issues` to a `Partial<Record<field, string>>` error map.
- Field pattern: `<Label>` (+ `*` in `text-destructive` for required) → optional `Tooltip` with `HelpCircle` icon for help text → `<Input>`/`<Checkbox>` (red border via `errors.field ? "border-destructive" : ""`) → inline error `<p className="text-sm text-destructive">` → optional muted helper text `<p className="text-sm text-muted-foreground">`.
- Related-entity pickers rendered as removable chips: `flex items-center gap-2 p-3 bg-muted rounded-lg` rows with an `X` icon ghost button, opening a `*SelectionDialog` to add more.
- Footer: right-aligned `flex gap-3 justify-end` — `Скасувати` (Cancel, outline) + primary submit button(s) with `Loader2` spinner while `isLoading`. Some forms (Product) support a secondary "Створити та додати в кошик" (create and add to cart) action.
- `shadcn/ui`'s `form.tsx` (react-hook-form–integrated `Form`/`FormField`/`FormItem`) exists in the codebase but is not universally used — worth normalizing during redesign.

---

## 7. shadcn/ui Component Inventory

All under `src/components/ui/`, standard shadcn "new-york" style, largely unmodified from upstream defaults:

`accordion`, `ai-textarea` (custom), `badge`, `breadcrumb`, `button`, `calendar`, `card`, `checkbox`, `date-time-picker` (custom, composes `calendar` + `time-picker`), `dialog`, `form`, `input`, `label`, `pagination`, `popover`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner` (toaster), `switch`, `table`, `tabs`, `textarea`, `time-picker`, `time-picker-input`, `tooltip`.

### 7.1 Button variants (CVA, `button.tsx`)
Project has **extended** the stock shadcn button with two custom variants:
```
default | destructive | outline | destructiveOutline (custom) | secondary | ghost | ghostOutline (custom) | link
```
- `destructiveOutline`: red border, red text, background→destructive on hover — used for row-level "delete" actions in table toolbars.
- `ghostOutline`: transparent, no hover background, only text→accent — a low-emphasis variant.

Sizes: `default (h-9)`, `sm (h-8)`, `lg (h-10)`, `icon (size-9)`, `icon-sm (size-8)`, `icon-lg (size-10)`.

### 7.2 Badge variants
Stock: `default | secondary | destructive | outline`. No custom additions found (worth adding a "level/rank" badge variant for the loyalty-level gamification concept per CLAUDE.md principle #3).

### 7.3 Card
Stock shadcn card (`Card`/`CardHeader`/`CardTitle`/`CardDescription`/`CardAction`/`CardContent`/`CardFooter`), `rounded-xl border shadow-sm`, unmodified.

---

## 8. Domain / Resource Areas

Each is a self-contained module under `src/components/<domain>/` with `api/`, `columns/`, `types/` (+ `validations/`) subfolders, a `*-table.tsx` (list) and `*-form.tsx` (create/edit):

| Domain | Ukrainian label | Notes |
|---|---|---|
| `members` | Підкорювачі | Has tabs (all / unclaimed prizes), points-ledger sub-table, level-info-card, points adjustment flow |
| `products` | Товари | SKU, price, inventory (supports "unlimited" `-1` sentinel), category assignment, points override |
| `activities` | Активності | Date-filtered |
| `categories` | Категорії | Simple CRUD, used as a selection dialog elsewhere |
| `rooms` | Кімнати | Simple CRUD |
| `games` / `games/systems` | Ігрові системи | Games + nested game systems |
| `levels` | Рівні лояльності | Loyalty tier definitions — core gamification concept |
| `configs` | Автоматизація (loyalty program automation) | Multiple sub-forms: activity time slots, level-change rules, AI system instructions (main + per-entity) — includes an `ai-textarea` custom UI component |
| `promotions` | Промоакції | Most complex domain: conditions/effects/targets/assignments/metadata panels — a rule-builder UI |
| `checkout` | Каса | POS-style cart/checkout flow, hardware barcode scanner hook (`useHardwareScanner`) |

---

## 9. Content & Voice Notes (relevant to redesign copy)

- 100% Ukrainian UI copy, informal-but-professional register.
- Domain terminology leans into the RPG framing already: members are "Підкорювачі" (roughly "Conquerors"), progression is "Рівні лояльності" (loyalty levels), the confirm-to-delete keyword is the literal Ukrainian word for "delete" typed by the admin.
- Toast messages are short, action-confirming, occasionally reference the club/system by name (e.g. "деактивує підкорювача в базі даних Вежі" — already using "Вежі" (genitive of Вежа) in copy).

---

## 10. Gap Summary — What a "Вежа" Redesign Needs to Address

1. **No brand palette implemented**: replace the neutral OKLCH grayscale in `src/index.css` with the intended deep-black (`#161616`-class) + gold/parchment gradient (`#f4e5c4` → `#c8a679`) OKLCH tokens, for both `:root` and `.dark`, and decide whether dark mode becomes the default (CLAUDE.md implies dark-mode-primary "tavern/guild hall" feel — currently the app boots in light mode with no theme toggle wired up at all).
2. **No custom typography**: no font is loaded; needs a "Modern, readable" primary font per CLAUDE.md, likely paired with a distinct heading/display treatment for a "Modern Legacy" feel.
2b. **Border radius**: current `--radius: 0.3rem` is quite square; consider whether a slightly different radius language better fits "Modern Legacy" (Shadcn/Radix modern + RPG gold-accent classic).
3. **Logo/wordmark**: current `Logo` SVG is a plain monochrome glyph inheriting text color — no gold treatment, no gradient fill, despite the brand spec calling for gold/parchment gradients.
4. **No gamification surfacing**: CLAUDE.md principle #3 ("Progressive Gamification — surface Adventurer Levels throughout the UI") is not reflected — no level badges, progress bars, or rank iconography appear in the current component set (Badge has no "level" variant; member cards are plain).
5. **Hand-rolled tab control** on the Members page bypasses the shadcn `Tabs` primitive — an opportunity to standardize AND restyle consistently.
6. **Form pattern inconsistency**: mix of manual `useState`+zod validation vs. the available `react-hook-form`-integrated `form.tsx` — a redesign pass is a natural point to unify.
7. **Sidebar nav icons** (`lucide-react`, generic: `ListIcon`, `DoorClosedIcon`, `Dice5Icon`, etc.) are functional but generic — no fantasy/adventure-themed iconography.

---

## 11. Suggested Inputs to Hand to a Redesign Session

- This document.
- `apps/admin/src/index.css` (current tokens, to be replaced).
- `apps/admin/src/components/ui/button.tsx` and `badge.tsx` (variant surface to extend).
- `apps/admin/src/components/logo.tsx` and `apps/admin/public/logo.svg` (mark to re-treat with gold/gradient).
- A concrete list of the 3 brand colors from CLAUDE.md (`#161616`, `#f4e5c4`, `#c8a679`) converted to OKLCH for both light/dark token sets.
- Screenshot(s) of the current running app (not captured in this export — recommend running `pnpm dev` in `apps/admin` and screenshotting the Members list, a create form, and a dialog for visual before/after reference).
