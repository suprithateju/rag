import json
from .config import settings
from .vector_store import get_retriever
from groq import Groq

# No reranker needed for super fast mode
reranker = None

def answer_question_stream(query: str, history: list = None, collection_name: str = "documind"):
    retriever = get_retriever(collection_name, k=4)
    if not retriever:
        raise ValueError("Vector store not found. Please upload and process a document first.")
        
    # 1. Retrieve Candidate Documents (Top 4 from Ensemble)
    source_docs = retriever.invoke(query)
    
    # 2. Extract Top Results (Skipping heavy CrossEncoder for speed)
    sources = []
    if source_docs:
        top_docs = source_docs[:3]
            
        context_parts = []
        for doc in top_docs:
            page = doc.metadata.get("page", "Unknown")
            source_file = doc.metadata.get("source", "Unknown")
            context_parts.append(f"[Page {page}]: {doc.page_content}")
            
            sources.append({
                "text": doc.page_content,
                "page": page,
                "source": source_file
            })
            
        context = "\n\n".join(context_parts)
    else:
        context = "No relevant context found."
        
    # 3. Prepare Prompt with History
    system_prompt = f"""Use the following pieces of retrieved context to answer the user's question.
If you don't know the answer, just say that you don't know. Don't try to make up an answer.
Include the page number(s) from the context in your answer if applicable.

Context:
{context}"""

    messages = [{"role": "system", "content": system_prompt}]
    
    if history:
        for msg in history:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
            
    messages.append({"role": "user", "content": query})
    
    # 4. Stream LLM Response
    if not settings.GROQ_API_KEY:
        yield json.dumps({"type": "sources", "data": sources}) + "\n"
        yield "⚠️ **System Configuration Error**\n\nThe LLM API Key is missing. I cannot generate an answer without it.\n\nPlease create a `.env` file in your `rag` directory and add your key like this:\n`GROQ_API_KEY=gsk_your_key_here`\n\n*(Note: After saving the .env file, restart your backend server)*."
        return
        
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    # Yield sources as the very first chunk (encoded as JSON)
    yield json.dumps({"type": "sources", "data": sources}) + "\n"
    
    try:
        stream = client.chat.completions.create(
            messages=messages,
            model=settings.LLM_MODEL,
            temperature=0.0,
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content
    except Exception as e:
        yield f"\n\n⚠️ **LLM Generation Error**: {str(e)}"
