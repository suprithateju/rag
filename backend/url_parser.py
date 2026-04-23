import requests
from bs4 import BeautifulSoup
from typing import List, Dict

def extract_text_from_url(url: str, source_name: str) -> List[Dict]:
    """
    Fetches a URL, extracts its text, and returns it as a list of dictionaries 
    (with one 'page' representing the whole webpage) to match the PDF parser format.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Remove script and style elements
    for script_or_style in soup(['script', 'style', 'header', 'footer', 'nav']):
        script_or_style.decompose()
        
    text = soup.get_text(separator=' ')
    
    # Clean up text
    text = " ".join(text.split())
    
    documents = []
    if text:
        # We split it into artificial "pages" of roughly 3000 characters just so it behaves somewhat like a PDF 
        # for the document_analyzer which takes the first 10 pages.
        chunk_size = 3000
        for i in range(0, len(text), chunk_size):
            chunk = text[i:i+chunk_size]
            page_num = (i // chunk_size) + 1
            documents.append({
                "text": chunk,
                "metadata": {
                    "source": source_name,
                    "page": page_num
                }
            })
            
    return documents
