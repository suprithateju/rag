import os
import shutil
from typing import List, Optional, Dict
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from .config import settings
from .pdf_parser import extract_text_with_metadata
from .vector_store import process_and_store_documents
from .rag_pipeline import answer_question_stream
from .document_analyzer import analyze_document

app = FastAPI(title="DocuMind API", description="AI-Powered Document Intelligence System")

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
        files = [f for f in os.listdir(settings.UPLOAD_DIR) if f.endswith('.pdf')]
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
