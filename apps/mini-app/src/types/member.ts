import type { Member } from "@/data/member"

export type { Member }

export interface MemberContextState {
  member: Member | null
  isLoading: boolean
  error: string | null
  refreshMember: () => Promise<void>
}
