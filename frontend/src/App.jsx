import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';

function App() {
  const [selectedPdf, setSelectedPdf] = useState(null);

  const handlePdfView = (source, page) => {
    setSelectedPdf({ source, page });
  };

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#fafafa] relative selection:bg-blue-500/20">
      
      {/* Extremely subtle clean background gradient */}
      <div className="absolute top-0 w-full h-96 bg-gradient-to-b from-white to-transparent pointer-events-none z-0"></div>

      <Sidebar />
      
      <div className="flex-1 flex max-w-full min-w-0 transition-all duration-500 z-10 relative">
          <ChatInterface onPdfView={handlePdfView} />
          
          {selectedPdf && (
            <div className="w-[45%] border-l border-gray-200 bg-white flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.03)] animate-in slide-in-from-right-8 duration-500 relative">
              
              <div className="bg-white/90 backdrop-blur-md text-gray-800 border-b border-gray-100 p-4 flex justify-between items-center shrink-0 z-20">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  </div>
                  <h3 className="font-semibold text-sm truncate pr-4 text-gray-800 tracking-tight">
                    {selectedPdf.source} <span className="text-gray-400 font-normal ml-1">· Page {selectedPdf.page}</span>
                  </h3>
                </div>
                
                <button 
                  onClick={() => setSelectedPdf(null)}
                  className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
                  title="Close Viewer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div className="flex-1 w-full relative bg-gray-50/50">
                <div className="absolute inset-0 flex flex-col items-center justify-center z-0 text-gray-400">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
                    <p className="text-[11px] tracking-wider uppercase font-semibold text-gray-400">Rendering Document</p>
                </div>
                <iframe 
                  src={`http://localhost:8000/docs/${encodeURIComponent(selectedPdf.source)}#page=${selectedPdf.page}&view=FitH`} 
                  className="w-full h-full border-none bg-transparent relative z-10"
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
