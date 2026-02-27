
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import minioClient from "@/lib/minio";

// GET /api/knowledge/buckets - List buckets
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const buckets = await minioClient.listBuckets();
        const bucketList = buckets.map(b => b.name);
        return NextResponse.json(bucketList);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to list buckets" }, { status: 500 });
    }
}

// POST /api/knowledge/buckets - Create bucket
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { bucketName } = body;

        if (!bucketName) return NextResponse.json({ error: "Bucket name required" }, { status: 400 });

        const exists = await minioClient.bucketExists(bucketName);
        if (exists) return NextResponse.json({ error: "Bucket already exists" }, { status: 400 });

        await minioClient.makeBucket(bucketName, "us-east-1");
        return NextResponse.json({ success: true, bucketName });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to create bucket" }, { status: 500 });
    }
}
