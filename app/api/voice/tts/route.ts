import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/db";
import { customVoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { text, voiceId, isCloned, engine = 'xtts' } = body;

        if (!text) {
            return new NextResponse("Text is required", { status: 400 });
        }

        // ==========================================================================================
        // INDIC ENGINE - LEGACY FALLBACK REDIRECTED TO TRUE HINDI PIPER
        // ==========================================================================================
        if (engine === 'indic' || engine === 'kokoro') {
            try {
                // OpenAI Compatible Endpoint provided by our new True Hindi Piper Service
                const piperUrl = "http://127.0.0.1:8003/v1/audio/speech";

                // Default to our specialized Hindi model
                const voice = voiceId || "hi_IN-pratham-medium";

                console.log(`[TTS] Routing legacy Kokoro engine to Native Piper with voice: ${voice}`);

                const response = await fetch(piperUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "piper",
                        input: text,
                        voice: voice,
                        response_format: "mp3"
                    })
                });

                if (!response.ok) {
                    const err = await response.text();
                    console.error("Piper TTS Error:", err);
                    throw new Error(`Piper API Error: ${err}`);
                }

                const audioBuffer = await response.arrayBuffer();

                // Save to public/generated
                const generatedDir = path.join(process.cwd(), "public", "generated");
                if (!fs.existsSync(generatedDir)) {
                    fs.mkdirSync(generatedDir, { recursive: true });
                }

                const outFilename = `piper-${Date.now()}.mp3`;
                const outPath = path.join(generatedDir, outFilename);
                fs.writeFileSync(outPath, Buffer.from(audioBuffer));

                return NextResponse.json({
                    audioUrl: `/generated/${outFilename}`,
                    mock: false,
                    engine: "piper"
                });

            } catch (e) {
                console.error("Piper Failure:", e);
                return NextResponse.json({ error: "Piper generation failed" }, { status: 500 });
            }
        }

        // ==========================================================================================
        // NATIVE HINDI (PIPER FASTAPI) ENGINE
        // ==========================================================================================
        if (engine === 'piper') {
            try {
                const piperUrl = "http://127.0.0.1:8003/v1/audio/speech";
                const voice = voiceId || "hi_IN-pratham-medium";

                console.log(`[TTS] Using Native Piper engine with voice: ${voice}`);

                const response = await fetch(piperUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "piper",
                        input: text,
                        voice: voice,
                        response_format: "mp3"
                    })
                });

                if (!response.ok) {
                    const err = await response.text();
                    console.error("Piper TTS Error:", err);
                    throw new Error(`Piper API Error: ${err}`);
                }

                const audioBuffer = await response.arrayBuffer();
                const generatedDir = path.join(process.cwd(), "public", "generated");
                if (!fs.existsSync(generatedDir)) {
                    fs.mkdirSync(generatedDir, { recursive: true });
                }

                const outFilename = `piper-${Date.now()}.mp3`;
                const outPath = path.join(generatedDir, outFilename);
                fs.writeFileSync(outPath, Buffer.from(audioBuffer));

                return NextResponse.json({
                    audioUrl: `/generated/${outFilename}`,
                    mock: false,
                    engine: "piper"
                });

            } catch (e) {
                console.error("Piper Failure:", e);
                return NextResponse.json({ error: "Piper generation failed" }, { status: 500 });
            }
        }

        // ==========================================================================================
        // XTTS (CLONING) ENGINE
        // ==========================================================================================

        // ==========================================================================================
        // XTTS (CLONING) ENGINE
        // ==========================================================================================

        if (!isCloned || !voiceId) {
            // Fallback if not cloned but engine is xtts (unlikely path given UI, but just in case)
            return NextResponse.json({ error: "Voice ID required for XTTS" }, { status: 400 });
        }

        const voice = await db.query.customVoices.findFirst({
            where: eq(customVoices.id, voiceId)
        });

        if (!voice) {
            return NextResponse.json({ error: "Voice not found" }, { status: 404 });
        }

        let speakerWavPath = voice.embeddingPath;

        console.log(`[TTS] XTTS Generation for: "${text}" | Voice: ${voice.name}`);

        try {
            const speakerFileName = path.basename(speakerWavPath);

            console.log(`[TTS] Synthesizing speech with XTTS API Server for speaker: ${speakerFileName}`);

            // XTTS on CPU can be very slow — set a 2 minute timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const ttsRes = await fetch("http://127.0.0.1:8002/tts_to_audio/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: text,
                    language: "en",
                    speaker_wav: speakerFileName
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!ttsRes.ok) {
                const errText = await ttsRes.text();
                console.error("XTTS Generation Failed:", errText);
                throw new Error(`XTTS API Error: ${errText}`);
            }

            const finalBuffer = Buffer.from(await ttsRes.arrayBuffer());

            // Save to public/generated
            const generatedDir = path.join(process.cwd(), "public", "generated");
            if (!fs.existsSync(generatedDir)) {
                fs.mkdirSync(generatedDir, { recursive: true });
            }

            const outFilename = `xtts-${Date.now()}.wav`;
            const outPath = path.join(generatedDir, outFilename);

            fs.writeFileSync(outPath, finalBuffer);

            console.log(`[TTS] Saved to ${outPath}`);

            return NextResponse.json({
                audioUrl: `/generated/${outFilename}`,
                mock: false,
                engine: "xtts"
            });

        } catch (genError) {
            console.error("XTTS Logic Error:", genError);
            return NextResponse.json({
                error: "XTTS Generation failed",
                details: genError instanceof Error ? genError.message : String(genError)
            }, { status: 500 });
        }

    } catch (error) {
        console.error("TTS Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
