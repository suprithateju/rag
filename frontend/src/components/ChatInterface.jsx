import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Info, ChevronDown, ChevronUp, FileSearch, Sparkles } from 'lucide-react';
import { queryDocumentStream } from '../api';

const SourceCitation = ({ source, index, onPdfView }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
             <span className="text-[10px] font-bold">{index + 1}</span>
          </div>
          <span className="text-[13px] font-medium text-gray-700 truncate">
            {source.source} <span className="text-gray-400 font-normal ml-1">• Page {source.page || '?'}</span>
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      
      {isOpen && (
        <div className="bg-white text-[13px] text-gray-600 leading-relaxed border-t border-gray-100 flex flex-col">
          <div className="p-4 font-mono text-[12px] italic text-gray-500 bg-gray-50/50">
            "{source.text}"
          </div>
          <div className="p-2 border-t border-gray-100 bg-white">
              <button 
                onClick={() => onPdfView(source.source, source.page)}
                className="w-full py-2 flex items-center justify-center gap-2 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors rounded-lg font-semibold text-[11px] uppercase tracking-widest"
              >
                <FileSearch className="w-3.5 h-3.5" />
                View Document View
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ChatInterface = ({ onPdfView }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const currentQuery = query;
    setQuery('');
    setIsLoading(true);

    const newHistory = [...history, { role: 'user', content: currentQuery }];
    setHistory(newHistory);
    
    setHistory(prev => [...prev, { role: 'bot', content: '', sources: [], isStreaming: true }]);

    const apiHistory = newHistory.slice(0, -1).map(h => ({ role: h.role, content: h.content }));

    try {
      await queryDocumentStream(
        currentQuery, 
        apiHistory,
        (chunk) => {
           setHistory(prev => {
               const updated = [...prev];
               const lastIndex = updated.length - 1;
               updated[lastIndex] = {
                   ...updated[lastIndex],
                   content: updated[lastIndex].content + chunk
               };
               return updated;
           });
        },
        (sources) => {
           setHistory(prev => {
               const updated = [...prev];
               const lastIndex = updated.length - 1;
               updated[lastIndex] = {
                   ...updated[lastIndex],
                   sources: sources
               };
               return updated;
           });
        }
      );
      
      setHistory(prev => {
           const updated = [...prev];
           const lastIndex = updated.length - 1;
           updated[lastIndex] = { ...updated[lastIndex], isStreaming: false };
           return updated;
      });

    } catch (error) {
      setHistory(prev => {
           const updated = [...prev];
           const lastIndex = updated.length - 1;
           const errorMessage = updated[lastIndex].content ? `\n\nError: ${error.message}` : `Error: ${error.message}`;
           
           updated[lastIndex] = { 
               ...updated[lastIndex], 
               content: updated[lastIndex].content + errorMessage,
               isError: true,
               isStreaming: false
           };
           return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[100vh] bg-transparent relative z-20">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 px-8 py-5 sticky top-0 z-30 shrink-0 flex items-center justify-between">
        <div>
           <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
             <Sparkles className="w-5 h-5 text-blue-500" />
             AI Document Intelligence
           </h2>
           <p className="text-gray-500 text-[13px] mt-0.5 font-medium ml-7">Enterprise generative search architecture</p>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-8 pb-32">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-5 max-w-md mx-auto text-center animate-in fade-in duration-700">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-1 shadow-sm border border-gray-200">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 tracking-tight">How can I help?</h3>
            <p className="text-[14px] leading-relaxed text-gray-500">
              Upload your massive document libraries on the left and ask me any deeply technical or analytical question. I'll search through the layers and find exact citations.
            </p>
          </div>
        ) : (
          history.map((msg, index) => (
            <div 
              key={index} 
              className={`flex gap-4 w-full flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}
            >
              <div className={`flex gap-4 max-w-4xl w-full ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  
                  {/* Avatar box */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm border
                    ${msg.role === 'user' ? 'bg-gray-900 text-white border-gray-800' : 
                      msg.isError ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white text-blue-600 border-gray-200'}`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[calc(100%-3rem)]`}>
                    
                    {msg.role === 'bot' && (
                        <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-1.5 ml-1">Documind AI</span>
                    )}

                    <div className={`px-5 py-4 shadow-sm rounded-2xl text-[14px] leading-relaxed
                      ${msg.role === 'user' ? 'bg-gray-900 text-white rounded-tr-sm border border-gray-800 font-medium' : 
                        msg.isError ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-sm' : 
                        'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'}`}>
                      
                      {msg.isStreaming && !msg.content ? (
                          <div className="flex items-center gap-2 text-gray-400 font-medium tracking-wide">
                              <Loader2 className="w-4 h-4 animate-spin shrink-0 text-blue-500" /> Synthesizing answer...
                          </div>
                      ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}

                      {msg.isStreaming && msg.content && (
                          <span className="inline-block w-2.5 h-4 ml-1 bg-blue-500 animate-pulse align-middle rounded-sm"></span>
                      )}
                    </div>

                    {/* Sources Area */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="w-full mt-3 min-w-[300px]">
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 pl-1.5">
                          <Info className="w-3.5 h-3.5" />
                          Retrieved Sources
                        </div>
                        <div className="space-y-2.5">
                          {msg.sources.map((source, idx) => (
                            <SourceCitation key={idx} source={source} index={idx} onPdfView={onPdfView} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Floating Pill Component */}
      <div className="absolute bottom-6 left-0 w-full px-8 pointer-events-none z-40">
        <form onSubmit={handleAsk} className="max-w-4xl mx-auto relative group flex pointer-events-auto bg-white shadow-[0_4px_30px_rgba(0,0,0,0.08)] rounded-[20px] border border-gray-200 p-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your documents..."
            disabled={isLoading}
            className="w-full pl-5 pr-14 py-4 rounded-[16px] bg-transparent focus:outline-none transition-all text-gray-800 placeholder:text-gray-400 disabled:text-gray-400 font-medium text-[15px]"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-3 top-3 bottom-3 aspect-square bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        <p className="text-center text-[11px] text-gray-400 mt-3 font-medium pointer-events-auto">AI can make mistakes. Always verify with the cited source documents.</p>
      </div>

    </div>
  );
};

export default ChatInterface;
