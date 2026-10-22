import * as React from "react"
import {
    ArrowBigUpIcon,
    BadgePercentIcon,
    Calendar1Icon,
    Dice5Icon, DoorClosedIcon, ListCheckIcon,
    ListIcon,
    ScanBarcodeIcon, SettingsIcon,
    // SettingsIcon,
    UsersIcon,
    // WandSparklesIcon
} from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar.tsx"
import Logo from "@/components/logo.tsx";
import { Link } from "react-router-dom";
import { NavCheckout } from "@/components/layout/nav-checkout.tsx";
import { NavMain } from "@/components/layout/nav-main.tsx"

const data = {
    navMain: [
        {
            title: "Класифікація",
            items: [
                {
                    title: "Категорії",
                    icon: () => <ListIcon />,
                    url: "/categories",
                },
                {
                    title: "Кімнати",
                    icon: () => <DoorClosedIcon />,
                    url: "/rooms",
                },
                {
                    title: "Ігрові системи",
                    icon: () => <Dice5Icon />,
                    url: "/games",
                }
            ],
        },
        {
            title: "Клуб",
            items: [
                {
                    title: "Товари",
                    icon: () => <ScanBarcodeIcon />,
                    url: "/products",
                },
                {
                    title: "Активності",
                    icon: () => <Calendar1Icon />,
                    url: "/activities",
                },
                {
                    title: "Промоакції",
                    icon: () => <BadgePercentIcon />,
                    url: "/promotions",
                },
            ],
        },
        {
            title: "Програма лояльності",
            items: [
                {
                    title: "Підкорювачі",
                    icon: () => <UsersIcon />,
                    url: "/members",
                },
                {
                    title: "Рівні лояльності",
                    icon: () => <ArrowBigUpIcon />,
                    url: "/levels",
                },
                {
                    title: "Автоматизація",
                    icon: () => <SettingsIcon />,
                    url: "/configs",
                },
                {
                    title: "Завдання — в розробці",
                    icon: () => <ListCheckIcon />,
                    url: "/",
                    disable: true,
                }
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar {...props}>
            {/*
                A plain Link, not SidebarMenuButton: that primitive forces
                `[&>svg]:size-4` onto its child, which squashed the vertical
                wordmark into a 16px square. This is a brand lockup, not a nav item.
            */}
            <SidebarHeader className="border-sidebar-border gap-0 border-b p-0">
                <Link to="/" className="flex items-center gap-3.5 px-5 py-[18px] transition-opacity hover:opacity-85">
                    <Logo className="text-primary h-[64px] w-auto shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-left">
                        <span className="font-heading text-foreground truncate text-[24px] leading-none font-semibold uppercase tracking-[.1em]">
                            Вежа
                        </span>
                        <span className="font-heading text-primary truncate text-[11px] leading-none font-medium uppercase tracking-[.18em]">
                            Адміністрація
                        </span>
                    </div>
                </Link>
            </SidebarHeader>
            <SidebarContent className="gap-0 py-[18px]">
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter className="border-sidebar-border border-t p-5">
                <NavCheckout />
            </SidebarFooter>
        </Sidebar>
    )
}
