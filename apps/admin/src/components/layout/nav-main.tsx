import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar.tsx"
import React from "react";
import {Link} from "react-router-dom";

export function NavMain({
                            items,
                        }: {
    items: {
        title: string
        url?: string
        items?: {
            title: string
            url: string
            icon: () => React.ReactNode
            isActive?: boolean
            disable?: boolean
        }[]
    }[]
}) {
    return (
        <SidebarGroup >
            {items.map((item) => (
                <SidebarGroup key={item.title}>
                    <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {item.items?.map((item) => {
                                const content = (
                                    <SidebarMenuItem key={item.title} className="ml-2">
                                        <SidebarMenuButton
                                            className={
                                                !item.disable
                                                    ? "cursor-pointer"
                                                    : "cursor-not-allowed text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                                            }
                                            isActive={item.isActive}
                                        >
                                            {item.icon && <item.icon />}
                                            {item.title}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )

                                return item.disable ? content : <Link key={item.title} to={item.url}>{content}</Link>
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))
            }
        </SidebarGroup>
    )
}
