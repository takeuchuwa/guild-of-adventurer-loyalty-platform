import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        className={cn(
          "border-input placeholder:text-foreground/40 bg-surface-alt flex field-sizing-content min-h-24 w-full border px-3.5 py-3 text-[14.5px] leading-[1.55] transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-40",
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
Textarea.displayName = "Textarea"

export { Textarea }
