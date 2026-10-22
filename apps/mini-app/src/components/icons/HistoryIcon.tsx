interface IconProps {
  className?: string
}

// Clock face glyph: circle + hour/minute hands, built from primitives per the brand icon system.
export function HistoryIcon({ className = "" }: IconProps) {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width: 22, height: 22 }}>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "2px solid currentColor",
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: "50%", top: 4, width: 2, height: 6, background: "currentColor" }} />
        <div style={{ position: "absolute", left: "50%", top: 9, width: 5, height: 2, background: "currentColor" }} />
      </div>
    </div>
  )
}
