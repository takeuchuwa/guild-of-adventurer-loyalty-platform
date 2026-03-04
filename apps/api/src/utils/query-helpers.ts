import { asc, desc, like, or } from "drizzle-orm"

/** Parse pagination params from URL */
export function parsePagination(url: URL) {
    const cursor = url.searchParams.get("cursor") || null;
    const pageSizeParam = Number.parseInt(url.searchParams.get("pageSize") || "20", 10);
    const includeCount = url.searchParams.get("includeCount") === "true";

    const MAX_PAGE_SIZE = 100;
    const DEFAULT_PAGE_SIZE = 20;

    const pageSize =
        Number.isFinite(pageSizeParam) && pageSizeParam > 0 ? Math.min(pageSizeParam, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;

    return { cursor, pageSize, includeCount };
}

/** Parse sort param like `field,desc` */
export function parseSort(sortParam: string | null, table: Record<string, any>) {
    if (!sortParam) return undefined
    const [field, direction] = sortParam.split(",")
    const column = table[field as keyof typeof table]
    if (!column) return undefined
    return direction === "desc" ? desc(column) : asc(column)
}

/** Generic pagination result builder */
export function buildPagination({
    pageSize,
    hasNextPage,
    nextCursor,
    total,
}: {
    pageSize: number;
    hasNextPage: boolean;
    nextCursor: string | null;
    total?: number;
}) {
    return {
        pageSize,
        hasNextPage,
        nextCursor,
        total,
        pageCount: total !== undefined ? Math.ceil(total / pageSize) : undefined,
    }
}

/** Optional search helper for simple LIKE-based search */
export function buildSearch(
    q: string | null,
    searchableColumns: any[],
) {
    if (!q) return undefined;
    const trimmed = q.trim();
    if (!trimmed) return undefined;
    return or(...searchableColumns.map((col) => like(col, `${trimmed}%`)));
}
