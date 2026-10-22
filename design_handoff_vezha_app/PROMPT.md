# Prompt for Claude Code

Paste this in the repo root of the Vezha Telegram Mini App, with `design_handoff_vezha_app/` copied into it.

**Model:** Sonnet is enough for the whole job — this is a mechanical, well-specified restyle, not architecture work.
Run the plan step by step; use a stronger model only for step 4 (the Tower component) if Sonnet's first attempt
misreads the three configurations.

---

Read `design_handoff_vezha_app/README.md` first, then open `Vezha App Guidelines.html` in a browser (the new design:
sections 01 tokens, 02 tower, 03 level card, 04 expanded states, 05 sheets, 06 all screens, 07 components, 08 do/don't)
and `tma_pages_and_design_spec.md` (the current app — source of truth for behaviour and Ukrainian copy).
`Vezha Brandbook.html` is the master brand book if you need a rule the README doesn't cover.

We are rebranding this Telegram Mini App from "Guild of Adventurer" to "Vezha". This is a **visual redesign only**:
do not change any functionality, props, API calls, routes, validation, or Ukrainian strings. If a refactor seems
tempting beyond styling, stop and ask me first.

Work in this order, **one step per commit**, and show me the diff before moving on. Do not start the next step until
I confirm.

1. **Tokens.** Replace the whole `guild-*` palette with the Vezha tokens (README table) in the theme/tailwind config.
   Remove glassmorphism entirely: no `backdrop-filter`, no translucent card fills, no glow/shadow utilities.
   `border-radius: 0` globally except the avatar and the QR frame. Add Oswald / Manrope / JetBrains Mono.
   App background = the vertical gradient from the README (the only gradient in the app).
2. **Tap feedback.** Remove the global ripple; replace with a 120ms color inversion. Keep 44×44 min tap targets
   and `env(safe-area-inset-*)`.
3. **Chrome.** Rebuild the bottom tab bar (new geometric icons: person / clock / three bars / marked sheet) and the
   header ("V" monogram in a 34px square, referral `+1` in a 2px square, help "?" in a diamond).
4. **Tower.** Build ONE `<Tower>` primitive with floor states completed / current / locked, then two consumers:
   the 3-floor mini tower in the Profile level card (three configurations: first level / middle / max level — §03 of
   the guidelines) and the full tower on Tower Ranks. It replaces the horizontal progress bar; the percentage value
   and its data source stay exactly the same. Card height must not change between levels.
5. **Screens.** History as a dense hairline register (category coded by icon SHAPE, not color), Top podium as three
   tower floors, Calendar teaser.
6. **Expanded states.** Promos expand in place (26px indent, ticket icon, 3 chips, expiry, copy-able code, one open at
   a time) and the tower floor accordion (200ms ease-out, Переваги / Призи / Знижки on coal).
7. **Sheets.** All four bottom sheets to the single pattern (dim 82%, 2px gold top edge, 52×3 handle, title + close,
   content, one gold CTA). Settings toggles apply instantly.
8. **Icons.** Replace every lucide icon with the geometric shape + mono glyph system (hex / diamond / square /
   triangle), using the sizing rule in the README so shapes look optically equal.

Constraints: mobile-first; numbers always JetBrains Mono; one filled gold element per screen; `#7E2B21` at most once
per screen; no emoji, no illustrative SVG, no green, no orange.

Start with step 1 and stop for my review.
---
