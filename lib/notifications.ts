import { db } from "@/db/db";
import { notifications } from "@/db/schema";
import { redis } from "@/lib/redis";

export interface NotificationPayload {
    userId: string;
    title: string;
    message: string;
    type?: "info" | "success" | "warning" | "error";
    ticketId?: string;
}

export async function sendNotification(payload: NotificationPayload) {
    // 1. Persist to Postgres
    const [newNotif] = await db.insert(notifications).values({
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type || "info",
        ticketId: payload.ticketId ? payload.ticketId : null,
    }).returning();

    // 2. Publish to Redis for real-time delivery
    const channel = `notifications:${payload.userId}`;
    const message = JSON.stringify({
        ...newNotif,
        timestamp: new Date().toISOString()
    });

    await redis.publish(channel, message);

    return newNotif;
}
