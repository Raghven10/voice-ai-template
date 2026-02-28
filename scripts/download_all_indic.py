#!/usr/bin/env python3
"""
download_all_indic.py — Downloads all Indic STT & TTS models to the centralized ./models/ directory.

Downloads:
  1. AI4Bharat/IndicF5 model weights → models/indicf5/IndicF5/
  2. All Piper Indic voice models → models/piper/ (as .onnx + .onnx.json)
  3. Whisper Fast Small STT model → via HF to models/speaches/hub/

Usage:
  pip install huggingface_hub transformers torch
  python scripts/download_all_indic.py
"""

import os
import shutil
from pathlib import Path

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
MODELS_DIR        = ROOT / "models"
INDICF5_MODEL_DIR = MODELS_DIR / "indicf5" / "IndicF5"
PIPER_MODELS_DIR  = MODELS_DIR / "piper"
SPEACHES_DIR      = MODELS_DIR / "speaches"

INDICF5_MODEL_DIR.mkdir(parents=True, exist_ok=True)
PIPER_MODELS_DIR.mkdir(parents=True, exist_ok=True)
SPEACHES_DIR.mkdir(parents=True, exist_ok=True)

# ─── 1. Download AI4Bharat IndicF5 (TTS) ──────────────────────────────────────
print("=" * 60)
print("Step 1: Downloading AI4Bharat IndicF5 model weights…")
print("=" * 60)
hf_token = os.environ.get("HF_TOKEN")
try:
    from huggingface_hub import snapshot_download
    snapshot_download(
        repo_id="ai4bharat/IndicF5",
        local_dir=str(INDICF5_MODEL_DIR),
        token=hf_token,
        ignore_patterns=["*.msgpack", "*.h5", "flax_model*"],
    )
    print(f"✅ IndicF5 weights saved to {INDICF5_MODEL_DIR}")
except Exception as e:
    print(f"❌ IndicF5 download failed: {e}")

# ─── 2. Download ALL Piper Indic Voices (TTS) ─────────────────────────────────
print()
print("=" * 60)
print("Step 2: Downloading ALL Piper Indic voice models…")
print("=" * 60)

PIPER_VOICES = {
    # Hindi
    "hi_IN-pratham-medium":    "hi/hi_IN/pratham/medium/hi_IN-pratham-medium",
    "hi_IN-priyamvada-medium": "hi/hi_IN/priyamvada/medium/hi_IN-priyamvada-medium",
    "hi_IN-swara-medium":      "hi/hi_IN/swara/medium/hi_IN-swara-medium",
    # Telugu
    "te_IN-ammu-medium":       "te/te_IN/ammu/medium/te_IN-ammu-medium",
    # Tamil
    "ta_IN-kokila-medium":     "ta/ta_IN/kokila/medium/ta_IN-kokila-medium",
    # Malayalam
    "ml_IN-maneesha-medium":   "ml/ml_IN/maneesha/medium/ml_IN-maneesha-medium",
    # Kannada
    "kn_IN-saptha-medium":     "kn/kn_IN/saptha/medium/kn_IN-saptha-medium",
    # Marathi
    "mr_IN-arohi-medium":      "mr/mr_IN/arohi/medium/mr_IN-arohi-medium",
    # Gujarati
    "gu_IN-niranjan-medium":   "gu/gu_IN/niranjan/medium/gu_IN-niranjan-medium",
    # Bengali
    "bn_IN-tanishq-medium":    "bn/bn_IN/tanishq/medium/bn_IN-tanishq-medium",
    # Punjabi
    "pa_IN-amandeep-medium":   "pa/pa_IN/amandeep/medium/pa_IN-amandeep-medium",
    # Odia
    "or_IN-suhas-medium":      "or/or_IN/suhas/medium/or_IN-suhas-medium",
    # Assamese
    "as_IN-minu-medium":       "as/as_IN/minu/medium/as_IN-minu-medium",
    # Nepali
    "ne_NP-kanya-medium":      "ne/ne_NP/kanya/medium/ne_NP-kanya-medium",
}

try:
    from huggingface_hub import hf_hub_download
    for voice_id, hf_base_path in PIPER_VOICES.items():
        for ext in (".onnx", ".onnx.json"):
            local_path = PIPER_MODELS_DIR / f"{voice_id}{ext}"
            if local_path.exists():
                pass
            else:
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

# ─── 3. Download whisper STT (Multilingual, handles all Indic) ─────────────────
print()
print("=" * 60)
print("Step 3: Downloading Multilingual Faster Whisper STT weights…")
print("=" * 60)
try:
    # Speaches expects cache at /data/hub/ inside the container. 
    import os
    os.environ["HF_HOME"] = str(SPEACHES_DIR)
    from huggingface_hub import snapshot_download
    snapshot_download("Systran/faster-whisper-small")
    print(f"✅ STT model saved to {SPEACHES_DIR}")
except Exception as e:
    print(f"❌ Whisper download failed: {e}")

print("\n🎉 DONE! All Indic TTS and STT models have been downloaded to ./models.")
