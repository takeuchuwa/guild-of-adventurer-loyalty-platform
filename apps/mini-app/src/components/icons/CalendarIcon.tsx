interface IconProps {
  className?: string
}

// Sheet-with-thick-top glyph (calendar), built from primitives per the brand icon system.
export function CalendarIcon({ className = "" }: IconProps) {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width: 22, height: 22 }}>
      <div
        className="flex items-center justify-center gap-0.5 box-border"
        style={{ width: 20, height: 19, border: "2px solid currentColor", borderTopWidth: 6, paddingTop: 2 }}
      >
        <div style={{ width: 3, height: 3, background: "currentColor" }} />
        <div style={{ width: 3, height: 3, background: "currentColor" }} />
        <div style={{ width: 3, height: 3, background: "currentColor" }} />
      </div>
    </div>
  )
}
