# Telegram Mini App (TMA) — Complete UI/UX & Design Specification for AI Redesign

> **Purpose**: This document provides a complete breakdown of every page, tab, modal, popover, design system token, UI hierarchy, and interaction flow in the **Guild of Adventurer** Telegram Mini App. It is designed to serve as a comprehensive context prompt for an AI agent tasked with performing a visual and UX redesign.

---

## 1. Overview & Brand Context

### 1.1 Project Purpose
The Telegram Mini App is the player-facing interface for the **Guild of Adventurer** loyalty platform — a role-playing game (TTRPG) club and tavern (Dungeons & Dragons, Call of Cthulhu, Pathfinder, Daggerheart, etc.). 
Adventurers use this app to:
- Track their **Adventurer Level / Rank** and accumulated experience points (XP).
- View unlocked **Prizes**, **Discounts**, and **Promotions**.
- Show a **Personal QR Code** to administrators at the club/tavern for instant XP crediting.
- View their complete **Experience History** log.
- Compete on the **Hall of Fame Leaderboard**.
- Invite friends via a **Referral Program**.
- Manage personal settings and profile information.

### 1.2 Target Audience & Tone
- **Users**: Tabletop RPG enthusiasts, tavern patrons, board game lovers.
- **Brand Personality**: Friendly, Modern, Experiential, Adventurous.
- **Aesthetic Vibe**: Modern "Tavern / Guild Hall" dark theme. Elevated RPG/Fantasy elements (parchment gold, emerald dark green, magical glows, glassmorphism) integrated into crisp modern UI components.
- **Primary Language**: **Ukrainian** (All UX copy, headers, and dates are in Ukrainian).

---

## 2. Design System Tokens & Style Guide

### 2.1 Color Palette
The current theme uses an OKLCH and custom hex dark palette representing a fantasy guild hall at night:

| Token Name | Hex / Value | Description & UI Role |
| :--- | :--- | :--- |
| `--color-guild-bg-top` | `#011711` | Top gradient background (Very dark emerald) |
| `--color-guild-bg-mid` | `#0b241d` | Mid gradient background (Deep forest green) |
| `--color-guild-bg-bottom` | `#00110c` | Bottom gradient background (Near black emerald) |
| `--color-guild-card` | `rgba(40, 78, 65, 0.4)` | Translucent glassmorphism card background |
| `--color-guild-card-hover` | `rgba(26, 92, 66, 0.5)` | Glass card hover / active fill |
| `--color-guild-card-border` | `rgba(200, 166, 121, 0.15)` | Subtle parchment gold card border |
| `--color-guild-gold` | `#C8A679` | Primary parchment/guild gold accent |
| `--color-guild-pure-gold` | `#FFD700` | Bright pure gold for rank #1 & trophy highlights |
| `--color-guild-orange` | `#D47826` | Warm amber/orange gradient fill & active tabs |
| `--color-guild-red` | `#C82813` | Crimson red gradient end & negative indicators |
| `--color-guild-gold-light` | `#F4E5C4` | Soft parchment text & shiny badges |
| `--color-guild-green-accent` | `#2D9B6E` | Emerald green success/promo accent |
| `--color-guild-green-light` | `#3BBF89` | Bright emerald text/links |
| `--color-guild-text` | `#FAFAF5` | High-contrast off-white primary text |
| `--color-guild-text-muted` | `rgba(250, 250, 245, 0.6)` | Medium opacity secondary text |
| `--color-guild-text-dim` | `rgba(250, 250, 245, 0.4)` | Low opacity helper/timestamp text |
| `--color-guild-modal-bg` | `#0A1F17` | Dark modal/bottom sheet background |

### 2.2 Typography & Micro-Interactions
- **Font Family**: `Manrope`, sans-serif (clean, geometric, highly readable). Monospaced font (`font-mono`) used for promo codes and date inputs.
- **Glassmorphism**: `backdrop-filter: blur(12px)`, translucent borders (`rgba(255,255,255,0.05)` or gold tint).
- **Global Ripple Effect**: Tap interaction creates a circular expanding ripple (`span.ripple-effect`) on cards and buttons.
- **Safe Area Insets**: Respects Telegram Mini App safe area insets (`env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`).

