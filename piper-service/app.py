import os
import subprocess
import shlex
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from huggingface_hub import hf_hub_download

app = FastAPI(title="Piper TTS Service", version="2.0.0")

DEFAULT_REPO = "rhasspy/piper-voices"
MODELS_DIR = "/app/models"
os.makedirs(MODELS_DIR, exist_ok=True)

class SpeechRequest(BaseModel):
    model: str = "piper"
    input: str
    voice: str = "hi_IN-pratham-medium"
    response_format: str = "wav"

# ─── Voice registry ───────────────────────────────────────────────────────────
# Maps voice_id → HuggingFace path (without extension) inside rhasspy/piper-voices
VOICE_REGISTRY: dict[str, str] = {
    # ── Hindi ──────────────────────────────────────────────────────────────
    "hi_IN-pratham-medium":    "hi/hi_IN/pratham/medium/hi_IN-pratham-medium",
    "hi_IN-priyamvada-medium": "hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium",
    # ── Telugu (real voices from rhasspy/piper-voices) ─────────────────────
    "te_IN-padmavathi-medium": "te/te_IN/padmavathi/medium/te_IN-padmavathi-medium",
    "te_IN-maya-medium":       "te/te_IN/maya/medium/te_IN-maya-medium",
    "te_IN-venkatesh-medium":  "te/te_IN/venkatesh/medium/te_IN-venkatesh-medium",
    # ── English (US / UK) ──────────────────────────────────────────────────
    "en_US-lessac-medium":     "en/en_US/lessac/medium/en_US-lessac-medium",
    "en_US-ryan-high":         "en/en_US/ryan/high/en_US-ryan-high",
    "en_GB-alan-medium":       "en/en_GB/alan/medium/en_GB-alan-medium",
    # ── Other Indic (add more verified IDs from rhasspy/piper-voices) ──────
    # Tamil, Kannada, Malayalam paths must be verified before adding
}

# Voices to pre-fetch at startup (must be verified to exist in rhasspy/piper-voices)
PREFETCH_VOICES = [
    "hi_IN-pratham-medium",
    "hi_IN-priyamvada-medium",
    "te_IN-padmavathi-medium",
    "en_US-lessac-medium",
]

def get_model_path(voice_id: str) -> str:
    """Resolve a voice_id to a local .onnx path, downloading if needed."""
    internal_path = VOICE_REGISTRY.get(voice_id)
    if not internal_path:
        raise HTTPException(status_code=400, detail=f"Unsupported voice: {voice_id}. Available: {list(VOICE_REGISTRY.keys())}")

    onnx_local = os.path.join(MODELS_DIR, f"{voice_id}.onnx")
    json_local = os.path.join(MODELS_DIR, f"{voice_id}.onnx.json")

    for ext, local_path in [(".onnx", onnx_local), (".onnx.json", json_local)]:
        if not os.path.exists(local_path):
            try:
                hf_path = internal_path + ext
                print(f"📥 Downloading {hf_path}…")
                fetched = hf_hub_download(repo_id=DEFAULT_REPO, filename=hf_path)
                try:
                    os.symlink(fetched, local_path)
                except FileExistsError:
                    pass
            except Exception as e:
                raise HTTPException(status_code=503, detail=f"Failed to download model {voice_id}: {e}. "
                                    "In air-gapped environments, pre-seed the models volume.")
    return onnx_local


@app.get("/health")
async def health():
    available = [v for v in VOICE_REGISTRY if os.path.exists(os.path.join(MODELS_DIR, f"{v}.onnx"))]
    return {"status": "ok", "available_voices": available, "registered_voices": list(VOICE_REGISTRY.keys())}


@app.get("/v1/voices")
async def list_voices():
    return [
        {
            "id": vid,
            "available": os.path.exists(os.path.join(MODELS_DIR, f"{vid}.onnx")),
        }
        for vid in VOICE_REGISTRY
    ]


@app.on_event("startup")
async def startup_event():
    print("🚀 Piper TTS Service starting — pre-fetching priority voices…")
    for voice_id in PREFETCH_VOICES:
        try:
            get_model_path(voice_id)
            print(f"  ✅ {voice_id}")
        except Exception as e:
            print(f"  ⚠️  {voice_id}: {e}")
    print("Pre-fetch complete.")


@app.post("/v1/audio/speech")
async def create_speech(req: SpeechRequest):
    try:
        model_path = get_model_path(req.voice)
        escaped_input = shlex.quote(req.input)

        if req.response_format == "mp3":
            cmd = f"echo {escaped_input} | piper -m {model_path} -f - | ffmpeg -i pipe:0 -f mp3 pipe:1"
            result = subprocess.run(cmd, shell=True, capture_output=True)
            if result.returncode != 0 or not result.stdout:
                print("Pipeline Error:", result.stderr.decode("utf-8"))
                raise HTTPException(status_code=500, detail="Piper→MP3 synthesis failed")
            return Response(content=result.stdout, media_type="audio/mpeg")
        else:
            cmd = f"echo {escaped_input} | piper -m {model_path} -f -"
            result = subprocess.run(cmd, shell=True, capture_output=True)
            if result.returncode != 0 or not result.stdout:
                print("Pipeline Error:", result.stderr.decode("utf-8"))
                raise HTTPException(status_code=500, detail="Piper synthesis failed")
            return Response(content=result.stdout, media_type="audio/wav")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
