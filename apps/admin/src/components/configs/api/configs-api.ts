import { axiosInstance } from "@/lib/api-utils"

export type LoyaltyTriggerKey =
  | "level_change"
  | "activity_time_slot"
  | "main_system_instruction"
  | `entity_system_instruction:${string}`

export type LevelChangeConfig = {
  targetLevel: string
  pointsForReferrer: number
  pointsForReferred: number
  notifyReferrer: boolean
  notifyReferred: boolean
}

export type ActivityTimeSlotConfig = {
  startHour: string
  endHour: string
}

export type MainSystemInstructionConfig = {
  systemPrompt: string
}

export type EntitySystemInstructionConfig = {
  entity: "promotion" | "activity" | "game" | "system" | "benefit" | "prize"
  systemPrompt: string
  length: number
  outputTokens?: number | null
}

export type LoyaltyConfig = {
  configId: string
  triggerKey: LoyaltyTriggerKey
  active: boolean
  name: string
  configJson: string
  config?: any
  createdAt: number
  updatedAt: number
}

export type LoyaltyConfigCreate = {
  name: string
  active: boolean
  triggerKey: LoyaltyTriggerKey
  config: LevelChangeConfig | ActivityTimeSlotConfig | MainSystemInstructionConfig | EntitySystemInstructionConfig
}

export type LoyaltyConfigUpdate = Partial<Pick<LoyaltyConfigCreate, "name" | "active">> & {
  config?: LevelChangeConfig | ActivityTimeSlotConfig | MainSystemInstructionConfig | EntitySystemInstructionConfig
}

export async function fetchConfigs(params: { pageSize?: number; cursor?: string | null; includeCount?: boolean; q?: string; triggerKey?: LoyaltyTriggerKey; sort?: string } = {}) {
  const response = await axiosInstance.get("/configs", { params })
  if (!response.data?.ok) {
    throw new Error(response.data?.error || "Failed to fetch configs")
  }
  return { data: response.data.data as LoyaltyConfig[], pagination: response.data.pagination as { pageSize: number; hasNextPage: boolean; nextCursor: string | null; total?: number } }
}

export async function fetchConfig(id: string) {
  const response = await axiosInstance.get(`/configs/${id}`)
  if (!response.data?.ok) {
    throw new Error(response.data?.error || "Failed to fetch config")
  }
  return response.data.data as LoyaltyConfig
}

export async function createConfig(input: LoyaltyConfigCreate) {
  const response = await axiosInstance.post("/configs", input)
  if (!response.data?.ok) {
    throw new Error(response.data?.error || "Failed to create config")
  }
  return response.data
}

export async function updateConfig(id: string, input: LoyaltyConfigUpdate) {
  const response = await axiosInstance.put(`/configs/${id}`, input)
  if (!response.data?.ok) {
    throw new Error(response.data?.error || "Failed to update config")
  }
  return response.data
}

export async function deleteConfig(id: string) {
  const response = await axiosInstance.delete(`/configs/${id}`)
  if (!response.data?.ok) {
    throw new Error(response.data?.error || "Failed to delete config")
  }
  return response.data
}