---

## 3. Global App Layout Shell

The global shell (`App.tsx`) consists of three fixed layers:

```
+-------------------------------------------------------+
|  HEADER: Invite Icon (Left) | Guild Logo | Help (Right)|
+-------------------------------------------------------+
|                                                       |
|                  ACTIVE TAB CONTENT                   |
|       (Profile / History / Leaderboard / Calendar)    |
|                                                       |
+-------------------------------------------------------+
|  FLOATING BOTTOM NAV BAR (Glass Pill Container)       |
|  [ Profile ]   [ History ]   [ Leaderboard ]  [ Calendar ] |
+-------------------------------------------------------+
```

### 3.1 Header (`Header.tsx`)
- **Left Button**: `Users` icon in gold (`#C8A679`). Tapping opens **Referral Modal**.
- **Center**: `GuildLogo` (Brand logo SVG, 16px high).
- **Right Button**: `HelpCircleIcon` in gold. Tapping opens **Help Modal ("Як це працює?")**.

### 3.2 Floating Bottom Navigation (`BottomTabs.tsx`)
- **Container**: Floating pill container centered at the bottom (`glass-card-bottom-tabs`, `rounded-full`, `backdrop-blur-xl`).
- **Background Gradient Fade**: Gradient blur mask (`from-guild-bg-bottom via-guild-bg-bottom/70 to-transparent`) behind the nav bar to keep content readable.
- **Tab Items**:
  1. **Profile (`User`)**: Label "Профіль".
  2. **History (`History`)**: Label "Історія".
  3. **Leaderboard (`BarChart3`)**: Label "Топ".
  4. **Calendar (`Calendar`)**: Label "Календар".
- **Active State**: Active icon & text highlighted in orange (`#D47826`). Inactive in muted teal-gray (`#6a7d75`).

---

## 4. Tab Pages Specifications

---

### Tab 1: Profile Page (`ProfileTab.tsx`)

**Purpose**: Primary landing screen showing the adventurer's personal profile, current rank progress, POS QR code, prizes, and active discounts.

```
+-------------------------------------------------------+
| [Avatar 🐱]  Привіт, Іван Іванов!                      |
|              3 Ваншотів  •  12 Квестів                |
+-------------------------------------------------------+
| [ Змінити профіль ]         [ Налаштування ]           |
+-------------------------------------------------------+
| LEVEL PROGRESS CARD                                   |
| РІВЕНЬ                           85%                  |
| [ Current Badge: Шукач Пригод ]                        |
| [============= Progress Bar Track =============]       |
|  Учень           1,450 / 2,000 досвіду       Майстер  |
+-------------------------------------------------------+
| [v] QR код для нарахування (Collapsible)              |
|     [ QrCodeDisplay ]                                 |
|     "Проскануйте код в адміністратора..."            |
+-------------------------------------------------------+
| [v] Призи (Collapsible)                               |
|     "На вас чекає 2 винагороди!"                       |
|     • Рівень 2: Знижка 10% на напої                   |
|     • Рівень 3: Фірмовий кубик d20                   |
+-------------------------------------------------------+
| [v] Знижки (Collapsible)                              |
|     "3 знижки доступно"                               |
|     • Промокод 'DRAGON2026'                           |
+-------------------------------------------------------+
```

#### Structural Elements & Components:
1. **User Header Block**:
   - **Avatar**: 56x56px circular frame with gold border (`border-guild-gold/30`). Shows `photoUrl` or fallback emoji (`🐱`).
   - **Greeting**: Bold text `Привіт, {firstName} {lastName}!`.
   - **Stats Chips**: Shows game statistics (`N Ваншотів`, `M Квестів`) or "Немає активностей".
