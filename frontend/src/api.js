const API_URL = 'http://127.0.0.1:8000';

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const registerUser = async (username, email, password) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Registration failed');
  }
  return await response.json();
};

export const loginUser = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed');
  }
  return await response.json();
};

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
    const response = await fetch(`${API_URL}/upload/`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const detail = errorData.detail;
        const errorMsg = Array.isArray(detail) ? JSON.stringify(detail) : (detail || 'Upload failed');
        throw new Error(errorMsg);
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Could not connect to the server');
  }
};

export const uploadUrl = async (url) => {
  try {
    const response = await fetch(`${API_URL}/upload-url/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'URL upload failed');
    }
    
    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Could not connect to the server');
  }
};

export const queryDocumentStream = async (query, history, onChunk, onSources) => {
  try {
    const response = await fetch(`${API_URL}/query/`, {
      method: 'POST',
      headers: getAuthHeaders(),
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

export const analyzeDocument = async (filename) => {
  try {
    const response = await fetch(`${API_URL}/analyze/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ filename }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Analysis failed');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || 'Could not connect to the server');
  }
};

export const fetchDocuments = async () => {
    try {
        const response = await fetch(`${API_URL}/documents/`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch documents");
        return await response.json();
    } catch (error) {
        throw error;
    }
};
