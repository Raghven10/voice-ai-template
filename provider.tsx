"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";
import { FontProvider } from "@/components/FontProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <NextThemesProvider
                attribute="data-theme"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
            >
                <FontProvider>
                    <TooltipProvider>
                        {children}
                    </TooltipProvider>
                </FontProvider>
            </NextThemesProvider>
        </SessionProvider>
    );
}
