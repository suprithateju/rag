import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Info, ChevronDown, ChevronUp, FileSearch, Sparkles, Mic, Lightbulb } from 'lucide-react';
import { queryDocumentStream } from '../api';

const SourceCitation = ({ source, index, onPdfView }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-4 border border-white/60 rounded-2xl overflow-hidden bg-white/40 backdrop-blur-sm shadow-sm transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/50 transition-colors"
      >
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-fuchsia-100 to-purple-200 text-purple-700 flex items-center justify-center shrink-0 shadow-inner">
             <span className="text-[12px] font-black">{index + 1}</span>
          </div>
          <span className="text-[14px] font-bold text-slate-700 truncate">
            {source.source} <span className="text-purple-400 font-bold ml-1">• Page {source.page || '?'}</span>
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-purple-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-purple-400 shrink-0" />}
      </button>
      
      {isOpen && (
        <div className="bg-white/60 text-[14px] text-slate-700 leading-relaxed border-t border-white flex flex-col">
          <div className="p-5 font-mono text-[13px] text-slate-600">
            "{source.text}"
          </div>
          <div className="p-3 border-t border-white flex justify-end">
              <button 
                onClick={() => onPdfView(source.source, source.page)}
                className="px-5 py-2.5 flex items-center justify-center gap-2 text-purple-700 hover:text-white bg-purple-100 hover:bg-purple-600 transition-all rounded-xl font-bold text-[12px] shadow-sm uppercase tracking-widest"
              >
                <FileSearch className="w-4 h-4" />
                Inspect Raw Source
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
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSupported = !!SpeechRecognition;

  const toggleListening = () => {
      if (!speechSupported) return alert("Your browser doesn't support speech recognition.");
      
      if (isListening) {
          setIsListening(false);
          return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setQuery(prev => prev ? prev + ' ' + transcript : transcript);
          setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognition.start();
  };

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

    const apiHistory = newHistory.slice(0, -1).map(h => ({ 
        role: h.role === 'bot' ? 'assistant' : h.role, 
        content: h.content 
    }));

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
    <div className="flex-1 flex flex-col h-full bg-transparent relative z-20">
      
      {/* Header */}
      <header className="bg-white/40 backdrop-blur-2xl border-b border-white/50 px-8 py-5 sticky top-0 z-30 shrink-0 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
             <div className="p-2 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl text-white shadow-lg shadow-cyan-500/30">
                <Sparkles className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black tracking-tight text-slate-800">
                  Nexus Intelligence
                </h2>
                <p className="text-cyan-600 text-[13px] font-bold mt-0.5">Generative RAG Engine</p>
             </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-6 md:px-16 py-10 custom-scrollbar space-y-10 pb-40">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-6 max-w-lg mx-auto text-center animate-in zoom-in duration-700">
            <div className="w-24 h-24 bg-gradient-to-br from-fuchsia-400 to-cyan-400 rounded-[2rem] flex items-center justify-center text-white mb-2 shadow-[0_15px_35px_rgba(217,70,239,0.3)] border-4 border-white transform rotate-3 hover:rotate-0 transition-all duration-500 hover:scale-105">
              <Bot className="w-12 h-12" />
            </div>
            <h3 className="text-4xl font-black text-slate-800 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-600 to-cyan-600">Ask Anything!</h3>
            <p className="text-[17px] font-medium leading-relaxed text-slate-600">
              Upload your documents to the vibrant knowledge base on the left, then ask me complex questions. Let the magic begin.
            </p>
          </div>
        ) : (
          history.map((msg, index) => (
            <div 
              key={index} 
              className={`flex gap-5 w-full flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-4 fade-in duration-500`}
            >
              <div className={`flex gap-4 max-w-[85%] w-full ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  
                  {/* Avatar block */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border-2 mt-1
                    ${msg.role === 'user' ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white border-white' : 
                      msg.isError ? 'bg-red-50 text-red-500 border-red-200' : 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white border-white'}`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} w-full`}>
                    
                    {msg.role === 'bot' && (
                        <span className="text-[12px] font-black text-cyan-600 mb-1.5 ml-1 tracking-widest uppercase">Nexus AI</span>
                    )}

                    <div className={`px-6 py-5 w-full text-[16px] leading-relaxed backdrop-blur-md shadow-xl
                      ${msg.role === 'user' ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white rounded-[24px] rounded-tr-[4px] font-medium w-auto border border-white/20' : 
                        msg.isError ? 'bg-red-50 text-red-800 border border-red-100 rounded-[24px] rounded-tl-[4px] w-auto' : 
                        'bg-white/80 border border-white text-slate-800 rounded-[24px] rounded-tl-[4px] font-medium w-full'}`}>
                      
                      {msg.isStreaming && !msg.content ? (
                          <div className="flex items-center gap-3 text-cyan-600 font-bold tracking-wide">
                              <Loader2 className="w-5 h-5 animate-spin shrink-0" /> Conjuring Answer...
                          </div>
                      ) : (
                          <div className="whitespace-pre-wrap">
                            {msg.content.split('---FOLLOWUPS---')[0]}
                          </div>
                      )}

                      {msg.isStreaming && msg.content && !msg.content.includes('---FOLLOWUPS---') && (
                          <span className="inline-block w-3 h-5 ml-2 bg-gradient-to-t from-fuchsia-400 to-cyan-400 animate-pulse align-middle rounded-full"></span>
                      )}
                    </div>

                    {/* Follow up chips */}
                    {!msg.isStreaming && msg.content && msg.content.includes('---FOLLOWUPS---') && (
                      <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in duration-500">
                        {msg.content.split('---FOLLOWUPS---')[1].trim().split('\n').filter(q => q.trim().length > 0).map((question, qIdx) => {
                           const cleanQuestion = question.replace(/^\d+\.\s*/, '').trim();
                           return (
                             <button
                               key={qIdx}
                               onClick={() => {
                                 setQuery(cleanQuestion);
                                 setTimeout(() => {
                                   document.getElementById('chat-submit-btn').click();
                                 }, 100);
                               }}
                               className="px-4 py-2 bg-white/60 hover:bg-white backdrop-blur-sm border border-fuchsia-200 text-fuchsia-700 text-[13px] font-bold rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 hover:-translate-y-0.5"
                             >
                               <Lightbulb className="w-3.5 h-3.5" />
                               {cleanQuestion}
                             </button>
                           );
                        })}
                      </div>
                    )}

                    {/* Sources intentionally removed as requested by user */}
                  </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <div className="absolute bottom-8 left-0 w-full px-8 pointer-events-none z-40 flex justify-center">
        <form onSubmit={handleAsk} className="w-full max-w-4xl relative flex pointer-events-auto bg-white/80 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.1)] rounded-[32px] border border-white focus-within:ring-[6px] focus-within:ring-fuchsia-500/20 focus-within:bg-white transition-all p-2 group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a spell... (Ask a question about your documents)"
            disabled={isLoading}
            className="w-full pl-6 pr-32 py-4 rounded-[28px] bg-transparent focus:outline-none transition-all text-slate-800 placeholder:text-slate-400 disabled:text-slate-400 font-bold text-[16px]"
          />
          <div className="absolute right-3 top-3 bottom-3 flex items-center gap-2">
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`aspect-square rounded-[20px] transition-all flex items-center justify-center p-2 transform group-focus-within:scale-105 ${isListening ? 'bg-red-100 text-red-500 animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                title="Voice Input"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
            <button
              id="chat-submit-btn"
              type="submit"
              disabled={!query.trim() || isLoading}
              className="aspect-square bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white rounded-[20px] hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center p-2 transform group-focus-within:scale-105"
            >
              <Send className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default ChatInterface;
