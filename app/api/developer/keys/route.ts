
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/db";
import { apiKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const keys = await db.query.apiKeys.findMany({
        where: eq(apiKeys.userId, session.user.id),
        orderBy: (keys, { desc }) => [desc(keys.createdAt)]
    });

    // Mask keys for security (show only last 4 chars)
    const maskedKeys = keys.map(k => ({
        ...k,
        key: `sk_live_...${k.key.slice(-4)}`
    }));

    return NextResponse.json(maskedKeys);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { name } = body;

    // Generate Key
    const rawKey = `sk_live_${crypto.randomBytes(16).toString("hex")}`;

    // Store
    await db.insert(apiKeys).values({
        userId: session.user.id,
        name: name || "Untitled Key",
        key: rawKey
    });

    return NextResponse.json({ key: rawKey, name });
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return new NextResponse("ID required", { status: 400 });

    await db.delete(apiKeys).where(eq(apiKeys.id, id));

    return NextResponse.json({ success: true });
}
