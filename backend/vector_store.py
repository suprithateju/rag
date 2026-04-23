import os
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from config import settings

import threading

_embeddings_instance = None
_embeddings_lock = threading.Lock()

def get_embeddings_model():
    global _embeddings_instance
    with _embeddings_lock:
        if _embeddings_instance is None:
            _embeddings_instance = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)
    return _embeddings_instance

def process_and_store_documents(documents: list, collection_name: str = "documind"):
    """
    Chunks the documents and stores them in ChromaDB.
    """
    # 1. Convert to Langchain Document objects
    lc_docs = [
        Document(page_content=doc["text"], metadata=doc["metadata"])
        for doc in documents
    ]
    
    # 2. Chunking
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ".", " ", ""]
    )
    chunks = text_splitter.split_documents(lc_docs)
    
    # 3. Embedding and Storage
    embeddings = get_embeddings_model()
    
    # Ensure directory exists
    os.makedirs(settings.CHROMA_DB_DIR, exist_ok=True)
    
    # Create or update ChromaDB
    vector_db = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=settings.CHROMA_DB_DIR,
        collection_name=collection_name
    )
    
    return vector_db

def get_retriever(collection_name: str = "documind", k: int = 4):
    """
    Returns the Chroma Retriever.
    """
    if not os.path.exists(settings.CHROMA_DB_DIR):
        return None
        
    embeddings = get_embeddings_model()
        
    vector_store = Chroma(
        persist_directory=settings.CHROMA_DB_DIR,
        embedding_function=embeddings,
        collection_name=collection_name
    )
    chroma_retriever = vector_store.as_retriever(search_kwargs={"k": k})
    return chroma_retriever
