import React, { useState, useCallback, useEffect } from 'react';
import Palette from './components/Palette';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import CodeModal from './components/CodeModal';
import ConfirmationDialog from './components/ConfirmationDialog';
import type { FormElement } from './types';
import { getFormSuggestions } from './services/geminiService';

const App: React.FC = () => {
  const [formElements, setFormElements] = useState<FormElement[]>(() => {
    try {
      const savedElements = localStorage.getItem('formBuilderElements');
      return savedElements ? JSON.parse(savedElements) : [];
    } catch (error) {
      console.error("Failed to parse form elements from localStorage", error);
      return [];
    }
  });
  const [selectedElement, setSelectedElement] = useState<FormElement | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [suggestedElements, setSuggestedElements] = useState<Partial<FormElement>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const [searchSources, setSearchSources] = useState<any[] | null>(null);

  // Save form elements to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('formBuilderElements', JSON.stringify(formElements));
  }, [formElements]);

  const updateElement = useCallback((id: string, updatedProps: Partial<FormElement>) => {
    setFormElements(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updatedProps } : el))
    );
    setSelectedElement(prev =>
      prev?.id === id ? { ...prev, ...updatedProps } : prev
    );
  }, []);

  const generateCode = () => {
    // Style mappings for generated code
    const sizeClasses: Record<string, string> = {
      small: 'p-1 text-sm rounded-sm',
      medium: 'p-2 text-base rounded-md',
      large: 'p-3 text-lg rounded-lg',
    };
    const buttonSizeClasses: Record<string, string> = {
      small: 'px-3 py-1 text-sm rounded-sm',
      medium: 'px-4 py-2 text-base rounded-md',
      large: 'px-6 py-3 text-lg rounded-lg',
    };
    const checkboxRadioSizeClasses: Record<string, string> = {
      small: 'h-3 w-3',
      medium: 'h-4 w-4',
      large: 'h-5 w-5',
    };
    const buttonColorClasses: Record<string, string> = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
    };

    const html = formElements.map(el => {
      const requiredAttr = el.required ? ' required' : '';
      const disabledAttr = el.disabled ? ' disabled' : '';
      const minLengthAttr = el.minLength != null ? ` minlength="${el.minLength}"` : '';
      const maxLengthAttr = el.maxLength != null ? ` maxlength="${el.maxLength}"` : '';
      const minAttr = el.min != null ? ` min="${el.min}"` : '';
      const maxAttr = el.max != null ? ` max="${el.max}"` : '';
      const stepAttr = el.step != null ? ` step="${el.step}"` : '';
      const acceptAttr = el.accept ? ` accept="${el.accept}"` : '';

      const currentSize = el.styles?.size || 'medium';

      const labelHtml = `<label for="${el.name}" class="block text-sm font-medium text-gray-700 mb-1">${el.label}${el.required ? ' <span class="text-red-500">*</span>' : ''}</label>`;
      const commonInputClasses = `w-full border border-gray-300 rounded-md shadow-sm`;

      switch (el.type) {
        case 'text':
          const inputType = el.subType || 'text';
          return `<div class="mb-4">
  ${labelHtml}
  <input type="${inputType}" id="${el.name}" name="${el.name}" placeholder="${el.placeholder || ''}"${requiredAttr}${minLengthAttr}${maxLengthAttr}${disabledAttr} class="${commonInputClasses} ${sizeClasses[currentSize]}">
</div>`;
        case 'textarea':
          return `<div class="mb-4">
  ${labelHtml}
  <textarea id="${el.name}" name="${el.name}" placeholder="${el.placeholder || ''}" rows="4"${requiredAttr}${minLengthAttr}${maxLengthAttr}${disabledAttr} class="${commonInputClasses} ${sizeClasses[currentSize]}"></textarea>
</div>`;
        case 'select':
          const optionsHtml = (el.options || []).map(opt => `    <option value="${opt}">${opt}</option>`).join('\n');
          return `<div class="mb-4">
  ${labelHtml}
  <select id="${el.name}" name="${el.name}"${requiredAttr}${disabledAttr} class="${commonInputClasses} ${sizeClasses[currentSize]}">
${optionsHtml}
  </select>
</div>`;
        case 'checkbox':
          return `<div class="mb-4 flex items-center">
  <input id="${el.name}" name="${el.name}" type="checkbox"${requiredAttr}${disabledAttr} class="text-blue-600 border-gray-300 rounded ${checkboxRadioSizeClasses[currentSize]}">
  <label for="${el.name}" class="ml-2 block text-sm text-gray-900">${el.label}</label>
</div>`;
        case 'radio':
          const radioOptionsHtml = (el.options || []).map((opt, index) => `    <div class="flex items-center mt-1">
      <input id="${el.name}-${index}" name="${el.name}" type="radio" value="${opt}"${index === 0 ? requiredAttr : ''}${disabledAttr} class="text-blue-600 border-gray-300 ${checkboxRadioSizeClasses[currentSize]}">
      <label for="${el.name}-${index}" class="ml-2 block text-sm text-gray-900">${opt}</label>
    </div>`).join('\n');
          return `<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-1">${el.label}${el.required ? ' <span class="text-red-500">*</span>' : ''}</label>
${radioOptionsHtml}
</div>`;
        case 'number':
          return `<div class="mb-4">
  ${labelHtml}
  <input type="number" id="${el.name}" name="${el.name}" placeholder="${el.placeholder || ''}"${requiredAttr}${minAttr}${maxAttr}${stepAttr}${disabledAttr} class="${commonInputClasses} ${sizeClasses[currentSize]}">
</div>`;
        case 'date':
          return `<div class="mb-4">
  ${labelHtml}
  <input type="date" id="${el.name}" name="${el.name}"${requiredAttr}${disabledAttr} class="${commonInputClasses} ${sizeClasses[currentSize]}">
</div>`;
        case 'range':
          return `<div class="mb-4">
  ${labelHtml}
  <input type="range" id="${el.name}" name="${el.name}"${minAttr}${maxAttr}${stepAttr}${disabledAttr} class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
</div>`;
        case 'file':
          return `<div class="mb-4">
  ${labelHtml}
  <input type="file" id="${el.name}" name="${el.name}"${requiredAttr}${acceptAttr}${disabledAttr} class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100">
</div>`;
        case 'color':
          return `<div class="mb-4">
  ${labelHtml}
  <input type="color" id="${el.name}" name="${el.name}" value="#0078D4"${disabledAttr} class="w-full h-10 border border-gray-300 rounded-md shadow-sm p-1">
</div>`;
        case 'button':
            const buttonColorClass = buttonColorClasses[el.styles?.color || 'primary'];
            const buttonSizeClass = buttonSizeClasses[currentSize];
            return `<div class="mb-4">
  <button type="submit"${requiredAttr}${disabledAttr} class="font-semibold rounded-md shadow-sm ${buttonColorClass} ${buttonSizeClass}">${el.label}</button>
</div>`;
        default:
          return '';
      }
    }).join('\n\n');

    setGeneratedCode(`<form>\n${html}\n</form>`);
    setShowCodeModal(true);
  };
  
  const handleGetSuggestions = async () => {
    if (!aiPrompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setSuggestedElements([]);
    setSearchSources(null);
    try {
        const { suggestions, sources } = await getFormSuggestions(aiPrompt, useGoogleSearch);
        setSuggestedElements(suggestions);
        if (sources) {
            setSearchSources(sources);
        }
    } catch(err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearAll = () => {
    setFormElements([]);
    setSelectedElement(null);
    setSuggestedElements([]);
    setAiPrompt('');
    setShowClearConfirm(false);
    setUseGoogleSearch(false);
    setSearchSources(null);
  };
  
  const handleClearSuggestions = () => {
    setSuggestedElements([]);
  };

  return (
    <div className="flex flex-col h-screen font-sans text-brand-text">
      <header className="flex justify-between items-center p-3 bg-brand-primary text-white shadow-md z-10">
        <h1 className="text-2xl font-bold">Power Form Builder AI</h1>
        <div className="flex items-center space-x-2">
           <button
            onClick={() => setShowClearConfirm(true)}
            disabled={formElements.length === 0 && suggestedElements.length === 0 && aiPrompt.trim() === ''}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={generateCode}
            disabled={formElements.length === 0}
            className="px-4 py-2 bg-white text-brand-primary font-semibold rounded-md shadow-sm hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Generate Code
          </button>
        </div>
      </header>
       <div className="p-3 bg-brand-secondary border-b border-gray-300">
            <div className="max-w-3xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe your form, e.g., 'A user registration form with name, email, and password'"
                        className="flex-grow p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                        disabled={isLoading}
                    />
                    <div className="flex items-stretch space-x-2 mt-2 sm:mt-0 w-full sm:w-auto">
                        <button
                            onClick={handleGetSuggestions}
                            disabled={isLoading || !aiPrompt.trim()}
                            className="px-4 py-2 bg-brand-accent text-white font-semibold rounded-md shadow-sm hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex-grow sm:flex-grow-0"
                        >
                            {isLoading ? 'Thinking...' : 'Get Suggestions'}
                        </button>
                        <div 
                            title="Use Google Search for more relevant and up-to-date suggestions"
                            className="flex items-center p-2 rounded-md bg-white border border-gray-300 shadow-sm whitespace-nowrap"
                        >
                            <input
                                type="checkbox"
                                id="useGoogleSearch"
                                checked={useGoogleSearch}
                                onChange={(e) => setUseGoogleSearch(e.target.checked)}
                                className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                            />
                            <label htmlFor="useGoogleSearch" className="ml-2 text-sm text-gray-700 font-medium select-none cursor-pointer">
                                Use Google Search
                            </label>
                        </div>
                    </div>
                </div>
                {error && <p className="text-red-500 text-center mt-2">{error}</p>}
                {searchSources && searchSources.length > 0 && (
                    <div className="mt-4 text-sm p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <h4 className="font-semibold text-blue-800">Sources from Google Search:</h4>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                            {searchSources.filter(s => s.web && s.web.uri).map((source, index) => (
                                <li key={index}>
                                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
                                        {source.web.title || source.web.uri}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
      <main className="flex flex-grow overflow-hidden">
        <Palette suggestedElements={suggestedElements} onClearSuggestions={handleClearSuggestions} />
        <Canvas 
          elements={formElements} 
          setElements={setFormElements} 
          setSelectedElement={setSelectedElement} 
          selectedElement={selectedElement}
          updateElement={updateElement}
        />
        <PropertiesPanel selectedElement={selectedElement} updateElement={updateElement} closePanel={() => setSelectedElement(null)} />
      </main>

      <ConfirmationDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Clear All"
        message="Are you sure you want to clear the canvas, AI prompt, and all suggestions? This action cannot be undone."
        confirmButtonText="Clear All"
        confirmButtonVariant="danger"
      />

      {showCodeModal && <CodeModal code={generatedCode} onClose={() => setShowCodeModal(false)} />}
    </div>
  );
};

export default App;