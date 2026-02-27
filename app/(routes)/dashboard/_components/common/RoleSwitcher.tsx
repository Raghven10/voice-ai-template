"use client";

import { useSession } from "next-auth/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Shield, User, Hammer, Settings, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const roleIcons: Record<string, any> = {
    sysadmin: Shield,
    admin: Settings,
    dev_manager: Hammer,
    developer: Hammer,
    project_manager: Briefcase,
    user: User,
};

export function RoleSwitcher() {
    const { data: session, update } = useSession();
    const router = useRouter();

    if (!session?.user?.roles || session.user.roles.length <= 1) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--foreground)]/5 border border-[var(--foreground)]/10">
                {session?.user?.activeRole && (
                    <>
                        {(() => {
                            const Icon = roleIcons[session.user.activeRole.name] || User;
                            return <Icon className="w-4 h-4 text-[var(--color-primary)]" />;
                        })()}
                        <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
                            {session.user.activeRole.name}
                        </span>
                    </>
                )}
            </div>
        );
    }

    const handleRoleSwitch = async (roleId: string) => {
        try {
            const res = await fetch("/api/user/active-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roleId }),
            });

            if (res.ok) {
                toast.success("Role switched successfully");
                // Update the session to reflect the new active role
                await update();
                router.refresh();
            } else {
                toast.error("Failed to switch role");
            }
        } catch (error) {
            console.error("Error switching role:", error);
            toast.error("An error occurred");
        }
    };

    const ActiveIcon = roleIcons[session.user.activeRole?.name || "user"] || User;


    return (
        <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="h-9 gap-2 border-[var(--foreground)]/10 bg-[var(--foreground)]/5 hover:bg-[var(--foreground)]/10 transition-colors">
                            <ActiveIcon className="w-4 h-4 text-[var(--color-primary)]" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {session.user.activeRole?.name || "Select Role"}
                            </span>
                            <ChevronDown className="w-3 h-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Switch Role</p>
                </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="w-48 glass-panel border-[var(--foreground)]/10">
                <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] px-2 py-1.5">
                    Switch Role
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[var(--foreground)]/10" />
                {session.user.roles.map((role) => {
                    const RoleIcon = roleIcons[role.name] || User;
                    const isActive = session.user.activeRole?.id === role.id;

                    return (
                        <DropdownMenuItem
                            key={role.id}
                            onClick={() => handleRoleSwitch(role.id)}
                            className={`flex items-center gap-2 px-2 py-2 cursor-pointer transition-colors ${isActive ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "hover:bg-[var(--foreground)]/5"
                                }`}
                        >
                            <RoleIcon className={`w-4 h-4 ${isActive ? "text-[var(--color-primary)]" : "text-[var(--muted-foreground)]"}`} />
                            <span className="text-sm font-medium capitalize">{role.name.replace("_", " ")}</span>
                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
