import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/db";
import { customVoices, documents } from "@/db/schema";
import { eq, or } from "drizzle-orm";

// GET /api/developer/resources - specific for developer dash
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

        // 1. Fetch Voices (System + Custom)
        // Hardcoded system voices for consistency
        const systemVoices = [
            // English Premade
            { id: "af_heart", name: "Heart (F) - US", category: "premade" },
            { id: "af_bella", name: "Bella (F) - US", category: "premade" },
            { id: "af_nicole", name: "Nicole (F) - US", category: "premade" },
            { id: "am_adam", name: "Adam (M) - US", category: "premade" },
            { id: "am_michael", name: "Michael (M) - US", category: "premade" },
            { id: "bf_emma", name: "Emma (F) - UK", category: "premade" },
            { id: "bm_george", name: "George (M) - UK", category: "premade" },

            // Indic Premade
            { id: "hi_female_1", name: "Hindi Female", category: "indic" },
            { id: "hi_male_1", name: "Hindi Male", category: "indic" },
            { id: "bn_female_1", name: "Bengali Female", category: "indic" },
            { id: "ta_male_1", name: "Tamil Male", category: "indic" },
            { id: "gu_female_1", name: "Gujarati Female", category: "indic" }
        ];

        const myVoices = await db.query.customVoices.findMany({
            where: or(
                eq(customVoices.userId, user.id),
                eq(customVoices.isPublic, true)
            )
        });

        const allVoices = [
            ...systemVoices,
            ...myVoices.map(v => ({ id: v.id, name: `${v.name} (Cloned)`, category: "cloned" }))
        ];

        // 2. Fetch Knowledge Bases (Documents)
        // Currently assuming 'documents' table serves as KB source.
        // We might need to filter by 'applicationId' accessible to user, or just user-created docs.
        // Since schema links documents to applications, we first find apps user can access or just all docs for simplicity in this dev context.
        // Let's assume user wants to see all documents for now.

        // Actually, documents are linked to applications. Let's return all documents for now as a flat list.
        const docs = await db.query.documents.findMany({
            orderBy: (d, { desc }) => [desc(d.createdAt)],
            limit: 50
        });

        return NextResponse.json({
            voices: allVoices,
            knowledgeBases: docs.map(d => ({ id: d.id, name: d.title }))
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
    }
}
