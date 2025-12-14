
import React, { useState, useCallback, useEffect } from 'react';
import Palette from './components/Palette';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import CodeModal from './components/CodeModal';
import PreviewModal from './components/PreviewModal';
import ConfirmationDialog from './components/ConfirmationDialog';
import type { FormElement } from './types';
import { getFormSuggestions, analyzeFormContext } from './services/geminiService';

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
          if (el.id === id) {
              const newProps = { ...updatedProps };
              // Deep merge styles if present
              if (updatedProps.styles && el.styles) {
                  newProps.styles = { ...el.styles, ...updatedProps.styles };
              }
              // Deep merge logic if present
              if (updatedProps.logic && el.logic) {
                  newProps.logic = { ...el.logic, ...updatedProps.logic };
              }
              // Deep merge validationLogic if present
               if (updatedProps.validationLogic && el.validationLogic) {
                  newProps.validationLogic = { ...el.validationLogic, ...updatedProps.validationLogic };
              }
              return { ...el, ...newProps };
          }
          if (el.children) return { ...el, children: recursiveUpdateElement(el.children, id, updatedProps) };
          return el;
      });
  };

  const updateElement = useCallback((id: string, updatedProps: Partial<FormElement>) => {
    updateFormElementsWithHistory((prev) => {
        const updated = recursiveUpdateElement(prev, id, updatedProps);
        // Find the updated element to refresh selectedElement state properly
        // We can't just merge updatedProps into selectedElement because selectedElement might be stale or updatedProps might be partial
        // However, for UI responsiveness, we usually assume success.
        // Better: Find the element in the updated tree.
        const findElement = (list: FormElement[]): FormElement | undefined => {
            for(const el of list) {
                if(el.id === id) return el;
                if(el.children) {
                    const found = findElement(el.children);
                    if(found) return found;
                }
            }
        };
        const newSelected = findElement(updated);
        if (newSelected && selectedElement && selectedElement.id === id) {
            setSelectedElement(newSelected);
        }
        return updated;
    });
  }, [history, historyIndex, selectedElement]); 

  // Helper to deep clone element with new IDs
  const deepCloneWithNewIds = (element: FormElement): FormElement => {
      const newId = `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newChildren = element.children ? element.children.map(deepCloneWithNewIds) : undefined;
      return {
          ...element,
          id: newId,
          name: `${element.name}_copy`, // Basic rename to avoid duplicates
          children: newChildren
      };
  };

  const duplicateElement = useCallback((id: string) => {
      updateFormElementsWithHistory(prev => {
          // Recursive finder and inserter
          const insertAfter = (list: FormElement[]): FormElement[] => {
              const idx = list.findIndex(el => el.id === id);
              if (idx !== -1) {
                  const original = list[idx];
                  const copy = deepCloneWithNewIds(original);
                  const newList = [...list];
                  newList.splice(idx + 1, 0, copy);
                  return newList;
              }
              // If not found in this level, map children
              return list.map(el => {
                  if (el.children) {
                      return { ...el, children: insertAfter(el.children) };
                  }
                  return el;
              });
          };
          return insertAfter(prev);
      });
  }, [history, historyIndex]);


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
          
          if (el.type === 'html-block') {
              if (el.htmlContent) {
                  lines.push(`  ${el.htmlContent}`);
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
              if(s.width) styles.push(`width: ${s.width}`);
              if(s.textAlign) styles.push(`text-align: ${s.textAlign}`);
              if(s.letterSpacing) styles.push(`letter-spacing: ${s.letterSpacing}`);
              if(s.lineHeight) styles.push(`line-height: ${s.lineHeight}`);
              if(s.textDecoration) styles.push(`text-decoration: ${s.textDecoration}`);
              if(s.boxShadow) styles.push(`box-shadow: ${s.boxShadow}`);
              
              // Grid/Flex Item props
              if(s.gridColumn) styles.push(`grid-column: ${s.gridColumn}`);
              if(s.gridRow) styles.push(`grid-row: ${s.gridRow}`);
              if(s.flexGrow) styles.push(`flex-grow: ${s.flexGrow}`);
              if(s.flexShrink) styles.push(`flex-shrink: ${s.flexShrink}`);
              if(s.flexBasis) styles.push(`flex-basis: ${s.flexBasis}`);
              if(s.alignSelf) styles.push(`align-self: ${s.alignSelf}`);

              // Grid Container props
              if(s.display === 'grid') {
                  styles.push('display: grid');
                  if(s.gridTemplateColumns) styles.push(`grid-template-columns: ${s.gridTemplateColumns}`);
                  if(s.gridTemplateRows) styles.push(`grid-template-rows: ${s.gridTemplateRows}`);
                  if(s.gap) styles.push(`gap: ${s.gap}`);
              }
              return styles.length > 0 ? `style="${styles.join('; ')}"` : '';
          };
          const styleStr = getStyleString(el.styles);

          if (el.type === 'container') {
              // Handle flexbox styles for container content
              const s = el.styles || {};
              const layoutStyles = [];
              if (s.display === 'flex') {
                  layoutStyles.push('display: flex');
                  if(s.flexDirection) layoutStyles.push(`flex-direction: ${s.flexDirection}`);
                  if(s.justifyContent) layoutStyles.push(`justify-content: ${s.justifyContent}`);
                  if(s.alignItems) layoutStyles.push(`align-items: ${s.alignItems}`);
                  if(s.gap) layoutStyles.push(`gap: ${s.gap}`);
                  if(s.flexWrap) layoutStyles.push(`flex-wrap: ${s.flexWrap}`);
              } else if (s.display === 'grid') {
                  layoutStyles.push('display: grid');
                  if(s.gridTemplateColumns) layoutStyles.push(`grid-template-columns: ${s.gridTemplateColumns}`);
                  if(s.gridTemplateRows) layoutStyles.push(`grid-template-rows: ${s.gridTemplateRows}`);
                  if(s.gap) layoutStyles.push(`gap: ${s.gap}`);
              }
              
              const layoutStyleStr = layoutStyles.length > 0 ? `style="${layoutStyles.join('; ')}"` : '';
              const wrapperClass = (!s.display || s.display === 'block') ? 'space-y-2' : '';

              // For HTML generation, we typically want the container to be the layout wrapper.
              // In our recursive edit mode, we had wrappers. Here we flatten it a bit.
              
              lines.push(`  <div class="container-element ${wrapperClass}" ${styleStr} ${layoutStyleStr}>`);
              if (el.children) {
                  lines.push(generateHTML(el.children));
              }
              lines.push('  </div>');
              return;
          }
          
          if (el.type === 'accordion') {
              lines.push(`  <details class="accordion-wrapper" ${styleStr}>`);
              lines.push(`    <summary class="cursor-pointer font-bold p-2 bg-gray-50 border border-b-0">${el.label}</summary>`);
              lines.push(`    <div class="accordion-content border p-2">`);
              if (el.children) {
                  lines.push(generateHTML(el.children));
              }
              lines.push('    </div>');
              lines.push('  </details>');
              return;
          }
          
          if (el.type === 'typography') {
              const Tag = el.headingLevel || 'p';
              lines.push(`  <${Tag} ${styleStr}>${el.textContent || ''}</${Tag}>`);
              return;
          }
          
          if (el.type === 'divider') {
              lines.push(`  <hr class="my-2" ${styleStr} />`);
              return;
          }
          
          if (el.type === 'image') {
              lines.push(`  <div class="w-full"><img src="${el.src || ''}" alt="${el.altText || ''}" class="max-w-full h-auto" ${styleStr} /></div>`);
              return;
          }

          // Start field wrapper
          lines.push(`  <div class="form-group" ${styleStr}>`);
          
          // Label
          if (!['button', 'reset-button', 'news-card', 'iframe', 'navbar', 'container', 'html-block', 'typography', 'divider', 'image', 'accordion'].includes(el.type)) {
              lines.push(`    <label for="${el.name}" class="block text-sm font-medium text-gray-700">${el.label}${el.required ? ' *' : ''}</label>`);
          }
          
          // Element
          let fieldHtml = '';
          const requiredAttr = el.required ? 'required' : '';
          const disabledAttr = el.disabled ? 'disabled' : '';
          const errorAttr = el.customErrorMessage ? `data-error-message="${el.customErrorMessage}"` : '';
          
          // Inner style (stripping layout props for inner input if needed, but for simple HTML gen, reusing styleStr on wrapper is often safer for layout, and input gets width:100%)
          const inputStyleStr = 'style="width: 100%"';

          switch (el.type) {
              case 'text':
              case 'number':
              case 'date':
              case 'color':
              case 'file':
              case 'range':
                  fieldHtml = `    <input type="${el.subType || el.type}" id="${el.name}" name="${el.name}" placeholder="${el.placeholder || ''}" class="form-control block w-full border rounded-md p-2" ${requiredAttr} ${disabledAttr} ${errorAttr} ${inputStyleStr} />`;
                  break;
              case 'textarea':
                  fieldHtml = `    <textarea id="${el.name}" name="${el.name}" placeholder="${el.placeholder || ''}" rows="4" class="form-control block w-full border rounded-md p-2" ${requiredAttr} ${disabledAttr} ${errorAttr} ${inputStyleStr}></textarea>`;
                  break;
              case 'select':
                  const optionsHtml = el.options?.map(opt => `<option value="${opt}">${opt}</option>`).join('') || '';
                  fieldHtml = `    <select id="${el.name}" name="${el.name}" class="form-control block w-full border rounded-md p-2" ${requiredAttr} ${disabledAttr} ${errorAttr} ${inputStyleStr}>${optionsHtml}</select>`;
                  break;
              case 'checkbox':
                  fieldHtml = `    <div class="flex items-center"><input type="checkbox" id="${el.name}" name="${el.name}" class="mr-2" ${requiredAttr} ${disabledAttr} ${errorAttr} /><label for="${el.name}">${el.label}</label></div>`;
                  break;
              case 'radio':
                  fieldHtml = el.options?.map(opt => `    <div class="flex items-center"><input type="radio" name="${el.name}" value="${opt}" class="mr-2" ${requiredAttr} ${disabledAttr} ${errorAttr} /><label>${opt}</label></div>`).join('\n') || '';
                  break;
              case 'button':
                  fieldHtml = `    <button type="button" class="px-4 py-2 bg-blue-600 text-white rounded-md" ${disabledAttr}>${el.label}</button>`;
                  break;
              case 'reset-button':
                  fieldHtml = `    <button type="reset" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md" ${disabledAttr}>${el.label}</button>`;
                  break;
              case 'iframe':
                  fieldHtml = `    <iframe src="${el.src || 'about:blank'}" title="${el.label}" class="w-full border" style="height: 300px"></iframe>`;
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
  
  const handleSmartSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      setSuggestedElements([]);
      try {
          const suggestions = await analyzeFormContext(formElements);
          setSuggestedElements(suggestions);
      } catch(err) {
           setError(err instanceof Error ? err.message : 'Failed to analyze form.');
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
                Copy to Clipboard
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
                         <button
                            onClick={handleSmartSuggestions}
                            disabled={isLoading}
                            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center whitespace-nowrap"
                            title="Analyze current form and suggest missing fields"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            Analyze Form
                        </button>
                    </div>
                </div>
                 <div className="flex items-center justify-end mt-2">
                        <div 
                            title="Use Google Search for more relevant and up-to-date suggestions"
                            className="flex items-center p-1 rounded-md bg-transparent"
                        >
                            <input
                                type="checkbox"
                                id="useGoogleSearch"
                                checked={useGoogleSearch}
                                onChange={(e) => setUseGoogleSearch(e.target.checked)}
                                className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                            />
                            <label htmlFor="useGoogleSearch" className="ml-2 text-sm text-gray-700 select-none cursor-pointer">
                                Use Google Search for Suggestions
                            </label>
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
            onDuplicate={duplicateElement}
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
