import type { FormEvent, ReactNode } from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Overline } from "@/components/ui/typography"

interface FormShellProps {
    title: string
    description?: string
    /** Fields. */
    children: ReactNode
    /** Settings and toggles pinned to the sticky right rail. */
    rail?: ReactNode
    /** Primary / secondary / cancel — they live at the bottom of the rail. */
    actions: ReactNode
    onSubmit: (event: FormEvent) => void
}

/**
 * The entity-form template: a content column plus a sticky right rail that
 * carries the settings and the screen's actions. Every create/edit screen uses it.
 */
export function FormShell({ title, description, children, rail, actions, onSubmit }: FormShellProps) {
    return (
        <form onSubmit={onSubmit} className="grid min-h-0 grid-cols-1 xl:grid-cols-[1fr_380px]">
            <div className="flex flex-col gap-[26px] px-8 py-[30px]">
                <div className="flex flex-col gap-2">
                    <h1 className="font-heading text-[36px] leading-none font-bold uppercase tracking-[.03em]">{title}</h1>
                    {description && <p className="text-foreground/60 text-[14.5px]">{description}</p>}
                </div>
                {children}
            </div>

            <div className="bg-surface-alt flex flex-col gap-[26px] border-t border-[rgba(201,158,58,.14)] px-[26px] py-[30px] xl:sticky xl:top-0 xl:h-fit xl:min-h-full xl:border-t-0 xl:border-l">
                {rail}
                <div className="mt-auto flex flex-col gap-2.5 pt-4">{actions}</div>
            </div>
        </form>
    )
}

/** The standard rail footer: one gold submit plus the neutral cancel. */
export function FormActions({
    mode,
    isLoading,
    onCancel,
    submitLabel,
}: {
    mode: "create" | "edit"
    isLoading?: boolean
    onCancel: () => void
    submitLabel?: string
}) {
    return (
        <>
            <Button type="submit" size="lg" className="w-full cursor-pointer" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitLabel ?? (mode === "create" ? "Створити" : "Зберегти")}
            </Button>
            <Button
                type="button"
                size="lg"
                variant="outline"
                className="w-full cursor-pointer"
                onClick={onCancel}
                disabled={isLoading}
            >
                Скасувати
            </Button>
        </>
    )
}

interface FormFieldProps {
    label: string
    htmlFor?: string
    required?: boolean
    error?: string
    /** Muted helper text under the control. */
    hint?: ReactNode
    /** Rendered next to the label — tooltips and the like. */
    labelAdornment?: ReactNode
    className?: string
    children: ReactNode
}

/** Body-face label, the control, then the error or helper line. */
export function FormField({
    label,
    htmlFor,
    required,
    error,
    hint,
    labelAdornment,
    className,
    children,
}: FormFieldProps) {
    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className="flex items-center gap-1.5">
                <Label htmlFor={htmlFor}>
                    {label}
                    {required && <span className="text-destructive">*</span>}
                </Label>
                {labelAdornment}
            </div>
            {children}
            {error ? (
                <p className="text-destructive text-[12.5px]">{error}</p>
            ) : hint ? (
                <p className="text-foreground/45 text-[12.5px]">{hint}</p>
            ) : null}
        </div>
    )
}

/** Square chip for a related entity, with the mono × remover. */
export function Chip({ children, onRemove, disabled }: { children: ReactNode; onRemove?: () => void; disabled?: boolean }) {
    return (
        <span className="flex items-center gap-3 border border-[rgba(201,158,58,.4)] bg-[rgba(201,158,58,.07)] px-3 py-2.5 text-[14px]">
            {children}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={disabled}
                    className="text-foreground/45 cursor-pointer font-mono text-[12px] transition-colors hover:text-destructive disabled:cursor-not-allowed"
                    aria-label="Прибрати"
                >
                    ×
                </button>
            )}
        </span>
    )
}

/** The dashed «+ …» affordance that ends a chip row or a rule stack. */
export function AddChip({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="font-heading text-foreground/60 cursor-pointer border border-dashed border-[rgba(237,230,216,.25)] px-3.5 py-2.5 text-[13px] uppercase tracking-[.1em] transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
            {children}
        </button>
    )
}

/** Label + control row used inside the rail (toggles, checkboxes). */
export function RailRow({ label, children }: { label: ReactNode; children: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-foreground/75 text-[14.5px]">{label}</span>
            {children}
        </div>
    )
}

export function RailSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-3.5">
            <Overline>{title}</Overline>
            {children}
        </div>
    )
}
