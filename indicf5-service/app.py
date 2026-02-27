"""
AI4Bharat IndicF5 TTS — Offline FastAPI Service
Exposes an OpenAI-compatible /v1/audio/speech endpoint.

Offline deployment:
  1. On an internet-connected machine, run:
       python download_models.py
     This populates ./models/ with all IndicF5 weights.

  2. Copy the entire ./indicf5-service/ directory (including the models/ folder)
     to the air-gapped server.

  3. docker compose up indicf5-tts
     The models/ folder is bind-mounted read-only inside the container.
"""

import io
import os
import tempfile
import numpy as np
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

app = FastAPI(title="IndicF5 Offline TTS", version="1.0.0")

# ─── Model config ─────────────────────────────────────────────────────────────
MODEL_DIR   = os.environ.get("MODEL_DIR", "/app/models/IndicF5")
SAMPLE_RATE = 24000   # IndicF5 native sample rate

# Speaker → reference audio file (inside MODEL_DIR/ref_audio/)
# These short (~5–10 s) wav files act as voice cloning references.
# Provide your own or use the samples from the IndicF5 repo.
SPEAKER_MAP: dict[str, dict] = {
    "hi_female":  {"ref": "hi_female.wav",  "lang": "hi"},
    "hi_male":    {"ref": "hi_male.wav",     "lang": "hi"},
    "te_male":    {"ref": "te_male.wav",     "lang": "te"},
    "ta_female":  {"ref": "ta_female.wav",   "lang": "ta"},
    "mr_female":  {"ref": "mr_female.wav",   "lang": "mr"},
    "bn_female":  {"ref": "bn_female.wav",   "lang": "bn"},
    "kn_male":    {"ref": "kn_male.wav",     "lang": "kn"},
    "ml_female":  {"ref": "ml_female.wav",   "lang": "ml"},
    "gu_male":    {"ref": "gu_male.wav",     "lang": "gu"},
    "pa_female":  {"ref": "pa_female.wav",   "lang": "pa"},
    "or_female":  {"ref": "or_female.wav",   "lang": "or"},
}

# Keep model loaded in memory after first call
_model = None

def get_model():
    global _model
    if _model is None:
        print(f"📥 Loading IndicF5 from {MODEL_DIR}…")
        try:
            from transformers import AutoModel
            _model = AutoModel.from_pretrained(
                MODEL_DIR,
                trust_remote_code=True,
                local_files_only=True,   # strictly offline — no HF network calls
            )
            print("✅ IndicF5 loaded.")
        except Exception as e:
            raise RuntimeError(f"Failed to load IndicF5 model from {MODEL_DIR}: {e}")
    return _model


class SpeechRequest(BaseModel):
    model: str = "indicf5"
    input: str
    voice: str = "hi_female"
    response_format: str = "wav"


@app.get("/health")
async def health():
    model_exists = Path(MODEL_DIR).exists()
    ref_dir = Path(MODEL_DIR) / "ref_audio"
    available_speakers = [
        s for s, meta in SPEAKER_MAP.items()
        if (ref_dir / meta["ref"]).exists()
    ] if ref_dir.exists() else []
    return {
        "status": "ok" if model_exists else "model_missing",
        "model_dir": MODEL_DIR,
        "available_speakers": available_speakers,
    }


@app.get("/v1/voices")
async def list_voices():
    ref_dir = Path(MODEL_DIR) / "ref_audio"
    return [
        {
            "id": f"indic:{sid}",
            "lang": meta["lang"],
            "available": (ref_dir / meta["ref"]).exists() if ref_dir.exists() else False,
        }
        for sid, meta in SPEAKER_MAP.items()
    ]


@app.post("/v1/audio/speech")
async def create_speech(req: SpeechRequest):
    # Strip the "indic:" prefix that worker.ts uses as a routing key
    speaker_id = req.voice.replace("indic:", "")
    speaker_meta = SPEAKER_MAP.get(speaker_id)
    if not speaker_meta:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown speaker '{speaker_id}'. Available: {list(SPEAKER_MAP.keys())}"
        )

    ref_path = Path(MODEL_DIR) / "ref_audio" / speaker_meta["ref"]
    if not ref_path.exists():
        raise HTTPException(
            status_code=503,
            detail=f"Reference audio '{speaker_meta['ref']}' not found at {ref_path}. "
                   "Run download_models.py to populate ref_audio/ directory."
        )

    try:
        model = get_model()
        audio = model(
            req.input,
            ref_audio_path=str(ref_path),
            ref_text="",          # IndicF5 auto-transcribes the ref
        )
        # audio is a numpy array at SAMPLE_RATE
        audio_np = np.array(audio, dtype=np.float32)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IndicF5 inference error: {e}")

    # ── Encode to WAV ─────────────────────────────────────────────────────────
    import wave, struct
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)   # 16-bit
        wf.setframerate(SAMPLE_RATE)
        pcm = (audio_np * 32767).astype(np.int16)
        wf.writeframes(pcm.tobytes())
    wav_bytes = buf.getvalue()

    if req.response_format == "mp3":
        # Convert WAV→MP3 via ffmpeg (must be in the Docker image)
        import subprocess, shlex
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(wav_bytes)
            tmp_path = tmp.name
        try:
            result = subprocess.run(
                f"ffmpeg -i {shlex.quote(tmp_path)} -f mp3 pipe:1",
                shell=True, capture_output=True
            )
            if result.returncode != 0:
                raise HTTPException(status_code=500, detail="ffmpeg WAV→MP3 failed")
            return Response(content=result.stdout, media_type="audio/mpeg")
        finally:
            os.unlink(tmp_path)

    return Response(content=wav_bytes, media_type="audio/wav")
