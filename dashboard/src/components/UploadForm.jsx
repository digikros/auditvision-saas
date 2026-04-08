import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const UploadForm = ({ userId, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file => 
      ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)
    );
    if (droppedFiles.length > 0) setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadInvoices = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setProgress(30);
    setMessage(null);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('user_id', userId);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setProgress(100);

      if (response.ok) {
        setMessage({ type: 'success', text: 'Factura(s) processada(s) com sucesso!' });
        setFiles([]);
        setTimeout(() => {
          setIsUploading(false);
          setProgress(0);
          setMessage(null);
          if (onUploadSuccess) onUploadSuccess();
        }, 800);
      } else {
        throw new Error(data.error || 'Erro no upload');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-gray-400" />
        <h2 className="text-lg font-bold text-gray-900">Upload de Facturas</h2>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer group"
      >
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileSelect}
          accept=".pdf,.png,.jpg,.jpeg,.webp"
        />
        <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
          <Upload className="w-6 h-6 text-gray-500" />
        </div>
        <p className="text-sm font-medium text-gray-700">Arraste as facturas aqui ou clique para selecionar</p>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-tight font-semibold">PDF, PNG, JPG, WEBP (Máximo 20MB)</p>
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
            <span>Ficheiros Selecionados ({files.length})</span>
            <button onClick={() => setFiles([])} className="text-red-400 hover:text-red-500 transition-colors">Limpar tudo</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-600 truncate">{file.name}</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-gray-400 hover:text-red-500">×</button>
              </div>
            ))}
          </div>

          <button
            onClick={uploadInvoices}
            disabled={isUploading}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isUploading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> A Processar...</>
            ) : (
              <>Enviar {files.length} Factura(s)</>
            )}
          </button>
        </div>
      )}

      {isUploading && (
        <div className="mt-6">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-gray-500">Progresso</span>
            <span className="text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div 
              className="bg-gray-900 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {message && (
        <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 border ${
          message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
