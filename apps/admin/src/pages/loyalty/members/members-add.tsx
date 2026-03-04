import {Layout} from "@/components/layout/layout.tsx";

export default function MembersAddPage() {

    return (
        <Layout
            breadcrumbs={[
                {label: "Авантюристи", path: "/members"},
                {label: "Додати авантюриста", path: "/members/create"}
            ]}
        >
            <div></div>
        </Layout>
    )
}
