"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Palette, Type, Scaling } from "lucide-react";
import { useTheme } from "next-themes";
import { useFont } from "@/components/FontProvider";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AppearanceSwitcher() {
    const { setTheme, theme } = useTheme();
    const { fontFamily, setFontFamily, fontSize, setFontSize } = useFont();

    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="relative h-9 w-9 border-[var(--border)] bg-[var(--background)]/50 hover:bg-[var(--foreground)]/5 transition-colors">
                            <Palette className="h-[1.2rem] w-[1.2rem] text-[var(--color-primary)]" />
                            <span className="sr-only">Toggle appearance</span>
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Appearance Settings</p>
                </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-80 p-0 glass-panel bg-black/80 backdrop-blur-xl border-[var(--border)]">

                <div className="p-4 border-b border-[var(--border)]">
                    <h4 className="font-semibold text-[var(--foreground)] mb-1">Appearance</h4>
                    <p className="text-xs text-[var(--muted-foreground)]">Customize your workspace</p>
                </div>

                <Tabs defaultValue="theme" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b border-[var(--border)] bg-transparent p-0 h-auto">
                        <TabsTrigger value="theme" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-transparent py-3 px-4 text-xs font-medium">Theme</TabsTrigger>
                        <TabsTrigger value="font" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--color-primary)] data-[state=active]:bg-transparent py-3 px-4 text-xs font-medium">Typography</TabsTrigger>
                    </TabsList>

                    {/* Theme Tab */}
                    <TabsContent value="theme" className="p-4 grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => setTheme("dark")} className={`justify-start ${theme === 'dark' ? 'border-[var(--color-primary)]' : 'border-[var(--border)]'}`}>
                            <Moon className="mr-2 h-4 w-4" /> Neon Dark
                        </Button>
                        <Button variant="outline" onClick={() => setTheme("light")} className={`justify-start ${theme === 'light' ? 'border-[var(--color-primary)]' : 'border-[var(--border)]'}`}>
                            <Sun className="mr-2 h-4 w-4" /> Light
                        </Button>
                        <Button variant="outline" onClick={() => setTheme("green")} className={`justify-start ${theme === 'green' ? 'border-[var(--color-primary)]' : 'border-[var(--border)]'}`}>
                            <Palette className="mr-2 h-4 w-4 text-green-500" /> Matrix
                        </Button>
                        <Button variant="outline" onClick={() => setTheme("red")} className={`justify-start ${theme === 'red' ? 'border-[var(--color-primary)]' : 'border-[var(--border)]'}`}>
                            <Palette className="mr-2 h-4 w-4 text-red-500" /> Mars
                        </Button>
                        <Button variant="outline" onClick={() => setTheme("system")} className={`justify-start col-span-2 ${theme === 'system' ? 'border-[var(--color-primary)]' : 'border-[var(--border)]'}`}>
                            <Monitor className="mr-2 h-4 w-4" /> System Default
                        </Button>
                    </TabsContent>

                    {/* Font Tab */}
                    <TabsContent value="font" className="p-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--muted-foreground)] flex items-center gap-2">
                                <Type className="w-3 h-3" /> Font Family
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <Button variant="outline" onClick={() => setFontFamily('inter')} className={`justify-start font-sans ${fontFamily === 'inter' ? 'border-[var(--color-primary)]' : 'border-[var(--border)]'}`}>
                                    Inter
                                </Button>
                                <Button variant="outline" onClick={() => setFontFamily('geist')} className={`justify-start font-sans ${fontFamily === 'geist' ? 'border-[var(--color-primary)]' : 'border-[var(--border)]'}`}>
                                    Geist
                                </Button>
                                <Button variant="outline" onClick={() => setFontFamily('outfit')} className={`justify-start font-sans ${fontFamily === 'outfit' ? 'border-[var(--color-primary)]' : 'border-[var(--border)]'}`}>
                                    Outfit
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[var(--muted-foreground)] flex items-center gap-2">
                                <Scaling className="w-3 h-3" /> Text Scaling
                            </label>
                            <div className="flex items-center gap-2 bg-[var(--background)]/50 p-1 rounded-lg border border-[var(--border)]">
                                <Button variant="ghost" size="sm" onClick={() => setFontSize('0.85')} className={`flex-1 ${fontSize === '0.85' ? 'bg-[var(--color-primary)]/20' : ''}`}>
                                    Small
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setFontSize('1')} className={`flex-1 ${fontSize === '1' ? 'bg-[var(--color-primary)]/20' : ''}`}>
                                    Normal
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setFontSize('1.15')} className={`flex-1 ${fontSize === '1.15' ? 'bg-[var(--color-primary)]/20' : ''}`}>
                                    Large
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setFontSize('1.3')} className={`flex-1 ${fontSize === '1.3' ? 'bg-[var(--color-primary)]/20' : ''}`}>
                                    XL
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

            </DropdownMenuContent>
        </DropdownMenu>
    );
}
