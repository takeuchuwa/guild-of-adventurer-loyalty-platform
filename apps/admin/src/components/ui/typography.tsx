import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

/**
 * Section marker — the small tracked-out line above a group of fields or a rail
 * block.
 *
 * Oswald, not mono: these are Ukrainian words, and a condensed display face
 * survives uppercase + wide tracking where a monospace face turns Cyrillic into
 * a picket fence. Mono is reserved for values (see `numeric` below).
 */
export const overlineClass =
    "font-heading text-[11px] font-semibold uppercase leading-none tracking-[.16em] text-primary"

/** Same marker in the muted tone — captions under a value, tower headings. */
export const overlineMutedClass =
    "font-heading text-[11px] font-medium uppercase leading-none tracking-[.14em] text-foreground/45"

export function Overline({ className, children, ...props }: ComponentProps<"div">) {
    return (
        <div className={cn(overlineClass, className)} {...props}>
            {children}
        </div>
    )
}
