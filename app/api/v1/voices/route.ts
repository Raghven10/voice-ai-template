import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { db } from "@/db/db";
import { customVoices } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function GET(req: Request) {
    const auth = await authenticateApiKey(req);
    if (!auth) {
        return new NextResponse("Unauthorized: Invalid API Key", { status: 401 });
    }

    // 1. Fetch User's Cloned Voices
    const userInfo = await db.query.users.findFirst({
        where: eq(customVoices.userId, auth.userId),
        with: {
            // @ts-ignore - drizzle relational setup might be pending 
        }
    });

    const clonedVoicesList = await db.query.customVoices.findMany({
        where: or(
            eq(customVoices.userId, auth.userId),
            eq(customVoices.isPublic, true)
        )
    });

    const formattedCloned = clonedVoicesList.map(v => ({
        voice_id: v.id,
        name: v.name,
        category: v.userId === auth.userId ? 'cloned' : 'community',
        settings: null,
        is_owner: v.userId === auth.userId
    }));

    // 2. Fetch System Voices (Hardcoded for now based on Speaches/Kokoro)
    const systemVoices = [
        { voice_id: "af_heart", name: "Heart (F) - US", category: "premade" },
        { voice_id: "af_bella", name: "Bella (F) - US", category: "premade" },
        { voice_id: "af_nicole", name: "Nicole (F) - US", category: "premade" },
        { voice_id: "am_adam", name: "Adam (M) - US", category: "premade" },
        { voice_id: "am_michael", name: "Michael (M) - US", category: "premade" },
        { voice_id: "bf_emma", name: "Emma (F) - UK", category: "premade" },
        { voice_id: "bm_george", name: "George (M) - UK", category: "premade" },
    ];

    return NextResponse.json({
        voices: [...systemVoices, ...formattedCloned]
    });
}
