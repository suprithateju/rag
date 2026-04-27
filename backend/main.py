import os
import shutil
import threading
from typing import List, Optional, Dict
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import settings

# Auth and DB imports
from database import engine, get_db
import models
from auth import verify_password, get_password_hash, create_access_token, get_current_user, get_user_from_token

# Create database tables
models.Base.metadata.create_all(bind=engine)

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

# Auth Models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

@app.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer", "username": user.username}

@app.get("/me")
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return {"username": current_user.username, "email": current_user.email}

class QueryRequest(BaseModel):
    query: str
    history: Optional[List[Dict[str, str]]] = None

@app.post("/upload/")
async def upload_documents(
    background_tasks: BackgroundTasks, 
    files: List[UploadFile] = File(...),
    current_user: models.User = Depends(get_current_user)
):
    total_pages = 0
    all_documents = []
    
    from pdf_parser import extract_text_with_metadata
    from vector_store import process_and_store_documents
    
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, f"user_{current_user.id}")
    os.makedirs(user_upload_dir, exist_ok=True)
    
    for file in files:
        if not file.filename.endswith(".pdf"):
            continue
            
        # Save the file permanently for PDF viewer
        dest_path = os.path.join(user_upload_dir, file.filename)
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
        background_tasks.add_task(
            process_and_store_documents, 
            all_documents,
            f"user_{current_user.id}"
        )
        
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
async def upload_url_endpoint(
    request: UrlUploadRequest, 
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user)
):
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, f"user_{current_user.id}")
    os.makedirs(user_upload_dir, exist_ok=True)
    
    # We will use the domain name as the file name, or just a safe version of the URL
    import urllib.parse
    parsed_url = urllib.parse.urlparse(request.url)
    domain = parsed_url.netloc or "unknown_domain"
    # Create a safe filename
    safe_filename = "".join([c if c.isalnum() else "_" for c in domain + parsed_url.path]) + ".txt"
    dest_path = os.path.join(user_upload_dir, safe_filename)
    
    try:
        from url_parser import extract_text_from_url
        from vector_store import process_and_store_documents
        documents = extract_text_from_url(request.url, safe_filename)
        
        if not documents:
            raise HTTPException(status_code=400, detail="Could not extract any text from the URL.")
            
        # Save the raw text for the dashboard transcript
        raw_text = "\n".join([doc["text"] for doc in documents])
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(raw_text)
            
        # Store in ChromaDB
        background_tasks.add_task(
            process_and_store_documents, 
            documents,
            f"user_{current_user.id}"
        )
        
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
async def query_document(
    request: QueryRequest,
    current_user: models.User = Depends(get_current_user)
):
    try:
        from rag_pipeline import answer_question_stream
        # Use StreamingResponse to stream from generator
        return StreamingResponse(
            answer_question_stream(
                request.query, 
                history=request.history,
                collection_name=f"user_{current_user.id}"
            ),
            media_type="text/event-stream"
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/")
async def analyze_document_endpoint(
    request: AnalyzeRequest,
    current_user: models.User = Depends(get_current_user)
):
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, f"user_{current_user.id}")
    try:
        from document_analyzer import analyze_document
        result = analyze_document(request.filename, user_dir=user_upload_dir)
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/")
async def list_documents(current_user: models.User = Depends(get_current_user)):
    try:
        user_upload_dir = os.path.join(settings.UPLOAD_DIR, f"user_{current_user.id}")
        os.makedirs(user_upload_dir, exist_ok=True)
        files = [f for f in os.listdir(user_upload_dir) if f.endswith('.pdf') or f.endswith('.txt')]
        return {"documents": files}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Securely serve the uploaded PDFs with token query param
@app.get("/docs/{filename}")
async def get_document(filename: str, token: str, db: Session = Depends(get_db)):
    try:
        user = await get_user_from_token(token, db)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Invalid or missing token")
        
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, f"user_{user.id}")
    file_path = os.path.join(user_upload_dir, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(file_path)

@app.get("/")
async def root():
    return {"message": "DocuMind API is running successfully. Please use http://localhost:5173 for the frontend UI."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
