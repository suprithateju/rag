import json
from .config import settings
from .vector_store import get_retriever
from groq import Groq
from sentence_transformers import CrossEncoder

# Initialize Reranker globally
reranker = None
try:
    reranker = CrossEncoder(settings.RERANKER_MODEL)
except Exception as e:
    print(f"Failed to load reranker: {e}")

def answer_question_stream(query: str, history: list = None, collection_name: str = "documind"):
    retriever = get_retriever(collection_name, k=10)
    if not retriever:
        raise ValueError("Vector store not found. Please upload and process a document first.")
        
    # 1. Retrieve Candidate Documents (Top 10 from Ensemble)
    source_docs = retriever.invoke(query)
    
    # 2. Rerank using CrossEncoder
    sources = []
    if source_docs:
        if reranker and len(source_docs) > 1:
            pairs = [[query, doc.page_content] for doc in source_docs]
            scores = reranker.predict(pairs)
            
            # Sort documents by score descending
            scored_docs = sorted(zip(scores, source_docs), key=lambda x: x[0], reverse=True)
            # Take top 3
            top_docs = [doc for score, doc in scored_docs[:3]]
        else:
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
        raise ValueError("GROQ_API_KEY is not set. Please check your .env file.")
        
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    # Yield sources as the very first chunk (encoded as JSON)
    yield json.dumps({"type": "sources", "data": sources}) + "\n"
    
    stream = client.chat.completions.create(
        messages=messages,
        model=settings.LLM_MODEL,
        temperature=0.0,
        stream=True
    )
    
    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            yield chunk.choices[0].delta.content
