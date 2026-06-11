export function pluralUk(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod10 === 1 && mod100 !== 11) return one
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
    return many
}

export function getPromoResumeText(
    config: any,
    levels: { levelId: string; name: string }[] = [],
    levelAssignments: string[] = [],
    memberIds: string[] = []
): string {
    // 1. Effects
    const effects = config?.effects
    const effectParts = []
    if (effects?.price) {
        if (effects.price.type === "percentage") effectParts.push(`знижку ${effects.price.value}%`)
        if (effects.price.type === "fixed") effectParts.push(`знижку ${effects.price.value}₴`)
        if (effects.price.type === "override") effectParts.push(`фіксовану ціну ${effects.price.value}₴`)
    }
    if (effects?.points) {
        if (effects.points.type === "multiplier") effectParts.push(`у ${effects.points.value} разів більше балів`)
        if (effects.points.type === "bonus") effectParts.push(`+${effects.points.value} бонусних балів`)
    }
    if (effects?.inventory) {
        if (effects.inventory.add_free_item) {
            effectParts.push(`безкоштовний товар (ID: ${effects.inventory.add_free_item})`)
        } else if (effects.inventory.itemId) {
            const itemLabel = effects.inventory.itemName || effects.inventory.itemId
            effectParts.push(`безкоштовний елемент "${itemLabel}"`)
        }
    }

    let effectStr = effectParts.length > 0 ? `Дає ${effectParts.join(" та ")}` : ""
    if (!effectStr) return ""

    // 2. Targets
    const targets = config?.targets
    let targetStr = ""
    if (targets?.type === "cart") targetStr = "на весь кошик"
    else if (targets?.type === "items") {
        const itemCount = (targets?.categories?.length || 0) + (targets?.products?.length || 0) + (targets?.activities?.length || 0)
        targetStr = itemCount > 0 ? `на конкретні елементи (${itemCount})` : "на конкретні елементи"
    }
    else if (targets?.type === "entity") {
        const subTypeMap: Record<string, string> = {
            products: "на всі товари",
            sessions: "на всі сесії",
            games: "на всі ігри",
        }
        targetStr = subTypeMap[targets?.entitySubType as string] ?? "на визначені сутності"
    }

    // 3. Conditions list
    const conditions = config?.conditions
    const condList: string[] = []

    if (conditions?.cartConditions?.cart_total !== undefined) {
        condList.push(`сума кошика від ${conditions.cartConditions.cart_total}₴`)
    }
    if (conditions?.cartConditions?.cart_item_count !== undefined) {
        condList.push(`кількість товарів від ${conditions.cartConditions.cart_item_count} шт.`)
    }
    if (conditions?.itemConditions?.contains_category) {
        condList.push("наявність категорій")
    }
    if (conditions?.itemConditions?.contains_product) {
        condList.push("наявність товарів")
    }
    if (conditions?.itemConditions?.contains_activity) {
        condList.push("наявність сесій")
    }
    if (conditions?.memberConditions?.member_is_new !== undefined) {
        condList.push(`новий учасник (до ${conditions.memberConditions.member_is_new} днів)`)
    }
    if (conditions?.memberConditions?.member_is_birthday !== undefined) {
        condList.push(`день народження (+/- ${conditions.memberConditions.member_is_birthday} днів)`)
    }
    if (conditions?.memberConditions?.max_usage_per_member !== undefined) {
        condList.push(`ліміт використання на учасника (${conditions.memberConditions.max_usage_per_member.limit} разів)`)
    }

    if (levelAssignments && levelAssignments.length > 0) {
        const selectedNames = levelAssignments
            .map((id: string) => levels.find(l => l.levelId === id)?.name || id)
            .join(", ")
        condList.push(`тільки для рівнів: ${selectedNames}`)
    }
    if (memberIds && memberIds.length > 0) {
        condList.push(`тільки для обраних учасників (${memberIds.length})`)
    }

    const condStr = condList.length > 0 ? `, за виконання умов: ${condList.join(", ")}` : ", без додаткових умов"

    return `${effectStr} ${targetStr}${condStr}`.trim()
}
