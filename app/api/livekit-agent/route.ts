import { NextResponse } from "next/server";
import { voice } from "@livekit/agents";
import * as livekit from "@livekit/agents-plugin-livekit";
import * as openai from "@livekit/agents-plugin-openai";

// these can come from env
const stt_model_id = "Systran/faster-whisper-small";
const tts_model_id = "speaches-ai/Kokoro-82M-v1.0-ONNX-fp16";
const voice_id = "af_heart";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get("sessionId") ?? "default-session";
        const agentPrompt =
            searchParams.get("agentPrompt") ??
            "You are a helpful AI assistant.";

        // Define agent pipeline
        const assistant = new voice.Agent({
            instructions: agentPrompt,
        });

        const session = new voice.AgentSession({
            stt: new openai.STT({
                language: "en",
                model: stt_model_id,
                baseURL: process.env.NEXT_PUBLIC_OPENAI_BASE_URL,
                apiKey: process.env.OPENAI_API_KEY,
            }),
            // @ts-ignore
            llm: new openai.LLM.withOllama({
                model: process.env.NEXT_PUBLIC_OPENAI_BASE_MODEL!,
                baseURL: process.env.NEXT_PUBLIC_OPENAI_BASE_URL!,
            }),
            tts: new openai.TTS({
                model: tts_model_id,
                // @ts-ignore
                voice: voice_id,
                instructions: "Speak in a friendly and conversational tone.",
                baseURL: process.env.NEXT_PUBLIC_SPEECH_BASE_URL,
                apiKey: process.env.OPENAI_API_KEY,
            }),
            turnDetection: new livekit.turnDetector.MultilingualModel(),
        });

        // Start the session
        await session.start({
            agent: assistant,
            // @ts-ignore
            room: newRoom,
            inputOptions: {
                // noiseCancellation: BackgroundVoiceCancellation(),
            },

        });

        return NextResponse.json({
            sessionId,
            agentPrompt,
            session: { id: sessionId },
        });
    } catch (err: any) {
        console.error("LiveKit Agent error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
