import fitz  # PyMuPDF
from typing import List, Dict

def extract_text_with_metadata(pdf_path: str) -> List[Dict]:
    """
    Extracts text from a PDF and returns a list of dictionaries.
    Each dictionary contains the text and metadata (like page number).
    """
    doc = fitz.open(pdf_path)
    documents = []
    
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text")
        
        # Clean up text a bit
        text = " ".join(text.split())
        
        if text:
            documents.append({
                "text": text,
                "metadata": {
                    "source": pdf_path,
                    "page": page_num + 1 # 1-indexed pages
                }
            })
            
    return documents
