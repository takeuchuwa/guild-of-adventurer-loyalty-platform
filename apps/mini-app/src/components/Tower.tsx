import type { ReactNode } from "react"

export interface TowerFloor {
  id: string
  name: string
  status: "completed" | "current" | "locked"
  minPoints: number
  fillPercent?: number
}

interface TowerProps {
  floors: TowerFloor[]
  compact?: boolean
  selectedId?: string
  onFloorClick?: (id: string) => void
  /** Full mode only: renders the accordion body for the currently selected floor. */
  renderExpanded?: (floor: TowerFloor) => ReactNode
  className?: string
}

const FLOOR_HEIGHT: Record<"compact" | "full", Record<TowerFloor["status"], number>> = {
  compact: { locked: 24, completed: 28, current: 32 },
  full: { locked: 64, completed: 74, current: 104 },
}

export function Tower({ floors, compact = false, selectedId, onFloorClick, renderExpanded, className = "" }: TowerProps) {
  // floors are ordered bottom-up (index 0 = lowest level). Render top-to-bottom
  // in the DOM so the lowest floor lands at the bottom of the flex column.
  const renderFloors = [...floors].reverse()
  const heights = FLOOR_HEIGHT[compact ? "compact" : "full"]
  const nameSize = compact ? "text-sm" : "text-base"
  const labelSize = compact ? "text-[10px]" : "text-[11px]"

  return (
    <div className={`flex flex-col justify-end gap-[3px] ${className}`}>
      {renderFloors.map((floor, i) => {
        // i is distance from the top (DOM/visual order). The tower tapers
        // upward, so width grows the closer a floor is to the bottom.
        const width = Math.min(100, 70 + i * 10)
        const height = heights[floor.status]
        const isSelected = floor.id === selectedId
        const clickable = !!onFloorClick
        const canExpand = !compact && !!renderExpanded
        const isExpanded = canExpand && isSelected
        const handleClick = clickable ? () => onFloorClick!(floor.id) : undefined
        const chevron = canExpand ? (
          <span className="font-mono text-[11px]">{isExpanded ? "−" : "+"}</span>
        ) : null

        let borderClass: string
        let header: ReactNode

        if (floor.status === "current") {
          borderClass = "border-2 border-guild-pure-gold"
          header = (
            <div className="relative overflow-hidden" style={{ height }} onClick={handleClick}>
              <div
                className="absolute inset-x-0 bottom-0"
                style={{
                  height: `${Math.min(100, Math.max(0, floor.fillPercent ?? 0))}%`,
                  background: "var(--color-guild-gold)",
                  transition: "height 0.6s linear",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(201,158,58,.2) 0 2px, transparent 2px 9px)",
                }}
              />
              {!compact && (
                <div className="relative h-full flex items-center justify-between px-3.5">
                  <span className={`font-heading ${nameSize} uppercase tracking-wide text-guild-text`}>
                    {floor.name}
                  </span>
                  <span className={`font-mono ${labelSize} font-bold text-guild-text flex items-center gap-2.5`}>
                    ВИ ТУТ
                    {chevron}
                  </span>
                </div>
              )}
            </div>
          )
        } else if (floor.status === "completed") {
          borderClass = isSelected ? "border-2 border-guild-pure-gold" : "border-2 border-guild-gold"
          header = (
            <div
              className="flex items-center justify-between px-3.5"
              style={{
                height,
                backgroundImage: "repeating-linear-gradient(45deg, rgba(201,158,58,.16) 0 2px, transparent 2px 9px)",
              }}
              onClick={handleClick}
            >
              {!compact && (
                <>
                  <span className={`font-heading ${nameSize} uppercase tracking-wide text-guild-text`}>
                    {floor.name}
                  </span>
                  <span className={`font-mono ${labelSize} tracking-wider text-guild-gold flex items-center gap-2.5`}>
                    ПРОЙДЕНО
                    {chevron}
                  </span>
                </>
              )}
            </div>
          )
        } else {
          borderClass = isSelected ? "border-2 border-guild-text-muted" : "border border-dashed border-guild-text-dim"
          header = (
            <div className="flex items-center justify-between px-3.5" style={{ height }} onClick={handleClick}>
              {!compact && (
                <>
                  <span className={`font-heading ${nameSize} uppercase tracking-wide text-guild-text-dim`}>
                    {floor.name}
                  </span>
                  <span className={`font-mono ${labelSize} text-guild-text-dim flex items-center gap-2.5`}>
                    {floor.minPoints.toLocaleString("uk-UA")} XP
                    {chevron}
                  </span>
                </>
              )}
            </div>
          )
        }

        return (
          <div
            key={floor.id}
            style={{ width: `${width}%`, marginLeft: "auto", marginRight: "auto" }}
            className={`box-border shrink-0 ${borderClass} ${clickable ? "cursor-pointer" : ""}`}
          >
            {header}
            {canExpand && (
              <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
              >
                <div className="overflow-hidden bg-guild-modal-bg">{renderExpanded!(floor)}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
