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
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
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
                    title: "Системи",
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
                    title: "Сесії/Активності",
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
                    title: "Авантюристи",
                    icon: () => <UsersIcon />,
                    url: "/members",
                },
                {
                    title: "Рівні",
                    icon: () => <ArrowBigUpIcon />,
                    url: "/levels",
                },
                {
                    title: "Конфігурації",
                    icon: () => <SettingsIcon />,
                    url: "/configs",
                },
                {
                    title: "Завдання (В розробці)",
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
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem className="flex justify-between">
                        <SidebarMenuButton size="lg" asChild>
                            <Link to="/">
                                <div
                                    className="flex w-8 h-22 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                                    <Logo />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">Гільдія авантюристів</span>
                                    <span className="truncate text-xs">Адміністрація</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavCheckout />
            </SidebarFooter>
        </Sidebar>
    )
}
