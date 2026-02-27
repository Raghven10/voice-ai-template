import 'dotenv/config';
import { voice } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';

async function test() {
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

    console.log("Created successfully. Now let's try creating an agent");
    const agent = new voice.Agent({
        instructions: `Test`,
    });
    console.log("Agent created");
    // wait I can't start session without a room.
    console.log("Done");
}
test().catch(console.error);
