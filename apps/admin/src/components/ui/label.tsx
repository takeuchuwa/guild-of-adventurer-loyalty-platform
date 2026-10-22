import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "flex items-center gap-2 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
  {
    variants: {
      variant: {
        /**
         * Field label. Body face at reading size — a form is a column of
         * questions, and questions are language, not data. The gold mono
         * overline is kept for section markers only (see `overline`), because a
         * stack of eight tracked-out mono labels is unreadable and spends the
         * accent on every line at once.
         */
        field: "text-[13.5px] font-semibold leading-none text-foreground/85 [&>span]:ml-0.5",
        /** Sits beside a checkbox / toggle — reads as body copy. */
        inline: "text-[13.5px] font-medium leading-none text-foreground/75",
        /** Groups fields under a marker. Matches `Overline` in ui/typography. */
        overline:
          "font-heading text-[11px] font-semibold uppercase leading-none tracking-[.16em] text-primary [&>span]:tracking-normal",
      },
    },
    defaultVariants: {
      variant: "field",
    },
  }
)

function Label({
  className,
  variant,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(labelVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Label, labelVariants }
