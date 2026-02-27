import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { documents } from "@/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { desc } from "drizzle-orm";

// GET /api/documents — list available knowledge base documents
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const docs = await db.query.documents.findMany({
            orderBy: [desc(documents.createdAt)],
        });

        return NextResponse.json(docs);
    } catch (err: any) {
        console.error("[documents GET]", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
