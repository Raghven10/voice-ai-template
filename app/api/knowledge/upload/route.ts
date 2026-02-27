
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/db";
import { documents, documentChunks } from "@/db/schema";
import minioClient, { BUCKET_NAME, ensureBucketExists } from "@/lib/minio";
import { pipeline } from "@xenova/transformers";
const pdf = require("pdf-parse");
import { v4 as uuidv4 } from "uuid";

// Singleton Embedder
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

// 2. POST /api/knowledge/upload - Helper to upload and trigger processing
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, session.user!.email!)
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        const bucketName = (formData.get("bucketName") as string) || BUCKET_NAME;

        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${uuidv4()}-${file.name}`;

        // 1. Upload to Minio
        await ensureBucketExists(bucketName);
        await minioClient.putObject(bucketName, fileName, buffer, file.size, {
            'Content-Type': file.type
        });

        // 2. Create Document Entry (Status: pending)
        const [newDoc] = await db.insert(documents).values({
            userId: user.id,
            title: file.name,
            content: "", // Content will be populated by OCR
            filePath: fileName,
            status: "pending"
        }).returning();

        // 3. Trigger Python Processing Service
        const serviceUrl = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";
        // Fire and forget (don't await processing, just await the trigger acknowledgment)
        fetch(`${serviceUrl}/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                document_id: newDoc.id,
                bucket_name: bucketName,
                file_path: fileName
            })
        }).catch(err => console.error("Failed to trigger processing:", err));

        return NextResponse.json(newDoc);

    } catch (e) {
        console.error("Upload error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
