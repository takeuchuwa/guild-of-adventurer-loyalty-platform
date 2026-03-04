export interface System {
    systemId: string;
    name: string;
    description: string;
}

export interface Game {
    gameId: string;
    name: string;
    description: string;
    createdAt: number
    updatedAt: number
    systems: System[];
}
