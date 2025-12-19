
import React, { useState } from 'react';

interface PromptModalProps {
  prompt: string;
  onClose: () => void;
}

const PromptModal: React.FC<PromptModalProps> = ({ prompt, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <h2 className="text-xl font-bold text-brand-text">Export to AI Prompt</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 bg-purple-50 border-b border-purple-100 text-sm text-purple-900">
            <strong>Ready to deploy?</strong> Copy this prompt and paste it into Power Apps Copilot, ChatGPT, or other AI tools to instantly recreate this form's logic and structure.
        </div>
        <div className="p-4 overflow-y-auto">
          <textarea 
            readOnly 
            value={prompt} 
            className="w-full h-64 p-4 border border-gray-300 rounded-md font-mono text-sm focus:ring-brand-primary focus:border-brand-primary resize-none leading-relaxed text-gray-700 shadow-inner bg-gray-50"
          />
        </div>
        <div className="p-4 border-t flex justify-end items-center bg-gray-50 rounded-b-lg">
          <span className={`text-green-600 font-bold mr-4 transition-all duration-300 ease-in-out transform ${copied ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            ✓ Copied to clipboard!
          </span>
          <button
            onClick={handleCopy}
            className="px-6 py-2 bg-purple-600 text-white font-bold rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            Copy Prompt
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
