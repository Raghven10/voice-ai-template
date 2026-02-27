#!/usr/bin/env python3
"""
download_models.py — Run this ONCE on a machine with internet access.

Downloads:
  1. AI4Bharat/IndicF5 model weights → indicf5-service/models/IndicF5/
  2. IndicF5 sample reference audio files → indicf5-service/models/IndicF5/ref_audio/
  3. All Piper Indic voice models → piper-service/models/ (as .onnx + .onnx.json)

Then copy the entire project (or just the models/ folders) to your air-gapped server.

Usage:
  pip install huggingface_hub transformers torch
  export HF_TOKEN=hf_...     # only needed for IndicF5 (gated model)
  python scripts/download_models.py
"""

import os
import shutil
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
INDICF5_MODEL_DIR = ROOT / "indicf5-service" / "models" / "IndicF5"
PIPER_MODELS_DIR  = ROOT / "piper-service" / "models"
REF_AUDIO_DIR     = INDICF5_MODEL_DIR / "ref_audio"

INDICF5_MODEL_DIR.mkdir(parents=True, exist_ok=True)
PIPER_MODELS_DIR.mkdir(parents=True, exist_ok=True)
REF_AUDIO_DIR.mkdir(parents=True, exist_ok=True)

# ─── 1. Download IndicF5 model weights ────────────────────────────────────────
print("=" * 60)
print("Step 1: Downloading AI4Bharat IndicF5 model weights…")
print("=" * 60)
hf_token = os.environ.get("HF_TOKEN")
if not hf_token:
    print("⚠️  HF_TOKEN not set. If IndicF5 is gated you'll need to set it.")
    print("   export HF_TOKEN=hf_your_token_here")

try:
    from huggingface_hub import snapshot_download
    snapshot_download(
        repo_id="ai4bharat/IndicF5",
        local_dir=str(INDICF5_MODEL_DIR),
        token=hf_token,
        ignore_patterns=["*.msgpack", "*.h5", "flax_model*"],  # skip JAX/Flax weights
    )
    print(f"✅ IndicF5 weights saved to {INDICF5_MODEL_DIR}")
except Exception as e:
    print(f"❌ IndicF5 download failed: {e}")
    print("   If you see '403 Forbidden', request access at:")
    print("   https://huggingface.co/ai4bharat/IndicF5")

# ─── 2. Download IndicF5 ref audio samples ────────────────────────────────────
print()
print("=" * 60)
print("Step 2: Downloading IndicF5 reference audio samples…")
print("=" * 60)
# IndicF5 repo contains sample reference audio in the repo itself
REF_AUDIO_FILES = [
    # (hf_repo_filename, local_name)
    ("samples/hi_female.wav", "hi_female.wav"),
    ("samples/hi_male.wav",   "hi_male.wav"),
    ("samples/te_male.wav",   "te_male.wav"),
    ("samples/ta_female.wav", "ta_female.wav"),
    ("samples/mr_female.wav", "mr_female.wav"),
    ("samples/bn_female.wav", "bn_female.wav"),
    ("samples/ml_female.wav", "ml_female.wav"),
    ("samples/gu_male.wav",   "gu_male.wav"),
    ("samples/kn_male.wav",   "kn_male.wav"),
]

try:
    from huggingface_hub import hf_hub_download
    for hf_path, local_name in REF_AUDIO_FILES:
        local_path = REF_AUDIO_DIR / local_name
        if local_path.exists():
            print(f"  ✓ {local_name} (already exists)")
            continue
        try:
            src = hf_hub_download(
                repo_id="ai4bharat/IndicF5",
                filename=hf_path,
                token=hf_token,
            )
            shutil.copy(src, local_path)
            print(f"  ✅ {local_name}")
        except Exception as e:
            print(f"  ⚠️  {hf_path}: {e}")
            print(f"     You can manually place a ~5–10s WAV file at {local_path}")
except Exception as e:
    print(f"❌ Ref audio download failed: {e}")

# ─── 3. Download Piper Indic voice models ─────────────────────────────────────
print()
print("=" * 60)
print("Step 3: Downloading Piper Indic voice models…")
print("=" * 60)

PIPER_VOICES = {
    "hi_IN-pratham-medium":    "hi/hi_IN/pratham/medium/hi_IN-pratham-medium",
    "hi_IN-priyamvada-medium": "hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium",
    "te_IN-ammu-medium":       "te/te_IN/ammu/medium/te_IN-ammu-medium",
    "ta_IN-kokila-medium":     "ta/ta_IN/kokila/medium/ta_IN-kokila-medium",
    "ml_IN-maneesha-medium":   "ml/ml_IN/maneesha/medium/ml_IN-maneesha-medium",
    "kn_IN-saptha-medium":     "kn/kn_IN/saptha/medium/kn_IN-saptha-medium",
    "en_US-lessac-medium":     "en/en_US/lessac/medium/en_US-lessac-medium",
    "en_US-ryan-high":         "en/en_US/ryan/high/en_US-ryan-high",
}

try:
    from huggingface_hub import hf_hub_download
    for voice_id, hf_base_path in PIPER_VOICES.items():
        for ext in (".onnx", ".onnx.json"):
            local_path = PIPER_MODELS_DIR / f"{voice_id}{ext}"
            if local_path.exists():
                print(f"  ✓ {voice_id}{ext} (already exists)")
                continue
            try:
                src = hf_hub_download(
                    repo_id="rhasspy/piper-voices",
                    filename=hf_base_path + ext,
                )
                shutil.copy(src, local_path)
                print(f"  ✅ {voice_id}{ext}")
            except Exception as e:
                print(f"  ⚠️  {voice_id}{ext}: {e}")
except Exception as e:
    print(f"❌ Piper download failed: {e}")

# ─── Done ──────────────────────────────────────────────────────────────────────
print()
print("=" * 60)
print("Download complete!")
print()
print("Model directories:")
print(f"  IndicF5 weights : {INDICF5_MODEL_DIR}")
print(f"  IndicF5 ref wav : {REF_AUDIO_DIR}")
print(f"  Piper models    : {PIPER_MODELS_DIR}")
print()
print("Next steps for air-gapped deployment:")
print("  1. Copy this project (or just the models/ folders) to your server")
print("  2. docker compose up piper-tts indicf5-tts -d")
