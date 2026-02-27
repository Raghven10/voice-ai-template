import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db.ts";
import { conversations, messages, voiceAgents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route.tsx";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Fetch user's conversations ordered by newest first
        const userConversations = await db.query.conversations.findMany({
            where: eq(conversations.userId, session.user.id),
            orderBy: [desc(conversations.startedAt)],
            with: {
                messages: {
                    limit: 1,
                    orderBy: [desc(messages.createdAt)]
                },
                tickets: true // Join tickets table to get ticket status
            }
        });

        return NextResponse.json(userConversations);
    } catch (error) {
        console.error("GET CONVERSATIONS ERROR:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
