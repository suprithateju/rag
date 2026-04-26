import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, Files, Database, Sparkles, Link as LinkIcon, Globe, LogOut } from 'lucide-react';
import { uploadDocument, fetchDocuments, uploadUrl } from '../api';
import { useAuth } from '../AuthContext';

const Sidebar = ({ onUploadSuccess, onAnalyzeFile }) => {
  const [files, setFiles] = useState([]);
  const [url, setUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState(null); 
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const fileInputRef = useRef(null);
  const { user, logout } = useAuth();

  const loadDocuments = async () => {
    try {
        const data = await fetchDocuments();
        if (data && data.documents) {
            setUploadedDocs(data.documents);
        }
    } catch(err) {
        console.error("Failed to fetch documents", err);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validPdfs = selectedFiles.filter(file => file.type === 'application/pdf');
    
    if (validPdfs.length > 0) {
      setFiles(validPdfs);
      setStatus(null);
    } else {
      setStatus({ type: 'error', message: 'Please select valid PDF files.' });
    }
  };

  const handleUpload = async () => {
    if (files.length === 0 && !url.trim()) return;

    setIsUploading(true);
    setStatus(null);

    try {
      if (files.length > 0) {
        const data = await uploadDocument(files);
        setStatus({ 
          type: 'success', 
          message: `Indexed ${data.pages_processed || 'all'} pages! ✨` 
        });
        await loadDocuments();
        
        if (onAnalyzeFile && files.length > 0) {
            onAnalyzeFile(files[0].name);
        }
        setFiles([]); 
      } else if (url.trim()) {
        const data = await uploadUrl(url.trim());
        setStatus({ 
          type: 'success', 
          message: `Indexed webpage! ✨` 
        });
        await loadDocuments();
        
        if (onAnalyzeFile && data.files && data.files.length > 0) {
            onAnalyzeFile(data.files[0]);
        }
        setUrl("");
      }
      
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-[340px] bg-white/40 border-r border-white/60 h-full flex flex-col p-7 z-20 shrink-0 relative overflow-y-auto backdrop-blur-md custom-scrollbar">
      
      {/* Brand Header */}
      <div className="flex items-center gap-4 mb-8 px-1 mt-2">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-2xl shadow-[0_8px_16px_rgba(217,70,239,0.3)] text-white transform -rotate-6">
          <Database className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-800 bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-fuchsia-600">DocuMind</h1>
      </div>

      <div className="flex-1 px-1 flex flex-col">
        <h2 className="text-[12px] font-black tracking-widest text-fuchsia-400 uppercase mb-4 px-1">
          Knowledge Base
        </h2>
        
        {/* Upload Dropzone */}
        <div 
          className={`relative overflow-hidden border-2 border-dashed rounded-[24px] p-6 text-center cursor-pointer transition-all duration-500 group backdrop-blur-xl shrink-0
            ${files.length > 0 ? 'border-fuchsia-400 bg-fuchsia-500/10 shadow-[inset_0_0_20px_rgba(217,70,239,0.1)]' : 'border-purple-200 hover:border-fuchsia-400 bg-white/60 hover:bg-white/90 shadow-sm'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf"
            multiple
            className="hidden" 
          />
          {files.length > 0 ? (
             <div className="flex flex-col items-center gap-3 relative z-10 animate-in zoom-in duration-300">
               <div className="w-14 h-14 bg-gradient-to-br from-fuchsia-500 to-purple-600 rounded-[18px] flex items-center justify-center text-white shadow-lg rotate-3">
                  <Files className="w-6 h-6" />
               </div>
               <div className="mt-1">
                  <p className="text-[14px] font-black text-slate-800">Ready to Abstract</p>
                  <p className="text-[12px] text-fuchsia-600 mt-1 font-bold">{files.length} document(s) in queue</p>
               </div>
             </div>
          ) : (
            <div className="flex flex-col items-center relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-[18px] flex items-center justify-center border border-white text-slate-400 mb-3 group-hover:scale-110 group-hover:rotate-6 group-hover:from-fuchsia-100 group-hover:to-purple-100 group-hover:text-fuchsia-500 group-hover:border-fuchsia-200 transition-all duration-500 shadow-sm">
                 <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-[14px] font-bold text-slate-700 mb-1">Click to browse files</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase tracking-widest px-1">
          <div className="h-px bg-white/60 flex-1"></div>
          <span className="px-2">OR</span>
          <div className="h-px bg-white/60 flex-1"></div>
        </div>

        {/* URL Input */}
        <div className="mt-4 relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <LinkIcon className="h-4 w-4 text-slate-400 group-focus-within:text-fuchsia-500 transition-colors" />
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => {
                setUrl(e.target.value);
                if (e.target.value) setFiles([]); // Clear files if URL is typed
            }}
            placeholder="Paste a website URL..."
            className="block w-full pl-10 pr-3 py-3 border border-white/60 rounded-2xl bg-white/60 backdrop-blur-sm text-[13px] font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent focus:bg-white transition-all shadow-sm"
          />
        </div>
        
        {/* Action Button */}
        {(files.length > 0 || url.trim()) && (
          <div className="mt-4 animate-in slide-in-from-bottom-4 duration-500 shrink-0">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white font-black py-3.5 px-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(217,70,239,0.4)] hover:shadow-[0_15px_35px_rgba(217,70,239,0.5)] transform hover:-translate-y-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" /> Weaving Magic...
                </>
              ) : (
                'Upload & Index'
              )}
            </button>
          </div>
        )}

        {/* Status Messages */}
        {status && (
          <div className={`mt-4 p-3 rounded-xl flex items-start gap-3 text-sm animate-in zoom-in duration-300 shadow-sm border shrink-0
            ${status.type === 'success' ? 'bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
            {status.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            )}
            <p className="font-bold text-[12px] leading-relaxed">{status.message}</p>
          </div>
        )}

        {/* Available Documents List */}
        {uploadedDocs.length > 0 && (
            <div className="mt-8 flex-1">
               <h2 className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-3 px-1">Available Documents</h2>
               <div className="space-y-3">
                   {uploadedDocs.map((doc, idx) => {
                       const isWebpage = doc.endsWith('.txt');
                       return (
                       <div key={idx} className="bg-white/60 border border-white p-3 rounded-2xl shadow-sm flex flex-col gap-3 group hover:bg-white/90 transition-colors">
                           <div className="flex items-center gap-2 overflow-hidden">
                               {isWebpage ? <Globe className="w-4 h-4 text-cyan-500 shrink-0" /> : <FileText className="w-4 h-4 text-purple-400 shrink-0" />}
                               <span className="text-[13px] font-bold text-slate-700 truncate" title={doc}>{isWebpage ? doc.replace('.txt', '') : doc}</span>
                           </div>
                           <button 
                               onClick={() => onAnalyzeFile && onAnalyzeFile(doc)}
                               className={`w-full text-white font-bold text-[12px] py-2 rounded-xl flex items-center justify-center gap-1.5 hover:shadow-lg transition-all opacity-90 group-hover:opacity-100 ${isWebpage ? 'bg-gradient-to-r from-teal-400 to-emerald-500 hover:shadow-emerald-500/30' : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:shadow-cyan-500/30'}`}
                           >
                               <Sparkles className="w-3.5 h-3.5" /> Analyze {isWebpage ? 'Webpage' : 'PDF'}
                           </button>
                       </div>
                   )})}
               </div>
            </div>
        )}

      </div>

      {/* Footer */}
      <div className="mt-6 px-1 shrink-0 space-y-3">
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-white flex items-center justify-center text-slate-600 font-bold text-sm shadow-inner uppercase">
                  {user?.username ? user.username[0] : 'U'}
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-slate-800 leading-tight truncate w-24">{user?.username || 'User'}</span>
                  <span className="text-[10px] font-black tracking-widest text-fuchsia-500 uppercase">Authenticated</span>
                </div>
            </div>
            <button 
              onClick={logout}
              className="p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors border border-transparent hover:border-red-100"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
        </div>
        <div className="flex items-center justify-center gap-2 mb-1.5 opacity-60">
            <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 shadow-[0_0_12px_rgba(217,70,239,0.8)] animate-pulse"></div>
            <span className="text-[11px] font-black tracking-widest text-slate-800 uppercase">System Online</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
