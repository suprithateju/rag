import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Info, ChevronDown, ChevronUp, FileSearch } from 'lucide-react';
import { queryDocumentStream } from '../api';

const SourceCitation = ({ source, index, onPdfView }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-700 truncate pr-4">
          Source {index + 1} • {source.source} (Page {source.page || '?'})
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      
      {isOpen && (
        <div className="bg-white text-sm text-slate-600 leading-relaxed border-t border-slate-100 flex flex-col">
          <div className="p-4 bg-slate-50/50 italic border-b border-slate-100">
            "{source.text}"
          </div>
          <button 
            onClick={() => onPdfView(source.source, source.page)}
            className="w-full py-2.5 flex items-center justify-center gap-2 text-primary-600 hover:bg-primary-50 hover:text-primary-700 transition-colors font-medium text-xs uppercase tracking-wider"
          >
            <FileSearch className="w-4 h-4" />
            View in PDF
          </button>
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
    
    // Create a scaffold for the assistant's response
    setHistory(prev => [...prev, { role: 'bot', content: '', sources: [], isStreaming: true }]);

    // Only send the previous context (excluding the new scaffold)
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
      
      // Mark as done streaming
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
    <div className="flex-1 flex flex-col h-[100vh] bg-slate-50 bg-[url('https://www.transparenttextures.com/patterns/micro-carbon.png')]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 shadow-sm sticky top-0 z-10 shrink-0">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Ask Questions</h2>
        <p className="text-slate-500 mt-1">Get precise, cited answers directly from your library</p>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 max-w-md mx-auto text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-2 shadow-sm border border-slate-200">
              <Bot className="w-8 h-8" />
            </div>
            <p className="text-lg font-semibold text-slate-700">No questions yet</p>
            <p className="text-sm leading-relaxed">Upload a PDF or folder to build your library, then start asking questions with Hybrid Search Memory!</p>
          </div>
        ) : (
          history.map((msg, index) => (
            <div 
              key={index} 
              className={`flex gap-4 w-full flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex gap-4 max-w-4xl ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md border border-slate-100
                    ${msg.role === 'user' ? 'bg-primary-600 text-white object-cover' : 
                      msg.isError ? 'bg-red-100 text-red-500' : 'bg-slate-800 text-white'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[100%]`}>
                    <div className={`p-4 rounded-2xl shadow-sm
                      ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-sm' : 
                        msg.isError ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-sm' : 
                        'bg-white text-slate-800 border border-slate-200 rounded-tl-sm'}`}>
                      
                      {msg.isStreaming && !msg.content ? (
                          <div className="flex items-center gap-2 text-slate-400">
                              <Loader2 className="w-4 h-4 animate-spin" /> Abstracting...
                          </div>
                      ) : (
                          <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      )}

                      {msg.isStreaming && msg.content && (
                          <span className="inline-block w-2 h-4 ml-1 bg-slate-400 animate-pulse align-middle"></span>
                      )}
                    </div>

                    {/* Sources Area */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="w-full mt-3 min-w-[300px]">
                        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium mb-1 pl-1">
                          <Info className="w-4 h-4" />
                          Cited Sources Context
                        </div>
                        <div className="space-y-2">
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

      {/* Input Area */}
      <div className="p-6 bg-white/50 backdrop-blur-md border-t border-slate-200 shrink-0">
        <form onSubmit={handleAsk} className="max-w-4xl mx-auto relative group flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question about your documents here..."
            disabled={isLoading}
            className="w-full pl-6 pr-14 py-4 rounded-full border border-slate-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 group-hover:border-slate-400"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="absolute right-2 top-2 p-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-5 h-5 pl-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
