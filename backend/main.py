import os
import shutil
import threading
from typing import List, Optional, Dict
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from config import settings
from pdf_parser import extract_text_with_metadata
from url_parser import extract_text_from_url
from vector_store import process_and_store_documents
from rag_pipeline import answer_question_stream
from document_analyzer import analyze_document

app = FastAPI(title="DocuMind API", description="AI-Powered Document Intelligence System")

@app.on_event("startup")
async def startup_event():
    # Warm up the embeddings model in the background to avoid long delays on first query
    from vector_store import get_embeddings_model
    threading.Thread(target=get_embeddings_model, daemon=True).start()

# Configure CORS for React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str
    history: Optional[List[Dict[str, str]]] = None

@app.post("/upload/")
async def upload_documents(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    total_pages = 0
    all_documents = []
    
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    for file in files:
        if not file.filename.endswith(".pdf"):
            continue
            
        # Save the file permanently for PDF viewer
        dest_path = os.path.join(settings.UPLOAD_DIR, file.filename)
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        try:
            # Extract text
            documents = extract_text_with_metadata(dest_path)
            
            # Using just filename as source metadata for better UI display
            for doc in documents:
                doc["metadata"]["source"] = file.filename
                
            all_documents.extend(documents)
            total_pages += len(documents)
        except Exception as e:
            print(f"Error processing {file.filename}: {e}")
            
    if not all_documents:
        raise HTTPException(status_code=400, detail="No valid PDF documents processed.")
        
    try:
        # Store in ChromaDB and raw DB in the background
        background_tasks.add_task(process_and_store_documents, all_documents)
        
        return {
            "message": f"Successfully processing {len(files)} file(s) in background", 
            "pages_processed": total_pages,
            "files": [f.filename for f in files]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class UrlUploadRequest(BaseModel):
    url: str

@app.post("/upload-url/")
async def upload_url_endpoint(request: UrlUploadRequest, background_tasks: BackgroundTasks):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # We will use the domain name as the file name, or just a safe version of the URL
    import urllib.parse
    parsed_url = urllib.parse.urlparse(request.url)
    domain = parsed_url.netloc or "unknown_domain"
    # Create a safe filename
    safe_filename = "".join([c if c.isalnum() else "_" for c in domain + parsed_url.path]) + ".txt"
    dest_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    try:
        documents = extract_text_from_url(request.url, safe_filename)
        
        if not documents:
            raise HTTPException(status_code=400, detail="Could not extract any text from the URL.")
            
        # Save the raw text for the dashboard transcript
        raw_text = "\n".join([doc["text"] for doc in documents])
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(raw_text)
            
        # Store in ChromaDB
        background_tasks.add_task(process_and_store_documents, documents)
        
        return {
            "message": f"Successfully processing URL in background", 
            "pages_processed": len(documents),
            "files": [safe_filename]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnalyzeRequest(BaseModel):
    filename: str

@app.post("/query/")
async def query_document(request: QueryRequest):
    try:
        # Use StreamingResponse to stream from generator
        return StreamingResponse(
            answer_question_stream(request.query, history=request.history),
            media_type="text/event-stream"
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/")
async def analyze_document_endpoint(request: AnalyzeRequest):
    try:
        result = analyze_document(request.filename)
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/")
async def list_documents():
    try:
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        files = [f for f in os.listdir(settings.UPLOAD_DIR) if f.endswith('.pdf') or f.endswith('.txt')]
        return {"documents": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Serve the uploaded raw PDFs
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/docs", StaticFiles(directory=settings.UPLOAD_DIR), name="docs")

@app.get("/")
async def root():
    return {"message": "DocuMind API is running successfully. Please use http://localhost:5173 for the frontend UI."}
