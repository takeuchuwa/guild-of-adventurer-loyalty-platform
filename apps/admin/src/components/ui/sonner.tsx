import { Toaster as Sonner, type ToasterProps } from "sonner"

/** Square plate on #141210 with a 2px gold left edge; Кров for errors. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--hairline)",
          "--border-radius": "0px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "!rounded-none !border !border-l-2 !border-[rgba(201,158,58,.22)] !border-l-primary !bg-surface !text-foreground !shadow-none font-sans",
          title: "!text-[14.5px] !font-semibold",
          description: "!text-[13px] !text-foreground/60",
          error: "!border-l-blood !border-[rgba(126,43,33,.4)]",
          actionButton: "!rounded-none !bg-primary !text-primary-foreground",
          cancelButton: "!rounded-none !bg-transparent !text-foreground/60",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
