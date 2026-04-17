import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    CHROMA_DB_DIR = "data/chroma_db"
    EMBEDDING_MODEL = "all-MiniLM-L6-v2"
    CHUNK_SIZE = 500
    CHUNK_OVERLAP = 50
    LLM_MODEL = "llama-3.1-8b-instant"

settings = Settings()
