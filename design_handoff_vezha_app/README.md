# Handoff: Vezha TMA — visual redesign (Guild of Adventurer → Vezha)

## Overview
The "Guild of Adventurer" Telegram Mini App is being rebranded to **Vezha** (Вежа — "tower"), a dnd studio in Kharkiv.
This is a **visual + UX redesign only**. All functionality, data, fields, flows and Ukrainian copy stay as they are.
The one structural idea added: **level progression is rendered as a tower built from the bottom up** (one rank = one floor)
instead of a horizontal progress bar. The same floor language is reused on the leaderboard podium.

## About the design files
The files in this bundle are **design references written in HTML** — prototypes of the intended look and behaviour,
not production code to copy. Recreate them inside the existing app codebase (React + Tailwind, Telegram Mini App)
using its established components and patterns. Do not port HTML/inline styles.

Files:
- `Vezha App Guidelines.html` — the design system for the app: principles, token migration table, tower states,
  6 screens at 390×844 (Profile, Tower Ranks, History, Top, Calendar, bottom sheet), components, motion, do/don't.
- `Vezha Brandbook.html` — the master brand book (logo rules, palette, typography, borders, icon system, Instagram).
- `tma_pages_and_design_spec.md` — the ORIGINAL spec of the current app (source of truth for functionality & copy).
- `assets/logo-gold.png`, `assets/logo-parchment.png`, `assets/logo-ink.png` — the Vezha wordmark (aspect 248:667).

## Fidelity
**High-fidelity.** Colors, typography, sizes, states and motion timings are final. Match them exactly.

## Design tokens (replace the whole guild-* palette)

| Purpose | Old (guild) | New (vezha) |
| --- | --- | --- |
| App background | `#011711`/`#0b241d`/`#00110c` gradient | `linear-gradient(180deg,#1A1715 0%,#131110 38%,#0E0D0C 100%)` — the ONLY gradient allowed in the UI |
| Surface / card | `rgba(40,78,65,.4)` + blur(12px) | `#1C1917` opaque (secondary: `#141210`) — no glassmorphism, no backdrop-filter |
| Hairline border | `rgba(200,166,121,.15)` | `rgba(201,158,58,.22)` at 1px; active state = 2px solid `#C99E3A` |
| Accent primary | `#C8A679` | `#C99E3A` (Золото) |
| Accent bright | `#FFD700` | `#E3C46A` (Свічка) — all numeric XP values |
| Warm | `#D47826` | `#8A6A1E` (Латунь). Orange is removed entirely |
| Success | `#2D9B6E` / `#3BBF89` | `#C99E3A` — green is removed; positives are gold + a "+" sign |
| Danger | `#C82813` | `#7E2B21` (Кров) — errors, penalties, negative XP. Max one element per screen |
| Text primary | `#FAFAF5` | `#EDE6D8` (Пергамент, warm not white) |
| Text muted / dim | `rgba(250,250,245,.6/.4)` | `rgba(237,230,216,.6)` / `rgba(237,230,216,.42)` |
| Sheet background | `#0A1F17` | `#141210`, top edge = 2px `#C99E3A` instead of a shadow |

Other tokens: screen padding 20px · vertical rhythm 8/16/24/40 · **border-radius: 0 everywhere** (exceptions: avatar
circle, QR frame) · min tap target 44×44 · respect `env(safe-area-inset-*)`.

## Typography
- **Oswald** 500/600/700 — screen titles and floor/rank names. UPPERCASE, letter-spacing .04–.08em. Screen title 28px.
- **Manrope** 400/600 — body text, descriptions, names. 15–17px, line-height 1.5.
- **JetBrains Mono** 400/700 — every number and label: XP, dates, times, levels, promo codes, section overlines
  (10–11px, letter-spacing .20–.24em, uppercase). Mono badges must be `white-space: nowrap`.

## The tower (replaces the progress bar)
One rank = one floor, stacked bottom-up. Three states:
1. **Completed** — 2px `#C99E3A` border + hatch fill `repeating-linear-gradient(45deg, rgba(201,158,58,.16) 0 2px, transparent 2px 9px)`, label `ПРОЙДЕНО`.
2. **Current** — 2px `#E3C46A` border, hatch background, and a solid `#C99E3A` fill rising from the bottom to the
   progress %; badge `ВИ ТУТ` + the % on the right, text in `#0E0D0C` over the fill. Only filled element on screen.
3. **Locked** — 1px dashed `rgba(237,230,216,.22–.30)`, text at 40–50% opacity, right label = XP threshold.

