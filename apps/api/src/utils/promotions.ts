import { inArray } from "drizzle-orm"
import { products, activities, categories } from "@loyalty/db/schema"

export async function fetchPromoTargetNames(db: any, promos: any[]): Promise<Map<string, string>> {
    const pIds = new Set<string>()
    const aIds = new Set<string>()
    const cIds = new Set<string>()

    for (const p of promos) {
        let config: any = {}
        if (typeof p.config === 'string') {
            try { config = JSON.parse(p.config) } catch (e) { }
        } else if (p.config) {
            config = p.config
        }

        const targets = config?.targets;
        if (targets) {
            if (targets.products) targets.products.forEach((id: string) => pIds.add(id))
            if (targets.activities) targets.activities.forEach((id: string) => aIds.add(id))
            if (targets.categories) targets.categories.forEach((id: string) => cIds.add(id))
        }
    }

    const [pRes, aRes, cRes] = await db.batch([
        pIds.size > 0 ? db.select({ id: products.productId, name: products.name }).from(products).where(inArray(products.productId, Array.from(pIds))) : db.select({ id: products.productId, name: products.name }).from(products).limit(0),
        aIds.size > 0 ? db.select({ id: activities.activityId, name: activities.name }).from(activities).where(inArray(activities.activityId, Array.from(aIds))) : db.select({ id: activities.activityId, name: activities.name }).from(activities).limit(0),
        cIds.size > 0 ? db.select({ id: categories.categoryId, name: categories.name }).from(categories).where(inArray(categories.categoryId, Array.from(cIds))) : db.select({ id: categories.categoryId, name: categories.name }).from(categories).limit(0),
    ])

    const namesMap = new Map<string, string>()
    pRes.forEach((r: any) => namesMap.set(r.id, r.name))
    aRes.forEach((r: any) => namesMap.set(r.id, r.name))
    cRes.forEach((r: any) => namesMap.set(r.id, r.name))

    return namesMap
}

export function filterValidPromosForMember(promos: any[], member: any | null, memberUsages: Record<string, number[]> = {}): any[] {
    const nowSeconds = Math.floor(Date.now() / 1000);
    return promos.filter(p => {
        let config: any = {}
        if (typeof p.config === 'string') {
            try { config = JSON.parse(p.config) } catch (e) { }
        } else if (p.config) {
            config = p.config
        }
        if (config?.conditions?.memberConditions?.member_is_new !== undefined) {
            if (!member || !member.joinedAt) return false;
            const daysLimit = config.conditions.memberConditions.member_is_new;
            const daysSinceJoin = (nowSeconds - member.joinedAt) / (60 * 60 * 24);
            if (daysSinceJoin > daysLimit) return false;
        }

        if (config?.conditions?.memberConditions?.member_is_birthday !== undefined) {
            if (!member || !member.birthDate) return false;

            const windowDays = config.conditions.memberConditions.member_is_birthday;
            const now = new Date();
            const bday = new Date(member.birthDate * 1000);

            const currentYearBday = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());

            const diffTime = Math.abs(now.getTime() - currentYearBday.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > windowDays) {
                return false;
            }
        }

        if (config?.conditions?.memberConditions?.max_usage_per_member !== undefined) {
            if (!member) return false;
            const limits = config.conditions.memberConditions.max_usage_per_member;
            const maxUsage = limits.limit || 1;
            const period = limits.period || "global";

            const allUsages = memberUsages[p.promoId] || [];

            const SECONDS_IN_MONTH = 30 * 24 * 60 * 60;
            const SECONDS_IN_YEAR = 365 * 24 * 60 * 60;

            let currentUsage = 0;
            if (period === "global") {
                currentUsage = allUsages.length;
            } else if (period === "year") {
                currentUsage = allUsages.filter((u: number) => nowSeconds - u <= SECONDS_IN_YEAR).length;
            } else if (period === "month") {
                currentUsage = allUsages.filter((u: number) => nowSeconds - u <= SECONDS_IN_MONTH).length;
            }

            if (currentUsage >= maxUsage) {
                return false;
            }
        }
        return true;
    })
}
