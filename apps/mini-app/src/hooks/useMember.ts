import { useContext } from "react"
import { MemberContext } from "@/context/MemberContext"
import type { MemberContextState } from "@/types/member"

export function useMember(): MemberContextState {
  const context = useContext(MemberContext)
  if (context === undefined) {
    throw new Error("useMember must be used within a MemberProvider")
  }
  return context
}
