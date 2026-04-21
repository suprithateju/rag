import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const uploadDocument = async (files) => {
  const formData = new FormData();
  
  if (files instanceof FileList || Array.isArray(files)) {
    for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
    }
  } else {
    // Single file
    formData.append('files', files);
  }

  try {
    const response = await axios.post(`${API_URL}/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.detail || 'Upload failed');
    }
    throw new Error('Could not connect to the server');
  }
};

export const queryDocumentStream = async (query, history, onChunk, onSources) => {
  try {
    const response = await fetch(`${API_URL}/query/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, history }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Query failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    
    let isFirstChunk = true;
    let accumulatedText = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunkText = decoder.decode(value, { stream: true });
      
      if (isFirstChunk) {
        isFirstChunk = false;
        // The first chunk is JSON encoded sources + \n
        const lines = chunkText.split('\n');
        
        if (lines.length > 0) {
            try {
               const parsedJSON = JSON.parse(lines[0]);
               if (parsedJSON.type === "sources") {
                   onSources(parsedJSON.data);
               }
               // Send the rest of the chunks if they came in same read
               const remainder = lines.slice(1).join('\n');
               if (remainder) {
                   accumulatedText += remainder;
                   onChunk(remainder);
               }
            } catch (e) {
               // Fallback if not proper JSON or split differently
               accumulatedText += chunkText;
               onChunk(chunkText);
            }
        } else {
            accumulatedText += chunkText;
            onChunk(chunkText);
        }
      } else {
        accumulatedText += chunkText;
        onChunk(chunkText);
      }
    }
    return accumulatedText;
  } catch (error) {
    throw error;
  }
};
