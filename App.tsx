
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Palette from './components/Palette';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import CodeModal from './components/CodeModal';
import PreviewModal from './components/PreviewModal';
import ConfirmationDialog from './components/ConfirmationDialog';
import ImportModal from './components/ImportModal';
import PromptModal from './components/PromptModal';
import type { FormElement, FormElementType, SnippetItem, ElementStyle } from './types';
import { getFormSuggestions, analyzeFormContext } from './services/geminiService';

const getSmartLabel = (type: string, name?: string, label?: string) => {
  if (label && label !== 'New Element') return label;
  
  // Try to derive from name if it looks like a custom name (not auto-generated timestamp)
  if (name && !name.match(/^(el_|group_|ai_group_)\d+$/) && !name.startsWith('col')) {
      return name.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim().replace(/^\w/, c => c.toUpperCase());
  }
  
  const typeMap: Record<string, string> = {
      text: 'Text Input', textarea: 'Text Area', number: 'Number Input', 
      email: 'Email', password: 'Password', date: 'Date Picker',
      select: 'Dropdown', checkbox: 'Checkbox', radio: 'Radio Group',
      button: 'Button', 'reset-button': 'Reset Button', file: 'File Upload', 
      container: 'Container', accordion: 'Accordion', 'news-card': 'News Card',
      table: 'Data Table', navbar: 'Navigation Bar', iframe: 'Embedded Frame',
      divider: 'Divider', 'html-block': 'HTML Block', typography: 'Text Block',
      image: 'Image'
  };
  return typeMap[type] || 'New Element';
};

