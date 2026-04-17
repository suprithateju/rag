import streamlit as st
import requests

# Configuration
API_URL = "http://localhost:8000"

st.set_page_config(page_title="DocuMind - AI Document Intelligence", page_icon="🧠", layout="wide")

st.title("🧠 DocuMind — AI-Powered Document Intelligence")
st.markdown("Upload a PDF document and ask questions about it. Get instant, cited answers!")

# Sidebar for uploading
with st.sidebar:
    st.header("Document Management")
    uploaded_file = st.file_uploader("Upload a PDF", type=["pdf"])
    
    if uploaded_file is not None:
        if st.button("Process Document"):
            with st.spinner("Uploading and processing... This might take a minute."):
                # Send to FastAPI
                files = {"file": (uploaded_file.name, uploaded_file.getvalue(), "application/pdf")}
                try:
                    response = requests.post(f"{API_URL}/upload/", files=files)
                    if response.status_code == 200:
                        st.success(f"Successfully processed {uploaded_file.name}!")
                        st.info(f"Processed {response.json().get('pages_processed', 'unknown')} pages.")
                    else:
                        st.error(f"Error: {response.json().get('detail', 'Unknown error')}")
                except requests.exceptions.ConnectionError:
                    st.error("Failed to connect to the backend server. Please ensure FastAPI is running.")

# Main chat interface
st.header("Ask Questions")
query = st.text_input("What would you like to know about the document?")

if st.button("Ask"):
    if not query:
        st.warning("Please enter a question.")
    else:
        with st.spinner("Searching and generating answer..."):
            try:
                response = requests.post(f"{API_URL}/query/", json={"query": query})
                
                if response.status_code == 200:
                    data = response.json()
                    answer = data.get("answer", "No answer found.")
                    sources = data.get("sources", [])
                    
                    st.markdown("### Answer")
                    st.write(answer)
                    
                    if sources:
                        st.markdown("### Sources")
                        for i, source in enumerate(sources):
                            with st.expander(f"Source {i+1} - Page {source.get('page', 'Unknown')}"):
                                st.write(f"**From:** {source.get('source', 'Unknown')} (Page {source.get('page', 'Unknown')})")
                                st.write(source.get("text", ""))
                else:
                    st.error(f"Error: {response.json().get('detail', 'Unknown error')}")
            except requests.exceptions.ConnectionError:
                st.error("Failed to connect to the backend server. Please ensure FastAPI is running.")