2. **Quick Actions Grid (2 Columns)**:
   - **Edit Profile Button**: Icon `UserPen` + text "Змінити профіль". Opens `EditProfileModal`.
   - **Settings Button**: Icon `Settings` + text "Налаштування". Opens `SettingsModal`.
3. **Level Progress Card (Interactive Bento Card)**:
   - Tapping entire card opens the full **Tower Ranks Popover** (`LevelRoadmapPopover`).
   - **Top Row**: Section label "РІВЕНЬ" + Percentage readout (e.g. `85%`).
   - **Floating Animated Badge**: Dynamic pill badge (`Badge`) displaying current level name (e.g., "Шукач Пригод"), dynamically clamped over the progress bar.
   - **Progress Bar Track**: Rounded gradient bar (`from-guild-orange to-guild-red`).
   - **Bottom Labels**: Previous level name (left), experience counter (`1,450 / 2,000 досвіду` or "Максимальний рівень досягнуто! 🎉"), Next level name (right).
4. **Collapsible POS QR Code Card**:
   - **Header**: Icon `QR Code` in gold box + title "QR код для нарахування" + animated dropdown chevron.
   - **Expanded View**: Renders QR Code (`QrCodeDisplay` 180x180px) containing the member's unique code + helper text: *"Проскануйте код в адміністратора для нарахування досвіду"*.
5. **Collapsible Prizes Card**:
   - **Header**: Icon `Trophy` in gold box + title "Призи" + chevron.
   - **Summary Subtitle**: Shows pending count (e.g., *"На вас чекає 2 винагороди!"* or *"Немає незабраних призів"*).
   - **Expanded View**: Grouped by level rank header with gold glowing bullets for each unclaimed reward.
6. **Collapsible Discounts & Promos Card**:
   - **Header**: Icon `Gift` in emerald box + title "Знижки" + chevron.
   - **Summary Subtitle**: e.g., *"3 знижки доступно"*.
   - **Expanded View**: Timeline list with green glowing node indicators, promotion title, description, targets chip (e.g., "На всі товари та послуги"), effect chip (e.g., "-15% знижка"), conditions chip, validity period, and promo code badge (`font-mono`).

---

### Tab 2: Experience History Page (`HistoryTab.tsx`)

**Purpose**: Timeline ledger documenting all earned/spent experience points (XP) with timestamps and categories.

```
+-------------------------------------------------------+
| АРТЕФАКТ ПАМ'ЯТІ                                      |
| Історія досвіду                                       |
| Ваш шлях крізь пригоди та випробування у Вежі.        |
+-------------------------------------------------------+
| BENTO XP SUMMARY                                      |
| [ РІВЕНЬ: Шукач Пригод ]  [ УСЬОГО ДОСВІДУ: 4,850 ]   |
+-------------------------------------------------------+
| Сьогодні                                              |
| [Dice5]  Партія D&D: Прокляття Страда       +150 XP   |
|          18:30 • Сесія НРІ                            |
|                                                       |
| [ShoppingBag] Таверна: Еліксир Здоров'я      +20 XP   |
|               15:10 • Крамниця Вежі                   |
+-------------------------------------------------------+
| Вчора                                                 |
| [Tag]    Привітальний бонус                  +100 XP  |
|          12:00 • Промо-акція                          |
+-------------------------------------------------------+
```

#### Structural Elements & Components:
1. **Hero Header**:
   - Small gold tracking title: `АРТЕФАКТ ПАМ'ЯТІ`.
   - Main Title: `Історія досвіду`.
   - Description: `Ваш шлях крізь пригоди та випробування у Вежі.`.
2. **XP Summary Bento Grid (2 Cards)**:
   - **Card 1**: "РІВЕНЬ" -> Current level rank name in gold text.
   - **Card 2**: "УСЬОГО ЗАРОБЛЕНО ДОСВІДУ" -> Numeric total formatted with Ukrainian spacing (`4 850`).
