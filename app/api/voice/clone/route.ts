import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/db";
import { customVoices, users } from "@/db/schema";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { eq, or } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        const name = formData.get("name") as string;
        const isPublicStr = formData.get("is_public") as string;
        const isPublic = isPublicStr === "true";

        if (!file || !name) {
            return new NextResponse("Missing file or name", { status: 400 });
        }

        // Get user ID
        const user = await db.query.users.findFirst({
            where: eq(users.email, session.user.email)
        });
        if (!user) return new NextResponse("User not found", { status: 404 });

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), "public", "voices");
        await mkdir(uploadDir, { recursive: true });

        // Save file
        const buffer = Buffer.from(await file.arrayBuffer());
        // Sanitize filename
        const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${user.id}-${safeName}-${Date.now()}.wav`;
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        // Save to DB
        await db.insert(customVoices).values({
            userId: user.id,
            name: name,
            embeddingPath: filePath,
            previewUrl: `/voices/${fileName}`,
            isPublic: isPublic
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Voice clone error:", e);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const user = await db.query.users.findFirst({
            where: eq(users.email, session.user.email)
        });

        if (!user) return new NextResponse("User not found", { status: 404 });

        const voices = await db.query.customVoices.findMany({
            where: or(
                eq(customVoices.userId, user.id),
                eq(customVoices.isPublic, true)
            ),
            orderBy: (customVoices, { desc }) => [desc(customVoices.createdAt)]
        });

        // Add is_owner flag for frontend convenience
        const enrichedVoices = voices.map(v => ({
            ...v,
            is_owner: v.userId === user.id
        }));

        return NextResponse.json(enrichedVoices);
    } catch (e) {
        console.error("Fetch voices error:", e);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
