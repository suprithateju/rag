import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, Files } from 'lucide-react';
import { uploadDocument } from '../api';

const Sidebar = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState(null); 
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    // Collect all valid PDFs
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
      setFiles([]); // Clear selection after uploading
    } catch (error) {
      setStatus({ type: 'error', message: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-80 border-r border-slate-200 bg-white h-[100vh] flex flex-col p-6 shadow-sm z-10 glass-panel shrink-0">
      <div className="flex items-center gap-3 mb-8 text-primary-600">
        <div className="p-2 bg-primary-50 rounded-xl">
          <FileText className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800">DocuMind</h1>
      </div>

      <div className="flex-1">
        <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase mb-4">
          Library Management
        </h2>
        
        <div 
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
            ${files.length > 0 ? 'border-primary-300 bg-primary-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'}`}
          onClick={() => fileInputRef.current?.click()}
        >
          {/* webkitdirectory attribute is added dynamically or standardly to allow folder select */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf"
            multiple
            className="hidden" 
          />
          <UploadCloud className={`w-10 h-10 mx-auto mb-3 ${files.length > 0 ? 'text-primary-500' : 'text-slate-400'}`} />
          
          {files.length > 0 ? (
             <div className="flex flex-col items-center gap-1">
               <Files className="w-4 h-4 text-primary-500" />
               <p className="text-sm font-medium text-slate-700">{files.length} document(s)</p>
             </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-slate-600">Upload PDF(s) or Folder</p>
              <p className="text-xs text-slate-400 mt-1">Multi-document support enabled</p>
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-slate-400 text-center italic hover:text-slate-500 cursor-pointer" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.webkitdirectory = 'true';
            input.multiple = true;
            input.onchange = handleFileChange;
            input.click();
        }}>
           Want to upload a whole folder? Click here.
        </div>

        {files.length > 0 && (
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Abstracting...
              </>
            ) : (
              'Add to Library'
            )}
          </button>
        )}

        {status && (
          <div className={`mt-4 p-3 rounded-xl flex items-start gap-2 text-sm
            ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
            {status.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            )}
            <p>{status.message}</p>
          </div>
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <p className="text-xs text-center text-slate-400">
          Powered by FastAPI, LangChain & CrossEncoder
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
