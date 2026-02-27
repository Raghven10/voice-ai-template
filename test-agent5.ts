import 'dotenv/config';
import { voice, initializeLogger } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';

async function test() {
    initializeLogger({ pretty: false } as any);
    console.log("Creating STT");
    const stt = new openai.STT({
        apiKey: "dummy",
        baseURL: process.env.OPENAI_BASE_URL || "",
        model: "Systran/faster-whisper-small",
    });
    console.log("Creating TTS");
    const tts = new openai.TTS({
        apiKey: "dummy",
        baseURL: process.env.OPENAI_BASE_URL || "",
        model: "piper:hi_IN-vakyansh-medium",
        voice: "hi_IN-vakyansh-medium" as any,
    });
    console.log("Creating LLM");
    const llmInfo = new openai.LLM({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    });

    console.log("Creating AgentSession");
    const session = new voice.AgentSession({
        tts,
        stt,
        llm: llmInfo
    });
    console.log("Session created!");

}
test().catch(console.error);
