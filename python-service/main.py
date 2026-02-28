
import os
import io
import logging
from typing import List, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from minio import Minio
from docling.document_converter import DocumentConverter
from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import psycopg2 

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ROOT_USER", "admin")
MINIO_SECRET_KEY = os.getenv("MINIO_ROOT_PASSWORD", "password")
MINIO_SECURE = os.getenv("MINIO_USE_SSL", "false").lower() == "true"

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@postgres:5432/ai-helpdesk")

# Initialize Clients
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

# DB Setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Embedder
# Load model globally (optimization: or load on demand)
logger.info("Loading embedding model...")
embedder = SentenceTransformer('all-MiniLM-L6-v2') 
logger.info("Model loaded.")

converter = DocumentConverter()

app = FastAPI()

class ProcessRequest(BaseModel):
    document_id: str
    bucket_name: str
    file_path: str

def update_status(doc_id: str, status: str, error: Optional[str] = None):
    try:
        with engine.connect() as conn:
            stmt = text("UPDATE documents SET status = :status WHERE id = :id")
            conn.execute(stmt, {"status": status, "id": doc_id})
            conn.commit()
    except Exception as e:
        logger.error(f"Failed to update status for {doc_id}: {e}")

def process_document_task(req: ProcessRequest):
    logger.info(f"Starting processing for {req.document_id}")
    update_status(req.document_id, "processing")
    
    try:
        # 1. Download file from Minio
        logger.info(f"Downloading {req.file_path} from {req.bucket_name}")
        response = minio_client.get_object(req.bucket_name, req.file_path)
        file_data = io.BytesIO(response.read())
        response.close()
        response.release_conn()

        # 2. Run Docling OCR
        logger.info("Running Docling conversion...")
        # docling needs a file path or file-like object?
        # Check docling API. Usually handles path. We might need to save to temp file.
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(file_data.getvalue())
            tmp_path = tmp.name
        
        result = converter.convert(tmp_path)
        markdown_text = result.document.export_to_markdown()
        
        os.remove(tmp_path)
        logger.info("Conversion complete.")

        # 3. Save processed text to 'processed-documents' bucket
        processed_bucket = "processed-documents"
        if not minio_client.bucket_exists(processed_bucket):
            minio_client.make_bucket(processed_bucket)
            
        processed_filename = f"{req.document_id}.md"
        processed_data = io.BytesIO(markdown_text.encode('utf-8'))
        minio_client.put_object(
            processed_bucket, 
            processed_filename, 
            processed_data, 
            len(processed_data.getvalue()), 
            content_type="text/markdown"
        )

        # 4. Generate Embeddings & Store in PGVector
        # Chunking (simple split for now, can be improved)
        chunks = split_text(markdown_text)
        
        logger.info(f"Generating embeddings for {len(chunks)} chunks...")
        embeddings = embedder.encode(chunks)
        
        # Determine embedding dimension from model -> 384 for all-MiniLM-L6-v2
        
        # Store in DB
        # We need to insert into document_chunks
        with engine.connect() as conn:
            # First clean up old chunks if any
            conn.execute(text("DELETE FROM document_chunks WHERE document_id = :id"), {"id": req.document_id})
            
            for i, chunk in enumerate(chunks):
                emb = embeddings[i].tolist()
                # Check format for pgvector insert. usually string list "[...]"
                conn.execute(
                    text("""
                        INSERT INTO document_chunks (document_id, content, chunk_index, embedding)
                        VALUES (:did, :content, :idx, :emb)
                    """),
                    {
                        "did": req.document_id, 
                        "content": chunk, 
                        "idx": i, 
                        "emb": str(emb) # pgvector expects '[...]' string representation in SQL arguments sometimes or explicit cast
                    }
                )
            conn.commit()

        # Update Status
        update_status(req.document_id, "completed")
        logger.info(f"Processing completed for {req.document_id}")

    except Exception as e:
        logger.error(f"Error processing {req.document_id}: {e}")
        update_status(req.document_id, "failed")

def split_text(text: str, chunk_size=1000):
    # Simple semantic split placeholder
    # In prod use recursive character splitter
    chunks = []
    current = ""
    for sentence in text.split('. '):
        if len(current) + len(sentence) > chunk_size:
            chunks.append(current)
            current = sentence + ". "
        else:
            current += sentence + ". "
    if current:
        chunks.append(current)
    return chunks

@app.post("/process")
async def trigger_processing(req: ProcessRequest, background_tasks: BackgroundTasks):
    # Retrieve doc info from request
    background_tasks.add_task(process_document_task, req)
    return {"message": "Processing started", "document_id": req.document_id}

@app.get("/health")
def health():
    return {"status": "ok"}
