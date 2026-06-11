import { useState, useCallback, useRef, useEffect } from "react";
import type { PaginationState } from "@tanstack/react-table";

export interface CursorPaginationContext {
    hasNextPage: boolean;
    nextCursor: string | null;
    total?: number;
}

export function usePagination(initialSize = 10, storageKey?: string) {
    const [pagination, setPaginationState] = useState<PaginationState>(() => {
        if (storageKey) {
            try {
                const stored = localStorage.getItem(`table-page-size:${storageKey}`);
                if (stored) {
                    const parsed = parseInt(stored, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                        return { pageSize: parsed, pageIndex: 0 };
                    }
                }
            } catch {
                // localStorage unavailable, fall through
            }
        }
        return { pageSize: initialSize, pageIndex: 0 };
    });

    const [context, setContext] = useState<CursorPaginationContext>({
        hasNextPage: false,
        nextCursor: null,
    });

    // Store cursors in a ref to avoid re-render loops.
    // Cursors changing should NOT trigger a re-fetch — only pageIndex changes should.
    const cursorsRef = useRef<(string | null)[]>([null]);

    // Store includeCount in a ref so it doesn't cause re-render loops either.
    // It's set to true by user action, read during fetch, then reset after fetch.
    const includeCountRef = useRef(false);

    // Track previous page size to detect when it changes
    const prevPageSizeRef = useRef<number>(pagination.pageSize);

    // Sync state when storageKey is set/changed (handles late-initialization/dynamic props)
    useEffect(() => {
        if (storageKey) {
            try {
                const stored = localStorage.getItem(`table-page-size:${storageKey}`);
                if (stored) {
                    const parsed = parseInt(stored, 10);
                    if (!isNaN(parsed) && parsed > 0 && parsed !== pagination.pageSize) {
                        setPaginationState((prev) => ({ ...prev, pageSize: parsed, pageIndex: 0 }));
                        prevPageSizeRef.current = parsed;
                    }
                }
            } catch (e) {
                console.error('[usePagination] localStorage read failed:', e);
            }
        }
    }, [storageKey]);

    // Handle side-effects of page size changes (resetting context/cursors, persisting to localStorage)
    useEffect(() => {
        const prevPageSize = prevPageSizeRef.current;
        if (pagination.pageSize !== prevPageSize) {
            prevPageSizeRef.current = pagination.pageSize;

            // Reset cursors and pagination context
            cursorsRef.current = [null];
            setContext((prev) => ({
                ...prev,
                hasNextPage: false,
                nextCursor: null,
            }));

            // Persist the new page size to localStorage
            if (storageKey) {
                try {
                    console.log(`[usePagination] Saving page size ${pagination.pageSize} for key "${storageKey}"`);
                    localStorage.setItem(`table-page-size:${storageKey}`, String(pagination.pageSize));
                } catch (e) {
                    console.error('[usePagination] localStorage write failed:', e);
                }
            }
        }
    }, [pagination.pageSize, storageKey]);

    const onPaginationChange = useCallback((updater: React.SetStateAction<PaginationState>) => {
        setPaginationState((old) => {
            const next = typeof updater === "function" ? updater(old) : updater;
            if (next.pageSize !== old.pageSize) {
                return { ...next, pageIndex: 0 };
            }
            return { ...next };
        });
    }, []);

    // Returns the cursor for a given page index (read from ref, no re-render)
    const getCursor = useCallback((pageIndex: number): string | undefined => {
        return cursorsRef.current[pageIndex] || undefined;
    }, []);

    // Returns whether includeCount is requested (reads from ref, resets it)
    const getIncludeCount = useCallback((): boolean => {
        const val = includeCountRef.current;
        if (val) {
            includeCountRef.current = false; // auto-reset after reading
        }
        return val;
    }, []);

    // Call this after a successful fetch to update the cursor map and hasNextPage state
    const updatePaginationContext = useCallback((hasNextPage: boolean, nextCursor: string | null, total?: number) => {
        // Update cursors ref (no re-render triggered)
        if (nextCursor && !cursorsRef.current.includes(nextCursor)) {
            cursorsRef.current.push(nextCursor);
        }

        // Update state (triggers re-render for UI like button disabled state)
        setContext((prev) => ({
            ...prev,
            hasNextPage,
            nextCursor,
            total: total !== undefined ? total : prev.total,
        }));
    }, []);

    // Triggers a re-fetch with includeCount=true by bumping pagination state
    const triggerCountFetch = useCallback(() => {
        includeCountRef.current = true;
        // Force re-render by bumping pagination (same values, but new object reference)
        setPaginationState((prev) => ({ ...prev }));
    }, []);

    // Triggers a complete reset of the cursor history, useful when sorting or filters change
    const resetCursors = useCallback(() => {
        cursorsRef.current = [null];
        setContext((prev) => ({
            ...prev,
            hasNextPage: false,
            nextCursor: null,
            total: undefined,
        }));
        setPaginationState((prev) => {
            if (prev.pageIndex === 0) return prev; // Do not trigger re-render if already at 0
            return { ...prev, pageIndex: 0 };
        });
    }, []);

    return {
        pagination,
        onPaginationChange,
        context,
        getCursor,
        getIncludeCount,
        updatePaginationContext,
        triggerCountFetch,
        resetCursors, // Expose reset method
    };
}
