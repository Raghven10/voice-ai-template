import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/db";
import { documents, documentChunks } from "@/db/schema";
import { pipeline } from "@xenova/transformers";

// Singleton implementation for the embedder to avoid reloading on every request (if possible in runtime)
class Embedder {
    static instance: any = null;
    static async getInstance() {
        if (!this.instance) {
            this.instance = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
        }
        return this.instance;
    }
}

function chunkText(text: string, maxChars: number = 1000): string[] {
    const chunks: string[] = [];
    let currentChunk = "";

    // A very simple chunking strategy. 
    // Ideally, we split by paragraphs or sentences.
    const sentences = text.split(/(?<=[.?!])\s+/);

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChars) {
            if (currentChunk) chunks.push(currentChunk.trim());
            currentChunk = sentence;
        } else {
            currentChunk += (currentChunk ? " " : "") + sentence;
        }
    }
    if (currentChunk) chunks.push(currentChunk.trim());

    return chunks;
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, session.user!.email!)
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    try {
        const body = await req.json();
        const { title, content } = body;

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
        }

        // 1. Create Document Entry
        const [newDoc] = await db.insert(documents).values({
            userId: user.id,
            title,
            content,
            // applicationId can be null for personal KBs
        }).returning();

        // 2. Generate Embeddings & Save Chunks
        // Note: For large documents, this should be offloaded to a background worker (e.g. BullMQ/Inngest).
        // Processing inline for simplicity as per requirements.
        try {
            const chunks = chunkText(content);
            const extractor = await Embedder.getInstance();

            const chunksData = [];

            // Process chunks sequentially or in batches
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                if (!chunk) continue;

                // Generate embedding (mean pooling over the sequence)
                const output = await extractor(chunk, { pooling: 'mean', normalize: true });
                const embedding = Array.from(output.data);

                chunksData.push({
                    documentId: newDoc.id,
                    content: chunk,
                    chunkIndex: i,
                    embedding: embedding as unknown as any // Casting because Drizzle TS types for vector might strictly expect string[] or number[] depending on setup, passing array usually works for insertion
                });
            }

            if (chunksData.length > 0) {
                await db.insert(documentChunks).values(chunksData);
            }

        } catch (embedError) {
            console.error("Error generating embeddings:", embedError);
            // We don't fail the whole request, but sidebar alert might be needed? 
            // For now, we return the document but log the error. The user can retry or we can re-process later.
        }

        return NextResponse.json(newDoc);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create knowledge base" }, { status: 500 });
    }
}
