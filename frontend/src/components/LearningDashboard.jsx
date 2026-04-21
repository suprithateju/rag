import React, { useState } from 'react';
import { BookOpen, List, CheckCircle, HelpCircle, ArrowRight, Brain, Lightbulb } from 'lucide-react';

const LearningDashboard = ({ data }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [quizAnswers, setQuizAnswers] = useState({});

  if (!data) return null;

  const handleQuizSelect = (qIndex, selectedOption) => {
    setQuizAnswers(prev => ({
      ...prev,
      [qIndex]: selectedOption
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar bg-transparent h-full relative z-20">
      
      {/* Dashboard Header Tabs */}
      <header className="bg-white/40 backdrop-blur-2xl border-b border-white/50 px-8 py-5 sticky top-0 z-30 shrink-0 flex items-center justify-between shadow-sm">
        <div className="flex bg-white/50 p-1 rounded-2xl shadow-inner border border-white/40 backdrop-blur-md">
            <button 
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-2.5 rounded-xl font-bold text-[14px] transition-all flex items-center gap-2 ${activeTab === 'summary' ? 'bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <BookOpen className="w-4 h-4" /> Executive Summary
            </button>
            <button 
                onClick={() => setActiveTab('topics')}
                className={`px-6 py-2.5 rounded-xl font-bold text-[14px] transition-all flex items-center gap-2 ${activeTab === 'topics' ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <List className="w-4 h-4" /> Key Topics
            </button>
            <button 
                onClick={() => setActiveTab('quiz')}
                className={`px-6 py-2.5 rounded-xl font-bold text-[14px] transition-all flex items-center gap-2 ${activeTab === 'quiz' ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <HelpCircle className="w-4 h-4" /> Interactive Quiz
            </button>
            <button 
                onClick={() => setActiveTab('transcript')}
                className={`px-6 py-2.5 rounded-xl font-bold text-[14px] transition-all flex items-center gap-2 ${activeTab === 'transcript' ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
                <BookOpen className="w-4 h-4" /> Transcript
            </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="p-8 md:p-12 w-full max-w-5xl mx-auto pb-32 animate-in fade-in duration-500">
        
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 shadow-xl border border-white/60 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                    <div className="p-3 bg-gradient-to-br from-fuchsia-100 to-purple-100 text-fuchsia-600 rounded-2xl">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Executive Summary</h2>
                        <p className="text-slate-500 font-medium mt-1">AI-abstracted core concepts from the text.</p>
                    </div>
                </div>
                <div className="text-[17px] leading-relaxed text-slate-700 space-y-6 font-medium">
                    {data.summary.split('\n').map((para, i) => (
                        <p key={i}>{para}</p>
                    ))}
                </div>
            </div>
        )}

        {/* TOPICS TAB */}
        {activeTab === 'topics' && (
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 shadow-xl border border-white/60 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                    <div className="p-3 bg-gradient-to-br from-cyan-100 to-blue-100 text-cyan-600 rounded-2xl">
                        <List className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Key Topics</h2>
                        <p className="text-slate-500 font-medium mt-1">Essential terminology and subjects to master.</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-4">
                    {data.topics.map((topic, index) => (
                        <div key={index} className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-105 cursor-pointer">
                            <Lightbulb className="w-5 h-5 text-cyan-500" />
                            <span className="font-bold text-slate-700 text-[16px]">{topic}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* QUIZ TAB */}
        {activeTab === 'quiz' && (
            <div className="space-y-8 animate-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-purple-600 to-fuchsia-600 rounded-[2rem] p-8 shadow-xl text-white">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <Brain className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">Knowledge Check</h2>
                            <p className="text-purple-100 font-medium mt-1">Test your understanding of the document.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {data.quiz.map((q, index) => {
                        const isAnswered = quizAnswers[index] !== undefined;
                        const isCorrect = quizAnswers[index] === q.answer;

                        return (
                            <div key={index} className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-lg border border-white/60">
                                <h3 className="text-[18px] font-black text-slate-800 mb-6 flex gap-3">
                                    <span className="text-fuchsia-500">{index + 1}.</span> {q.question}
                                </h3>
                                <div className="space-y-3">
                                    {q.options.map((opt, optIdx) => {
                                        const isSelected = quizAnswers[index] === opt;
                                        const isActualCorrect = opt === q.answer;
                                        
                                        let btnClass = "bg-white border-slate-200 text-slate-700 hover:bg-slate-50";
                                        
                                        if (isAnswered) {
                                            if (isActualCorrect) {
                                                btnClass = "bg-emerald-50 border-emerald-500 text-emerald-800";
                                            } else if (isSelected) {
                                                btnClass = "bg-red-50 border-red-500 text-red-800";
                                            } else {
                                                btnClass = "bg-slate-50 border-slate-200 text-slate-400 opacity-50";
                                            }
                                        } else if (isSelected) {
                                            btnClass = "bg-purple-50 border-purple-400 text-purple-800";
                                        }

                                        return (
                                            <button 
                                                key={optIdx}
                                                onClick={() => !isAnswered && handleQuizSelect(index, opt)}
                                                disabled={isAnswered}
                                                className={`w-full text-left px-6 py-4 rounded-xl border-2 font-bold text-[15px] transition-all flex items-center justify-between ${btnClass}`}
                                            >
                                                {opt}
                                                {isAnswered && isActualCorrect && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                {isAnswered && (
                                    <div className={`mt-5 p-4 rounded-xl font-bold flex items-center gap-2 ${isCorrect ? 'text-emerald-700 bg-emerald-50' : 'text-fuchsia-700 bg-fuchsia-50'}`}>
                                        <ArrowRight className="w-5 h-5" /> 
                                        {isCorrect ? 'Correct! Excellent job.' : `Ah, almost! The correct answer is: ${q.answer}`}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* TRANSCRIPT TAB */}
        {activeTab === 'transcript' && (
            <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 shadow-xl border border-white/60 animate-in zoom-in-95 duration-300">
                <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                    <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-2xl">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Raw Transcript</h2>
                        <p className="text-slate-500 font-medium mt-1">The exact text extracted from the document.</p>
                    </div>
                </div>
                <div className="text-[15px] leading-relaxed text-slate-600 space-y-6 font-mono whitespace-pre-wrap bg-slate-50 p-6 rounded-2xl border border-slate-100 h-[600px] overflow-y-auto custom-scrollbar">
                    {data.transcript || 'No transcript available.'}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default LearningDashboard;
