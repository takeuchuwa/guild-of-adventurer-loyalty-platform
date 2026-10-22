import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        // 42×22 square track — no pill.
        "peer group/switch inline-flex shrink-0 items-center border p-[2px] transition-colors outline-none focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40",
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        "data-[state=unchecked]:bg-transparent data-[state=unchecked]:border-[rgba(237,230,216,.25)]",
        "data-[size=default]:h-[22px] data-[size=default]:w-[42px] data-[size=sm]:h-[18px] data-[size=sm]:w-[32px]",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block ring-0 transition-transform",
          "data-[state=checked]:bg-primary-foreground data-[state=unchecked]:bg-[rgba(237,230,216,.3)]",
          "group-data-[size=default]/switch:size-[18px] group-data-[size=sm]/switch:size-[14px]",
          "data-[state=unchecked]:translate-x-0 group-data-[size=default]/switch:data-[state=checked]:translate-x-[20px] group-data-[size=sm]/switch:data-[state=checked]:translate-x-[14px]"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
