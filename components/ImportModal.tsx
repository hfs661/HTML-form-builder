
import React, { useState, useRef } from 'react';
import { read, utils } from 'xlsx';
import Papa from 'papaparse';
import { getFormSuggestionsFromData } from '../services/geminiService';
import type { FormElement } from '../types';

interface ImportModalProps {
  onClose: () => void;
  onImport: (elements: FormElement[]) => void;
}

interface ColumnPreview {
    header: string;
    sample: string;
}

const ImportModal: React.FC<ImportModalProps> = ({ onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [columns, setColumns] = useState<ColumnPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setError(null);
    setIsProcessing(true);
    setColumns([]);

    const ext = uploadedFile.name.split('.').pop()?.toLowerCase();

    try {
        if (ext === 'csv') {
            Papa.parse(uploadedFile, {
                header: true,
                preview: 5, // preview first 5 rows
                skipEmptyLines: true,
                complete: (results) => {
                    if (results.meta.fields && results.data.length > 0) {
                        const cols = results.meta.fields.map(field => ({
                            header: field,
                            sample: String((results.data[0] as any)[field] || '')
                        }));
                        setColumns(cols);
                    } else {
                        setError("Could not parse columns from CSV.");
                    }
                    setIsProcessing(false);
                },
                error: (err: any) => {
                    setError(`CSV Error: ${err.message}`);
                    setIsProcessing(false);
                }
            });
        } else if (['xlsx', 'xls'].includes(ext || '')) {
            const data = await uploadedFile.arrayBuffer();
            const workbook = read(data);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData: any[] = utils.sheet_to_json(sheet, { header: 1, defval: '' });
            
            if (jsonData.length > 0) {
                const headers = jsonData[0] as string[];
                const firstRow = jsonData.length > 1 ? jsonData[1] : [];
                
                const cols = headers.map((h, i) => ({
                    header: String(h),
                    sample: String(firstRow[i] || '')
                }));
                setColumns(cols);
            } else {
                 setError("Excel sheet appears empty.");
            }
            setIsProcessing(false);
        } else {
            setError("Unsupported file type. Please use CSV or Excel.");
            setIsProcessing(false);
        }
    } catch (e: any) {
        setError("Error parsing file: " + e.message);
        setIsProcessing(false);
    }
  };

  const handleProcessPaste = () => {
      if (!pasteContent.trim()) return;
      setIsProcessing(true);
      setError(null);
      
      try {
          // Try parse as JSON
          try {
              const json = JSON.parse(pasteContent);
              if (Array.isArray(json) && json.length > 0) {
                  const keys = Object.keys(json[0]);
                  const cols = keys.map(k => ({
                      header: k,
                      sample: String(json[0][k] || '')
                  }));
                  setColumns(cols);
                  setIsProcessing(false);
                  return;
              }
          } catch(e) {
              // Not JSON, ignore
          }
          
          // Try parse as CSV (tab or comma)
          const results = Papa.parse(pasteContent, { header: true, preview: 1 });
          if (results.meta.fields && results.meta.fields.length > 0) {
                const cols = results.meta.fields.map(field => ({
                    header: field,
                    sample: String((results.data[0] as any)[field] || '')
                }));
                setColumns(cols);
          } else {
               setError("Could not detect structure from pasted text. Try using CSV format or JSON array.");
          }
      } catch (e: any) {
          setError("Error parsing text: " + e.message);
      } finally {
          setIsProcessing(false);
      }
  };

  const handleGenerate = async () => {
      if (columns.length === 0) return;
      setIsGenerating(true);
      
      const summary = columns.map(c => `- Column: "${c.header}", Sample Value: "${c.sample}"`).join('\n');
      
      try {
          const suggestions = await getFormSuggestionsFromData(summary);
          
          // Convert simple suggestions to full FormElements with IDs
          const newElements = suggestions.map((s: any) => ({
              ...s,
              id: `${s.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              styles: { size: 'medium' }
          }));
          
          onImport(newElements);
          onClose();
      } catch (err: any) {
          setError(err.message || "Failed to generate form from data.");
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-brand-text">Import Data</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex border-b border-gray-200">
             <button 
                onClick={() => setActiveTab('file')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'file' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
             >
                 Upload File (CSV/Excel)
             </button>
             <button 
                onClick={() => setActiveTab('paste')}
                className={`flex-1 py-3 text-sm font-medium ${activeTab === 'paste' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500 hover:text-gray-700'}`}
             >
                 Paste Text/JSON
             </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
            {activeTab === 'file' && (
                <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-brand-primary bg-blue-50' : 'border-gray-300 hover:border-brand-primary hover:bg-gray-50'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <div className="flex flex-col items-center justify-center space-y-3">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                         </svg>
                         <div className="text-sm text-gray-600">
                             <span className="font-medium text-brand-primary cursor-pointer" onClick={() => fileInputRef.current?.click()}>Click to upload</span> or drag and drop
                         </div>
                         <p className="text-xs text-gray-500">CSV, XLSX, XLS (max 5MB)</p>
                         <input ref={fileInputRef} type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileChange} />
                    </div>
                    {file && <div className="mt-4 text-sm font-semibold text-brand-text bg-green-50 p-2 rounded inline-block">Selected: {file.name}</div>}
                </div>
            )}

            {activeTab === 'paste' && (
                <div className="space-y-3">
                    <textarea 
                        className="w-full h-48 border border-gray-300 rounded-md p-3 text-sm font-mono focus:ring-brand-primary focus:border-brand-primary"
                        placeholder="Paste CSV data or JSON array here..."
                        value={pasteContent}
                        onChange={(e) => setPasteContent(e.target.value)}
                    ></textarea>
                    <button 
                        onClick={handleProcessPaste}
                        disabled={!pasteContent.trim() || isProcessing}
                        className="px-4 py-2 bg-gray-100 border border-gray-300 rounded text-sm font-medium hover:bg-gray-200"
                    >
                        Process Text
                    </button>
                </div>
            )}
            
            {isProcessing && <p className="text-center text-gray-500 mt-4 animate-pulse">Analyzing data structure...</p>}
            {error && <p className="text-center text-red-500 mt-4 text-sm">{error}</p>}

            {columns.length > 0 && (
                <div className="mt-6">
                    <h3 className="font-bold text-gray-700 mb-2">Detected Columns</h3>
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-gray-50">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Header</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample Value</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {columns.map((col, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{col.header}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{col.sample}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Gemini AI will analyze these columns to suggest appropriate form fields (Types, Labels, Options).
                    </p>
                </div>
            )}
        </div>
        
        <div className="p-4 border-t flex justify-end items-center space-x-3 bg-gray-50 rounded-b-lg">
             <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100">Cancel</button>
             <button 
                onClick={handleGenerate} 
                disabled={columns.length === 0 || isGenerating}
                className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-md shadow-sm hover:bg-brand-accent disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
                {isGenerating ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                ) : (
                    'Generate Form'
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
