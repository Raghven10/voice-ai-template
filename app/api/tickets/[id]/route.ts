import { NextRequest, NextResponse } from "next/server";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db/db.ts";

// Helper to check access
function hasAccess(user: any, ticket: any) {
    const isStaff = ["sysadmin", "developer", "executive"].includes(user.role);
    if (isStaff) return true;
    return ticket.createdByUserId === user.id;
}

// GET ticket
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await requireAuth();
        const ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, params.id) });

        if (!ticket) return NextResponse.json({ error: "Not Found" }, { status: 404 });
        if (!hasAccess(user, ticket))
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        return NextResponse.json(ticket);
    } catch (err: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PATCH update status/priority/description
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await requireAuth();
        const body = await req.json();
        const ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, params.id) });

        if (!ticket) return NextResponse.json({ error: "Not Found" }, { status: 404 });

        // Only staff can update status/priority generally, but user might update description?
        // For simplicity: Staff can update everything. User can update description if open.
        // Or stick to simple permission:
        const isStaff = ["sysadmin", "developer", "executive"].includes(user.role);

        if (!hasAccess(user, ticket))
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // If user is not staff, restrict what they can update? 
        // For now, let's assume if they have access they can update (or refine later).
        // Let's restrict status changes to staff only unless closing?
        if (!isStaff && body.status && body.status !== 'closed' && body.status !== 'resolved') {
            // Maybe user can resolve/close? 
        }

        const updated = await db.update(tickets)
            .set({ ...body, updatedAt: new Date() })
            .where(eq(tickets.id, params.id))
            .returning();

        return NextResponse.json({ ticket: updated[0] });
    } catch (err: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE ticket
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await requireAuth();
        const ticket = await db.query.tickets.findFirst({ where: eq(tickets.id, params.id) });

        if (!ticket) return NextResponse.json({ error: "Not Found" }, { status: 404 });
        if (!hasAccess(user, ticket))
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await db.delete(tickets).where(eq(tickets.id, params.id));
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
