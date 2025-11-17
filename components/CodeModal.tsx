import React, { useState } from 'react';

interface CodeModalProps {
  code: string;
  onClose: () => void;
}

const CodeModal: React.FC<CodeModalProps> = ({ code, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-brand-text">Generated HTML Code</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          <pre className="bg-gray-800 text-white p-4 rounded-md text-sm whitespace-pre-wrap break-words">
            <code>{code}</code>
          </pre>
        </div>
        <div className="p-4 border-t flex justify-end items-center">
          <span className={`text-green-500 font-semibold mr-4 transition-opacity duration-300 ease-in-out ${copied ? 'opacity-100' : 'opacity-0'}`}>
            ✓ Copied!
          </span>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-md shadow-sm hover:bg-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeModal;