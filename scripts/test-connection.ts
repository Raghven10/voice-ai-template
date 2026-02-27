
import { Room, RoomEvent } from 'livekit-client';
import { AccessToken } from 'livekit-server-sdk';
import 'dotenv/config';
import { WebSocket } from 'ws';

// Polyfill WebSocket for Node environment if needed by livekit-client
global.WebSocket = WebSocket as any;

async function testConnection() {
    console.log("Testing connection...");

    // 1. Generate Token
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL || "ws://127.0.0.1:7880";

    console.log(`Using URL: ${wsUrl}`);

    if (!apiKey || !apiSecret) {
        console.error("Missing API Key/Secret");
        return;
    }

    const at = new AccessToken(apiKey, apiSecret, {
        identity: "test-bot",
        ttl: 60,
    });

    at.addGrant({
        roomJoin: true,
        room: "test-room",
        canPublish: true,
        canSubscribe: true,
    });

    const token = await at.toJwt();
    console.log("Token generated.");

    // 2. Connect
    const room = new Room();

    room.on(RoomEvent.Connected, () => {
        console.log("✅ Successfully connected to LiveKit server!");
        room.disconnect();
        process.exit(0);
    });

    room.on(RoomEvent.Disconnected, (reason) => {
        console.log("❌ Disconnected:", reason);
        process.exit(1);
    });

    try {
        await room.connect(wsUrl, token);
        console.log("Connect called, waiting for event...");
    } catch (e) {
        console.error("❌ Failed to connect:", e);
        process.exit(1);
    }
}

testConnection();