const createNewElement = (data: any): FormElement => ({
  id: `${data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type: data.type as FormElementType,
  label: getSmartLabel(data.type, data.name, data.label),
  name: data.name || `el_${Date.now()}`,
  options: data.options,
  children: data.children?.map((c: any) => createNewElement(c)),
  styles: { size: 'medium', ...(data.styles || {}) },
  textContent: data.textContent,
  headingLevel: data.headingLevel,
  src: data.src,
  altText: data.altText
});

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

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [suggestedElements, setSuggestedElements] = useState<Partial<FormElement>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const [searchSources, setSearchSources] = useState<any[] | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Initialize history
  useEffect(() => {
      if (history.length === 1 && history[0].length === 0 && formElements.length > 0) {
          setHistory([formElements]);
      }
  }, []);

  const updateFormElementsWithHistory = (newElements: FormElement[] | ((prev: FormElement[]) => FormElement[])) => {
    setFormElements(prev => {
        const resolvedElements = typeof newElements === 'function' ? newElements(prev) : newElements;
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
          setSelectedIds([]);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const nextIndex = historyIndex + 1;
          setFormElements(history[nextIndex]);
          setHistoryIndex(nextIndex);
          setSelectedIds([]);
      }
  };

  useEffect(() => {
    localStorage.setItem('formBuilderElements', JSON.stringify(formElements));
  }, [formElements]);

  const handleSaveDraft = () => {
      setSaveStatus('saving');
      localStorage.setItem('formBuilderElements', JSON.stringify(formElements));
      setTimeout(() => {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
      }, 500);
  };

  const handleClearAll = () => {
    setFormElements([]);
    setSuggestedElements([]);
    setHistory([[]]);
    setHistoryIndex(0);
    setSelectedIds([]);
    setShowClearConfirm(false);
    setError(null);
    setSearchSources(null);
  };

  const handleGetSuggestions = async () => {
    if (!aiPrompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setSearchSources(null);
    try {
      const result = await getFormSuggestions(aiPrompt, useGoogleSearch);
      setSuggestedElements(result.suggestions);
      setSearchSources(result.sources || null);
    } catch (err: any) {
      setError(err.message || "An error occurred while getting suggestions.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const recursiveUpdateElement = (list: FormElement[], id: string, updatedProps: Partial<FormElement>): FormElement[] => {
      return list.map(el => {
          if (el.id === id) {
              const newProps = { ...updatedProps };
              if (updatedProps.styles && el.styles) newProps.styles = { ...el.styles, ...updatedProps.styles };
              if (updatedProps.logic && el.logic) newProps.logic = { ...el.logic, ...updatedProps.logic };
              if (updatedProps.validationLogic && el.validationLogic) newProps.validationLogic = { ...el.validationLogic, ...updatedProps.validationLogic };
              if (updatedProps.dataLogic && el.dataLogic) newProps.dataLogic = { ...el.dataLogic, ...updatedProps.dataLogic };
              return { ...el, ...newProps };
          }
          if (el.children) return { ...el, children: recursiveUpdateElement(el.children, id, updatedProps) };
          return el;
      });
  };

  const updateElement = useCallback((id: string, updatedProps: Partial<FormElement>) => {
    updateFormElementsWithHistory((prev) => recursiveUpdateElement(prev, id, updatedProps));
  }, [historyIndex]);

  const deepCloneWithNewIds = (element: FormElement): FormElement => {
      const newId = `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newChildren = element.children ? element.children.map(deepCloneWithNewIds) : undefined;
      return {
          ...element,
          id: newId,
          name: `${element.name}_copy`,
          children: newChildren
      };
  };

  const duplicateElement = useCallback((id: string) => {
      updateFormElementsWithHistory(prev => {
          const insertAfter = (list: FormElement[]): FormElement[] => {
              const idx = list.findIndex(el => el.id === id);
              if (idx !== -1) {
                  const copy = deepCloneWithNewIds(list[idx]);
                  const newList = [...list];
                  newList.splice(idx + 1, 0, copy);
                  return newList;
              }
              return list.map(el => el.children ? { ...el, children: insertAfter(el.children) } : el);
          };
          return insertAfter(prev);
      });
  }, [historyIndex]);

  const handleAddElement = (data: any) => {
      updateFormElementsWithHistory(prev => {
          const elementsToAdd = data.isSnippet ? data.elements.map(createNewElement) : [createNewElement(data)];
          return [...prev, ...elementsToAdd];
      });
  };

  const handleGroupElements = () => {
    if (selectedIds.length < 1) return;
    
    updateFormElementsWithHistory(prev => {
        let removedItems: FormElement[] = [];
        const findAndRemove = (list: FormElement[]): FormElement[] => {
            return list.filter(item => {
                if (selectedIds.includes(item.id)) {
                    removedItems.push(item);
                    return false;
                }
                return true;
            }).map(item => item.children ? { ...item, children: findAndRemove(item.children) } : item);
        };

        const newTree = findAndRemove(prev);
        const newContainer: FormElement = {
            id: `container-${Date.now()}`,
            type: 'container',
            label: 'Grouped Container',
            name: `group_${Date.now()}`,
            styles: { padding: '16px', gap: '16px', display: 'flex', flexDirection: 'column', borderWidth: '1px', borderStyle: 'dashed', borderColor: '#ccc' },
            children: removedItems
        };

        return [...newTree, newContainer];
    });
    setSelectedIds([]);
  };

  const handleGroupWithAI = (label: string, styles: ElementStyle) => {
    if (selectedIds.length < 1) return;
    
    updateFormElementsWithHistory(prev => {
        let removedItems: FormElement[] = [];
        const findAndRemove = (list: FormElement[]): FormElement[] => {
            return list.filter(item => {
                if (selectedIds.includes(item.id)) {
                    removedItems.push(item);
                    return false;
                }
                return true;
            }).map(item => item.children ? { ...item, children: findAndRemove(item.children) } : item);
        };

        const newTree = findAndRemove(prev);
        const newContainer: FormElement = {
            id: `container-${Date.now()}`,
            type: 'container',
            label: label,
            name: `ai_group_${Date.now()}`,
            styles: { padding: '24px', gap: '16px', display: 'flex', flexDirection: 'column', ...styles },
            children: removedItems
        };

        return [...newTree, newContainer];
    });
    setSelectedIds([]);
  };

  const handleSaveAsTemplate = () => {
    if (selectedIds.length === 0) return;
    
    const selectedElements: FormElement[] = [];
    const findSelected = (list: FormElement[]) => {
      list.forEach(el => {
        if (selectedIds.includes(el.id)) selectedElements.push(el);
        if (el.children) findSelected(el.children);
      });
    };
    findSelected(formElements);

    if (selectedElements.length === 0) return;

    const templateName = prompt("Enter a name for your template:", "My Reusable Component");
    if (!templateName) return;

    const newTemplate: SnippetItem = {
      id: `template-${Date.now()}`,
      label: templateName,
      elements: selectedElements.map(el => {
        const stripIds = (item: FormElement): any => {
          const { id, ...rest } = item;
          if (rest.children) rest.children = rest.children.map(stripIds);
          return rest;
        };
        return stripIds(el);
      })
    };

    const saved = localStorage.getItem('formBuilderTemplates');
    const templates = saved ? JSON.parse(saved) : [];
    const updated = [...templates, newTemplate];
    localStorage.setItem('formBuilderTemplates', JSON.stringify(updated));
    
    window.dispatchEvent(new Event('templatesUpdated'));
    alert("Template saved to 'My Templates'!");
  };

  const selectedElement = useMemo(() => {
      if (selectedIds.length !== 1) return null;
      const find = (list: FormElement[]): FormElement | null => {
          for (const el of list) {
              if (el.id === selectedIds[0]) return el;
              if (el.children) {
                  const found = find(el.children);
                  if (found) return found;
              }
          }
          return null;
      };
      return find(formElements);
  }, [selectedIds, formElements]);

  const generatePrompt = (elements: FormElement[]): string => {
    let prompt = "Create a complete, responsive, and accessible HTML/CSS form based on the following detailed specifications. Use Tailwind CSS for styling.\n\n### Form Structure:\n";
    
    const describeElement = (el: FormElement, depth: number = 0, index: number): string => {
      const indent = "  ".repeat(depth);
      let desc = `${indent}${index + 1}. **${el.label}** (${el.type})`;
      
      const details = [];
      if (el.name) details.push(`name="${el.name}"`);
      if (el.placeholder) details.push(`placeholder="${el.placeholder}"`);
      if (el.required) details.push(`required`);
      if (el.subType) details.push(`type="${el.subType}"`);
      if (el.options) details.push(`options=[${el.options.join(', ')}]`);
      if (el.htmlContent) details.push(`content="Custom HTML Block"`);
      
      if (details.length > 0) desc += ` - [${details.join(', ')}]`;
      
      if (el.children && el.children.length > 0) {
        desc += `\n${indent}   *Container Contents:*`;
        desc += "\n" + el.children.map((c, i) => describeElement(c, depth + 1, i)).join("\n");
      }
      return desc;
    };
  
    prompt += elements.map((e, i) => describeElement(e, 0, i)).join("\n");
    prompt += "\n\n### Requirements:\n- Use semantic HTML tags.\n- Ensure high accessibility contrast.\n- Include form validation logic matching the 'required' and type attributes.\n- Layout should be clean and modern.";
    return prompt;
  };

  const generateHTML = (elements: FormElement[]) => {
      const lines: string[] = [];
      if (elements === formElements) lines.push('<form class="space-y-4 p-4">');
      
      elements.forEach(el => {
          if (el.type === 'script') {
              if (el.scriptContent) lines.push(`  <script>\n    ${el.scriptContent.replace(/\n/g, '\n    ')}\n  </script>`);
              return;
          }
          if (el.type === 'html-block' || el.type === 'htmlContent') {
              if (el.htmlContent) lines.push(`  ${el.htmlContent}`);
              return;
          }

          const getStyleString = (s: any) => {
              if(!s) return '';
              const styles = [];
              if(s.backgroundColor) styles.push(`background-color: ${s.backgroundColor}`);
              if(s.textColor) styles.push(`color: ${s.textColor}`);
              if(s.borderColor) styles.push(`border-color: ${s.borderColor}`);
              if(s.borderWidth) styles.push(`border-width: ${s.borderWidth}`);
              if(s.borderStyle) styles.push(`border-style: ${s.borderStyle}`);
              if(s.borderRadius) styles.push(`border-radius: ${s.borderRadius}`);
              if(s.padding) styles.push(`padding: ${s.padding}`);
              if(s.fontFamily) styles.push(`font-family: ${s.fontFamily}`);
              if(s.fontWeight) styles.push(`font-weight: ${s.fontWeight}`);
              if(s.height) styles.push(`height: ${s.height}`);
              if(s.width) styles.push(`width: ${s.width}`);
              if(s.textAlign) styles.push(`text-align: ${s.textAlign}`);
              if(s.display === 'grid') {
                  styles.push('display: grid');
                  if(s.gridTemplateColumns) styles.push(`grid-template-columns: ${s.gridTemplateColumns}`);
                  if(s.gap) styles.push(`gap: ${s.gap}`);
              } else if (s.display === 'flex') {
                  styles.push('display: flex');
                  if(s.flexDirection) styles.push(`flex-direction: ${s.flexDirection}`);
                  if(s.gap) styles.push(`gap: ${s.gap}`);
              }
              return styles.length > 0 ? `style="${styles.join('; ')}"` : '';
          };
          const styleStr = getStyleString(el.styles);

          if (el.type === 'container') {
              lines.push(`  <div class="container-element" ${styleStr}>`);
              if (el.children) lines.push(generateHTML(el.children));
              lines.push('  </div>');
              return;
          }
          
          if (el.type === 'accordion') {
              lines.push(`  <details class="accordion-wrapper" ${styleStr}>`);
              lines.push(`    <summary class="cursor-pointer font-bold p-2 bg-gray-50 border border-b-0">${el.label}</summary>`);
              lines.push(`    <div class="accordion-content border p-2">`);
              if (el.children) lines.push(generateHTML(el.children));
              lines.push('    </div>');
              lines.push('  </details>');
              return;
          }

          if (!['button', 'reset-button', 'news-card', 'iframe', 'navbar', 'container', 'html-block', 'htmlContent', 'typography', 'divider', 'image', 'accordion'].includes(el.type)) {
              lines.push(`  <div class="form-group mb-4" ${styleStr}>`);
              lines.push(`    <label for="${el.name}" class="block text-sm font-medium text-gray-700">${el.label}${el.required ? ' *' : ''}</label>`);
          } else {
              lines.push(`  <div class="form-group mb-4" ${styleStr}>`);
          }

          let fieldHtml = '';
          const requiredAttr = el.required ? 'required' : '';
          const disabledAttr = el.disabled ? 'disabled' : '';

          switch (el.type) {
              case 'text':
              case 'number':
              case 'date':
              case 'color':
              case 'file':
              case 'range':
                  fieldHtml = `    <input type="${el.subType || el.type}" id="${el.name}" name="${el.name}" placeholder="${el.placeholder || ''}" class="form-control block w-full border rounded-md p-2" ${requiredAttr} ${disabledAttr} />`;
                  break;
              case 'textarea':
                  fieldHtml = `    <textarea id="${el.name}" name="${el.name}" placeholder="${el.placeholder || ''}" rows="4" class="form-control block w-full border rounded-md p-2" ${requiredAttr} ${disabledAttr}></textarea>`;
                  break;
              case 'select':
                  const optionsHtml = el.options?.map(opt => `<option value="${opt}">${opt}</option>`).join('') || '';
                  fieldHtml = `    <select id="${el.name}" name="${el.name}" class="form-control block w-full border rounded-md p-2" ${requiredAttr} ${disabledAttr} ${el.multiple ? 'multiple' : ''}>${optionsHtml}</select>`;
                  break;
              case 'button':
                  fieldHtml = `    <button type="button" class="px-4 py-2 bg-blue-600 text-white rounded-md" ${disabledAttr}>${el.label}</button>`;
                  break;
              case 'reset-button':
                  fieldHtml = `    <button type="reset" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md" ${disabledAttr}>${el.label}</button>`;
                  break;
              default:
                  fieldHtml = `    <!-- Element type ${el.type} -->`;
          }
          lines.push(fieldHtml);
          lines.push('  </div>');
      });
      if (elements === formElements) lines.push('</form>');
      return lines.join('\n');
  };

  return (
    <div className="flex flex-col h-screen font-sans text-brand-text overflow-hidden">
      {/* Header - Fixed Height */}
      <header className="flex-none flex justify-between items-center p-3 bg-brand-primary text-white shadow-md z-30">
        <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Power Form Builder AI</h1>
            <div className="flex space-x-1 bg-brand-accent rounded-md p-1">
                <button onClick={handleUndo} disabled={historyIndex === 0} className="p-1 hover:bg-white/10 rounded disabled:opacity-30" title="Undo"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg></button>
                <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-1 hover:bg-white/10 rounded disabled:opacity-30" title="Redo"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
            </div>
        </div>
        <div className="flex items-center space-x-2">
           {selectedIds.length > 0 && (
               <div className="flex space-x-1 bg-white/10 p-1 rounded-md animate-pulse shadow-inner">
                 <button onClick={handleGroupElements} className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-bold rounded shadow-sm hover:bg-indigo-600 transition-colors flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                     Group
                 </button>
                 <button onClick={handleSaveAsTemplate} className="px-3 py-1.5 bg-yellow-600 text-white text-xs font-bold rounded shadow-sm hover:bg-yellow-700 transition-colors flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                     Template
                 </button>
               </div>
           )}
           <button onClick={handleSaveDraft} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 transition-colors flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
               {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Draft'}
           </button>
           <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-brand-accent text-white font-semibold rounded-md shadow-sm hover:bg-blue-800 flex items-center transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
             Import
           </button>
           <button onClick={() => setShowPreviewModal(true)} disabled={formElements.length === 0} className="px-4 py-2 bg-brand-accent text-white font-semibold rounded-md shadow-sm hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
             Preview
           </button>
           <button onClick={() => { setGeneratedPrompt(generatePrompt(formElements)); setShowPromptModal(true); }} disabled={formElements.length === 0} className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-md shadow-sm hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
               AI Prompt
           </button>
           <button onClick={() => setShowClearConfirm(true)} disabled={formElements.length === 0} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">Clear</button>
           <button onClick={() => { setGeneratedCode(generateHTML(formElements)); setShowCodeModal(true); }} disabled={formElements.length === 0} className="px-4 py-2 bg-white text-brand-primary font-semibold rounded-md shadow-sm hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">Code</button>
        </div>
      </header>

      {/* AI Bar - Fixed Height */}
       <div className="flex-none p-3 bg-brand-secondary border-b border-gray-300 z-20">
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:space-x-2">
                <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe your form, e.g., 'A user registration form...'" className="flex-grow p-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" disabled={isLoading} />
                <button onClick={handleGetSuggestions} disabled={isLoading || !aiPrompt.trim()} className="mt-2 sm:mt-0 px-4 py-2 bg-brand-accent text-white font-semibold rounded-md shadow-sm hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">{isLoading ? 'Thinking...' : 'AI Suggest'}</button>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0 px-4">
                  <input 
                    type="checkbox" 
                    id="search-toggle" 
                    checked={useGoogleSearch} 
                    onChange={(e) => setUseGoogleSearch(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                  />
                  <label htmlFor="search-toggle" className="text-xs font-bold text-brand-text uppercase tracking-tight cursor-pointer select-none">Web Search</label>
                </div>
            </div>
        </div>
        {error && (
            <div className="bg-red-50 p-3 text-center text-red-700 text-sm font-medium border-b border-red-200">
                {error}
            </div>
        )}

      {/* Main Content Area - Flex Grow */}
      <main className="flex flex-grow overflow-hidden relative">
        <div className="h-full overflow-y-auto border-r border-gray-300 z-10 flex-shrink-0">
            <Palette 
                suggestedElements={suggestedElements} 
                onClearSuggestions={() => setSuggestedElements([])} 
                onAddElement={handleAddElement}
            />
        </div>
        
        <div className="flex-grow h-full overflow-y-auto bg-gray-100 relative">
            <Canvas 
              elements={formElements} 
              setElements={updateFormElementsWithHistory} 
              setSelectedIds={setSelectedIds} 
              selectedIds={selectedIds}
              updateElement={updateElement}
            />
        </div>

        <div className="h-full overflow-y-auto border-l border-gray-300 z-10 flex-shrink-0 bg-white">
            <PropertiesPanel 
                selectedElement={selectedElement} 
                selectedIds={selectedIds}
                updateElement={updateElement} 
                closePanel={() => setSelectedIds([])} 
                allElements={formElements}
                onDuplicate={duplicateElement}
                onGroup={handleGroupElements}
                onGroupWithAI={handleGroupWithAI}
            />
        </div>
      </main>
      
      <ConfirmationDialog isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} onConfirm={handleClearAll} title="Clear All" message="Are you sure? This cannot be undone." confirmButtonText="Clear All" confirmButtonVariant="danger" />
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} onImport={(els) => updateFormElementsWithHistory(prev => [...prev, ...els])} />}
      {showCodeModal && <CodeModal code={generatedCode} onClose={() => setShowCodeModal(false)} />}
      {showPromptModal && <PromptModal prompt={generatedPrompt} onClose={() => setShowPromptModal(false)} />}
      {showPreviewModal && <PreviewModal elements={formElements} onClose={() => setShowPreviewModal(false)} />}
    </div>
  );
};

export default App;
