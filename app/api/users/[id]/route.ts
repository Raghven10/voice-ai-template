// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";

import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import {db} from "@/db/db.ts";

// GET single user
export async function GET(_: Request, { params }: { params: { id: string } }) {
    await requireAuth();
    const user = await db.query.users.findFirst({ where: eq(users.id, params.id) });
    return NextResponse.json(user);
}

// PUT update user (admin only)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const sessionUser = await requireAuth();
    if (sessionUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const updated = await db.update(users).set(body).where(eq(users.id, params.id)).returning();
    return NextResponse.json(updated[0]);
}

// DELETE user (admin only)
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const sessionUser = await requireAuth();
    if (sessionUser.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.delete(users).where(eq(users.id, params.id));
    return NextResponse.json({ success: true });
}
