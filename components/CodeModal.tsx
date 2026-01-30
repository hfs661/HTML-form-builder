
import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { generateExportFiles } from '../services/exportService';
import type { FormElement } from '../types';

interface CodeModalProps {
  formElements: FormElement[];
  onClose: () => void;
}

const CodeModal: React.FC<CodeModalProps> = ({ formElements, onClose }) => {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'json'>('html');
  const [copied, setCopied] = useState(false);

  const assets = useMemo(() => generateExportFiles(formElements), [formElements]);
  const jsonCode = useMemo(() => JSON.stringify(formElements, null, 2), [formElements]);

  const currentCode = useMemo(() => {
    switch(activeTab) {
      case 'html': return assets.html;
      case 'css': return assets.css;
      case 'js': return assets.js;
      case 'json': return jsonCode;
      default: return '';
    }
  }, [activeTab, assets, jsonCode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFiles = () => {
    const blobHtml = new Blob([assets.html], { type: 'text/html' });
    const blobCss = new Blob([assets.css], { type: 'text/css' });
    const blobJs = new Blob([assets.js], { type: 'application/javascript' });
    
    saveAs(blobHtml, 'index.html');
    saveAs(blobCss, 'style.css');
    saveAs(blobJs, 'script.js');
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    zip.file("index.html", assets.html);
    zip.file("style.css", assets.css);
    zip.file("script.js", assets.js);
    zip.file("blueprint.json", jsonCode);
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "powerform-export.zip");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fade-in-staggered">
        <div className="flex justify-between items-center p-6 border-b bg-gray-50/50">
          <div className="flex items-center space-x-4">
             <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-soft">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
             </div>
             <div>
                <h2 className="text-xl font-black text-brand-text tracking-tight">Export Code</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Production Ready Assets</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-lg">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex bg-gray-50/30 border-b">
           {(['html', 'css', 'js', 'json'] as const).map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-8 py-3 text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-brand-primary border-b-2 border-brand-primary bg-white' : 'text-gray-400 hover:text-gray-600'}`}
             >
               {tab}
             </button>
           ))}
        </div>

        <div className="flex-grow p-6 overflow-hidden flex flex-col">
          <div className="flex-grow relative bg-gray-900 rounded-2xl overflow-hidden shadow-inner group">
            <pre className="absolute inset-0 p-6 overflow-auto text-sm font-mono text-gray-300 custom-scrollbar">
              <code>{currentCode}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase rounded-lg backdrop-blur-md border border-white/10 transition-all opacity-0 group-hover:opacity-100"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Files verified & minified
           </div>
           <div className="flex items-center space-x-3">
              <button
                onClick={handleDownloadFiles}
                className="px-6 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 shadow-soft hover:bg-gray-50 transition-all active:scale-95 text-sm"
              >
                Download Files
              </button>
              <button
                onClick={handleDownloadZip}
                className="px-8 py-3 bg-brand-primary text-white font-black rounded-xl shadow-elevated hover:bg-brand-accent transition-all active:scale-95 text-sm uppercase tracking-wider"
              >
                Download ZIP Package
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CodeModal;
