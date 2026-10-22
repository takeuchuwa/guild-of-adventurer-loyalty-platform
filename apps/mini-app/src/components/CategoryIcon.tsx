type Shape = "hex" | "diamond" | "square" | "triangle"

interface CategoryIconProps {
  shape: Shape
  glyph: string
  size?: number
  className?: string
}

// Geometric outline + mono glyph icon system: hexagon = dice/mechanics/XP,
// diamond = place & time, square = conditions/price/discount, triangle = warning/penalty.
export function CategoryIcon({ shape, glyph, size = 38, className = "" }: CategoryIconProps) {
  const cx = size / 2
  const sw = 2
  let form: React.ReactNode

  if (shape === "hex") {
    const r = size * 0.46
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 180) * (60 * i - 90)
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cx + r * Math.sin(a)).toFixed(1)}`
    }).join(" ")
    form = <polygon points={pts} fill="none" stroke="currentColor" strokeWidth={sw} />
  } else if (shape === "diamond") {
    const r = size * 0.46
    form = (
      <polygon
        points={`${cx},${cx - r} ${cx + r},${cx} ${cx},${cx + r} ${cx - r},${cx}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
      />
    )
  } else if (shape === "triangle") {
    const r = size * 0.5
    form = (
      <polygon
        points={`${cx},${cx - r + 3} ${cx + r - 2},${cx + r - 4} ${cx - r + 2},${cx + r - 4}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
      />
    )
  } else {
    const p = size * 0.08
    form = (
      <rect
        x={p}
        y={p}
        width={size - p * 2}
        height={size - p * 2}
        fill="none"
        stroke="currentColor"
        strokeWidth={sw}
      />
    )
  }

  const dy = shape === "triangle" ? size * 0.1 : 0
  const fontSize = Math.round(size * (glyph.length > 2 ? 0.22 : 0.3))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      {form}
      <text
        x={cx}
        y={cx + dy}
        fill="currentColor"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight={700}
        fontSize={fontSize}
      >
        {glyph}
      </text>
    </svg>
  )
}
