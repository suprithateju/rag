import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    CHROMA_DB_DIR = ".data/chroma_db"
    RAW_DOCS_DIR = ".data/raw_docs"
    UPLOAD_DIR = ".uploaded_docs"
    EMBEDDING_MODEL = "all-MiniLM-L6-v2"
    RERANKER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    CHUNK_SIZE = 500
    CHUNK_OVERLAP = 50
    LLM_MODEL = "llama-3.1-8b-instant"

settings = Settings()
