import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db.ts";
import { conversations, messages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route.tsx";


export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const params = await context.params;

        const conversation = await db.query.conversations.findFirst({
            where: eq(conversations.id, params.id),
        });

        if (!conversation) {
            return new NextResponse("Conversation not found", { status: 404 });
        }

        if (conversation.userId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch all messages for this discussion in chronological order
        const conversationMessages = await db.query.messages.findMany({
            where: eq(messages.conversationId, params.id),
            orderBy: [asc(messages.createdAt)],
        });

        return NextResponse.json({
            conversation,
            messages: conversationMessages
        });

    } catch (error) {
        console.error("GET CONVERSATION BY ID ERROR:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
