"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Palette } from "lucide-react";
import { useTheme } from "next-themes";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function ThemeSwitcher() {
    const { setTheme, theme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative h-9 w-9 border-white/10 bg-white/5 hover:bg-white/10 hover:border-[var(--color-primary)]/50 transition-colors">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-[var(--color-primary)]" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[var(--color-primary)]" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-panel border-white/10 bg-black/80 backdrop-blur-xl">
                <DropdownMenuItem onClick={() => setTheme("light")} className="text-gray-300 focus:text-white focus:bg-white/10 cursor-pointer">
                    <Sun className="mr-2 h-4 w-4" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="text-gray-300 focus:text-white focus:bg-white/10 cursor-pointer">
                    <Moon className="mr-2 h-4 w-4" /> Dark (Neon)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("green")} className="text-gray-300 focus:text-white focus:bg-white/10 cursor-pointer">
                    <Palette className="mr-2 h-4 w-4 text-green-500" /> Matrix Green
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("red")} className="text-gray-300 focus:text-white focus:bg-white/10 cursor-pointer">
                    <Palette className="mr-2 h-4 w-4 text-red-500" /> Mars Red
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="text-gray-300 focus:text-white focus:bg-white/10 cursor-pointer">
                    <Monitor className="mr-2 h-4 w-4" /> System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
