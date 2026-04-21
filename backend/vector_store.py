import os
import pickle
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever
from .config import settings

def get_embeddings_model():
    return HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL)

def process_and_store_documents(documents: list, collection_name: str = "documind"):
    """
    Chunks the documents and stores them in ChromaDB and raw storage for BM25.
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
    
    # Save chunks for BM25
    os.makedirs(settings.RAW_DOCS_DIR, exist_ok=True)
    raw_docs_path = os.path.join(settings.RAW_DOCS_DIR, f"{collection_name}_chunks.pkl")
    
    existing_chunks = []
    if os.path.exists(raw_docs_path):
        try:
            with open(raw_docs_path, 'rb') as f:
                existing_chunks = pickle.load(f)
        except:
            pass
            
    all_chunks = existing_chunks + chunks
    with open(raw_docs_path, 'wb') as f:
        pickle.dump(all_chunks, f)
    
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

def get_retriever(collection_name: str = "documind", k: int = 10):
    """
    Returns an EnsembleRetriever (Chroma + BM25).
    """
    embeddings = get_embeddings_model()
    
    if not os.path.exists(settings.CHROMA_DB_DIR):
        return None
        
    vector_store = Chroma(
        persist_directory=settings.CHROMA_DB_DIR,
        embedding_function=embeddings,
        collection_name=collection_name
    )
    chroma_retriever = vector_store.as_retriever(search_kwargs={"k": k})
    
    raw_docs_path = os.path.join(settings.RAW_DOCS_DIR, f"{collection_name}_chunks.pkl")
    if os.path.exists(raw_docs_path):
        try:
            with open(raw_docs_path, 'rb') as f:
                all_chunks = pickle.load(f)
            if all_chunks:
                bm25_retriever = BM25Retriever.from_documents(all_chunks)
                bm25_retriever.k = k
                
                ensemble_retriever = EnsembleRetriever(
                    retrievers=[bm25_retriever, chroma_retriever], weights=[0.4, 0.6]
                )
                return ensemble_retriever
        except:
            pass
            
    return chroma_retriever
