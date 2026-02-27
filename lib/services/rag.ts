import { db } from "@/db/db.ts";
import { documents, documentChunks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import OpenAI from "openai";

// Initialize OpenAI client pointing to Ollama
const openai = new OpenAI({
    apiKey: "ollama",
    baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
});

export class RAGService {

    // Ingest a document: text content -> chunks -> embeddings -> DB
    static async ingestDocument(applicationId: string, title: string, content: string) {
        // 1. Create Document record
        const [doc] = await db.insert(documents).values({
            applicationId,
            title,
        }).returning();

        // 2. Chunk content (simple split by double newline or fixed size)
        const chunks = this.chunkText(content, 500);

        // 3. Generate embeddings and store
        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i];
            const embedding = await this.getEmbedding(chunkText);

            await db.insert(documentChunks).values({
                documentId: doc.id,
                content: chunkText,
                embedding: embedding, // Stored as JSONB
                chunkIndex: i,
            });
        }

        return doc;
    }

    // Search for relevant chunks
    static async search(applicationId: string, query: string, limit = 3) {
        const queryEmbedding = await this.getEmbedding(query);

        // This requires pgvector for performant cosine similarity. 
        // Since we are offline/using standard postgres image without pgvector extension setup in docker-compose (image: postgres:16-alpine), 
        // we might not have vector similarity search available directly via SQL efficiently.
        // However, for small datasets, we can fetch all chunks for the app and compute cosine similarity in JS, 
        // OR we just use keyword search if vector extension is missing.
        // Given the prompt asked for "ai based ... help manual", I will assume we want vector search.
        // I'll implement JS-side cosine similarity for offline standard postgres robustness (works without extension).

        // 1. Fetch chunks for the application
        // Join documents and documentChunks
        const chunks = await db.select({
            text: documentChunks.content,
            embedding: documentChunks.embedding,
            title: documents.title
        })
            .from(documentChunks)
            .innerJoin(documents, eq(documents.id, documentChunks.documentId))
            .where(eq(documents.applicationId, applicationId));

        // 2. Compute similarity
        const scored = chunks.map(chunk => ({
            ...chunk,
            score: this.cosineSimilarity(queryEmbedding, chunk.embedding as number[])
        }));

        // 3. Sort and slice
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit);
    }

    private static chunkText(text: string, chunkSize: number): string[] {
        // Simple chunking strategy
        const words = text.split(/\s+/);
        const chunks = [];
        let currentChunk = [];
        let currentLen = 0;

        for (const word of words) {
            currentChunk.push(word);
            currentLen += word.length + 1;
            if (currentLen >= chunkSize) {
                chunks.push(currentChunk.join(" "));
                currentChunk = [];
                currentLen = 0;
            }
        }
        if (currentChunk.length > 0) chunks.push(currentChunk.join(" "));
        return chunks;
    }

    private static async getEmbedding(text: string): Promise<number[]> {
        try {
            const response = await openai.embeddings.create({
                model: "nomic-embed-text", // or "llama2", or whatever model user has in ollama
                input: text,
            });
            return response.data[0].embedding;
        } catch (e) {
            console.error("Embedding generation failed", e);
            return [];
        }
    }

    private static cosineSimilarity(vecA: number[], vecB: number[]) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
