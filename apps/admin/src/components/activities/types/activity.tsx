import type { Category } from "@/components/categories/types/category-types.tsx"
import type { Game, System } from "@/components/games/types/game.tsx"
import type { Room } from "@/components/rooms/types/room"

export interface Activity {
    activityId: string
    name: string
    description: string | null
    price: number
    overridePoints: number | null
    game: Game | null
    system: System | null
    startDate: number
    endDate: number
    room: Room | null
    categories: Category[]
}
