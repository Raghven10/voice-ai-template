FROM python:3.11-slim

# System deps: ffmpeg for WAV→MP3 conversion
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    transformers \
    torch \
    torchaudio \
    numpy \
    soundfile \
    librosa \
    pydantic \
    git+https://github.com/ai4bharat/IndicF5.git

COPY app.py .

# The model weights + ref_audio/ are mounted in at runtime via docker-compose volume.
# MODEL_DIR=/app/models/IndicF5 (default in app.py)
ENV MODEL_DIR=/app/models/IndicF5

EXPOSE 8005

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8005", "--timeout-keep-alive", "120"]