Rules: floor width grows ~8% per level downward (tower silhouette, not a column) · spire is drawn only at max level ·
level-up = new floor drops in from above, 260ms ease-out + one border flash · no particles, no glow, no pulsing.

Where it appears: **compact 3-floor mini tower** inside the Profile level card (see below);
full-height tower on the Tower Ranks screen (tap a floor to expand perks / prizes / discounts);
leaderboard podium = three floors of different heights (1st = solid gold, 2nd/3rd = hatched outline).

## Level card — 3 floors out of 5 (guidelines §03)
The whole tower does NOT fit in the profile card: at 390px the floors become 8px strips and five unnamed frames tell a
newcomer nothing. The card shows **exactly three floor slots**, always the same card height at every level:

- Layout: 2px `#C99E3A` border, 16px padding, `display:flex; gap:16px`.
  **Left column (flex:1, text):** overline `РІВЕНЬ` (mono 10px, ls .24em, `#C99E3A`) + percentage right-aligned
  (mono 16px/700, `#E3C46A`); rank name (Oswald 30px/700, uppercase, line-height 1.05, margin 10px 0 6px);
  then pushed to the bottom `margin-top:auto` — `1 450 / 2 000 XP` (mono 12px, `#E3C46A`) and
  `ДО РІВНЯ «МАЙСТЕР»` (mono 10px, ls .14em, `rgba(237,230,216,.5)`). All mono values `white-space:nowrap`.
  **Right column (width 104px, flex:none, column, justify-content:flex-end, gap 3px):** the three floors, widening
  downward (72–100% of the column), plus caption `ПОВЕРХ 2 З 5` (mono 9px, ls .14em, 45% parchment, margin-top 6px).
- Floor states in the mini tower: locked = height 22–26px, 1px dashed `rgba(237,230,216,.26)`;
  current = height 30px, 2px `#E3C46A` + hatch, absolutely-positioned `#C99E3A` fill from the bottom at `height:<pct>%`;
  completed = height 30px, 2px `#C99E3A` + hatch, no fill.
- **Three configurations** (the component picks by level index):
  1. *Middle:* next (locked) / current / completed — the base case.
  2. *First level:* two locked above / current at 100% width, nothing below.
  3. *Max level:* a triangular roof cap (CSS triangle, 52px base × 20px, `#C99E3A`) / current at 100% / one completed;
     the caption reads `ПОВЕРХ 5 З 5` and the sub-label `ВЕЖА ЗБУДОВАНА` replaces "до рівня…"; XP shows total only.
- No text is drawn inside mini-tower floors — all labels live in the left text column, so no contrast problem arises.
- Tapping the card opens the full Tower Ranks screen.
- Rejected (do not reintroduce): horizontal 5-segment strip (reads as a progress bar), whole tower in miniature,
  progress ring.

## Expanded states (guidelines §04)
**Discounts / promos (Profile).** The collapsible expands *downward inside its own frame* — the list is not a modal.
Each promo row: a 22×14px outline ticket icon, the promo title, and mono meta; the expanded body is indented 26px from
the left so it reads as a child of the row. Details show **three chips** in one wrapping flex row (gap 8px, mono 10px,
uppercase, ls .14em, 4px 8px padding):
1. effect — solid-feel gold text on 2px `#C99E3A` border;
2. applies-to — 1px `rgba(201,158,58,.4)` outline, parchment text;
3. condition — 1px hairline, `rgba(237,230,216,.5)` text.
Below the chips: expiry date (mono) and the **promo code as a copy-able row** (mono 14px, 1px hairline box, tap = copy
+ 120ms inversion feedback). Never more than one promo expanded at a time.

**Tower floor expansion (Tower Ranks).** Accordion, **200ms ease-out height**, one floor open at a time. The opened body
sits on `#1C1917` (coal) inside the floor frame and holds three sub-sections in order — **Переваги · Призи · Знижки** —
each with a mono overline and rows marked by a small rotated-square (diamond) bullet. Collapsed floors keep their
completed / current / locked styling untouched.

## Bottom sheets — one pattern, four sheets (guidelines §05)
82% dim overlay (`rgba(14,13,12,.82)`), coal plate `#141210` with a **2px `#C99E3A` top edge instead of a shadow**,
52×3px drag handle, then Oswald title + a square close button, content, and **one filled gold action at the bottom**.
Height follows content, max 88% of the viewport; only the content scrolls — handle and title stay pinned.

