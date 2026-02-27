"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { db } from "@/db/db";
import { toast } from "sonner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Shield, User, Settings, Hammer, Briefcase, Loader2 } from "lucide-react";

interface Role {
    id: string;
    name: string;
    description: string | null;
}

interface UserData {
    id: string;
    email: string;
    displayName: string | null;
    primaryRole: string;
    roles: Role[];
}

export default function RoleManagementPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<UserData[]>([]);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, rolesRes] = await Promise.all([
                    fetch("/api/users"), // I need to create this or find existing
                    fetch("/api/roles")
                ]);

                if (usersRes.ok && rolesRes.ok) {
                    setUsers(await usersRes.json());
                    setAllRoles(await rolesRes.json());
                } else {
                    toast.error("Failed to fetch data");
                }
            } catch (error) {
                console.error("Error fetching role management data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleAssignRoles = async () => {
        if (!selectedUser) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/users/${selectedUser.id}/roles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roleIds: selectedRoleIds }),
            });

            if (res.ok) {
                toast.success("Roles updated successfully");
                // Refresh users
                const usersRes = await fetch("/api/users");
                if (usersRes.ok) setUsers(await usersRes.json());
                setSelectedUser(null);
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to update roles");
            }
        } catch (error) {
            console.error("Error updating roles:", error);
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    const isSysAdmin = session?.user?.role === "sysadmin";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-[var(--foreground)]">
                        Role <span className="text-[var(--color-primary)]">Management</span>
                    </h1>
                    <p className="text-[var(--muted-foreground)] text-sm">Manage user roles and permissions</p>
                </div>
            </div>

            <div className="glass-panel rounded-xl overflow-hidden border-[var(--foreground)]/10">
                <Table>
                    <TableHeader className="bg-[var(--foreground)]/5">
                        <TableRow>
                            <TableHead className="font-bold uppercase tracking-wider text-xs">User</TableHead>
                            <TableHead className="font-bold uppercase tracking-wider text-xs">Email</TableHead>
                            <TableHead className="font-bold uppercase tracking-wider text-xs">Active Role</TableHead>
                            <TableHead className="font-bold uppercase tracking-wider text-xs">Assigned Roles</TableHead>
                            <TableHead className="text-right font-bold uppercase tracking-wider text-xs">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-[var(--foreground)]/5 transition-colors">
                                <TableCell className="font-medium">{user.displayName || "N/A"}</TableCell>
                                <TableCell className="text-[var(--muted-foreground)]">{user.email}</TableCell>
                                <TableCell>
                                    <span className="px-2 py-1 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] font-bold uppercase tracking-wider border border-[var(--color-primary)]/20">
                                        {user.primaryRole}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {user.roles?.map((role) => (
                                            <span key={role.id} className="px-1.5 py-0.5 rounded bg-[var(--foreground)]/5 text-[var(--muted-foreground)] text-[10px] border border-[var(--foreground)]/10">
                                                {role.name}
                                            </span>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-[var(--foreground)]/10 hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] transition-all"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setSelectedRoleIds(user.roles?.map(r => r.id) || []);
                                                }}
                                            >
                                                Manage Roles
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="glass-panel border-[var(--foreground)]/10 sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl font-bold uppercase tracking-tight">
                                                    Manage Roles for <span className="text-[var(--color-primary)]">{user.email}</span>
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="py-4 space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    {allRoles.map((role) => {
                                                        const isForbidden = !isSysAdmin && ["sysadmin", "admin"].includes(role.name);

                                                        return (
                                                            <div
                                                                key={role.id}
                                                                className={`flex items-center space-x-2 p-2 rounded-lg border transition-all ${selectedRoleIds.includes(role.id)
                                                                        ? "bg-[var(--color-primary)]/5 border-[var(--color-primary)]/20"
                                                                        : "bg-[var(--foreground)]/5 border-transparent"
                                                                    } ${isForbidden ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                                                                onClick={() => {
                                                                    if (isForbidden) return;
                                                                    setSelectedRoleIds(prev =>
                                                                        prev.includes(role.id)
                                                                            ? prev.filter(id => id !== role.id)
                                                                            : [...prev, role.id]
                                                                    );
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    id={role.id}
                                                                    checked={selectedRoleIds.includes(role.id)}
                                                                    disabled={isForbidden}
                                                                />
                                                                <label
                                                                    htmlFor={role.id}
                                                                    className="text-sm font-medium capitalize cursor-pointer flex-1"
                                                                >
                                                                    {role.name.replace("_", " ")}
                                                                </label>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setSelectedUser(null)}
                                                    className="hover:bg-[var(--foreground)]/5"
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handleAssignRoles}
                                                    disabled={saving}
                                                    className="bg-[var(--color-primary)] text-black font-bold hover:bg-[var(--color-primary)]/80"
                                                >
                                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
