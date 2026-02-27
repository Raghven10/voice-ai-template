import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/db";
import { voiceAgents, agentDocuments } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

// 1. GET /api/developer/agents - List user's agents
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, session.user!.email!)
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const agents = await db.query.voiceAgents.findMany({
            where: eq(voiceAgents.userId, user.id),
            orderBy: [desc(voiceAgents.createdAt)]
        });

        // Enrich with Knowledge Base IDs
        const agentsWithKBs = await Promise.all(agents.map(async (agent) => {
            // @ts-ignore
            const links = await db.select().from(agentDocuments).where(eq(agentDocuments.agentId, agent.id));
            return {
                ...agent,
                knowledgeBaseIds: links.map((l: any) => l.documentId)
            };
        }));

        return NextResponse.json(agentsWithKBs);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
    }
}

// 2. POST /api/developer/agents - Create new agent
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const user = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.email, session.user!.email!)
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        const body = await req.json();
        const { name, baseVoiceId, systemPrompt, description, knowledgeBaseIds, tone } = body;

        if (!name || !baseVoiceId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const [newAgent] = await db.insert(voiceAgents).values({
            userId: user.id,
            name,
            baseVoiceId,
            systemPrompt: systemPrompt || "You are a helpful assistant.",
            description: description || "",
            language: "en",
            voiceSettings: { stability: 0.5, similarity: 0.75 },
            // knowledgeBaseId removed
            traits: tone ? { tone } : null,
            isPublic: false
        }).returning();

        // 3. Handle Knowledge Base Links
        if (knowledgeBaseIds && Array.isArray(knowledgeBaseIds) && knowledgeBaseIds.length > 0) {
            const agentDocsValues = knowledgeBaseIds.map((docId: string) => ({
                agentId: newAgent.id,
                documentId: docId
            }));
            // We need to import agentDocuments at top
            try {
                // @ts-ignore
                await db.insert(agentDocuments).values(agentDocsValues);
            } catch (linkError) {
                console.error("Error linking KBs:", linkError);
            }
        }

        return NextResponse.json(newAgent);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, session.user!.email!)
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    try {
        const body = await req.json();
        const { id, name, baseVoiceId, description, knowledgeBaseIds, tone } = body;

        if (!id) return NextResponse.json({ error: "Agent ID required" }, { status: 400 });

        const [updatedAgent] = await db.update(voiceAgents)
            .set({
                name,
                baseVoiceId,
                description,
                // knowledgeBaseId removed
                traits: tone ? { tone } : null,
            })
            .where(and(eq(voiceAgents.id, id), eq(voiceAgents.userId, user.id)))
            .returning();

        if (!updatedAgent) return NextResponse.json({ error: "Agent not found or unauthorized" }, { status: 404 });

        // Update KBs: Delete existing links, insert new ones
        // Note: Drizzle transaction would be ideal, but doing sequentially for now.
        // @ts-ignore
        await db.delete(agentDocuments).where(eq(agentDocuments.agentId, id));

        if (knowledgeBaseIds && Array.isArray(knowledgeBaseIds) && knowledgeBaseIds.length > 0) {
            const agentDocsValues = knowledgeBaseIds.map((docId: string) => ({
                agentId: id,
                documentId: docId
            }));
            // @ts-ignore
            await db.insert(agentDocuments).values(agentDocsValues);
        }

        return NextResponse.json(updatedAgent);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

