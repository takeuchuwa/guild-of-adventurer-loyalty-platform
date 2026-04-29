import { useContext } from "react"
import { LevelContext } from "../context/LevelContext"

export function useLevels() {
  const context = useContext(LevelContext)
  if (context === undefined) {
    throw new Error("useLevels must be used within a LevelProvider")
  }
  return context
}
