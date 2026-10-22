import React from "react"
import { Link, useLocation } from "react-router-dom"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { AppSidebar } from "@/components/layout/app-sidebar.tsx"

interface LayoutProps {
    children: React.ReactNode
    breadcrumbs?: Array<{ label: string; path: string }>
}

export function Layout({ children, breadcrumbs = [] }: LayoutProps) {
    const location = useLocation()

    return (
        <SidebarProvider className="overflow-hidden">
            <AppSidebar />
            {/*
                min-w-0: as a flex item the inset defaults to min-width:auto, so a
                wide table would stretch it past the viewport and clip the toolbar
                instead of letting the table scroll inside its own container.
            */}
            <SidebarInset className="min-w-0">
                <header className="flex h-[60px] shrink-0 items-center gap-3 border-b border-[rgba(201,158,58,.14)] px-7">
                    <SidebarTrigger className="-ml-1 text-foreground/50 hover:text-foreground" />
                    <Separator orientation="vertical" className="mr-1 h-4 bg-[rgba(201,158,58,.2)]" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink asChild>
                                    <Link to="/">Головна</Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.path}>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem className="hidden md:block">
                                        {index === breadcrumbs.length - 1 && location.pathname === crumb.path ? (
                                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild>
                                                <Link to={crumb.path}>{crumb.label}</Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <main className="min-w-0 flex-1">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    )
}
