"use client";

import { Calendar, Home, Inbox, Search, Settings, Stethoscope, LifeBuoy, FileText, User, Bell, LayoutDashboard, CheckCircle, ShieldCheck, ChevronRight, Bot } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar";
import Link from "next/link"; // Use Next.js Link

// Menu items.
const items = [
    { title: "Dashboard", url: "/dashboard", icon: Home, roles: ["user", "developer", "sysadmin", "executive"] },
    {
        title: "Voice Studio",
        url: "#",
        icon: LifeBuoy,
        roles: ["user"],
        items: [
            { title: "Assistant", url: "/dashboard/voice" },
            { title: "Clone Voice", url: "/dashboard/voice/clone" },
            { title: "Voice Lab", url: "/dashboard/voice/lab" },
            { title: "Knowledge Base", url: "/dashboard/knowledge" },
            { title: "API Dashboard", url: "/dashboard/developer" },
            { title: "Saved Voices", url: "/dashboard/voice/saved" },
        ]
    },
    { title: "My Tickets", url: "/dashboard/tickets", icon: FileText, roles: ["user"] },
    { title: "Manage Tickets", url: "/dashboard/developer", icon: LayoutDashboard, roles: ["developer", "executive", "sysadmin"] },
    { title: "Resolved", url: "/dashboard/developer/resolved", icon: CheckCircle, roles: ["developer", "executive"] },
    { title: "Notifications", url: "/dashboard/notifications", icon: Bell, roles: ["user", "developer", "sysadmin", "executive"] },
    { title: "Role Management", url: "/dashboard/admin/roles", icon: ShieldCheck, roles: ["sysadmin", "admin"] },
    { title: "Manage Assistants", url: "/dashboard/admin/agents", icon: Bot, roles: ["sysadmin", "admin"] },
    { title: "Profile", url: "/dashboard/profile", icon: User, roles: ["user", "developer", "sysadmin", "executive"] },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [unreadCount, setUnreadCount] = useState(0);

    const userRole = session?.user?.role || "user";

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await fetch("/api/notifications");
                const data = await res.json();
                if (Array.isArray(data)) {
                    setUnreadCount(data.filter((n: any) => !n.isRead).length);
                }
            } catch (e) {
                console.error("Failed to fetch notifications", e);
            }
        };

        if (session) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // Poll every minute
            return () => clearInterval(interval);
        }
    }, [session]);

    const filteredItems = items.filter(item => item.roles.includes(userRole));

    return (
        <Sidebar className="border-r border-[var(--border)]" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
            <SidebarContent className="backdrop-blur-xl bg-gradient-to-b from-[var(--background)]/5 to-transparent h-full px-4 py-6">

                {/* Logo Section */}
                <div className="flex flex-col items-center mb-12 relative group cursor-pointer">
                    <div className="relative w-20 h-20 mb-4 transition-transform duration-500 group-hover:scale-110">
                        <div className="absolute inset-0 bg-[var(--color-primary)] opacity-20 blur-xl rounded-full animate-pulse mx-auto" />
                        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[var(--border)] shadow-2xl">
                            <Image src={'/logo.jpg'} alt={'logo'} fill className="object-cover" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-black tracking-widest text-[var(--foreground)] mb-1 uppercase group-hover:text-[var(--color-primary)] transition-colors">
                            AI<span className="text-[var(--color-primary)] font-light">DESK</span>
                        </h2>
                        <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-[0.3em] font-medium">Enterprise Support</p>
                    </div>
                </div>

                {/* Navigation */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="space-y-2">
                            {filteredItems.map((item) => {
                                const isActive = pathname === item.url || (item.url !== '/dashboard' && pathname?.startsWith(item.url));
                                const hasSubItems = item.items && item.items.length > 0;

                                // Simple state for handling collapse/expand of this item if it has subitems
                                // note: in a real app component we might extract this to a separate component
                                // but for now we'll just render it flat or simple logic.
                                // Actually, separating the Item rendering is better to handle state.

                                return (
                                    <SidebarItemRenderer key={item.title} item={item} pathname={pathname} unreadCount={unreadCount} />
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-4 bg-transparent">
                <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 text-center">
                    <p className="text-xs text-gray-500 mb-1">System Status</p>
                    <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_green]" />
                        <span className="text-xs font-bold text-green-400 tracking-wider">ONLINE</span>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}

function SidebarItemRenderer({ item, pathname, unreadCount }: { item: any, pathname: string | null, unreadCount: number }) {
    const isActive = pathname === item.url || (item.items && item.items.some((sub: any) => pathname === sub.url));
    const [isOpen, setIsOpen] = useState(isActive);

    // Auto-expand if child is active
    useEffect(() => {
        if (isActive) setIsOpen(true);
    }, [isActive]);

    if (item.items) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                    w-full justify-start py-6 px-4 rounded-xl transition-all duration-300 group relative overflow-hidden cursor-pointer
                    ${isActive
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5'
                        }
                `}>
                    <div className="flex items-center gap-4 relative z-10 w-full">
                        <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-[var(--color-primary)]' : 'group-hover:text-[var(--color-primary)]'}`} />
                        <span className={`font-medium tracking-wide text-sm ${isActive ? 'font-bold' : ''}`}>
                            {item.title}
                        </span>
                        <ChevronRight className={`ml-auto w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                </SidebarMenuButton>

                {isOpen && (
                    <div className="pl-12 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-200">
                        {item.items.map((subItem: any) => {
                            const isSubActive = pathname === subItem.url;
                            return (
                                <Link key={subItem.title} href={subItem.url} className={`
                                    block py-2 px-2 text-sm rounded-lg transition-colors
                                    ${isSubActive
                                        ? 'text-[var(--color-primary)] font-medium bg-[var(/color-primary)]/5'
                                        : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                    }
                                 `}>
                                    {subItem.title}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </SidebarMenuItem>
        )
    }

    // Standard Item
    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild className={`
                w-full justify-start py-6 px-4 rounded-xl transition-all duration-300 group relative overflow-hidden
                ${isActive
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-[0_0_20px_rgba(0,243,255,0.1)]'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5'
                }
            `}>
                <Link href={item.url} className="flex items-center gap-4 relative z-10 w-full">
                    <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-[var(--color-primary)]' : 'group-hover:text-[var(--color-primary)] group-hover:scale-110'}`} />
                    <span className={`font-medium tracking-wide text-sm ${isActive ? 'font-bold' : ''}`}>
                        {item.title}
                    </span>

                    {/* Notification Badge */}
                    {item.title === "Notifications" && unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                            {unreadCount}
                        </span>
                    )}

                    {/* Active Indicator */}
                    {isActive && (
                        <div className="absolute right-0 w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shadow-[0_0_10px_var(--color-primary)] animate-pulse" />
                    )}
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}