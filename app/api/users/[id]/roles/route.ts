import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { userRoles, roles } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const currentUser = await requireAuth();
        const targetUserId = params.id;
        const { roleIds } = await req.json(); // Array of role IDs to assign

        // Permissions check: 
        // 1. Current user must be sysadmin or admin
        // 2. Admin cannot assign sysadmin or admin roles

        const isSysAdmin = currentUser.role === "sysadmin";
        const isAdmin = currentUser.role === "admin";

        if (!isSysAdmin && !isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (isAdmin) {
            // Fetch names of roles being assigned
            const rolesBeingAssigned = await db.select()
                .from(roles)
                .where(inArray(roles.id, roleIds));

            const forbiddenRoles = ["sysadmin", "admin"];
            const hasForbiddenRole = rolesBeingAssigned.some(r => forbiddenRoles.includes(r.name));

            if (hasForbiddenRole) {
                return NextResponse.json({ error: "Admins cannot assign sysadmin or admin roles" }, { status: 403 });
            }
        }

        // Update user roles
        // Clear existing roles first
        await db.delete(userRoles).where(eq(userRoles.userId, targetUserId));

        // Assign new roles
        if (roleIds.length > 0) {
            await db.insert(userRoles).values(
                roleIds.map((roleId: string) => ({
                    userId: targetUserId,
                    roleId: roleId,
                }))
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error managing user roles:", error);
        return NextResponse.json({ error: "Failed to update roles" }, { status: 500 });
    }
}
