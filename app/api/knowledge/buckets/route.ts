
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
        let { bucketName } = body;

        if (!bucketName) return NextResponse.json({ error: "Bucket name required" }, { status: 400 });

        // MinIO (S3) strictly requires bucket names to be DNS-compliant: lowercase, numbers, hyphens.
        bucketName = bucketName
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphen
            .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
            .substring(0, 63); // Max length 63

        if (bucketName.length < 3) {
            return NextResponse.json({ error: "Bucket name must be at least 3 characters long after sanitization" }, { status: 400 });
        }

        const exists = await minioClient.bucketExists(bucketName);
        if (exists) return NextResponse.json({ error: "Bucket already exists" }, { status: 400 });

        await minioClient.makeBucket(bucketName, "us-east-1");
        return NextResponse.json({ success: true, bucketName });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || "Failed to create bucket" }, { status: 500 });
    }
}
