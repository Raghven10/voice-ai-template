// app/api/token/route.ts
import { NextResponse } from "next/server";
import { generateRandomAlphanumeric } from "@/lib/util";

import { AccessToken } from "livekit-server-sdk";
import { RoomAgentDispatch, RoomConfiguration } from "@livekit/protocol";
import type { AccessTokenOptions, VideoGrant } from "livekit-server-sdk";
import { TokenResult } from "@/lib/types";

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

const createToken = (
    userInfo: AccessTokenOptions,
    grant: VideoGrant,
    agentName?: string,
) => {
    const at = new AccessToken(apiKey, apiSecret, userInfo);
    at.addGrant(grant);

    if (agentName) {
        at.roomConfig = new RoomConfiguration({
            agents: [
                new RoomAgentDispatch({
                    agentName,
                    metadata: '{"user_id": "12345"}',
                }),
            ],
        });
    }

    return at.toJwt();
};

export async function POST(req: Request) {
    try {
        if (!apiKey || !apiSecret) {
            return NextResponse.json(
                { error: "Environment variables aren't set up correctly" },
                { status: 500 },
            );
        }

        const body = await req.json();

        const {
            roomName: roomNameFromBody,
            participantName: participantNameFromBody,
            participantId: participantIdFromBody,
            metadata: metadataFromBody,
            attributes: attributesFromBody,
            agentName: agentNameFromBody,
        } = body;

        // Room name or generate random
        const roomName =
            (roomNameFromBody as string) ||
            `room-${generateRandomAlphanumeric(4)}-${generateRandomAlphanumeric(4)}`;

        // Identity or generate random
        const identity =
            (participantIdFromBody as string) ||
            `identity-${generateRandomAlphanumeric(4)}`;

        const agentName = (agentNameFromBody as string) || undefined;

        // Metadata & attributes
        const metadata = metadataFromBody as string | undefined;
        const attributesStr = attributesFromBody as string | undefined;
        const attributes = attributesStr || {};

        const participantName = participantNameFromBody || identity;

        const grant: VideoGrant = {
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canPublishData: true,
            canSubscribe: true,
            canUpdateOwnMetadata: true,
        };

        const token = await createToken(
            { identity, metadata, attributes, name: participantName },
            grant,
            agentName,
        );

        const result: TokenResult = {
            identity,
            accessToken: token,
        };

        return NextResponse.json(result);
    } catch (e) {
        return NextResponse.json(
            { error: (e as Error).message },
            { status: 500 },
        );
    }
}
