import os
import json
from groq import Groq
from config import settings
from pdf_parser import extract_text_with_metadata

def analyze_document(filename: str):
    """
    Extracts text from a local PDF and sends it to Groq to generate a JSON 
    containing a Summary, Key Topics, and a Quiz.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not set.")

    # 1. Locate the file in the uploaded_docs directory
    filepath = os.path.join(settings.UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Document {filename} not found.")

    # 2. Extract Document Content (Limit to first 10 pages for cost/context speed)
    if filename.endswith(".pdf"):
        documents = extract_text_with_metadata(filepath)
        docs_to_analyze = documents[:10]  # Only process the first 10 pages
        extracted_text = "\n".join([doc["text"] for doc in docs_to_analyze])
    else:
        # It's a .txt file from a URL scrape
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()
            # Limit to roughly 30000 characters to match the 10 pages limit
            extracted_text = text[:30000]
    
    # 3. Create strict JSON prompt for Groq
    prompt = f"""
    You are an expert Document Intelligence AI. Read the following text extracted from a document
    and generate a comprehensive learning report.
    
    You MUST output valid, structured JSON. The JSON must exactly match this format:
    {{
        "summary": "A 3-paragraph executive summary of the text.",
        "topics": ["An array of 5 to 7 short string keywords/topics"],
        "quiz": [
            {{
                "question": "A multiple choice question?",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "answer": "The exact string of the correct option"
            }},
            // Generate exactly 5 multiple choice questions
        ]
    }}
    
    Extracted Text Context:
    -----------------------
    {extracted_text}
    """

    # 4. Infer via Groq with JSON payload enforcement
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model=settings.LLM_MODEL,
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    
    # 5. Return the parsed JSON
    raw_json = response.choices[0].message.content
    result = json.loads(raw_json)
    
    # 6. Inject the raw transcript directly into the response payload
    result["transcript"] = extracted_text
    return result
