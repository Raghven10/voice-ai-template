
import { NextRequest, NextResponse } from "next/server";
import { tickets } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import {db} from "@/db/db.ts";
import { v4 as uuidv4 } from "uuid";


export async function GET() {
    const user = await requireAuth();
    const result = user.role === "admin"
        ? await db.select().from(tickets)
        : await db.select().from(tickets).where(eq(tickets.createdByUserId, user.id));

    return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { conversationId, applicationId, userId, title, description } = body;

        const [ticket] = await db.insert(tickets).values({
            id: uuidv4(),
            conversationId,
            applicationId,
            createdByUserId: userId,
            title,
            description,
            status: "open",
            priority: "medium"
        }).returning();

        return NextResponse.json({ ticket });

    } catch (err: any) {
        console.error("Ticket API Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
