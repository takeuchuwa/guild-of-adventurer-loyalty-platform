import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Vezha's icon system: geometry, not pictograms. Replaces lucide across the
 * admin. Everything here is CSS boxes/borders or a mono character, drawn in
 * `currentColor` so it inherits the surrounding text colour.
 *
 * Shape coding used by the nav and the promo builder:
 *   square = Класифікація / Умови · diamond = Клуб / Ефекти · circle = Лояльність / Цілі
 */

type ShapeVariant = "square" | "diamond" | "circle"

interface ShapeProps extends React.ComponentProps<"span"> {
    /** Box size in px. */
    size?: number
    /** Border thickness in px. */
    stroke?: number
    /** Solid fill instead of an outline — the active/selected state. */
    filled?: boolean
    variant?: ShapeVariant
}

function Shape({
    size = 14,
    stroke = 2,
    filled = false,
    variant = "square",
    className,
    style,
    ...props
}: ShapeProps) {
    return (
        <span
            aria-hidden="true"
            data-slot="glyph-shape"
            className={cn("block shrink-0 border-current", className)}
            style={{
                width: size,
                height: size,
                borderWidth: stroke,
                borderStyle: "solid",
                backgroundColor: filled ? "currentColor" : "transparent",
                borderRadius: variant === "circle" ? "50%" : 0,
                transform: variant === "diamond" ? "rotate(45deg)" : undefined,
                ...style,
            }}
            {...props}
        />
    )
}

function Square(props: Omit<ShapeProps, "variant">) {
    return <Shape variant="square" {...props} />
}

function Diamond(props: Omit<ShapeProps, "variant">) {
    return <Shape variant="diamond" {...props} />
}

function Circle(props: Omit<ShapeProps, "variant">) {
    return <Shape variant="circle" {...props} />
}

interface TriangleProps extends React.ComponentProps<"span"> {
    size?: number
    direction?: "up" | "down"
}

/** CSS triangle — the warning mark on destructive dialogs. */
function Triangle({ size = 12, direction = "up", className, style, ...props }: TriangleProps) {
    const half = Math.round((size * 7) / 12)
    return (
        <span
            aria-hidden="true"
            data-slot="glyph-triangle"
            className={cn("block shrink-0", className)}
            style={{
                width: 0,
                height: 0,
                borderLeft: `${half}px solid transparent`,
                borderRight: `${half}px solid transparent`,
                ...(direction === "up"
                    ? { borderBottom: `${size}px solid currentColor` }
                    : { borderTop: `${size}px solid currentColor` }),
                ...style,
            }}
            {...props}
        />
    )
}

interface ChevronProps extends React.ComponentProps<"span"> {
    size?: number
    stroke?: number
    direction?: "up" | "down" | "left" | "right"
}

const CHEVRON_ROTATION: Record<NonNullable<ChevronProps["direction"]>, string> = {
    up: "rotate(-135deg)",
    down: "rotate(45deg)",
    left: "rotate(135deg)",
    right: "rotate(-45deg)",
}

/** Two borders of a square, rotated — the sort indicator and pager arrows. */
function Chevron({ size = 7, stroke = 1.5, direction = "down", className, style, ...props }: ChevronProps) {
    return (
        <span
            aria-hidden="true"
            data-slot="glyph-chevron"
            className={cn("block shrink-0 border-current", className)}
            style={{
                width: size,
                height: size,
                borderStyle: "solid",
                borderWidth: 0,
                borderRightWidth: stroke,
                borderBottomWidth: stroke,
                transform: CHEVRON_ROTATION[direction],
                ...style,
            }}
            {...props}
        />
    )
}

interface MarkProps extends React.ComponentProps<"span"> {
    size?: number
}

function monoMark(character: string, slot: string, defaultSize: number) {
    return function Mark({ size = defaultSize, className, style, ...props }: MarkProps) {
        return (
            <span
                aria-hidden="true"
                data-slot={slot}
                className={cn("inline-flex shrink-0 items-center justify-center font-mono leading-none", className)}
                style={{ fontSize: size, ...style }}
                {...props}
            >
                {character}
            </span>
        )
    }
}

/** Mono characters, exactly as the design draws them. */
const Cross = monoMark("×", "glyph-cross", 13)
const Plus = monoMark("+", "glyph-plus", 13)
const Minus = monoMark("−", "glyph-minus", 13)
const Caret = monoMark("▾", "glyph-caret", 11)
const Check = monoMark("✓", "glyph-check", 11)
const ArrowLeft = monoMark("‹", "glyph-arrow-left", 15)
const ArrowRight = monoMark("›", "glyph-arrow-right", 15)

/** Square that pulses while work is in flight — replaces the lucide spinner. */
function Pulse({ size = 12, className, style, ...props }: MarkProps) {
    return (
        <span
            aria-hidden="true"
            data-slot="glyph-pulse"
            className={cn("block shrink-0 animate-pulse bg-current", className)}
            style={{ width: size, height: size, ...style }}
            {...props}
        />
    )
}

export const Glyph = {
    Shape,
    Square,
    Diamond,
    Circle,
    Triangle,
    Chevron,
    Cross,
    Plus,
    Minus,
    Caret,
    Check,
    ArrowLeft,
    ArrowRight,
    Pulse,
}

export {
    Shape,
    Square,
    Diamond,
    Circle,
    Triangle,
    Chevron,
    Cross,
    Plus,
    Minus,
    Caret,
    Check,
    ArrowLeft,
    ArrowRight,
    Pulse,
}