1. **Запросити друзів** — referral text, the invite link in a copy-able mono box, one gold CTA.
2. **Як це працює (Help)** — numbered steps, each with a geometric step icon: **hexagon** = games / XP,
   **square** = tavern & prices, **diamond** = friends & referrals. Icon slot 34px; the hexagon is drawn as SVG
   (34×39 viewBox, 2px stroke) so it optically matches the 34px squares next to it; the diamond is a rotated square
   with side ≈ round(S/√2) − 4 so its diagonal equals the slot.
3. **Редагувати профіль** — labelled fields (mono overline + hairline input, radius 0, 44px min height); the birthday
   field uses a **calendar icon** (20×20 SVG: box + top rail + two ticks), not a diamond. One gold "Зберегти".
4. **Налаштування** — rows with instant-apply toggles (no Save button semantics for toggles): a 44×24 track,
   off = 1px hairline, on = 2px `#C99E3A` with a solid gold 18px knob; 120ms transition.

## Screens (all specced visually in Vezha App Guidelines.html)
1. **Profile** — header (referral button `+1` in a 2px square · "V" monogram in a 34px square instead of the wordmark,
   because the mark is illegible below 40px · help "?" in a diamond), user block (56px circular avatar, 2px gold border),
   2-up secondary buttons, level card (2px gold border) with the mini tower, then three collapsibles
   (QR / Призи / Знижки) as 1px hairline rows with a mono "+" chevron.
2. **Tower Ranks** — back arrow + title, current-level summary row, then the full tower from the bottom up.
3. **History** — overline `АРТЕФАКТ ПАМ'ЯТІ`, title, 2-card XP summary, then a dense hairline register
   (no cards): 38px geometric icon + title + mono meta + XP on the right. Category is coded by icon SHAPE, not color.
4. **Top** — podium as three tower floors, then rank rows; the current user's row gets `#1C1917` fill + 2px gold left edge.
5. **Calendar** — teaser: 150px hatched square with a diamond "23", `НЕЗАБАРОМ` outline badge, title, copy, two ghosted cards at 45% opacity.
6. **Bottom sheet** (referral shown; same pattern for Edit profile / Settings / Help) — 52×3px drag handle,
   title + close square, content, ONE filled gold CTA at the bottom.

## Icons
Geometric outline (2px) + mono glyph, per the brand book: hexagon = dice/mechanics/XP, diamond = place & time,
square = conditions/price/discount, triangle = warning/penalty. Do NOT use lucide or any illustrative icon set.
Sizing rule for rotated/odd shapes inside a square slot of size S: a diamond's side = round(S/√2) − 4 (so its diagonal,
borders included, equals S); a hexagon is drawn as SVG at full slot width with height S×1.155, optically centred
(`top:-2.5px` for a 34px slot). Never rotate a bordered box and leave it at slot size — it reads ~41% too big.
Bottom nav icons are drawn from primitives: person (circle + shoulders) = Профіль, clock face = Історія,
three bars = Топ, sheet with thick top = Календар. Active `#C99E3A`, inactive `rgba(237,230,216,.42)`.

## Motion
120ms tap feedback (color inversion, **remove the global ripple effect**) · 200ms accordion height, ease-out ·
260ms new tower floor · 320ms bottom sheet, cubic-bezier(.2,.8,.2,1) · 600ms linear XP fill.
No pulsing dots, no parallax, no infinite glow.

## Do not touch
All functionality, all form fields and validation, infinite scroll, leaderboard anonymity, collapsible logic,
the 4 tabs and their order (Профіль · Історія · Топ · Календар), Telegram safe areas and drag handles,
and every Ukrainian string — verbatim, from `tma_pages_and_design_spec.md`.

## What changed since the first handoff
- Level card redesigned from a 4-floor mini tower to the **3-floor / three-configuration** card above.
- App background is a subtle vertical gradient (3% delta) — the single allowed gradient.
- Bottom nav icons redrawn for legibility (person / clock / three bars / marked sheet).
- Promos expand in place with the 3-chip detail block and copy-able code.
- All four bottom sheets unified into one pattern; Settings uses instant toggles.
- Icon geometry normalised (diamond and hexagon sizing rule above).

## Suggested working order
1. Palette/theme tokens + global background & typography.
2. Kill glassmorphism: card, border, radius primitives.
3. Bottom nav (new icons) + header.
4. Level card + tower component (shared by Profile and Tower Ranks).
5. History register · Top podium · Calendar.
6. Bottom sheets.
