/**
 * Every donation ledger note starts with this prefix — history views (admin ledger,
 * mini-app) detect donations by it, so it must never change without a data migration.
 */
export const DONATION_PREFIX = "Донат: "

export const DEFAULT_DONATION_POINTS_PERCENT = 10

export function donationName(label: string): string {
    return `${DONATION_PREFIX}${label}`
}

export function donationPoints(amount: number, pointsPercent: number): number {
    return Math.floor((amount * pointsPercent) / 100)
}
