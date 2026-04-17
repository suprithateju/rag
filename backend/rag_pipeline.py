import os
from .config import settings
from .vector_store import get_vector_store
from groq import Groq

def answer_question(query: str, collection_name: str = "documind"):
    vector_store = get_vector_store(collection_name)
    if not vector_store:
        raise ValueError("Vector store not found. Please upload and process a document first.")
        
    retriever = vector_store.as_retriever(search_kwargs={"k": 3})
    
    # Retrieve relevant documents
    source_docs = retriever.invoke(query)
    
    # Format context
    context_parts = []
    sources = []
    for doc in source_docs:
        page = doc.metadata.get("page", "Unknown")
        source_file = doc.metadata.get("source", "Unknown")
        context_parts.append(f"[Page {page}]: {doc.page_content}")
        
        sources.append({
            "text": doc.page_content,
            "page": page,
            "source": source_file
        })
        
    context = "\\n\\n".join(context_parts)
    
    prompt = f"""Use the following pieces of retrieved context to answer the question.
If you don't know the answer, just say that you don't know. Don't try to make up an answer.
Include the page number(s) from the context in your answer if applicable.

Context:
{context}

Question: {query}
Answer:"""

    # Call Groq API directly to avoid any langchain.chains versioning issues
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set. Please check your .env file.")
        
    client = Groq(api_key=settings.GROQ_API_KEY)
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model=settings.LLM_MODEL,
        temperature=0.0,
    )
    
    answer = chat_completion.choices[0].message.content
    
    return {
        "answer": answer,
        "sources": sources
    }
