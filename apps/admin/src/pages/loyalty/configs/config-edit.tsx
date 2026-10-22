"use client"

import {Layout} from "@/components/layout/layout.tsx"
import {ConfigForm, type ConfigFormValues} from "@/components/configs/config-form"
import {fetchConfig, updateConfig} from "@/components/configs/api/configs-api"
import {useNavigate, useParams} from "react-router-dom"
import {useEffect, useState} from "react"
import {toast} from "sonner"

export default function ConfigEditPage() {
    const navigate = useNavigate()
    const {id} = useParams()
    const [loading, setLoading] = useState(true)
    const [initial, setInitial] = useState<ConfigFormValues | null>(null)

    useEffect(() => {
        let mounted = true

        async function load() {
            try {
                if (!id) return
                const cfg = await fetchConfig(id)
                const parsed = typeof cfg.config === "object" && cfg.config !== null ? cfg.config : JSON.parse(cfg.configJson || "{}")
                if (mounted) setInitial({
                    name: cfg.name,
                    active: cfg.active,
                    triggerKey: cfg.triggerKey as any,
                    config: parsed,
                })
            } catch (e) {
                console.error(e)
                toast.error("Не вдалося завантажити конфігурацію")
            } finally {
                if (mounted) setLoading(false)
            }
        }

        load()
        return () => {
            mounted = false
        }
    }, [id])

    const onSubmit = async (vals: ConfigFormValues) => {
        try {
            if (!id) return
            await updateConfig(id, {name: vals.name, active: vals.active, config: vals.config})
            toast.success("Зміни збережено")
            navigate("/configs")
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Не вдалося зберегти")
        }
    }

    if (!initial) {
        return null
    }

    return (
        <Layout
            breadcrumbs={[{label: "Автоматизація", path: "/configs"}, {label: initial.name, path: `/configs/${id}`}]}>
            {initial && (
                <ConfigForm mode="edit" initial={initial} disableTrigger onSubmit={onSubmit} onCancel={() => navigate("/configs")}/>
            )}
            {!initial && !loading && <div className="text-muted-foreground p-8">Конфігурацію не знайдено</div>}
        </Layout>
    )
}
