import {Layout} from "@/components/layout/layout.tsx";

export default function SettingsPage() {

    return (
        <Layout breadcrumbs={[
            {label: "Налаштування", path: "/settings"},
        ]}>
            <div></div>
        </Layout>
    )
}
