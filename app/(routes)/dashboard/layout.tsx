"use client"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/app/(routes)/dashboard/_components/common/AppSidebar.tsx";
import AppHeader from "@/app/(routes)/dashboard/_components/common/AppHeader.tsx";


export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <div className="mesh-gradient" />
            <AppSidebar />
            <div className="relative w-full flex flex-col h-screen overflow-hidden">
                <div className="glass-panel m-4 mb-0 rounded-xl p-2 z-10">
                    <AppHeader />
                </div>
                <main className="flex-1 overflow-auto p-4 z-10">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    )
}