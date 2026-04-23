import json
from config import settings
from vector_store import get_retriever
from groq import Groq

# No reranker needed for super fast mode
reranker = None

def answer_question_stream(query: str, history: list = None, collection_name: str = "documind"):
    retriever = None
    try:
        retriever = get_retriever(collection_name, k=8)
    except Exception as e:
        print(f"Notice: Failed to initialize retriever, likely due to a database lock by a background task: {e}")
    
    # 1. Retrieve Candidate Documents (if retriever exists)
    source_docs = []
    if retriever:
        try:
            source_docs = retriever.invoke(query)
        except Exception:
            pass # Failsafe if DB exists but throws error
    
    # 2. Extract Top Results
    sources = []
    if source_docs:
        top_docs = source_docs[:8]
            
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
    system_prompt = f"""You are DocuMind, an exceptionally intelligent AI assistant. 
Answer the user's question clearly and comprehensively.

If relevant retrieved context from one or MULTIPLE documents is provided below, use it to accurately answer the question.
If multiple different sources are provided, compare and synthesize information across them to provide a comprehensive answer.
Cite the source file names and page numbers if helpful.
If the context says "No relevant context found." or does not contain the answer, you MUST use your own general knowledge to answer the question. 
NEVER say "I don't know because it's not in the context" or "The provided context does not specify". Just answer the question directly.

IMPORTANT: At the very end of your response, ALWAYS provide exactly 3 relevant follow-up questions that the user might ask next. Format them EXACTLY like this:
---FOLLOWUPS---
Question 1?
Question 2?
Question 3?

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
        
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
    except Exception as e:
        yield json.dumps({"type": "sources", "data": sources}) + "\n"
        yield f"⚠️ **Client Error**: Failed to initialize AI client. Details: {str(e)}"
        return
    
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
