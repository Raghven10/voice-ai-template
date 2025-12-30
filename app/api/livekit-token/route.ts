import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

// This API route issues a LiveKit token for the client
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const sessionId = url.searchParams.get("sessionId") || "default-session";

        // Identity could be user ID or random guest
        const identity = "user-" + Math.floor(Math.random() * 100000);

        // Create token with server secret
        const at = new AccessToken(
            process.env.LIVEKIT_API_KEY!,
            process.env.LIVEKIT_API_SECRET!,
            {
                identity,
                ttl: 60 * 60, // 1 hour
            }
        );

        at.addGrant({
            roomJoin: true,
            room: sessionId, // lock to sessionId as room name
            canPublish: true,
            canSubscribe: true,
        });

        const token = await at.toJwt();

        return NextResponse.json({ token });
    } catch (err: any) {
        console.error("Error creating LiveKit token:", err);
        return NextResponse.json(
            { error: "Failed to generate token" },
            { status: 500 }
        );
    }
}
