// Helper function for Ukrainian pluralization of "бал"
function getPluralForm(count: number): string {
    return "досвіду"
}

export const texts = {
    ask_contact_button: "📱 Зареєструватись (поділитись контактом)",
    open_mini_app_button: "🌟 Відкрити Гільдію",
    welcome: "Вітаємо вас в гільдії. Щоб зареєструватись, будь ласка натисніть кнопку нижче, щоб поділитись контактом.",
    already_registered: "👋 Вітаємо з поверненням! Ви вже зареєстровані.",
    registered_ok: "✅ Реєстрація успішна! Вітаємо в Гільдії Авантюристів.",
    mini_app_guide: "У нашому міні-додатку ви можете:\n\n👤 Переглядати свій профіль та редагувати його\n📊 Відслідковувати рівень, досвід та історію нарахувань\n🏅 Дізнатися більше про програму лояльності та призи\n🔗 Запрошувати друзів та отримувати бонуси\n⚙️ Керувати налаштуваннями\n\nНатисніть кнопку «🌟 Відкрити Гільдію» нижче, щоб розпочати!",
    contact_only_self: "Будь ласка, використовуйте кнопку, щоб поділитись своїм номером телефону.",
    error_generic: "Вибачте, сталась помилка. Будь ласка, спробуйте пізніше.",
    
    // Notifications
    level_up: (levelNameOrId: string) => {
        return `🎉 Вітаємо! Ви підвищили рівень до «${levelNameOrId}»!`
    },
    referral_referred_bonus: (points: number) => {
        const form = getPluralForm(points)
        return `🎁 Бонус за реферальною програмою: ви отримали ${points} ${form}.`
    },
    referral_referrer: (levelNameOrId: string, points: number) => {
        const form = getPluralForm(points)
        return `🎉 Ваш друг досяг рівня «${levelNameOrId}» — ви отримали ${points} ${form}!`
    },
    checkout_points_earned: (points: number) => {
        const form = getPluralForm(points)

        // Different messages based on points amount for gamification
        if (points >= 100) {
            return `⚔️ *Легендарна нагорода!*\n\n🎯 Ви отримали *${points} ${form}*!\n\n✨ Ваша майстерність зростає з кожним кроком. Так тримати, герою!`
        } else if (points >= 50) {
            return `🔥 *Епічна нагорода!*\n\n🎯 Ви отримали *${points} ${form}*!\n\n💪 Чудова робота! Ви на шляху до величі!`
        } else if (points >= 20) {
            return `⭐ *Чудова нагорода!*\n\n🎯 Ви отримали *${points} ${form}*!\n\n🎲 Продовжуйте в тому ж дусі!`
        } else if (points >= 10) {
            return `✨ *Гарна нагорода!*\n\n🎯 Ви отримали *${points} ${form}*!\n\n🌟 Кожен крок наближає вас до нових висот!`
        } else if (points > 0) {
            return `🎁 *Винагорода отримана!*\n\n🎯 Ви отримали *${points} ${form}*!\n\n📈 Ваш прогрес зростає!`
        } else {
            return `📝 Дякуємо за вашу покупку!`
        }
    },
} as const
