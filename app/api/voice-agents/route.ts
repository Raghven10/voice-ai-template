import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { voiceAgents, agentDocuments, documents } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { users } from "@/db/schema";

// GET /api/voice-agents — list agents for the current user (or all if admin)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.email, session.user.email),
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const isAdmin = user.primaryRole === "sysadmin";

        // Admins see all agents; others see their own + public agents
        const agentList = await db.query.voiceAgents.findMany({
            where: isAdmin ? undefined : eq(voiceAgents.userId, user.id),
            orderBy: (a, { desc }) => [desc(a.createdAt)],
        });

        // Attach linked document IDs for each agent
        const agentsWithDocs = await Promise.all(
            agentList.map(async (agent) => {
                const linkedDocs = await db.query.agentDocuments.findMany({
                    where: eq(agentDocuments.agentId, agent.id),
                });
                return {
                    ...agent,
                    knowledgeBaseDocIds: linkedDocs.map((d) => d.documentId),
                };
            })
        );

        return NextResponse.json(agentsWithDocs);
    } catch (err: any) {
        console.error("[voice-agents GET]", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/voice-agents — create a new agent
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.email, session.user.email),
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const {
            name,
            description,
            language,
            baseVoiceId,
            systemPrompt,
            knowledgeBaseDocIds = [],
        } = body;

        if (!name || !baseVoiceId) {
            return NextResponse.json({ error: "name and baseVoiceId are required" }, { status: 400 });
        }

        // Insert agent
        const [agent] = await db
            .insert(voiceAgents)
            .values({
                userId: user.id,
                name,
                description: description ?? null,
                language: language ?? "en",
                baseVoiceId,
                systemPrompt: systemPrompt ?? "You are a helpful helpdesk assistant.",
            })
            .returning();

        // Link knowledge base documents
        if (knowledgeBaseDocIds.length > 0) {
            await db.insert(agentDocuments).values(
                knowledgeBaseDocIds.map((docId: string) => ({
                    agentId: agent.id,
                    documentId: docId,
                }))
            );
        }

        return NextResponse.json({ ...agent, knowledgeBaseDocIds });
    } catch (err: any) {
        console.error("[voice-agents POST]", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH /api/voice-agents — update an agent
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.email, session.user.email),
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const { id, name, description, language, baseVoiceId, systemPrompt, knowledgeBaseDocIds } = body;

        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

        // Ensure the agent belongs to this user
        const existing = await db.query.voiceAgents.findFirst({
            where: and(eq(voiceAgents.id, id), eq(voiceAgents.userId, user.id)),
        });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const updates: Partial<typeof voiceAgents.$inferInsert> = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (language !== undefined) updates.language = language;
        if (baseVoiceId !== undefined) updates.baseVoiceId = baseVoiceId;
        if (systemPrompt !== undefined) updates.systemPrompt = systemPrompt;

        const [updated] = await db
            .update(voiceAgents)
            .set(updates)
            .where(eq(voiceAgents.id, id))
            .returning();

        // Re-sync knowledge base links if provided
        if (Array.isArray(knowledgeBaseDocIds)) {
            await db.delete(agentDocuments).where(eq(agentDocuments.agentId, id));
            if (knowledgeBaseDocIds.length > 0) {
                await db.insert(agentDocuments).values(
                    knowledgeBaseDocIds.map((docId: string) => ({
                        agentId: id,
                        documentId: docId,
                    }))
                );
            }
        }

        return NextResponse.json({ ...updated, knowledgeBaseDocIds: knowledgeBaseDocIds ?? [] });
    } catch (err: any) {
        console.error("[voice-agents PATCH]", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/voice-agents?id=<uuid>
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.email, session.user.email),
        });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const id = new URL(req.url).searchParams.get("id");
        if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

        const existing = await db.query.voiceAgents.findFirst({
            where: and(eq(voiceAgents.id, id), eq(voiceAgents.userId, user.id)),
        });
        if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await db.delete(voiceAgents).where(eq(voiceAgents.id, id));
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("[voice-agents DELETE]", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
