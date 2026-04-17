# DocuMind — AI-Powered Document Intelligence System

Real-World Problem it Solves: Students, researchers, and professionals waste hours manually reading through PDFs, textbooks, and research papers to find specific answers. This system lets you upload any document and ask questions in plain English — getting cited, accurate answers in seconds, something ChatGPT cannot do with your private files.

## Features (Phase 1)
- Upload a single PDF
- Ask a question, get an answer with page number
- Basic Streamlit UI

## Tech Stack
- **Backend:** FastAPI
- **RAG Pipeline:** LangChain
- **PDF Extraction:** PyMuPDF (fitz)
- **Embeddings:** Sentence-Transformers (`all-MiniLM-L6-v2`)
- **Vector DB:** ChromaDB
- **LLM:** Groq API (LLaMA 3)
- **Frontend:** Streamlit

## Setup Instructions

1. Obtain a Groq API key from [Groq Console](https://console.groq.com/keys).
2. Add your key to the `.env` file: `GROQ_API_KEY=your_key_here`
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI backend:
   ```bash
   uvicorn backend.main:app --reload
   ```
5. In a new terminal, run the Streamlit frontend:
   ```bash
   streamlit run frontend/app.py
   ```
