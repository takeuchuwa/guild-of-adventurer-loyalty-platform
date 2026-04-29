import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: any
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar w-fit p-3 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(10)]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-1 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "flex items-center justify-center rounded-full hover:bg-white/10 text-guild-gold transition-colors w-8 h-8 select-none aria-disabled:opacity-50 z-10",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "flex items-center justify-center rounded-full hover:bg-white/10 text-guild-gold transition-colors w-8 h-8 select-none aria-disabled:opacity-50 z-10",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center font-bold text-guild-gold tracking-widest uppercase text-sm",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-8 w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 opacity-0 cursor-pointer",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "font-bold select-none text-guild-gold uppercase tracking-widest",
          captionLayout === "label"
            ? "text-sm"
            : "flex items-center gap-1 rounded-full text-[11px] md:text-xs hover:bg-white/5 px-2 py-1 transition-colors [&>svg]:size-3.5 [&>svg]:text-guild-gold/80",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex h-8 items-center", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 text-[0.75rem] font-bold text-guild-text-muted select-none uppercase tracking-wider text-center",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full gap-1", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full p-0 text-center select-none text-base",
          defaultClassNames.day
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-full bg-white/5 after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-white/5",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-full bg-white/5 after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-white/5",
          defaultClassNames.range_end
        ),
        today: cn(
          "rounded-full bg-white/10 text-white font-bold data-[selected=true]:rounded-full",
          defaultClassNames.today
        ),
        outside: cn(
          "text-white/20 aria-selected:text-white/20",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-white/20 opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-5", className)} {...props} />
          }
          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-5", className)} {...props} />
          }
          return <ChevronDownIcon className={cn("size-5", className)} {...props} />
        },
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) items-center justify-center rounded-xl border-0 font-medium hover:bg-white/10 hover:text-white transition-colors group-data-[focused=true]/day:ring-2 group-data-[focused=true]/day:ring-guild-gold/50 data-[selected-single=true]:bg-guild-gold data-[selected-single=true]:text-black data-[selected-single=true]:font-bold data-[selected-single=true]:shadow-lg data-[selected-single=true]:shadow-guild-gold/20",
        defaultClassNames.day,
        className
      )}
      {...props as any}
    />
  )
}

export { Calendar, CalendarDayButton }
