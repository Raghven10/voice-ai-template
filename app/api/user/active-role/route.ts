import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { users, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const user = await requireAuth();
        const { roleId } = await req.json();

        if (!roleId) {
            return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
        }

        // Update the active role in the database
        await db.update(users)
            .set({ activeRoleId: roleId })
            .where(eq(users.id, user.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error switching active role:", error);
        return NextResponse.json({ error: "Failed to switch role" }, { status: 500 });
    }
}
