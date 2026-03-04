"use client"

import { useState } from "react"

import type React from "react"

import { useCallback, useEffect, useRef } from "react"
import { DataTable, type DataTableAction } from "@/components/table/data-table"
import type { CustomColumnDef } from "@/types/table"
import type { System } from "@/components/games/systems/types/system"
import { fetchGameSystems } from "@/components/games/systems/api/api"

interface SystemsTableProps {
    gameId: string
    columns: CustomColumnDef<System>[]
    actions?: DataTableAction<System>[]
    onLoadSystemsRef?: React.RefObject<(() => Promise<void>) | null>
}

export function SystemsTable({ gameId, columns, actions = [], onLoadSystemsRef }: SystemsTableProps) {
    const [systems, setSystems] = useState<System[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const loadSystems = useCallback(async () => {
        setIsLoading(true)
        try {
            const fetchedSystems = await fetchGameSystems(gameId)
            setSystems(fetchedSystems)
        } catch (error) {
            console.error("Error loading systems:", error)
            setSystems([])
        } finally {
            setIsLoading(false)
        }
    }, [gameId])

    useEffect(() => {
        loadSystems()
    }, [loadSystems])

    useEffect(() => {
        if (onLoadSystemsRef) {
            onLoadSystemsRef.current = loadSystems
        }
    }, [])

    const loadSystemsRef = useRef(loadSystems)
    useEffect(() => {
        loadSystemsRef.current = loadSystems
        if (onLoadSystemsRef) {
            onLoadSystemsRef.current = loadSystems
        }
    }, [loadSystems, onLoadSystemsRef])

    return (
        <DataTable
            columns={columns}
            data={systems}
            isLoading={isLoading}
            selectionMode="single"
            emptyStateMessage="Системи не знайдено"
            actions={actions}
            rowId="systemId"
        />
    )
}
