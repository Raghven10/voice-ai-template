"""
Sarvam AI Bulbul v2 TTS Adapter Service
Exposes an OpenAI-compatible /v1/audio/speech endpoint that proxies to
the Sarvam AI REST API (https://api.sarvam.ai/text-to-speech).
"""

import os
import base64
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Sarvam TTS Adapter", version="1.0.0")

SARVAM_API_KEY = os.environ.get("SARVAM_API_KEY", "")
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

# ─── Language code mapping (app code → Sarvam code) ─────────────────────────
LANG_MAP: dict[str, str] = {
    "hi": "hi-IN",
    "bn": "bn-IN",
    "ta": "ta-IN",
    "te": "te-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "mr": "mr-IN",
    "gu": "gu-IN",
    "pa": "pa-IN",
    "or": "or-IN",
    "en": "en-IN",
}

# ─── Voice registry: voice_id → {speaker, language, description} ────────────
VOICES: dict[str, dict] = {
    # ── Hindi ──
    "sarvam:anushka":   {"speaker": "anushka",   "lang": "hi-IN", "desc": "Anushka (F) — Hindi"},
    "sarvam:abhilash":  {"speaker": "abhilash",  "lang": "hi-IN", "desc": "Abhilash (M) — Hindi"},
    "sarvam:manisha":   {"speaker": "manisha",   "lang": "hi-IN", "desc": "Manisha (F) — Hindi"},
    "sarvam:arjun":     {"speaker": "arjun",     "lang": "hi-IN", "desc": "Arjun (M) — Hindi"},
    "sarvam:meera":     {"speaker": "meera",     "lang": "hi-IN", "desc": "Meera (F) — Hindi"},
    "sarvam:vijay":     {"speaker": "vijay",     "lang": "hi-IN", "desc": "Vijay (M) — Hindi"},
    # ── English (Indian) ──
    "sarvam:aria":      {"speaker": "aria",      "lang": "en-IN", "desc": "Aria (F) — English IN"},
    "sarvam:neel":      {"speaker": "neel",      "lang": "en-IN", "desc": "Neel (M) — English IN"},
    # ── Tamil ──
    "sarvam:pavithra":  {"speaker": "pavithra",  "lang": "ta-IN", "desc": "Pavithra (F) — Tamil"},
    "sarvam:karan":     {"speaker": "karan",     "lang": "ta-IN", "desc": "Karan (M) — Tamil"},
    # ── Telugu ──
    "sarvam:amol":      {"speaker": "amol",      "lang": "te-IN", "desc": "Amol (M) — Telugu"},
    "sarvam:diya":      {"speaker": "diya",      "lang": "te-IN", "desc": "Diya (F) — Telugu"},
    # ── Kannada ──
    "sarvam:misha":     {"speaker": "misha",     "lang": "kn-IN", "desc": "Misha (F) — Kannada"},
    "sarvam:arvind":    {"speaker": "arvind",    "lang": "kn-IN", "desc": "Arvind (M) — Kannada"},
    # ── Malayalam ──
    "sarvam:amrutha":   {"speaker": "amrutha",   "lang": "ml-IN", "desc": "Amrutha (F) — Malayalam"},
    # ── Marathi ──
    "sarvam:vian":      {"speaker": "vian",      "lang": "mr-IN", "desc": "Vian (M) — Marathi"},
    # ── Bengali ──
    "sarvam:siya":      {"speaker": "siya",      "lang": "bn-IN", "desc": "Siya (F) — Bengali"},
    # ── Gujarati ──
    "sarvam:karun":     {"speaker": "karun",     "lang": "gu-IN", "desc": "Karun (M) — Gujarati"},
    # ── Punjabi ──
    "sarvam:nina":      {"speaker": "nina",      "lang": "pa-IN", "desc": "Nina (F) — Punjabi"},
    # ── Odia ──
    "sarvam:maya":      {"speaker": "maya",      "lang": "or-IN", "desc": "Maya (F) — Odia"},
}

# ─── Request / Response Models ───────────────────────────────────────────────
class SpeechRequest(BaseModel):
    model: str = "bulbul:v2"
    input: str
    voice: str = "sarvam:anushka"
    response_format: str = "wav"
    speed: float = 1.0

@app.get("/health")
async def health():
    return {"status": "ok", "service": "sarvam-tts-adapter"}

@app.get("/v1/voices")
async def list_voices():
    """List all available Sarvam voices in a structured format."""
    return [
        {"id": voice_id, **meta}
        for voice_id, meta in VOICES.items()
    ]

@app.post("/v1/audio/speech")
async def create_speech(req: SpeechRequest):
    if not SARVAM_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="SARVAM_API_KEY not configured. Set it in your environment."
        )

    # ── Resolve voice ────────────────────────────────────────────────────────
    voice_meta = VOICES.get(req.voice)
    if not voice_meta:
        # If the voice is a raw speaker name (e.g. "anushka"), wrap it
        speaker = req.voice.removeprefix("sarvam:")
        # Use the first language in LANG_MAP as fallback
        lang_code = "hi-IN"
    else:
        speaker = voice_meta["speaker"]
        lang_code = voice_meta["lang"]

    # ── Clamp speed to Sarvam range (0.5 – 2.0) ─────────────────────────────
    pace = max(0.5, min(2.0, req.speed))

    payload = {
        "inputs": [req.input],
        "target_language_code": lang_code,
        "speaker": speaker,
        "pace": pace,
        "enable_preprocessing": True,
        "model": "bulbul:v2",
        "loudness": 1.5,
        "speech_sample_rate": 8000,
        "enc_format": "wav" if req.response_format in ("wav", "pcm") else "mp3",
        "eng_interpolation_wt": 123,
    }

    # ── Call Sarvam API ──────────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                SARVAM_TTS_URL,
                json=payload,
                headers={
                    "api-subscription-key": SARVAM_API_KEY,
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=e.response.status_code,
            detail=f"Sarvam API error: {e.response.text}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Request failed: {e}")

    # ── Decode base64 audio from Sarvam response ─────────────────────────────
    # Sarvam returns { "audios": ["<base64>", ...] }
    audios = data.get("audios") or data.get("audio", [])
    if not audios:
        raise HTTPException(status_code=500, detail="Empty audio response from Sarvam")

    audio_bytes = base64.b64decode(audios[0])

    media_type = "audio/mpeg" if req.response_format == "mp3" else "audio/wav"
    return Response(content=audio_bytes, media_type=media_type)
