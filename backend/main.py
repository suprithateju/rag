from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import shutil

from .pdf_parser import extract_text_with_metadata
from .vector_store import process_and_store_documents
from .rag_pipeline import answer_question

app = FastAPI(title="DocuMind API", description="AI-Powered Document Intelligence System")

# Configure CORS for Streamlit
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    query: str

@app.post("/upload/")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    # Save the file temporarily
    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Extract text
        documents = extract_text_with_metadata(temp_file_path)
        
        # Store in ChromaDB
        process_and_store_documents(documents)
        
        # Return success with number of pages extracted
        return {"message": f"Successfully processed {file.filename}", "pages_processed": len(documents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/query/")
async def query_document(request: QueryRequest):
    try:
        response = answer_question(request.query)
        return response
    except ValueError as ve:
        # Specifically catch ValueErrors like "Vector store not found"
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Serve the React Frontend
@app.get("/")
async def serve_frontend():
    return FileResponse("static/index.html")

app.mount("/static", StaticFiles(directory="static"), name="static")