3. **Timeline Day Groups**:
   - Sticky date section headers ("Сьогодні" in gold, "Вчора", or formatted date e.g., "12 травня").
   - **Entry Cards**:
     - **Category Icon Box**:
       - `Dice5` (Gold) -> TTRPG Session ("Сесія НРІ").
       - `BowArrow` (Light Green) -> Activity ("Активність").
       - `ShoppingBag` (Light Green) -> Tavern Purchase ("Крамниця Вежі").
       - `Tag` (Pure Gold) -> Promotion ("Промо-акція").
       - `Wrench` (Gray) -> Admin Note / Penalty ("Штраф" / "Адмін").
     - **Title & Details**: Item/game name + timestamp (`HH:MM`) + category tag.
     - **XP Delta Badge**: Positive values in green (`+150 досвіду`), negative in red (`-50 досвіду`).
4. **Infinite Scroll Loading**: Scroll observer trigger with gold spinner at bottom.

---

### Tab 3: Leaderboard Page (`TopTab.tsx`)

**Purpose**: Competitive Hall of Fame ranking top adventurers by total experience points.

```
+-------------------------------------------------------+
|                    Таблиця лідерів                    |
|             ЗАЛА СЛАВИ ШУКАЧІВ ПРИГОД                 |
+-------------------------------------------------------+
|                      [Trophy 🏆]                      |
|                      Олександр                        |
|        Артур             [ 1 ]            Марія       |
|        [ 2 ]            5,200 XP          [ 3 ]       |
|       3,800 XP                           3,100 XP     |
|     +----------+       +----------+     +----------+  |
|     |  PODIUM  |       | TALLEST  |     |  PODIUM  |  |
+-------------------------------------------------------+
| 4  [Avatar]  Дмитро            Володар     2,950 XP   |
+-------------------------------------------------------+
| 5  [Avatar]  Ви (Іван)         Шукач       2,450 XP   |  <- Highlighted User Card
+-------------------------------------------------------+
```

#### Structural Elements & Components:
1. **Title Section**:
   - Main Header: `Таблиця лідерів`.
   - Subtitle: `ЗАЛА СЛАВИ ШУКАЧІВ ПРИГОД`.
2. **Top 3 Podium Display (3-Column Isometric Visual Layout)**:
   - **1st Place (Center - Highest Platform)**: Gold `Trophy` icon, top player display name (highlighted gold if current user), tall glass platform (`rgba(40,78,65,0.7)`) with gold background glow (`from-guild-gold/20`), rank number `"1"`, experience score (`5,200 Досвіду`).
   - **2nd Place (Left - Medium Platform)**: Player name, rank number `"2"`, score (`3,800 Досвіду`).
   - **3rd Place (Right - Shorter Platform)**: Player name, rank number `"3"`, score (`3,100 Досвіду`).
3. **Leaderboard Ranks List (Rank 4+)**:
   - **Rank Badge**: Numeric circular badge (`4`, `5`, `6`...).
   - **User Info**: Display name + Level Rank title.
   - **Current User Highlight**: If the card represents the active user, card renders with elevated background (`rgba(40,78,65,0.8)`), gold border outline, and gold text `"Ви (Name)"`.
   - **XP Score**: Right-aligned bold experience readout.

---

### Tab 4: Event Calendar Page (`CalendarTab.tsx`)

**Purpose**: Feature teaser / preview page for upcoming TTRPG game sessions, tournaments, and tavern events.

```
+-------------------------------------------------------+
|                 [ Glowing Glass Card ]                |
|                    [ Calendar 📅 ]                    |
|                      (Pulse Dot)                      |
|                                                       |
|                     [ НЕЗАБАРОМ ]                     |
|                   Календар подій                      |
|    Ми готуємо щось особливе для справжніх шукачів     |
|    пригод. Календар сесій та інших івентів...        |
|                                                       |
|  +--------------------+    +--------------------+     |
|  | [Dice6]            |    | [Sparkles]         |     |
|  | НРІ СЕСІЇ          |    | КВЕСТИ             |     |
|  +--------------------+    +--------------------+     |
+-------------------------------------------------------+
```

