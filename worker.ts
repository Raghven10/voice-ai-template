// worker.ts
import 'dotenv/config';
import { type JobContext, WorkerOptions, cli, defineAgent, llm, initializeLogger } from '@livekit/agents';
import { voice } from '@livekit/agents';
import { fileURLToPath } from 'url';

// Initialize the logger to prevent AgentSession crash inside the worker entry
initializeLogger({ pretty: false } as any);

console.log("Worker starting to load...");
console.log("LIVEKIT_URL:", process.env.LIVEKIT_URL);

// STT/TTS Configuration
const STT_MODEL = process.env.STT_MODEL || "Systran/faster-whisper-small";
const TTS_MODEL = process.env.TTS_MODEL || "hi_IN-pratham-medium";
const TTS_VOICE = "hi_IN-pratham-medium";

export default defineAgent({
    prewarm: async (proc) => {
        console.log("🔥 Worker prewarm called. Pre-loading heavy modules...");
        // Pre-load heavy dependencies during prewarm so entry() doesn't timeout
        await import('@livekit/agents-plugin-openai');
        await import('@livekit/agents-plugin-silero');
        await import('./lib/voice-logic');
        await import('zod');
        console.log("✅ Prewarm complete - all modules cached.");
    },
    entry: async (ctx: JobContext) => {
        try {
            console.log("🚀 Worker ENTRY called - Dispatch received!");
            console.log("Job Context:", {
                roomName: ctx.room.name,
                jobId: ctx.job.id,
            });

            // Modules already cached by prewarm, import is instant
            const openai = await import('@livekit/agents-plugin-openai');
            const { VoiceHelpdeskLogic } = await import('./lib/voice-logic');
            const { z } = await import("zod");
            console.log("Modules loaded (from cache).");

            await ctx.connect();
            console.log('✅ Connected to room. Waiting for participant...');

            const participant = await ctx.waitForParticipant();
            const userEmail = participant.identity;
            console.log(`👤 Participant joined: ${userEmail}`);

            // Start conversation in DB
            const convo = await VoiceHelpdeskLogic.startConversation(ctx.room.name || "default-room", userEmail || "guest");

            // ── Parse agentId from room name (pattern: "agent-<uuid>-<random>") ──
            const roomName: string = ctx.room.name || "";
            const agentIdMatch = roomName.match(/^agent-([0-9a-f-]{36})-/);
            const agentId = agentIdMatch?.[1] ?? null;
            console.log(`🤖 Detected agentId: ${agentId ?? "none (using defaults)"}`);

            // Fetch agent config from DB (null = use defaults)
            const agentConfig = agentId
                ? await VoiceHelpdeskLogic.getAgentConfig(agentId)
                : null;

            const ttsVoice = agentConfig?.baseVoiceId ?? "hi_IN-pratham-medium";
            const sttLanguage = agentConfig?.language ?? "hi";
            const systemPromptText = agentConfig?.systemPrompt ?? "आप एक AI Helpdesk Assistant हैं। हिंदी में जवाब दें।";
            const greeting = VoiceHelpdeskLogic.getGreetingForAgent(sttLanguage);

            console.log(`🎙️ Agent: ${agentConfig?.name ?? "Default"} | Lang: ${sttLanguage} | Voice: ${ttsVoice}`);

            // Fetch User Voice Config
            const voiceConfig = await VoiceHelpdeskLogic.getActiveVoiceConfig(userEmail || "guest");
            console.log(`🎤 Using Voice Engine: ${voiceConfig.type} (${voiceConfig.model})`);

            // Helper: run a tool with a 5-second timeout so hanging tools don't freeze the agent
            const withTimeout = <T>(fn: () => Promise<T>, fallback: T, label: string): Promise<T> =>
                Promise.race([
                    fn().catch(e => { console.error(`❌ Tool error [${label}]:`, e?.message ?? e); return fallback; }),
                    new Promise<T>(resolve => setTimeout(() => { console.error(`⏱️ Tool timeout [${label}] after 5s`); resolve(fallback); }, 5000))
                ]);

            // Tool Definitions
            const tools: llm.ToolContext = {
                get_previous_queries: llm.tool({
                    description: "Lookup previous tickets or queries for an application",
                    parameters: z.object({
                        appName: z.string().describe("The name of the application")
                    }),
                    execute: async ({ appName }) => withTimeout(async () => {
                        const queries = await VoiceHelpdeskLogic.getPreviousQueries(userEmail || "guest", appName);
                        if (queries.length === 0) return "No previous queries found for this application.";
                        return `Found ${queries.length} previous tickets: ` + queries.map(t => `${t.title} (Status: ${t.status})`).join(", ");
                    }, "No previous queries found.", "get_previous_queries")
                }),
                search_documentation: llm.tool({
                    description: "Search the knowledge base or documentation to answer a user's question about an application.",
                    parameters: z.object({
                        appName: z.string().describe("The name of the application"),
                        query: z.string().describe("The user's question or issue to look up in the documentation")
                    }),
                    execute: async ({ appName, query }) => withTimeout(
                        () => VoiceHelpdeskLogic.searchDocumentation(appName, query),
                        "Documentation search is currently unavailable. I'll guide you based on my knowledge, or we can raise a ticket.",
                        "search_documentation"
                    )
                }),
                create_ticket: llm.tool({
                    description: "Create a new support ticket for an application",
                    parameters: z.object({
                        appName: z.string().describe("The name of the application"),
                        description: z.string().describe("Detailed description of the issue")
                    }),
                    execute: async ({ appName, description }) => withTimeout(async () => {
                        const ticket = await VoiceHelpdeskLogic.createTicket(userEmail || "guest", appName, description, convo.id);
                        return `Successfully created ticket #${ticket.id.substring(0, 8)}. A developer has been notified.`;
                    }, "Ticket creation failed. Please try again.", "create_ticket")
                }),
                escalate_issue: llm.tool({
                    description: "Escalate the issue to a human executive, developer, or sysadmin based on the user's request or complexity.",
                    parameters: z.object({
                        level: z.enum(["human_executive", "developer", "sysadmin"]).describe("The team to escalate to"),
                        reason: z.string().describe("Reason for the escalation (e.g., user is frustrated, issue is complex)")
                    }),
                    execute: async ({ level, reason }) => withTimeout(
                        () => VoiceHelpdeskLogic.escalateIssue(convo.id, level, reason),
                        "Escalation failed. Please try again.",
                        "escalate_issue"
                    )
                })
            };

            // Configure STT — uses local Speaches (Whisper, offline on port 8001)
            const stt = new openai.STT({
                apiKey: "dummy",
                baseURL: "http://localhost:8001/v1",
                model: "Systran/faster-whisper-small",
                language: sttLanguage,
            });

            // Configure TTS from agent config — route by baseVoiceId prefix (all offline)
            let tts;
            if (voiceConfig.type === 'xtts') {
                // Custom cloned XTTS voice
                tts = new openai.TTS({
                    apiKey: "dummy",
                    baseURL: "http://localhost:8002/v1",
                    model: "tts_models/multilingual/multi-dataset/xtts_v2",
                    voice: voiceConfig.embeddingPath ? voiceConfig.embeddingPath.split('/').pop() : "" as any,
                });
            } else if (ttsVoice.startsWith("indic:")) {
                // ✅ AI4Bharat IndicF5 — fully offline self-hosted
                console.log(`🎙️ Using IndicF5 TTS: ${ttsVoice}`);
                tts = new openai.TTS({
                    apiKey: "dummy",
                    baseURL: "http://localhost:8005/v1",
                    model: "indicf5",
                    voice: ttsVoice as any,
                });
            } else {
                // 🔊 Piper TTS — fully offline (hi_IN-pratham, te_IN-ammu, ta_IN-kokila, etc.)
                console.log(`🔊 Using Piper TTS: ${ttsVoice}`);
                tts = new openai.TTS({
                    apiKey: "dummy",
                    baseURL: "http://localhost:8003/v1",
                    model: "piper",
                    voice: ttsVoice as any,
                });
            }

            const llmInfo = new openai.LLM({
                apiKey: process.env.GROQ_API_KEY,
                baseURL: "https://api.groq.com/openai/v1",
                model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
            });
            // Configure Voice Activity Detection (VAD)
            const silero = await import('@livekit/agents-plugin-silero');
            const vad = await silero.VAD.load();
            const agent = new voice.Agent({
                instructions: systemPromptText,
            });


            const session = new voice.AgentSession({
                tts,
                stt,
                llm: llmInfo,
                vad,   // ← required: without VAD, OpenAI STT adapter can't stream and stays silent
            });

            session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
                console.log("🗣️ User transcribed:", ev.transcript, ev.isFinal);
            });
            session.on(voice.AgentSessionEventTypes.AgentStateChanged, (ev) => {
                console.log("🤖 Agent State Changed:", ev.newState);
            });
            session.on(voice.AgentSessionEventTypes.UserStateChanged, (ev) => {
                console.log("👤 User State Changed:", ev.newState);
            });
            session.on(voice.AgentSessionEventTypes.FunctionToolsExecuted, (ev) => {
                console.log("🛠️ Tools Executed:", ev);
            });
            session.on(voice.AgentSessionEventTypes.Error, (ev) => {
                console.error("❌ Agent Error:", ev.error);
            });

            // Save messages hook
            session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
                const item = ev.item;
                if (item instanceof llm.ChatMessage && item.textContent) {
                    // Warning: Lazy loaded Logic might be scoped, but we imported it above so it's in scope of entry() closure
                    VoiceHelpdeskLogic.logMessage(convo.id, item.role === 'user' ? 'user' : 'ai', item.textContent);
                }
            });

            console.log("Starting agent session...");
            await session.start({
                room: ctx.room,
                agent,
            });
            console.log("Agent session started!");

            // Initial Greeting — wait 1s so audio track is established
            console.log("Attempting to say greeting...");
            try {
                await new Promise(r => setTimeout(r, 1000));
                await session.say(greeting);
                console.log("Greeting sent!");
            } catch (error) {
                console.error("Failed to say greeting:", error);
            }
        } catch (err) {
            console.error("CRITICAL ERROR IN WORKER ENTRY:", err);
        }
    },
});

cli.runApp(new WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    initializeProcessTimeout: 60000, // 60s — heavy modules (Silero VAD, OpenAI plugins) need extra time
}));
