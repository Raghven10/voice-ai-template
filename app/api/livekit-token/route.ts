import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { RoomAgentDispatch, RoomConfiguration } from "@livekit/protocol";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// This API route issues a LiveKit token for the client
export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        // FORCE distinct sessions for debugging to ensure Dispatch triggers every time
        const uniqueId = Math.random().toString(36).substring(7);
        const agentId = url.searchParams.get("agentId") ?? "";
        // Embed agentId in room name so the worker can parse it: "agent-<uuid>-<random>"
        const sessionId = agentId
            ? `agent-${agentId}-${uniqueId}`
            : url.searchParams.get("sessionId")
                ? `${url.searchParams.get("sessionId")}-${uniqueId}`
                : `session-${Date.now()}-${uniqueId}`;

        const session = await getServerSession(authOptions);

        // Use user email or ID as identity if authenticated, otherwise random guest
        const identity = session?.user?.email || "guest-" + Math.floor(Math.random() * 100000);

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

        return NextResponse.json({ token, agentId: agentId || null });
    } catch (err: any) {
        console.error("Error creating LiveKit token:", err);
        return NextResponse.json(
            { error: "Failed to generate token" },
            { status: 500 }
        );
    }
}
