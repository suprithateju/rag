import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import LearningDashboard from './components/LearningDashboard';
import AuthPage from './components/AuthPage';
import { analyzeDocument } from './api';
import { Loader2, MessageSquare } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';

function AppContent() {
  const { user, token } = useAuth();
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [viewMode, setViewMode] = useState('chat'); // 'chat' | 'dashboard'
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handlePdfView = (source, page) => {
    setSelectedPdf({ source, page });
  };

  const handleAnalyzeFile = async (filename) => {
    try {
        setIsAnalyzing(true);
        setViewMode('chat'); // Reset briefly or show loading overlay
        const data = await analyzeDocument(filename);
        setAnalysisData(data);
        setViewMode('dashboard');
    } catch(err) {
        alert("Failed to analyze document: " + err.message);
    } finally {
        setIsAnalyzing(false);
    }
  };

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-slate-900 relative overflow-hidden font-outfit selection:bg-fuchsia-500/30 selection:text-fuchsia-900">
      
      {/* Spectacular Vibrant Animated Mesh Background */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-70 animate-blob animation-delay-4000"></div>

      {/* Main glass application window */}
      <div className="w-full max-w-[1600px] h-[92vh] bg-white/90 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/40 flex relative z-10">
        
        <Sidebar onAnalyzeFile={handleAnalyzeFile} />
        
        <div className="flex-1 flex max-w-full min-w-0 transition-all duration-500 relative">
            
            {/* View Switcher Overlay Action */}
            {analysisData && !isAnalyzing && viewMode === 'chat' && (
                <div className="absolute top-5 right-8 z-50">
                    <button onClick={() => setViewMode('dashboard')} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white border border-white/20 rounded-xl shadow-[0_10px_20px_rgba(217,70,239,0.3)] font-black hover:scale-105 transition-all">
                        View Dashboard ✨
                    </button>
                </div>
            )}

            {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center relative z-20 animate-in fade-in duration-500">
                     <div className="w-24 h-24 border-4 border-white border-t-fuchsia-500 rounded-full animate-spin mb-6 shadow-xl"></div>
                     <h2 className="text-3xl font-black text-slate-800 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-fuchsia-600">Extracting Knowledge...</h2>
                     <p className="text-slate-500 font-bold mt-2 text-[15px]">Reading document and generating intelligent summaries.</p>
                </div>
            ) : viewMode === 'dashboard' ? (
                <LearningDashboard data={analysisData} onClose={() => setViewMode('chat')} />
            ) : (
                <ChatInterface onPdfView={handlePdfView} />
            )}
            
            {selectedPdf && viewMode === 'chat' && (
              <div className="w-[45%] lg:w-[40%] xl:w-[45%] border-l border-white/50 bg-white/50 backdrop-blur-md flex flex-col shadow-2xl animate-in slide-in-from-right-8 duration-500 relative z-30">
                
                <div className="bg-white/60 backdrop-blur-xl text-slate-800 border-b border-white/50 p-5 flex justify-between items-center shrink-0 z-20">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md transform rotate-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div className="flex flex-col truncate">
                        <h3 className="font-bold text-[15px] truncate text-slate-800 tracking-tight leading-tight">
                          {selectedPdf.source}
                        </h3>
                        <p className="text-[12px] text-fuchsia-600 font-bold tracking-wide">Page {selectedPdf.page}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedPdf(null)}
                    className="p-2.5 bg-white hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-700 border border-transparent shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                
                <div className="flex-1 w-full relative">
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
                      <div className="w-10 h-10 border-4 border-slate-200 border-t-fuchsia-500 rounded-full animate-spin mb-4 shadow-sm"></div>
                      <p className="text-[13px] tracking-widest uppercase font-black text-slate-300">Loading Document</p>
                  </div>
                  <iframe 
                    src={`http://127.0.0.1:8000/docs/${encodeURIComponent(selectedPdf.source)}?token=${token}#page=${selectedPdf.page}&view=FitH`} 
                    className="w-full h-full border-none bg-transparent relative z-10"
                    title="PDF Viewer"
                  ></iframe>
                </div>

              </div>
            )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
