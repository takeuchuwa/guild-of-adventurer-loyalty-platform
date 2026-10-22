interface IconProps {
  className?: string
}

// Person glyph: circle head + shoulders arc, built from primitives per the brand icon system.
export function ProfileIcon({ className = "" }: IconProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-0.5 ${className}`} style={{ width: 22, height: 22 }}>
      <div style={{ width: 9, height: 9, borderRadius: "50%", border: "2px solid currentColor", boxSizing: "border-box" }} />
      <div style={{ width: 18, height: 8, border: "2px solid currentColor", borderBottom: "none", boxSizing: "border-box" }} />
    </div>
  )
}
