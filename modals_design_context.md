# Mini App Modals Design Context

This document contains the structural and informational context of four key modals in the Guild of Adventurer Telegram Mini App. It is intended to be used by a UI/UX design agent to redesign and improve these interfaces.

## 1. Referral Modal (`ReferralModal.tsx`)
**Purpose**: Allows users to invite friends by sharing a referral link or QR code, granting bonus XP to both the referrer and the referred user.

**Structural Elements**:
- **Header**: Contains a close button (`X` icon).
- **Title Block**:
  - Title: "Запросити друзів" (Invite friends)
  - Subtitle: "Ви можете запросити приєднатися своїх друзів і отримати за це додаткові бали досвіду!"
- **QR Code Section**: Renders a large QR code containing the user's specific referral link (`https://t.me/GuildAdventurerBot?start={memberId}`).
- **Rules Card (Dynamic)**: A glass-morphism card titled "Правила отримання додаткових балів". It renders a dynamic list of rules explaining the rewards. For example: "When your friend reaches level X, they get Y experience and you get Z experience."
- **Link Display**: At the bottom, displays the raw referral link as selectable mono-spaced text for easy copy-pasting.

## 2. Help Modal (`HelpModal.tsx`)
**Purpose**: Explains the core mechanics of the loyalty platform to new users.

**Structural Elements**:
- **Header**: Close button (`X` icon).
- **Title Block**: 
  - Large Icon: `HelpCircle` 
  - Title: "Як це працює?" (How does it work?)
- **Information Cards List**: A vertical stack of cards explaining the platform features.
  1. **Грайте в ігри** (Icon: `Dice5`): "Беріть участь у сесіях D&D, Pathfinder, Daggerheart, Call of Cthulhu та інших рольових системах, щоб заробляти досвід."
  2. **Купуйте в таверні** (Icon: `ShoppingBag`): "Кожна покупка напою чи їжі додає вам балів досвіду."
  3. **Підвищуйте рівень** (Icon: `Star`): "Заробляйте досвід та піднімайтесь по рівнях від Учня до Легенди. На кожному рівні — нові знижки та призи."
  4. **Запрошуйте друзів** (Icon: `Users`): "Використовуйте реферальну програму, щоб запрошувати друзів та отримувати бонусний досвід."
- **Footer**: A simple text note encouraging users to ask guild administrators if they have questions.

## 3. Edit Profile Modal (`EditProfileModal.tsx`)
**Purpose**: A form for users to update their personal information.
**Style**: Designed as a "bottom sheet" modal (slides up from the bottom) with a drag handle indicator at the top (`rounded-t-3xl`).

**Structural Elements**:
- **Header**: Title "Редагувати профіль" and a Close button.
- **Error Banner**: A conditional banner at the top of the form that displays validation errors (e.g., "Ім'я обов'язкове", "Невірний формат дати").
- **Form Fields** (Vertical Stack):
  1. **Ім'я** (Required, max 32 chars): User's first name.
  2. **Прізвище** (Optional, max 32 chars): User's last name.
  3. **Псевдонім** (Optional, max 32 chars): Nickname to be displayed on the leaderboard in place of the real name.
  4. **Дата народження** (Format: DD.MM.YYYY): Birth date. Includes a critical helper note below: "Дату народження можна змінити лише один раз на рік. В іншому випадку зверніться до адміністратора."
- **Footer Actions**:
  - **Cancel Button**: "Скасувати"
  - **Save Button**: "Зберегти" (Shows a loading spinner "Збереження" while the API call is in flight).

## 4. Settings Modal (`SettingsModal.tsx`)
**Purpose**: Allows users to configure application-wide preferences (notifications and privacy).
**Style**: Designed as a "bottom sheet" modal with a drag handle indicator.

**Structural Elements**:
- **Header**: Title "Налаштування" and a Close button.
- **Loading State**: Displays a spinner if the app is currently fetching the user's settings from the backend.
- **Settings List**: A vertical list of toggleable settings. Each setting has a visual icon, a title, a description, and a custom toggle switch.
  1. **Notifications Toggle**:
     - Icon: `Bell` (Blue if on, gray `BellOff` if off).
     - Title: "Дозволити сповіщення"
     - Description: "Отримуйте сповіщення про новий досвід, підвищення рівня та акції."
  2. **Leaderboard Visibility Toggle**:
     - Icon: `Eye` (Gold if on, gray `EyeOff` if off).
     - Title: "Показувати моє ім'я в таблиці лідерів"
     - Description: "За замовчуванням ви анонімні. Увімкніть, щоб відображати ваше реальне ім'я або встановіть псевдонім в налаштуваннях профілю (він буде показаний замість імені)."
