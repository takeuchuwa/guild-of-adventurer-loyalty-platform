import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar.tsx"
import React from "react";
import { Link, useLocation } from "react-router-dom";

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
    const { pathname } = useLocation()

    // A section is active for its own route and everything nested under it
    // (/products also lights up on /products/create and /products/:id).
    const isActiveUrl = (url: string) => pathname === url || pathname.startsWith(`${url}/`)

    return (
        <>
            {items.map((group) => (
                <SidebarGroup key={group.title} className="gap-0 px-0 pt-0 pb-[22px] last:pb-0">
                    <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-0.5">
                            {group.items?.map((item) => {
                                const active = !item.disable && isActiveUrl(item.url)

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild={!item.disable}
                                            isActive={active}
                                            aria-disabled={item.disable}
                                            className={
                                                item.disable
                                                    ? "cursor-not-allowed text-foreground/34 hover:bg-transparent hover:text-foreground/34"
                                                    : "cursor-pointer"
                                            }
                                        >
                                            {item.disable ? (
                                                <>
                                                    {item.icon && <item.icon />}
                                                    <span className="truncate">{item.title}</span>
                                                    <span className="ml-auto border border-[rgba(237,230,216,.14)] px-[5px] py-[2px] font-mono text-[9px] tracking-[.14em] text-foreground/30">
                                                        SOON
                                                    </span>
                                                </>
                                            ) : (
                                                <Link to={item.url}>
                                                    {item.icon && <item.icon />}
                                                    <span className="truncate">{item.title}</span>
                                                </Link>
                                            )}
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    )
}
