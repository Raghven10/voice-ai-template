
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/db";
import { documents, documentChunks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import minioClient, { BUCKET_NAME } from "@/lib/minio";

// DELETE /api/knowledge/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.email, session.user!.email!)
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;

    try {
        const doc = await db.query.documents.findFirst({
            where: and(eq(documents.id, id), eq(documents.userId, user.id))
        });

        if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

        // 1. Delete from Minio
        if (doc.filePath) {
            try {
                await minioClient.removeObject(BUCKET_NAME, doc.filePath);
            } catch (minioError) {
                console.error("Error deleting from Minio:", minioError);
                // Proceed to delete metadata locally anyway
            }
        }

        // 2. Delete chunks (Cascade should handle this if defined in schema, but good to be explicit or let DB handle it)
        // Schema: onDelete: "cascade" for documentChunks -> documentId. So deleting document is enough.

        // 3. Delete Document
        await db.delete(documents).where(eq(documents.id, id));

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
}
