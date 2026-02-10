
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Palette from './components/Palette';
import Canvas from './components/Canvas';
import PropertiesPanel from './components/PropertiesPanel';
import CodeModal from './components/CodeModal';
import PreviewModal from './components/PreviewModal';
import ConfirmationDialog from './components/ConfirmationDialog';
import ImportModal from './components/ImportModal';
import type { FormElement, FormElementType, ElementStyle, SnippetItem } from './types';
import { getFormSuggestions } from './services/geminiService';

const App: React.FC = () => {
  const [formElements, setFormElements] = useState<FormElement[]>(() => {
    try {
      const saved = localStorage.getItem('formElements');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [suggestedElements, setSuggestedElements] = useState<Partial<FormElement>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    localStorage.setItem('formElements', JSON.stringify(formElements));
  }, [formElements]);

  const handleClearAll = () => {
    setFormElements([]);
    setSelectedIds([]);
    setShowClearConfirm(false);
  };

  const handleGetSuggestions = async () => {
    if (!aiPrompt.trim()) return;
    setIsLoading(true);
    try {
      const result = await getFormSuggestions(aiPrompt, false);
      setSuggestedElements(result.suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateElement = useCallback((id: string, updatedProps: Partial<FormElement>) => {
    setFormElements(prev => {
      const recursiveUpdate = (list: FormElement[]): FormElement[] => {
        return list.map(el => {
          if (el.id === id) return { ...el, ...updatedProps };
          if (el.children) return { ...el, children: recursiveUpdate(el.children) };
          return el;
        });
      };
      return recursiveUpdate(prev);
    });
  }, []);

  const duplicateElement = useCallback((id: string) => {
    setFormElements(prev => {
      const generateNewIds = (el: FormElement): FormElement => {
        const newId = `${el.type}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        return {
          ...el,
          id: newId,
          name: `${el.name}_copy`,
          children: el.children ? el.children.map(generateNewIds) : undefined
        };
      };

      const findAndClone = (list: FormElement[]): FormElement[] => {
        const index = list.findIndex(el => el.id === id);
        if (index !== -1) {
          const clone = generateNewIds(list[index]);
          const newList = [...list];
          newList.splice(index + 1, 0, clone);
          return newList;
        }
        return list.map(el => el.children ? { ...el, children: findAndClone(el.children) } : el);
      };
      return findAndClone(prev);
    });
  }, []);

  const saveAsTemplate = useCallback((id: string) => {
    const find = (list: FormElement[]): FormElement | null => {
      for (const el of list) {
        if (el.id === id) return el;
        if (el.children) {
          const found = find(el.children);
          if (found) return found;
        }
      }
      return null;
    };

    const element = find(formElements);
    if (!element) return;

    const templateName = prompt("Enter a name for your custom template:", element.label || "My Custom Snippet");
    if (!templateName) return;

    const newTemplate: SnippetItem = {
      id: `template-${Date.now()}`,
      label: templateName,
      elements: [element]
    };

    const saved = localStorage.getItem('formBuilderTemplates');
    const templates = saved ? JSON.parse(saved) : [];
    templates.push(newTemplate);
    localStorage.setItem('formBuilderTemplates', JSON.stringify(templates));
    window.dispatchEvent(new Event('templatesUpdated'));
    alert(`"${templateName}" saved to toolkit!`);
  }, [formElements]);

  const groupSelectedElements = useCallback(() => {
    if (selectedIds.length < 2) return;

    setFormElements(prev => {
      let harvested: FormElement[] = [];
      
      const recursiveHarvest = (list: FormElement[]): FormElement[] => {
        const remaining: FormElement[] = [];
        list.forEach(item => {
          if (selectedIds.includes(item.id || '')) {
            harvested.push(item);
          } else {
            if (item.children) {
              item.children = recursiveHarvest(item.children);
            }
            remaining.push(item);
          }
        });
        return remaining;
      };

      const cleanTree = recursiveHarvest([...prev]);
      
      const newGroup: FormElement = {
        id: `container-${Date.now()}`,
        type: 'container',
        label: 'New Group',
        name: `group_${Date.now().toString(36)}`,
        styles: { 
          padding: '20px', 
          backgroundColor: '#ffffff', 
          borderWidth: '1px', 
          borderStyle: 'dashed', 
          borderColor: '#e5e7eb',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        },
        children: harvested
      };

      return [...cleanTree, newGroup];
    });
    
    // Select the new group
    setSelectedIds([`container-${Date.now()}`]);
  }, [selectedIds]);

  const applyStyleToChildren = useCallback((parentId: string, styles: ElementStyle) => {
    setFormElements(prev => {
      const syncStyles = (list: FormElement[]): FormElement[] => {
        return list.map(el => {
          if (el.id === parentId && el.children) {
            return {
              ...el,
              children: el.children.map(child => ({
                ...child,
                styles: { ...child.styles, ...styles }
              }))
            };
          }
          if (el.children) return { ...el, children: syncStyles(el.children) };
          return el;
        });
      };
      return syncStyles(prev);
    });
  }, []);

  const handleAddFromPalette = (data: any) => {
    const id = `${data.type}-${Date.now()}`;
    const newEl: FormElement = {
      ...data,
      id,
      name: `${data.type}_${Date.now().toString(36)}`,
      styles: { size: 'medium', ...(data.styles || {}) },
      children: data.children || (['container', 'bootstrap-row', 'bootstrap-col', 'accordion'].includes(data.type) ? [] : undefined)
    };
    setFormElements(prev => [...prev, newEl]);
    setSelectedIds([id]);
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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white text-brand-text">
      <header className="h-16 flex-none border-b border-gray-100 flex items-center justify-between px-8 z-40 bg-white shadow-soft">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-black shadow-elevated">P</div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none mb-0.5">PowerStudio</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Form Builder</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsAiAssistantOpen(!isAiAssistantOpen)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center space-x-2 border-2 ${isAiAssistantOpen ? 'bg-brand-primary text-white border-brand-primary shadow-elevated' : 'bg-white text-gray-700 border-gray-100 hover:border-brand-primary/30'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span>AI Assist</span>
          </button>
          
          <div className="h-6 w-px bg-gray-100 mx-2" />

          <button onClick={() => setShowPreviewModal(true)} disabled={formElements.length === 0} className="px-5 py-2 bg-gray-50 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center space-x-2 border border-gray-200 disabled:opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <span>Preview</span>
          </button>
          <button onClick={() => setShowCodeModal(true)} disabled={formElements.length === 0} className="px-6 py-2 bg-brand-primary text-white text-sm font-bold rounded-xl hover:bg-brand-accent transition-all shadow-soft disabled:opacity-30">
            Export
          </button>
        </div>
      </header>

      {isAiAssistantOpen && (
        <div className="flex-none bg-gray-50 border-b border-gray-100 py-6 px-12 z-30 animate-fade-in-staggered">
          <div className="max-w-5xl mx-auto flex items-center space-x-6">
            <div className="relative flex-grow">
               <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-brand-primary">
                  <svg className="h-5 w-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
               <input 
                type="text" 
                value={aiPrompt} 
                onChange={(e) => setAiPrompt(e.target.value)} 
                placeholder="What kind of form do you need?" 
                className="block w-full pl-12 pr-4 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-sm outline-none shadow-soft font-medium" 
                onKeyDown={(e) => e.key === 'Enter' && handleGetSuggestions()}
               />
            </div>
            <button 
              onClick={handleGetSuggestions} 
              disabled={isLoading || !aiPrompt.trim()} 
              className="bg-brand-primary text-white px-8 py-3.5 rounded-2xl text-sm font-black shadow-elevated hover:bg-brand-accent transition-all flex items-center disabled:bg-gray-400"
            >
              {isLoading ? 'Generating...' : "Generate"}
            </button>
          </div>
        </div>
      )}

      <main className="flex-grow flex overflow-hidden">
        <div className="w-80 flex-none bg-white border-r border-gray-100">
          <Palette suggestedElements={suggestedElements} onClearSuggestions={() => setSuggestedElements([])} onAddElement={handleAddFromPalette} />
        </div>

        <div className="flex-grow flex flex-col relative overflow-hidden bg-[#F0F2F5]">
          <Canvas 
            elements={formElements} 
            setElements={setFormElements} 
            setSelectedIds={setSelectedIds} 
            selectedIds={selectedIds} 
            updateElement={updateElement} 
          />
          
          <div className="absolute bottom-10 right-10 flex flex-col space-y-4 z-30">
            <button onClick={() => setShowImportModal(true)} title="Import Data" className="w-14 h-14 bg-white rounded-2xl shadow-elevated flex items-center justify-center text-brand-primary border border-gray-100 hover:bg-brand-subtle transition-all active:scale-95">
               <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </button>
            <button onClick={() => setShowClearConfirm(true)} title="Clear Canvas" className="w-14 h-14 bg-red-50 rounded-2xl shadow-elevated flex items-center justify-center text-red-500 border border-red-100 hover:bg-red-100 transition-all active:scale-95">
               <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" /></svg>
            </button>
          </div>
        </div>

        <div className="w-96 flex-none bg-white">
          <PropertiesPanel 
            selectedElement={selectedElement} 
            selectedIds={selectedIds} 
            updateElement={updateElement} 
            closePanel={() => setSelectedIds([])} 
            allElements={formElements} 
            onDuplicate={duplicateElement}
            onSaveTemplate={saveAsTemplate}
            onGroup={groupSelectedElements}
            onApplyStyleToChildren={applyStyleToChildren}
          />
        </div>
      </main>

      <ConfirmationDialog isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} onConfirm={handleClearAll} title="Clear Everything?" message="This will permanently delete all form components." confirmButtonText="Clear All" confirmButtonVariant="danger" />
      {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} onImport={(els) => setFormElements(prev => [...prev, ...els])} />}
      {showCodeModal && <CodeModal formElements={formElements} onClose={() => setShowCodeModal(false)} />}
      {showPreviewModal && <PreviewModal elements={formElements} onClose={() => setShowPreviewModal(false)} />}
    </div>
  );
};

export default App;
