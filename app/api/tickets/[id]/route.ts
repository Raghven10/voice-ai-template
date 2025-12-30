// app/api/tickets/[id]/route.ts
import { NextResponse } from "next/server";

import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import {db} from "@/db/db.ts";

// GET ticket
export async function GET(_: Request, { params }: { params: { id: string } }) {
    const user = await requireAuth();
    const ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, params.id) });
    if (!ticket || (user.role !== "admin" && String(tickets.createdByUserId) !== user.id))
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    return NextResponse.json(ticket);
}

// PUT update ticket
export async function PUT(req: Request, { params }: { params: { id: string } }) {
    const user = await requireAuth();
    const body = await req.json();
    const ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, params.id) });

    if (!ticket || (user.role !== "admin" && ticket.createdByUserId !== user.id))
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updated = await db.update(tickets).set(body).where(eq(tickets.id, params.id)).returning();
    return NextResponse.json(updated[0]);
}

// DELETE ticket
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
    const user = await requireAuth();
    const ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, params.id) });

    if (!ticket || (user.role !== "admin" && ticket.createdByUserId !== user.id))
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.delete(tickets).where(eq(tickets.id, params.id));
    return NextResponse.json({ success: true });
}
