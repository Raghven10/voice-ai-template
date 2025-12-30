// app/api/messages/route.ts
import { NextResponse } from "next/server";

import { messages } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import {db} from "@/db/db.ts";

// GET all messages (admin sees all, user sees only theirs)
export async function GET() {
    const user = await requireAuth();
    const result = user.role === "admin"
        ? await db.select().from(messages)
        : await db.select().from(messages).where(eq(messages.senderUserId, user.id));

    return NextResponse.json(result);
}

// POST new message
export async function POST(req: Request) {
    const user = await requireAuth();
    const body = await req.json();
    const newMessage = await db.insert(messages).values({ ...body, userId: user.id }).returning();
    return NextResponse.json(newMessage[0]);
}
