
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const user = await requireAuth();
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        // Redis subscriber client (must be separate from publisher)
        const subscriber = redis.duplicate();
        const channel = `notifications:${user.id}`;

        await subscriber.subscribe(channel);

        console.log(`[SSE] User ${user.id} subscribed to ${channel}`);

        // Heartbeat to keep connection alive
        const heartbeatParams = setInterval(async () => {
            try {
                await writer.write(encoder.encode(": heartbeat\n\n"));
            } catch (e) {
                // connection likely closed
            }
        }, 15000);

        subscriber.on("message", async (chan, message) => {
            if (chan === channel) {
                try {
                    const data = `data: ${message}\n\n`;
                    await writer.write(encoder.encode(data));
                } catch (err) {
                    console.error("[SSE] Error writing message", err);
                }
            }
        });

        // Clean up when client disconnects
        req.signal.addEventListener("abort", async () => {
            console.log(`[SSE] Client disconnected ${user.id}`);
            clearInterval(heartbeatParams);
            try {
                await subscriber.unsubscribe(channel);
                subscriber.disconnect();
                // Check if the writer is locked or closed effectively by just trying to close and catching error
                await writer.close();
            } catch (e) {
                // Ignore errors during cleanup (e.g. stream already closed)
            }
        });

        return new NextResponse(readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            },
        });
    } catch (error) {
        console.error("[SSE] Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