#### Structural Elements & Components:
1. **Hero Icon Card**:
   - Ambient gold halo blur backdrop (`bg-guild-gold/10 blur-[60px]`).
   - Large 176x176px glass card holding a glowing `Calendar` icon with pulsing orange indicator dot.
2. **Teaser Header & Subtitle**:
   - Shiny Badge: `НЕЗАБАРОМ` (Coming Soon).
   - Title: `Календар подій`.
   - Description: *"Ми готуємо щось особливе для справжніх шукачів пригод. Календар сесій та інших івентів з'явиться тут дуже скоро!"*.
3. **Ghosted Bento Placeholder Cards (Grayscale / 40% Opacity)**:
   - **Card 1**: Icon `Dice6` + label `НРІ СЕСІЇ`.
   - **Card 2**: Icon `Sparkles` + label `КВЕСТИ`.

---

## 5. Modal Sheets & Popover Specifications

---

### Modal 1: Edit Profile Sheet (`EditProfileModal.tsx`)

**Type**: Bottom Sheet (Slides up from screen bottom with drag handle).

```
+-------------------------------------------------------+
|                      ( Drag Bar )                     |
| Редагувати профіль                                 [X]|
+-------------------------------------------------------+
| [!] Error Banner (Conditional)                        |
|                                                       |
| ІМ'Я (ОБОВ'ЯЗКОВО)                                    |
| [ Input: Іван                                       ] |
|                                                       |
| ПРІЗВИЩЕ                                              |
| [ Input: Іванов                                     ] |
|                                                       |
| ПСЕВДОНІМ                                             |
| [ Input: DragonSlayer99                             ] |
|                                                       |
| ДАТА НАРОДЖЕННЯ                                       |
| [ Input: 15.08.1995                         [📅]   ] |
| [!] Дату народження можна змінити лише один раз...   |
+-------------------------------------------------------+
| [                     ЗБЕРЕГТИ                      ] |
| [                    Скасувати                      ] |
+-------------------------------------------------------+
```

#### Key Elements:
- **Title**: `Редагувати профіль` + Close `X` button.
- **Form Inputs**:
  1. **First Name** (`firstName`): Required text input (max 32 chars).
  2. **Last Name** (`lastName`): Optional text input.
  3. **Nickname** (`nickname`): Optional display name for leaderboard anonymity override.
  4. **Birth Date** (`birthDate`): Text input with `DD.MM.YYYY` formatting + popover calendar trigger button (`ShadcnCalendar` date picker).
  5. **Warning Note**: Gold callout box stating *"Дату народження можна змінити лише один раз на рік. В іншому випадку зверніться до адміністратора."*.
- **Action Buttons**:
  - Primary Gold Gradient Button: `"Зберегти"` (shows `Loader2` spinner when saving).
  - Secondary Text Button: `"Скасувати"`.

---

### Modal 2: Settings Sheet (`SettingsModal.tsx`)

**Type**: Bottom Sheet (Slides up from screen bottom).

```
+-------------------------------------------------------+
|                      ( Drag Bar )                     |
| Налаштування                                       [X]|
+-------------------------------------------------------+
| [Bell]  Дозволити сповіщення                 (TOGGLE) |
|         Отримуйте сповіщення про новий досвід...      |
+-------------------------------------------------------+
| [Eye]   Показувати моє ім'я в таблиці        (TOGGLE) |
|         За замовчуванням ви анонімні...               |
+-------------------------------------------------------+
```

#### Key Elements:
- **Title**: `Налаштування` + Close `X` button.
- **Settings Toggle Cards**:
  1. **Notifications Switch**:
     - Icon: `Bell` (gold fill when ON, `BellOff` gray when OFF).
     - Title: `Дозволити сповіщення`.
     - Subtitle: `Отримуйте сповіщення про новий досвід та важливі події у Вежі.`.
     - Toggle Control: Custom smooth slide switch.
  2. **Leaderboard Privacy Switch**:
     - Icon: `Eye` (teal fill when ON, `EyeOff` gray when OFF).
     - Title: `Показувати моє ім'я в таблиці лідерів`.
     - Subtitle: `За замовчуванням ви анонімні. Увімкніть, щоб відображати ваше реальне ім'я іншим учасникам.`.

