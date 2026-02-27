import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userNotifications = await db.query.notifications.findMany({
            where: eq(notifications.userId, session.user.id),
            orderBy: [desc(notifications.createdAt)],
            limit: 20
        });

        return NextResponse.json(userNotifications);
    } catch (err: any) {
        console.error("Error fetching notifications:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id, isRead } = await req.json();

        if (id) {
            await db.update(notifications)
                .set({ isRead })
                .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));
        } else {
            // Mark all as read
            await db.update(notifications)
                .set({ isRead: true })
                .where(eq(notifications.userId, session.user.id));
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Error updating notifications:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
