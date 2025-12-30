// app/api/users/route.ts
import { NextResponse } from "next/server";

import { users } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import {db} from "@/db/db.ts";

// GET all users (admin only)
export async function GET() {
    const user = await requireAuth();
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const allUsers = await db.select().from(users);
    return NextResponse.json(allUsers);
}

// POST create user (admin only)
export async function POST(req: Request) {
    const user = await requireAuth();
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const newUser = await db.insert(users).values(body).returning();
    return NextResponse.json(newUser[0]);
}
