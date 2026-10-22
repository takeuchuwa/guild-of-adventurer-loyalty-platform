/**
 * Mirrors the API's `DONATION_PREFIX`. Every donation ledger note starts with it,
 * which is how history tells a donation apart from a manual admin adjustment.
 */
export const DONATION_PREFIX = "Донат: "

export function isDonationNote(note: string | null | undefined): note is string {
    return !!note && note.startsWith(DONATION_PREFIX)
}
