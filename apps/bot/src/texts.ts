// Helper function to create a visual progress bar
function createProgressBar(progress: number, total: number, barLength = 10): string {
    const percentage = Math.min(Math.max(progress / total, 0), 1) // Clamp between 0 and 1
    const filledLength = Math.round(percentage * barLength)
    const emptyLength = barLength - filledLength

    const filledChar = "◽️" // White filled squares (progress)
    const emptyChar = "◼️" // Black/dark empty squares (remaining)

    const bar = filledChar.repeat(filledLength) + emptyChar.repeat(emptyLength)
    const percentageText = Math.round(percentage * 100)

    return `${bar} ${percentageText}%`
}

// Helper function for Ukrainian pluralization of "бал"
function getPluralForm(count: number): string {
    const lastDigit = count % 10
    const lastTwoDigits = count % 100

    return "досвіду"
}

// Helper function to format date in Ukrainian locale
function formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000) // Convert from epoch seconds to milliseconds
    return date.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

// Helper function to get reason text for points history (by names)
function getReasonText(entry: {
    activity?: { name: string | null; hasGame?: boolean } | null
    product?: { name: string | null } | null
    adminNote?: string | null
}): string {
    if (entry.activity) {
        const name = (entry.activity.name ?? "(без назви)").replace(/_/g, "\\_")
        const emoji = entry.activity.hasGame ? "🎲" : "🎯"
        const label = entry.activity.hasGame ? "Гра" : "Активність"
        return `${emoji} ${label}: ${name}`
    }
    if (entry.product) {
        const name = (entry.product.name ?? "(без назви)").replace(/_/g, "\\_")
        return `🛍️ Купівля: ${name}`
    }
    if (entry.adminNote) {
        const escapedNote = entry.adminNote.replace(/_/g, "\\_")
        return `⚙️ Адмін: ${escapedNote}`
    }
    return "📝 Не вказано"
}

function escapeMd(text: string): string {
    return text.replace(/_/g, "\\_")
}

