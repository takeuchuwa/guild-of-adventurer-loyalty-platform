import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-heading text-sm font-semibold uppercase tracking-[.1em] transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary",
    {
        variants: {
            variant: {
                // The one filled gold action per screen.
                default: "bg-primary text-primary-foreground hover:bg-accent-bright",
                // Кров, filled — max one per screen.
                destructive: "bg-blood text-foreground hover:bg-blood/85",
                // Neutral / cancel.
                outline:
                    "border border-[rgba(237,230,216,.2)] bg-transparent text-foreground/80 hover:border-[rgba(237,230,216,.35)] hover:text-foreground",
                destructiveOutline:
                    "border border-[rgba(126,43,33,.7)] bg-transparent text-destructive hover:bg-blood/20 hover:border-[rgba(126,43,33,.9)]",
                // Gold hairline — the secondary action.
                secondary:
                    "border border-[rgba(201,158,58,.45)] bg-transparent text-accent-bright hover:bg-accent hover:border-primary",
                ghost: "text-foreground/70 hover:bg-accent hover:text-foreground",
                ghostOutline: "text-foreground/70 hover:bg-transparent hover:text-primary",
                link: "font-sans normal-case tracking-normal text-primary underline-offset-4 hover:text-accent-bright hover:underline",
            },
            size: {
                default: "h-[42px] px-5 py-2 has-[>svg]:px-4",
                sm: "h-[34px] gap-1.5 px-3.5 text-[13px] has-[>svg]:px-3",
                lg: "h-[46px] px-6 text-[15px] tracking-[.12em] has-[>svg]:px-5",
                icon: "size-[42px]",
                "icon-sm": "size-[34px]",
                "icon-lg": "size-[46px]",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Button = React.forwardRef<
    HTMLButtonElement,
    React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"

    return (
        <Comp
            ref={ref}
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    )
})

Button.displayName = "Button"

export { Button, buttonVariants }
