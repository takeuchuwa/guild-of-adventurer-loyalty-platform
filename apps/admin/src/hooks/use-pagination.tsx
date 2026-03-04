import { useState, useCallback, useRef } from "react";
import type { PaginationState } from "@tanstack/react-table";

export interface CursorPaginationContext {
    hasNextPage: boolean;
    nextCursor: string | null;
    total?: number;
}

export function usePagination(initialSize = 10) {
    const [pagination, setPaginationState] = useState<PaginationState>({
        pageSize: initialSize,
        pageIndex: 0,
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

    const onPaginationChange = useCallback((updater: React.SetStateAction<PaginationState>) => {
        setPaginationState((old) => {
            const next = typeof updater === "function" ? updater(old) : updater;

            // If page size changes, reset everything to the first page
            if (next.pageSize !== old.pageSize) {
                cursorsRef.current = [null];
                setContext((prev) => ({
                    ...prev,
                    hasNextPage: false,
                    nextCursor: null,
                }));
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