export const texts = {
    loyalty_details_button: "🏅 Деталі програми лояльності",
    loyalty_details_intro:
        "🏅 Програма лояльності\n\nУ нашій гільдії ви піднімаєтеся по рівнях, заробляючи досвід. Досвід нараховується за участь в іграх та різних активностей, а також купівлю товарів та запрошення друзів. Деталі про запрошення друзів дивіться у розділі «🔗 Реферальна програма».\n\nДосягаючи нових рівнів, ви отримуєте різні бенефіти, наприклад знижки. На деяких рівнях у таверні можна отримати призи.\n\nВи можете переглянути бенефіти рівнів — оберіть рівень нижче, щоб побачити деталі.",
    level_details_title: (name: string) => `🏅 Рівень: *${name}*`,
    level_prizes: (items: Array<{ name: string | null; description?: string | null }>) => {
        const list = items || []
        const lines: string[] = []

        if (list.length === 0) {
            return "";
        }
        lines.push("🎁 *Призи:*\n")
        for (const it of list) {
            const name = escapeMd(it.name || "(без назви)")
            const desc = it.description ? ` — ${escapeMd(it.description)}` : ""
            lines.push(`• ${name}${desc}`)
        }
        return lines.join("\n")
    },
    claimable_prizes_notice: (count: number) => {
        if (count <= 0) return ""
        if (count === 1) return "🏆 Ви можете забрати приз за свій рівень у таверні!\n"
        return `🏆 Ви можете забрати ${count} призи(ів) за свій рівень у таверні!`
    },
    welcome: "Вітаємо вас в гільдії. Щоб зареєструватись, будь ласка натисніть кнопку нижче, щоб поділитись контактом",
    ask_contact_button: "📱Зареєструватись (поділитись контактом)",
    my_level_button: "📊 Мій рівень",
    points_history_button: "📜 Історія досвіду",
    ref_button: "🔗 Реферальна програма",
    your_ref_link: "🔗 Ваше реферальне посилання:",
    no_referral_rules: "ℹ️ Наразі немає активних правил реферальної програми.",
    please_register_first: "Будь ласка, спочатку зареєструйтесь — натисніть кнопку, щоб поділитися контактом.",
    help_button: "❓ Допомога",
    already_registered: "Ви вже зареєстровані. Тепер ви можете користуватись ботом.",
    registered_ok: "✅ Зареєстровано! Тепер ви можете перевірити свій досвід та рівень.",
    contact_only_self: "Будь ласка, використовуйте кнопку, щоб поділитись своїм номером телефону.",
    error_generic: "Вибачте, сталась помилка. Будь ласка, спробуйте пізніше.",
    not_registered: "❌ Ви ще не зареєстровані. Будь ласка, натисніть Старт та поділіться своїм контактом.",
    level_not_found: "⚠️ Не вдалося знайти визначення вашого рівня. Будь ласка, зверніться до адміністратора.",
    points_history_empty: "📜 Історія досвіду порожня. Почніть отримувати досвід, граючи в ігри та купуючи товари!",
    help_text:
        `❓ *Допомога по боту гільдії*\n\n` +
        `*Доступні команди:*\n` +
        `/start - Почати роботу з ботом\n` +
        `/level - Перевірити свій рівень та досвід\n` +
        `/history - Переглянути історію досвіду\n` +
        `/loyalty - Деталі програми лояльності\n` +
        `/ref - Отримати персональну реферальну лінку\n` +
        `/help - Показати це повідомлення\n\n` +
        `*Як користуватися:*\n` +
        `1. Натисніть /start для реєстрації\n` +
        `2. Поділіться своїм контактом\n` +
        `3. Використовуйте /level щоб перевірити прогрес (або кнопку «📊 Мій рівень» в меню)\n` +
        `4. Використовуйте /history щоб побачити історію нарахування досвіду (або кнопку «📜 Історія досвіду» в меню)\n` +
        `5. Відкрийте /loyalty щоб переглянути опис програми, рівні, знижки, бенефіти й призи (або кнопку «🏅 Деталі програми лояльності» в меню)\n` +
        `6. Надішліть /ref щоб запросити друзів (або кнопку «🔗 Реферальна програма» в меню)\n` +
        `7. Якщо щось незрозуміло — відкрийте /help (або кнопку «❓ Допомога» в меню)\n\n` +
        `*Питання?* Звертайтеся до адміністраторів гільдії! 🎲`,

    points_history: (
        entries: Array<{
            delta: number
            balanceAfter: number
            occurredAt: number
            activity?: { name: string | null; hasGame?: boolean } | null
            product?: { name: string | null } | null
            adminNote?: string | null
        }>,
        page?: number,
        pageCount?: number,
    ) => {
        if (entries.length === 0) {
            return texts.points_history_empty
        }

        const header =
            page && pageCount
                ? `📜 *Історія вашого досвіду* (стор. ${page}/${pageCount}):\n\n`
                : "📜 *Історія вашого досвіду:*\n\n"
        let historyText = header

        entries.forEach((entry, index) => {
            const date = formatDate(entry.occurredAt)
            const deltaText = entry.delta > 0 ? `+${entry.delta}` : `${entry.delta}`
            const deltaEmoji = entry.delta > 0 ? "🟢" : "🔴"
            const pointsForm = getPluralForm(Math.abs(entry.delta))
            const balanceForm = getPluralForm(entry.balanceAfter)
            const reason = getReasonText(entry)

            historyText += `${deltaEmoji} ${deltaText} ${pointsForm}\n`
            historyText += `📅 ${date}\n`
            historyText += `${reason}\n`

            if (index < entries.length - 1) {
                historyText += "\n━━━━━━━━━━━━━━━\n\n"
            }
        })

        return historyText
    },

    level_progress: (
        levelName: string,
        points: number,
        progress: number,
        needed: number,
        nextName: string,
        remaining: number,
    ) => {
        const progressBar = createProgressBar(progress, needed)
        const pointsForm = getPluralForm(points)
        const neededForm = getPluralForm(needed)
        const remainingForm = getPluralForm(remaining)

        return (
            `📊 Прогрес вашого рівня:\n\n` +
            `🏆 Поточний рівень: *${levelName}*\n` +
            `🎯 Прогрес до наступного рівня *${nextName}*:\n` +
            `${progressBar}\n` +
            `${progress}/${needed} ${neededForm}\n` +
            `⚡ Залишилось до наступного рівня: *${remaining} ${remainingForm}*\n\n` +
            `✨ Загальна кількість заробленого досвіду за всі рівні: ${points}`

        )
    },

    level_max: (levelName: string, points: number) => {
        const pointsForm = getPluralForm(points)
        return (
            `🏆 Ви досягли найвищого рівня: *${levelName}*!\n\n` +
            `✨ Загальна кількість заробленого досвіду: ${points} ${pointsForm}\n` +
            `◽️️◽️◽️◽️◽️◽️◽️◽️◽️◽️ 100%\n\n` +
            `🎉 Вітаємо! Ви - справжній авантюрист! 🎉`
        )
    },

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

    referral_rules: (
        rules: Array<{
            levelId: string;
            levelName?: string | null;
            pointsForReferrer: number;
            pointsForReferred: number
        }>,
    ) => {
        if (!rules || rules.length === 0) {
            return "ℹ️ Наразі немає активних правил реферальної програми."
        }
        const lines: string[] = []
        lines.push("🎁 Правила реферальної програми:\n")
        for (const r of rules) {
            const name = r.levelName || r.levelId
            const a = r.pointsForReferred
            const b = r.pointsForReferrer
            const aForm = getPluralForm(a)
            const bForm = getPluralForm(b)
            if (a === b) {
                lines.push(`• Коли ваш друг досягає рівня «${name}», ви обоє отримуєте по ${a} ${aForm}.`)
            } else {
                lines.push(`• Коли ваш друг досягає рівня «${name}», він отримує ${a} ${aForm}, а ви — ${b} ${bForm}.`)
            }
        }
        return lines.join("\n")
    },

    level_discounts: (level: {
        discountProducts?: number
        discountActivities?: number
        discountGames?: number
        fixedProducts?: boolean
        fixedActivities?: boolean
        fixedGames?: boolean
    }) => {
        const lines: string[] = []
        lines.push("💸 *Знижки:*\n")
        const fmt = (amount?: number, fixed?: boolean) => {
            const a = amount || 0
            if (a <= 0) return null
            return fixed ? `${a}₴` : `${a}%`
        }
        const p = fmt(level.discountProducts, level.fixedProducts)
        const a = fmt(level.discountActivities, level.fixedActivities)
        const g = fmt(level.discountGames, level.fixedGames)

        if (p) lines.push(`• На товари: *${p}*`)
        if (a) lines.push(`• На активності: *${a}*`)
        if (g) lines.push(`• На ігри: *${g}*`)

        if (!p && !a && !g) {
            lines.push("• Знижок немає на цьому рівні.")
        }
        return lines.join("\n")
    },

    level_benefits: (items: Array<{ name: string | null; description?: string | null }>) => {
        const list = items || []
        const lines: string[] = []
        if (list.length === 0) {
            return ""
        }
        lines.push("🎁 *Бенефіти:*\n")
        for (const it of list) {
            const name = escapeMd(it.name || "(без назви)")
            const desc = it.description ? ` — ${escapeMd(it.description)}` : ""
            lines.push(`• ${name}${desc}`)
        }
        return lines.join("\n")
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
