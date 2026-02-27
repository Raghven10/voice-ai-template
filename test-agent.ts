import 'dotenv/config';
import { voice } from '@livekit/agents';
import openai from '@livekit/agents-plugin-openai';

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
        model: "speaches-ai/Kokoro-82M-v1.0-ONNX-fp16",
        voice: "af_heart" as any,
    });
    console.log("Creating LLM");
    const llmInfo = new openai.LLM({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    });

    console.log("Created successfully. Now let's try starting a dummy session or getting instance info");
    console.log("Done");
}
test().catch(console.error);
