export function formatDate(timestamp: number | null | undefined): string {
    if (!timestamp || timestamp === -1) return "—"
    const d = new Date(timestamp * 1000)
    return d.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}
