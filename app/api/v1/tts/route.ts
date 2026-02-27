import { NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-auth";
import { db } from "@/db/db";
import { customVoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import fs from "fs";

export async function POST(req: Request) {
    const auth = await authenticateApiKey(req);
    if (!auth) {
        return new NextResponse("Unauthorized: Invalid API Key", { status: 401 });
    }

    try {
        const body = await req.json();
        const { text, voice_id, model_id = "eleven_monolingual_v1" } = body;

        if (!text) return new NextResponse("Start by providing text to generate speech.", { status: 400 });
        if (!voice_id) return new NextResponse("voice_id is required", { status: 400 });

        // Logic to determine engine
        // If voice_id is a UUID, it's likely a Cloned Voice (XTTS)
        // If voice_id is short (e.g. "af_heart"), it's likely Kokoro

        const isCloned = voice_id.length > 20; // UUID is 36 chars

        let audioBuffer: ArrayBuffer | null = null;
        let finalFormat = "mp3";

        if (isCloned) {
            // XTTS Logic
            // Verify ownership
            const voiceRecord = await db.query.customVoices.findFirst({
                where: eq(customVoices.id, voice_id)
            });

            if (!voiceRecord || voiceRecord.userId !== auth.userId) {
                return new NextResponse("Voice not found or access denied.", { status: 401 });
            }

            // Call XTTS Container
            // ... (Shared logic with internal route, ideally refactored into a service)
            const containerPath = `/voices/${voiceRecord.embeddingPath.split('/').pop()}`;
            const xttsRes = await fetch("http://127.0.0.1:8002/tts_to_audio/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: text,
                    speaker_wav: containerPath,
                    language: "en"
                })
            });
            if (!xttsRes.ok) throw new Error("XTTS Generation Failed");
            audioBuffer = await xttsRes.arrayBuffer();
            finalFormat = "wav";

        } else {
            // Kokoro Logic
            const speachesRes = await fetch("http://127.0.0.1:8001/v1/audio/speech", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "speaches-ai/Kokoro-82M-v1.0-ONNX-fp16",
                    input: text,
                    voice: voice_id,
                    response_format: "mp3"
                })
            });
            if (!speachesRes.ok) throw new Error("Kokoro Generation Failed");
            audioBuffer = await speachesRes.arrayBuffer();
        }

        if (!audioBuffer) return new NextResponse("Generation returned no data", { status: 500 });

        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": `audio/${finalFormat}`,
                "Content-Length": audioBuffer.byteLength.toString(),
            },
        });

    } catch (e: any) {
        console.error("API TTS Error:", e);
        return new NextResponse(JSON.stringify({
            detail: {
                status: "server_error",
                message: e.message
            }
        }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
