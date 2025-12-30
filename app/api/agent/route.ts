import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db.ts";  // drizzle db client
import { conversations, messages, tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuid4 } from "uuid";

// Example: POST /api/agent
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { livekitRoomSid, livekitRoomName, userId, applicationId, userMessage } = body;

        // 1. Create or fetch conversation
        let convo = await db.query.conversations.findFirst({
            where: eq(conversations.livekitRoomSid, livekitRoomSid)
        });

        if (!convo) {
            [convo] = await db.insert(conversations).values({
                id: uuid4(),
                livekitRoomSid,
                livekitRoomName,
                userId,
                applicationId,
                status: "active",
                currentLevel: "ai"
            }).returning();
        }

        // 2. Save user message
        const [msg] = await db.insert(messages).values({
            id: uuid4(),
            conversationId: convo.id,
            senderKind: "user",
            senderUserId: userId,
            text: userMessage,
            isFinal: true
        }).returning();

        // 3. Generate AI response (replace with your LLM or agent call)
        let aiReply = `Hello! You said: "${userMessage}". Do you want me to create a support ticket for this issue?`;

        const [aiMsg] = await db.insert(messages).values({
            id: uuid4(),
            conversationId: convo.id,
            senderKind: "ai",
            text: aiReply,
            isFinal: true
        }).returning();

        return NextResponse.json({
            conversation: convo,
            lastUserMessage: msg,
            aiMessage: aiMsg
        });

    } catch (err: any) {
        console.error("Agent API Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

