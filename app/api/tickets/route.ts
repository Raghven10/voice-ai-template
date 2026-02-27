
import { NextRequest, NextResponse } from "next/server";
import { tickets } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/db/db.ts";
import { v4 as uuidv4 } from "uuid";


export async function GET(req: NextRequest) {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const assignedToMe = searchParams.get("assignedToMe") === "true";

    // Staff roles can see all tickets (or just their assigned ones if requested)
    // Users only see their own created tickets
    const isStaff = ["sysadmin", "developer", "executive"].includes(user.role);

    let query = db.select().from(tickets);

    if (assignedToMe && isStaff) {
        // @ts-ignore
        query = db.select().from(tickets).where(eq(tickets.assignedUserId, user.id));
    } else if (!isStaff) {
        // @ts-ignore
        query = db.select().from(tickets).where(eq(tickets.createdByUserId, user.id));
    }

    const result = await query;
    return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
    try {
        const user = await requireAuth();
        const body = await req.json();
        const { conversationId, applicationId, title, description, priority } = body;

        const [ticket] = await db.insert(tickets).values({
            // id is defaultRandom() in schema, but we can generate if needed. Schema has defaultRandom().
            conversationId,
            applicationId,
            createdByUserId: user.id, // Enforce sender
            title,
            description,
            status: "open",
            priority: priority || "medium"
        }).returning();

        return NextResponse.json({ ticket });

    } catch (err: any) {
        console.error("Ticket API Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
