
import React, { useState, useCallback, useEffect } from 'react';
import Palette from './components/Palette';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import CodeModal from './components/CodeModal';
import PreviewModal from './components/PreviewModal';
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
  
  // History for Undo/Redo
  const [history, setHistory] = useState<FormElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [selectedElement, setSelectedElement] = useState<FormElement | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [suggestedElements, setSuggestedElements] = useState<Partial<FormElement>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const [searchSources, setSearchSources] = useState<any[] | null>(null);

  // Initialize history with initial state if valid
  useEffect(() => {
      if (history.length === 1 && history[0].length === 0 && formElements.length > 0) {
          setHistory([formElements]);
      }
  }, []);

  // Helper to update state and push to history
  const updateFormElementsWithHistory = (newElements: FormElement[] | ((prev: FormElement[]) => FormElement[])) => {
    setFormElements(prev => {
        const resolvedElements = typeof newElements === 'function' ? newElements(prev) : newElements;
        
        // Avoid duplicates in history
        const currentHistory = history.slice(0, historyIndex + 1);
        const nextHistory = [...currentHistory, resolvedElements];
        setHistory(nextHistory);
        setHistoryIndex(nextHistory.length - 1);
        
        return resolvedElements;
    });
  };
  
  const handleUndo = () => {
      if (historyIndex > 0) {
          const prevIndex = historyIndex - 1;
          setFormElements(history[prevIndex]);
          setHistoryIndex(prevIndex);
          setSelectedElement(null);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const nextIndex = historyIndex + 1;
          setFormElements(history[nextIndex]);
          setHistoryIndex(nextIndex);
          setSelectedElement(null);
      }
  };


  // Save form elements to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('formBuilderElements', JSON.stringify(formElements));
  }, [formElements]);

  // Recursive update helper for deep updates
  const recursiveUpdateElement = (list: FormElement[], id: string, updatedProps: Partial<FormElement>): FormElement[] => {
      return list.map(el => {
          if (el.id === id) return { ...el, ...updatedProps };
          if (el.children) return { ...el, children: recursiveUpdateElement(el.children, id, updatedProps) };
          return el;
      });
  };

  const updateElement = useCallback((id: string, updatedProps: Partial<FormElement>) => {
    updateFormElementsWithHistory((prev) => {
        const updated = recursiveUpdateElement(prev, id, updatedProps);
        // Update selected element locally so props panel reflects changes immediately
        setSelectedElement(current => current?.id === id ? { ...current, ...updatedProps } : current);
        return updated;
    });
  }, [history, historyIndex]); // Depend on history state to ensure correct closure

  const generateHTML = (elements: FormElement[]) => {
      const lines: string[] = [];
      if (elements === formElements) lines.push('<form class="space-y-4 p-4">');
      
      elements.forEach(el => {
          if (el.type === 'script') {
              if (el.scriptContent) {
                 lines.push(`  <script>\n    ${el.scriptContent.replace(/\n/g, '\n    ')}\n  </script>`);
              }
              return;
          }

          // Simple Style String generator
          const getStyleString = (s: any) => {
              if(!s) return '';
              const styles = [];
              if(s.backgroundColor) styles.push(`background-color: ${s.backgroundColor}`);
              if(s.textColor) styles.push(`color: ${s.textColor}`);
              if(s.borderColor) styles.push(`border-color: ${s.borderColor}`);
              if(s.borderWidth) styles.push(`border-width: ${s.borderWidth}`);
              if(s.borderRadius) styles.push(`border-radius: ${s.borderRadius}`);
              if(s.padding) styles.push(`padding: ${s.padding}`);
              if(s.fontFamily) styles.push(`font-family: ${s.fontFamily}`);
              if(s.fontWeight) styles.push(`font-weight: ${s.fontWeight}`);
              if(s.height) styles.push(`height: ${s.height}`);
              return styles.length > 0 ? `style="${styles.join('; ')}"` : '';
          };
          const styleStr = getStyleString(el.styles);

          if (el.type === 'container') {
              lines.push(`  <div class="container-wrapper" ${styleStr}>`);
              // Recurse
              if (el.children) {
                  lines.push(generateHTML(el.children));
              }
              lines.push('  </div>');
              return;
          }

          // Start field wrapper
          lines.push('  <div class="form-group">');
          
          // Label
          if (!['button', 'news-card', 'iframe', 'navbar', 'container'].includes(el.type)) {
              lines.push(`    <label for="${el.name}" class="block text-sm font-medium text-gray-700">${el.label}${el.required ? ' *' : ''}</label>`);
          }
          
          // Element
          let fieldHtml = '';
          const requiredAttr = el.required ? 'required' : '';
          const disabledAttr = el.disabled ? 'disabled' : '';
          const errorAttr = el.customErrorMessage ? `data-error-message="${el.customErrorMessage}"` : '';
          

          switch (el.type) {
              case 'text':
              case 'number':
              case 'date':
              case 'color':
              case 'file':
              case 'range':
                  fieldHtml = `    <input type="${el.subType || el.type}" id="${el.name}" name="${el.name}" placeholder="${el.placeholder || ''}" class="form-control block w-full border rounded-md p-2" ${requiredAttr} ${disabledAttr} ${errorAttr} ${styleStr} />`;
                  break;
              case 'textarea':
                  fieldHtml = `    <textarea id="${el.name}" name="${el.name}" placeholder="${el.placeholder || ''}" rows="4" class="form-control block w-full border rounded-md p-2" ${requiredAttr} ${disabledAttr} ${errorAttr} ${styleStr}></textarea>`;
                  break;
              case 'select':
                  const optionsHtml = el.options?.map(opt => `<option value="${opt}">${opt}</option>`).join('') || '';
                  fieldHtml = `    <select id="${el.name}" name="${el.name}" class="form-control block w-full border rounded-md p-2" ${requiredAttr} ${disabledAttr} ${errorAttr} ${styleStr}>${optionsHtml}</select>`;
                  break;
              case 'checkbox':
                  fieldHtml = `    <div class="flex items-center"><input type="checkbox" id="${el.name}" name="${el.name}" class="mr-2" ${requiredAttr} ${disabledAttr} ${errorAttr} ${styleStr} /><label for="${el.name}">${el.label}</label></div>`;
                  break;
              case 'radio':
                  fieldHtml = el.options?.map(opt => `    <div class="flex items-center"><input type="radio" name="${el.name}" value="${opt}" class="mr-2" ${requiredAttr} ${disabledAttr} ${errorAttr} /><label>${opt}</label></div>`).join('\n') || '';
                  break;
              case 'button':
                  fieldHtml = `    <button type="button" class="px-4 py-2 bg-blue-600 text-white rounded-md" ${disabledAttr} ${styleStr}>${el.label}</button>`;
                  break;
              case 'iframe':
                  fieldHtml = `    <iframe src="${el.src || 'about:blank'}" title="${el.label}" class="w-full border" ${styleStr}></iframe>`;
                  break;
              default:
                  fieldHtml = `    <!-- Element type ${el.type} generation not fully supported yet -->`;
          }
          
          lines.push(fieldHtml);
          lines.push('  </div>');
      });
      
      if (elements === formElements) lines.push('</form>');
      return lines.join('\n');
  };

  const generateCode = () => {
    const code = generateHTML(formElements);
    setGeneratedCode(code);
    setShowCodeModal(true);
  };
  
  const handleQuickCopy = () => {
      const code = generateHTML(formElements);
      navigator.clipboard.writeText(code);
      alert('HTML Code copied to clipboard!');
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
    updateFormElementsWithHistory([]);
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
        <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Power Form Builder AI</h1>
            <div className="flex space-x-1 bg-brand-accent rounded-md p-1">
                <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1 hover:bg-white/10 rounded disabled:opacity-30" title="Undo">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-1 hover:bg-white/10 rounded disabled:opacity-30" title="Redo">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </button>
            </div>
        </div>
        <div className="flex items-center space-x-2">
           <button
            onClick={() => setShowPreviewModal(true)}
            disabled={formElements.length === 0}
            className="px-4 py-2 bg-brand-accent text-white font-semibold rounded-md shadow-sm hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Preview
          </button>
           <button
            onClick={() => setShowClearConfirm(true)}
            disabled={formElements.length === 0 && suggestedElements.length === 0 && aiPrompt.trim() === ''}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Clear All
          </button>
          <div className="relative group flex">
            <button
                onClick={handleQuickCopy}
                disabled={formElements.length === 0}
                className="px-4 py-2 bg-gray-100 text-brand-primary font-semibold rounded-l-md border-r border-gray-300 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                title="Quick Copy to Clipboard"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy HTML
            </button>
            <button
                onClick={generateCode}
                disabled={formElements.length === 0}
                className="px-4 py-2 bg-white text-brand-primary font-semibold rounded-r-md shadow-sm hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
                Generate Code
            </button>
          </div>
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
          setElements={updateFormElementsWithHistory} 
          setSelectedElement={setSelectedElement} 
          selectedElement={selectedElement}
          updateElement={updateElement}
        />
        <PropertiesPanel 
            selectedElement={selectedElement} 
            updateElement={updateElement} 
            closePanel={() => setSelectedElement(null)} 
            allElements={formElements}
        />
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
      {showPreviewModal && <PreviewModal elements={formElements} onClose={() => setShowPreviewModal(false)} />}
    </div>
  );
};

export default App;
