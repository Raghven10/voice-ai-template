
import { SidebarTrigger } from "@/components/ui/sidebar.tsx";

import { AppearanceSwitcher } from "@/components/AppearanceSwitcher";
import { RoleSwitcher } from "./RoleSwitcher";
import { Notifications } from "./Notifications";
import { UserNav } from "./UserNav";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function AppHeader() {
    return (
        <div className="flex justify-between items-center w-full px-4 py-2">
            {/* Left Side: Sidebar Trigger only */}
            <div className="flex items-center text-[var(--foreground)] gap-4">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <SidebarTrigger className="hover:bg-[var(--foreground)]/10 rounded-md p-1 transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent side="right">Toggle Sidebar</TooltipContent>
                </Tooltip>
            </div>

            {/* Right Side: All other icons */}
            <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                    <AppearanceSwitcher />
                    <Notifications />
                </div>

                <div className="h-4 w-px bg-[var(--foreground)]/10" />

                <RoleSwitcher />

                <div className="h-4 w-px bg-[var(--foreground)]/10" />

                <UserNav />
            </div>
        </div>
    )
}

export default AppHeader