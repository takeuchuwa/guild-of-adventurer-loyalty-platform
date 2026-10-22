import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Square, hairline, never wraps. Oswald because badge copy is words («Активний»,
  // «Немає»); add `font-mono` at the call site when the badge carries a number.
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden border px-2 py-[3.5px] font-heading text-[11px] font-semibold uppercase tracking-[.1em] whitespace-nowrap transition-colors [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "border-[rgba(201,158,58,.45)] bg-transparent text-accent-bright",
        secondary: "border-[rgba(237,230,216,.18)] bg-transparent text-foreground/60",
        destructive: "border-[rgba(126,43,33,.7)] bg-transparent text-destructive",
        outline: "border-[rgba(237,230,216,.2)] bg-transparent text-foreground",
        /** The single filled marker — use at most once per screen. */
        solid: "border-primary bg-primary text-primary-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
