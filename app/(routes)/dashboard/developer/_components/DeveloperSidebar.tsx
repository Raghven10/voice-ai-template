"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Key, Bot, BookOpen, Settings } from "lucide-react";

export function DeveloperSidebar() {
    const pathname = usePathname();

    const routes = [
        {
            label: "Overview",
            icon: LayoutDashboard,
            href: "/dashboard/developer",
            active: pathname === "/dashboard/developer",
        },
        {
            label: "Voice Agents",
            icon: Bot,
            href: "/dashboard/developer/agents",
            active: pathname.startsWith("/dashboard/developer/agents"),
        },
        {
            label: "API Keys",
            icon: Key,
            href: "/dashboard/developer/keys", // We might need to move keys page or reuse logic
            active: pathname === "/dashboard/developer/keys",
        },
        {
            label: "Documentation",
            icon: BookOpen,
            href: "/dashboard/developer/docs",
            active: pathname === "/dashboard/developer/docs",
        },
    ];

    return (
        <div className="w-64 border-r border-white/10 bg-black/20 h-full flex flex-col p-4 space-y-4">
            <div className="px-2 py-4">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Platform
                </h2>
            </div>
            <div className="space-y-1">
                {routes.map((route) => (
                    <Link key={route.href} href={route.href}>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-white/5",
                                route.active && "bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20"
                            )}
                        >
                            <route.icon className="w-5 h-5" />
                            {route.label}
                        </Button>
                    </Link>
                ))}
            </div>
        </div>
    );
}
