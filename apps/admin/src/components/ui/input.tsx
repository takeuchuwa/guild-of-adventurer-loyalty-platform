import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-foreground/40 selection:bg-primary selection:text-primary-foreground border-input bg-surface-alt h-[46px] w-full min-w-0 border px-3.5 py-1 text-[15px] transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
          // 1px border + 1px outline = the design's 2px gold focus edge, with no layout shift.
          "focus-visible:border-primary focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-primary",
          "aria-invalid:border-[rgba(126,43,33,.8)] aria-invalid:focus-visible:border-[rgba(126,43,33,.8)] aria-invalid:focus-visible:outline-[rgba(126,43,33,.8)]",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
