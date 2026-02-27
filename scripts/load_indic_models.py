import os
from huggingface_hub import snapshot_download

HF_HOME = os.getenv("HF_HOME", "/home/ubuntu/.cache/huggingface/hub")
repo_id = "rhasspy/piper-voices"

# Download Hindi (Pratham, Priyamvada, Rohan)
print("Downloading Hindi voices...")
snapshot_download(repo_id=repo_id, allow_patterns=["hi/hi_IN/pratham/medium/*", "hi/hi_IN/priyamvada/medium/*", "hi/hi_IN/rohan/medium/*"], cache_dir=HF_HOME)

# Download Malayalam
print("Downloading Malayalam voices...")
snapshot_download(repo_id=repo_id, allow_patterns=["ml/ml_IN/cml_tts/low/*"], cache_dir=HF_HOME)

# Download Telugu
print("Downloading Telugu voices...")
snapshot_download(repo_id=repo_id, allow_patterns=["te/te_IN/ammu/medium/*"], cache_dir=HF_HOME)

print("Downloads complete. Now we need to link them so speaches registry detects them.")
