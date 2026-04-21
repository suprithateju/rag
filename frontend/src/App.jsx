import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';

function App() {
  const [selectedPdf, setSelectedPdf] = useState(null);

  const handlePdfView = (source, page) => {
    setSelectedPdf({ source, page });
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-slate-50 relative">
      <Sidebar />
      
      <div className="flex-1 flex max-w-full min-w-0 transition-all duration-300">
          <ChatInterface onPdfView={handlePdfView} />
          
          {selectedPdf && (
            <div className="w-1/2 border-l border-slate-200 bg-white flex flex-col shadow-2xl animate-in slide-in-from-right-8 duration-300">
              <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
                <h3 className="font-semibold text-sm truncate pr-4">
                  {selectedPdf.source} - Page {selectedPdf.page}
                </h3>
                <button 
                  onClick={() => setSelectedPdf(null)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-xs font-semibold transition-colors"
                >
                  Close Viewer
                </button>
              </div>
              <div className="flex-1 w-full bg-slate-100">
                <iframe 
                  src={`http://localhost:8000/docs/${encodeURIComponent(selectedPdf.source)}#page=${selectedPdf.page}`} 
                  className="w-full h-full border-none"
                  title="PDF Viewer"
                ></iframe>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default App;
