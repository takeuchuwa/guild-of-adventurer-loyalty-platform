interface IconProps {
  className?: string
}

// Three-bars glyph (ranking chart), built from primitives per the brand icon system.
export function TopIcon({ className = "" }: IconProps) {
  return (
    <div
      className={`flex items-end justify-center gap-[3px] box-border ${className}`}
      style={{ width: 22, height: 22, paddingBottom: 2 }}
    >
      <div style={{ width: 4, height: 9, background: "currentColor" }} />
      <div style={{ width: 4, height: 16, background: "currentColor" }} />
      <div style={{ width: 4, height: 12, background: "currentColor" }} />
    </div>
  )
}
