import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, Files } from 'lucide-react';
import { uploadDocument } from '../api';

const Sidebar = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState(null); 
  const fileInputRef = useRef(null);

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
    if (files.length === 0) return;

    setIsUploading(true);
    setStatus(null);

    try {
      const data = await uploadDocument(files);
      setStatus({ 
        type: 'success', 
        message: `Successfully processed ${data.pages_processed || 'all'} pages from ${files.length} document(s).` 
      });
      if (onUploadSuccess) onUploadSuccess();
      setFiles([]); 
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-[320px] bg-white border-r border-gray-200 h-[100vh] flex flex-col p-7 shadow-[2px_0_20px_rgba(0,0,0,0.02)] z-20 shrink-0 relative">
      <div className="flex items-center gap-3 mb-10">
        <div className="p-2 bg-gradient-to-b from-blue-500 to-blue-600 rounded-xl shadow-sm text-white">
          <FileText className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">DocuMind</h1>
      </div>

      <div className="flex-1">
        <h2 className="text-[11px] font-bold tracking-widest text-gray-400 uppercase mb-4">
          Library Management
        </h2>
        
        <div 
          className={`relative overflow-hidden border border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300
            ${files.length > 0 ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'}`}
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
             <div className="flex flex-col items-center gap-2 relative z-10 animate-in fade-in duration-300">
               <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-blue-100 text-blue-600 shadow-sm">
                  <Files className="w-5 h-5" />
               </div>
               <div>
                  <p className="text-sm font-semibold text-gray-800">Ready to Upload</p>
                  <p className="text-[11px] text-blue-600 mt-0.5 font-medium">{files.length} document(s) queued</p>
               </div>
             </div>
          ) : (
            <div className="flex flex-col items-center relative z-10 group">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 mb-3 group-hover:scale-105 group-hover:text-blue-500 group-hover:border-blue-200 transition-all duration-300 shadow-sm">
                 <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-[13px] font-semibold text-gray-700 mb-1">Click or drag files</p>
              <p className="text-[11px] text-gray-500 leading-relaxed max-w-[200px]">Supports multiple PDFs simultaneously</p>
            </div>
          )}
        </div>
        
        <div className="mt-3 flex justify-center">
            <button 
                onClick={(e) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.webkitdirectory = 'true';
                    input.multiple = true;
                    input.onchange = handleFileChange;
                    input.click();
                }}
                className="text-[11px] text-gray-500 font-medium hover:text-blue-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-100"
            >
                <UploadCloud className="w-3.5 h-3.5" />
                Select entire folder
            </button>
        </div>

        {files.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full mt-5 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-bottom-2 duration-300"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> Processing...
              </>
            ) : (
              'Upload to Knowledge Base'
            )}
          </button>
        )}

        {status && (
          <div className={`mt-5 p-3.5 rounded-xl flex items-start gap-2.5 text-sm border animate-in fade-in duration-300
            ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
            {status.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            )}
            <p className="font-medium text-[13px] leading-relaxed">{status.message}</p>
          </div>
        )}
      </div>

      <div className="mt-auto pt-5 border-t border-gray-100">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">System Online</span>
            </div>
            <p className="text-[10px] font-semibold text-gray-400">
            v3.0.0 Clean
            </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
