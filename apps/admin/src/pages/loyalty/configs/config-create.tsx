"use client"

import {Layout} from "@/components/layout/layout.tsx"
import {ConfigForm, type ConfigFormValues} from "@/components/configs/config-form"
import {createConfig} from "@/components/configs/api/configs-api"
import {useNavigate} from "react-router-dom"
import {toast} from "sonner"

export default function ConfigCreatePage() {
    const navigate = useNavigate()

    const onSubmit = async (vals: ConfigFormValues) => {
        try {
            await createConfig({
                name: vals.name,
                active: vals.active,
                triggerKey: vals.triggerKey,
                config: vals.config,
            })
            toast.success("Конфігурацію створено")
            navigate("/configs")
        } catch (e: any) {
            console.error(e)
            toast.error(e.message || "Не вдалося створити конфігурацію")
        }
    }

    return (
        <Layout breadcrumbs={[{label: "Автоматизація", path: "/configs"}, {label: "Нова конфігурація", path: "/configs/create"}]}>
            <ConfigForm mode="create" onSubmit={onSubmit} onCancel={() => navigate("/configs")}/>
        </Layout>
    )
}