---

### Modal 3: Referral Sheet (`ReferralModal.tsx`)

**Type**: Bottom Sheet (Slides up from screen bottom).

```
+-------------------------------------------------------+
|                      ( Drag Bar )                     |
|                                                    [X]|
|                   Запросити друзів                    |
|     Ви можете запросити приєднатися своїх друзів...   |
+-------------------------------------------------------+
|               [ Glowing QR Code Box ]                 |
|                   [ QrCodeDisplay ]                   |
+-------------------------------------------------------+
| 📜 Правила отримання додаткових балів                 |
|    • Коли ваш друг досягає рівня «Шукач Пригод»,      |
|      ви обоє отримуєте 100 досвіду                    |
+-------------------------------------------------------+
| ВАШЕ УНІКАЛЬНЕ ПОСИЛАННЯ                              |
| [ https://t.me/GuildBot?start=usr_123 ] [Копіювати]   |
+-------------------------------------------------------+
| [            ПОДІЛИТИСЯ В TELEGRAM                  ] |
+-------------------------------------------------------+
```

#### Key Elements:
- **Title Block**:
  - Header: `Запросити друзів`.
  - Subtitle: `Ви можете запросити приєднатися своїх друзів і отримати за це додаткові бали досвіду!`.
- **Large QR Code Box**: White QR canvas centered inside a gold glowing backdrop.
- **Dynamic Rules Card**: Glass card with `ScrollText` icon detailing referral milestone rewards (e.g. *"Коли ваш друг досягає рівня «...», ви обоє отримуєте N досвіду"*).
- **Referral Link Field**: Single-line monospaced URL container + one-click copy button (`Копіювати` -> `Скопійовано`).
- **Telegram Share Button**: Gold gradient CTA button with `Send` icon (`"Поділитися в Telegram"`), triggering native `https://t.me/share/url` Telegram dialog.

---

### Modal 4: Help Sheet (`HelpModal.tsx`)

**Type**: Bottom Sheet (Slides up from screen bottom).

```
+-------------------------------------------------------+
|                      ( Drag Bar )                     |
|                                                    [X]|
|                     [ HelpCircle ]                    |
|                    Як це працює?                      |
|       Станьте частиною легенди та отримуйте...        |
+-------------------------------------------------------+
| [Dice5]        Грайте в ігри                          |
|                Беріть участь у партіях D&D...         |
+-------------------------------------------------------+
| [ShoppingBag]  Купуйте в таверні                      |
|                Смакуйте напої та їжу...               |
+-------------------------------------------------------+
| [Star]         Підвищуйте рівень                      |
|                Накопичуйте досвід...                  |
+-------------------------------------------------------+
| [Users]        Запрошуйте друзів                      |
|                Приводьте нових підкорювачів...        |
+-------------------------------------------------------+
|     Якщо у вас є запитання, звертайтеся до адмін...   |
+-------------------------------------------------------+
```

#### Key Elements:
- **Title Block**: Gold halo circle with large `HelpCircle` icon + Title `Як це працює?`.
- **Vertical Step Cards**:
  1. `Dice5` icon -> **Грайте в ігри**: *"Беріть участь у партіях D&D, Daggerheart та інших настільних пригодах."*.
  2. `ShoppingBag` icon -> **Купуйте в таверні**: *"Смакуйте напої та їжу в нашому закладі. Кожне замовлення додає вам досвіду."*.
  3. `Star` icon -> **Підвищуйте рівень**: *"Накопичуйте досвід, щоб розблокувати постійні знижки та унікальні призи Вежі."*.
  4. `Users` icon -> **Запрошуйте друзів**: *"Приводьте нових підкорювачів до Вежі та отримуйте реферальні бонуси."*.
