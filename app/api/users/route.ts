import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { users, roles, userRoles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET() {
    try {
        const currentUser = await requireAuth();

        // Check if user is sysadmin or admin
        if (currentUser.role !== "sysadmin" && currentUser.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Fetch all users with their assigned roles
        const allUsers = await db.query.users.findMany({
            orderBy: (users, { desc }) => [desc(users.createdAt)]
        });

        // For each user, fetch their roles
        const usersWithRoles = await Promise.all(allUsers.map(async (user) => {
            const userAssignedRoles = await db
                .select({
                    id: roles.id,
                    name: roles.name,
                    description: roles.description
                })
                .from(userRoles)
                .innerJoin(roles, eq(userRoles.roleId, roles.id))
                .where(eq(userRoles.userId, user.id));

            return {
                ...user,
                roles: userAssignedRoles
            };
        }));

        return NextResponse.json(usersWithRoles);
    } catch (error) {
        console.error("Error fetching users for role management:", error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}