- **Footer Note**: *"Якщо у вас є запитання, звертайтеся до адміністраторів Вежі."*.

---

### Popover 5: Tower Ranks / Level Roadmap (`LevelRoadmapPopover.tsx`)

**Type**: Full-Screen Overlay (Slides over screen with top sticky header).

```
+-------------------------------------------------------+
| [<-] Ранги Вежі                                       |
+-------------------------------------------------------+
| CURRENT LEVEL BENTO CARD                              |
| ПОТОЧНИЙ РІВЕНЬ                   4,850 Досвіду       |
| Шукач Пригод                                          |
| Прогрес до "Майстер"                            65%   |
| [============= Progress Bar Track =============]       |
+-------------------------------------------------------+
| ІЄРАРХІЯ РАНГІВ                            5 Ступенів |
|                                                       |
| (v) [Check]  Учень                      ПРОЙДЕНО      |
|               • Переваги: Доступ до таверни           |
|                                                       |
| (*) [Zap]    Шукач Пригод              ВАШ РІВЕНЬ     |
|               • Переваги: Безкоштовний чай             |
|               • Призи: Набір кубиків                  |
|               • Знижки: -10% на ігри                  |
|                                                       |
| ( ) [Lock]   Майстер                   2,000 ДОСВІДУ  |
|               (Locked / Expandable)                   |
|                                                       |
| ( ) [Lock]   Легенда                   5,000 ДОСВІДУ  |
+-------------------------------------------------------+
```

#### Key Elements:
- **Top Header**: Back arrow button (`ArrowLeft`) + title `Ранги Вежі`.
- **Active Level Overview Card**:
  - Current level title (e.g. `Шукач Пригод`).
  - Total experience points balance readout.
  - Progress bar track to the next rank tier with percentage.
- **Vertical Rank Hierarchy Timeline**:
  - **Completed Levels**: Green checkmark node (`Check`), labeled `ПРОЙДЕНО`.
  - **Current Active Level**: Glowing gold zap node (`Zap`), gold border, labeled `ВАШ РІВЕНЬ`.
  - **Locked Future Levels**: Dark padlock node (`Lock`), labeled `N ДОСВІДУ`.
  - **Interactive Accordion Expansion**: Clicking any level rank expands detailed cards listing:
    - **Sparkles Icon (Переваги)**: List of rank perks/benefits.
    - **Gift / Award Icon (Призи)**: Physical prizes unlocked at this tier.
    - **Tag Icon (Знижки)**: Percentage or fixed discounts attached to this rank.

---

## 6. Recommendations & Prompt Guidance for the Redesign AI

When instructing another AI to create a redesigned visual interface based on this specification, ensure it follows these directions:

1. **Retain All Functionality & Ukrainian Copy**: Do not change any labels, titles, metrics, or input fields. All text must remain in authentic Ukrainian.
2. **Elevate Aesthetics to Premium Fantasy/Tavern Vibe**:
   - Modernize glassmorphic cards with deeper blur, richer border highlights, and dynamic gradients.
   - Upgrade typography with high-contrast hierarchy and subtle parchment/gold text gradients.
   - Add purposeful micro-animations (glowing rank badges, animated progress fills, smooth accordion dropdowns).
3. **Mobile-First Telegram Mini App UX**:
   - Keep touch targets large (minimum 44x44px).
   - Maintain iOS/Android bottom sheet drag handle patterns and safe area padding.
   - Respect bottom navigation bar height to prevent content overlap.
4. **Key Visual Focus Areas for Redesign**:
   - **Level Progress Card & Floating Badge**: Make experience progression feel as satisfying as levelling up in an RPG video game.
   - **Podium in Leaderboard**: Create a dramatic 3D/isometric feel for 1st, 2nd, and 3rd place champions.
   - **Tavern Loyalty & QR Scanner**: Ensure the QR code card feels like a magical guild identity scroll or badge.

---
*Generated automatically from the Guild of Adventurer Loyalty Platform codebase.*
