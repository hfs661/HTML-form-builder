import React, { useState, useMemo } from 'react';
import type { FormElement, DataLogicRule, ValidationLogic, ElementStyle, ConditionalRule, BulkAction, ElementLogic, LogicCondition } from '../types';
import { getStyleSuggestions, getScriptSuggestions, getContentSuggestion, suggestContainerConfig } from '../services/geminiService';

interface PropertiesPanelProps {
  selectedElement: FormElement | null;
  selectedIds: string[];
  allElements: FormElement[];
  updateElement: (id: string, updatedProps: Partial<FormElement>) => void;
  closePanel: () => void;
  onDuplicate?: (id: string) => void;
  onGroup?: (id?: string) => void;
  onGroupWithAI?: (label: string, styles: ElementStyle) => void;
}

const PropertyInput: React.FC<{ label: string; name: string; value: string | number | undefined; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string, type?: string, min?: number }> = ({ label, name, value, onChange, placeholder, type = 'text', min }) => (
    <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <input 
            type={type} 
            name={name} 
            value={value === undefined || value === null ? '' : value} 
            onChange={onChange} 
            placeholder={placeholder} 
            min={min}
            className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary focus:outline-none transition-shadow" 
        />
    </div>
);

const PropertyToggle: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
    <div className="mb-3 flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input 
                type="checkbox" 
                checked={!!checked} 
                onChange={(e) => onChange(e.target.checked)} 
                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-brand-primary"
                style={{ right: checked ? '0' : 'auto', left: checked ? 'auto' : '0' }}
            />
            <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${checked ? 'bg-brand-primary' : 'bg-gray-300'}`}></label>
        </div>
    </div>
);

const PropertyTextarea: React.FC<{ label: string; value: string | undefined; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string, rows?: number, fontFamily?: string }> = ({ label, value, onChange, placeholder, rows=4, fontFamily }) => (
    <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <textarea 
            value={value === undefined || value === null ? '' : value} 
            onChange={onChange} 
            placeholder={placeholder} 
            rows={rows} 
            className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary focus:outline-none transition-shadow" 
            style={{ fontFamily }} 
        />
    </div>
);

const PropertySelect: React.FC<{ label: string; name: string; value: string | undefined; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: {value: string, label: string}[] }> = ({ label, name, value, onChange, options }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const showFilter = options.length > 8;

    const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            {showFilter && (
                <input 
                    type="text" 
                    placeholder="Search options..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-1.5 mb-1.5 text-xs border border-gray-200 rounded bg-gray-50 focus:bg-white focus:border-brand-primary focus:outline-none"
                />
            )}
            <select 
                name={name} 
                value={value === undefined || value === null ? '' : value} 
                onChange={onChange} 
                className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary focus:outline-none"
            >
                {filteredOptions.length > 0 ? (
                    filteredOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)
                ) : (
                    <option disabled>No matches found</option>
                )}
            </select>
        </div>
    );
};

const ColorPicker: React.FC<{ label: string; value: string | undefined; onChange: (val: string) => void }> = ({ label, value, onChange }) => (
    <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <div className="flex items-center space-x-2">
            <input 
                type="color" 
                value={value || '#000000'} 
                onChange={(e) => onChange(e.target.value)} 
                className="h-8 w-8 rounded border border-gray-300 cursor-pointer p-0 shadow-sm" 
            />
            <input 
                type="text" 
                value={value || ''} 
                onChange={(e) => onChange(e.target.value)} 
                placeholder="#RRGGBB" 
                className="flex-1 p-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary focus:outline-none" 
            />
        </div>
    </div>
);

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-md mb-2 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 uppercase tracking-wide focus:outline-none transition-colors">{title}<svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
            {isOpen && <div className="p-3 bg-white border-t border-gray-200 animate-fade-in-staggered">{children}</div>}
        </div>
    );
};

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement, selectedIds, allElements, updateElement, closePanel, onDuplicate, onGroup, onGroupWithAI }) => {
  const [activeTab, setActiveTab] = useState<'props' | 'style' | 'logic'>('props');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrouping, setIsGrouping] = useState(false);
  const [aiContentPrompt, setAiContentPrompt] = useState('');
  const [aiStylePrompt, setAiStylePrompt] = useState('');
  const [aiScriptPrompt, setAiScriptPrompt] = useState('');
  const [scriptType, setScriptType] = useState<'onClick' | 'onChange'>('onClick');

  const styles = selectedElement?.styles || {};
  const dataLogic = selectedElement?.dataLogic || { rules: [] };
  const validationLogic = selectedElement?.validationLogic || { triggerId: '', condition: 'matches', value: '', errorMessage: '' };
  const conditionalRules = selectedElement?.conditionalRules || [];
  const visibilityLogic = selectedElement?.logic || { triggerId: '', condition: 'equals', value: '', action: 'show' };

  const flattenElements = (elements: FormElement[]): FormElement[] => {
      let flat: FormElement[] = [];
      elements.forEach(el => {
          flat.push(el);
          if (el.children) flat = flat.concat(flattenElements(el.children));
      });
      return flat;
  };
  
  const allFlatElements = useMemo(() => flattenElements(allElements), [allElements]);

  const logicConditions: {value: LogicCondition, label: string}[] = [
      {value:'equals',label:'Equals'},
      {value:'not_equals',label:'Does Not Equal'},
      {value:'contains',label:'Contains'},
      {value:'starts_with',label:'Starts With'},
      {value:'ends_with',label:'Ends With'},
      {value:'greater_than',label:'Greater Than'},
      {value:'less_than',label:'Less Than'},
      {value:'is_empty',label:'Is Empty'},
      {value:'is_not_empty',label:'Is Not Empty'}
  ];

  const handleAiContentGenerate = async () => {
    if (!selectedElement || !aiContentPrompt.trim()) return;
    setIsGenerating(true);
    try {
        const result = await getContentSuggestion(aiContentPrompt, selectedElement.type);
        updateElement(selectedElement.id, { ...result });
    } catch (err) {
        console.error(err);
        alert("AI Failed to generate content.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleAiStyleGenerate = async () => {
      if (!selectedElement) return;
      setIsGenerating(true);
      try {
          const userPrompt = aiStylePrompt.trim() || "modern, accessible design with proper spacing, legible typography, and layout";
          const prompt = `${userPrompt}. Focus on layout, spacing, and typography.`;
          const result = await getStyleSuggestions(selectedElement, prompt);
          updateElement(selectedElement.id, { styles: { ...selectedElement.styles, ...result } });
      } catch (err) {
          console.error(err);
          alert("AI Failed to generate styles.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleAiScriptGenerate = async () => {
      if (!selectedElement || !aiScriptPrompt.trim()) return;
      setIsGenerating(true);
      try {
          const script = await getScriptSuggestions(aiScriptPrompt);
          if (scriptType === 'onClick') {
             updateElement(selectedElement.id, { onClickScript: script });
          } else {
             updateElement(selectedElement.id, { onChangeScript: script });
          }
      } catch (err) {
          console.error(err);
          alert("AI Failed to generate script.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleGroupWithAIMagic = async () => {
      if (selectedIds.length < 2 || !onGroupWithAI) return;
      setIsGrouping(true);
      try {
          const selectedElements: FormElement[] = [];
          const findSelected = (list: FormElement[]) => {
              list.forEach(el => {
                  if (selectedIds.includes(el.id)) selectedElements.push(el);
                  if (el.children) findSelected(el.children);
              });
          };
          findSelected(allElements);
          const config = await suggestContainerConfig(selectedElements);
          onGroupWithAI(config.label, config.styles);
      } catch (err) {
          console.error(err);
          alert("AI Failed to suggest group config.");
      } finally {
          setIsGrouping(false);
      }
  };

  const handleAddDataLogicRule = () => {
    const newRule: DataLogicRule = { triggerId: '', condition: 'equals', value: '', result: '', targetProperty: 'value' };
    updateElement(selectedElement!.id, { dataLogic: { ...dataLogic, rules: [...dataLogic.rules, newRule] } });
  };

  const updateDataLogicRule = (idx: number, props: Partial<DataLogicRule>) => {
    const newRules = [...dataLogic.rules];
    newRules[idx] = { ...newRules[idx], ...props };
    updateElement(selectedElement!.id, { dataLogic: { ...dataLogic, rules: newRules } });
  };

  const removeDataLogicRule = (idx: number) => {
    const newRules = dataLogic.rules.filter((_, i) => i !== idx);
    updateElement(selectedElement!.id, { dataLogic: { ...dataLogic, rules: newRules } });
  };

  const handleAddConditionalRule = () => {
    const newRule: ConditionalRule = {
        id: Date.now().toString(),
        condition: 'equals',
        matchValue: '',
        actions: []
    };
    updateElement(selectedElement!.id, { conditionalRules: [...conditionalRules, newRule] });
  };

  const updateConditionalRule = (idx: number, props: Partial<ConditionalRule>) => {
      const newRules = [...conditionalRules];
      newRules[idx] = { ...newRules[idx], ...props };
      updateElement(selectedElement!.id, { conditionalRules: newRules });
  };

  const removeConditionalRule = (idx: number) => {
      const newRules = conditionalRules.filter((_, i) => i !== idx);
      updateElement(selectedElement!.id, { conditionalRules: newRules });
  };
  
  const handleAddBulkAction = (ruleIdx: number) => {
      const newAction: BulkAction = { targetIds: [], property: 'hidden', value: true };
      const newRules = [...conditionalRules];
      newRules[ruleIdx].actions.push(newAction);
      updateElement(selectedElement!.id, { conditionalRules: newRules });
  };

  const updateBulkAction = (ruleIdx: number, actionIdx: number, props: Partial<BulkAction>) => {
      const newRules = [...conditionalRules];
      newRules[ruleIdx].actions[actionIdx] = { ...newRules[ruleIdx].actions[actionIdx], ...props };
      updateElement(selectedElement!.id, { conditionalRules: newRules });
  };

  const removeBulkAction = (ruleIdx: number, actionIdx: number) => {
      const newRules = [...conditionalRules];
      newRules[ruleIdx].actions = newRules[ruleIdx].actions.filter((_, i) => i !== actionIdx);
      updateElement(selectedElement!.id, { conditionalRules: newRules });
  };

  if (selectedIds.length > 1) {
      return (
          <div className="w-full md:w-72 lg:w-80 bg-brand-light-gray h-full flex flex-col border-l border-gray-300 shadow-xl z-20">
            <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-white">
                <h2 className="text-xl font-bold text-brand-text">Multi-Select</h2>
                <button onClick={closePanel} className="text-gray-400 hover:text-gray-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 shadow-sm text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  <p className="text-indigo-800 font-bold mb-1">{selectedIds.length} elements selected</p>
                  <p className="text-xs text-indigo-600 mb-4 px-2">These elements look like they could be related.</p>
                  
                  {onGroup && (
                    <button 
                        onClick={() => onGroup()} 
                        className="w-full py-3 bg-gray-600 text-white rounded-md font-bold text-sm hover:bg-gray-700 transition-all shadow-md mb-2 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Group Elements
                    </button>
                  )}

                  <button 
                    onClick={handleGroupWithAIMagic} 
                    disabled={isGrouping}
                    className="w-full py-3 bg-indigo-600 text-white rounded-md font-bold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                      {isGrouping ? "AI is analyzing..." : "Group with AI Magic ✨"}
                  </button>
              </div>
            </div>
          </div>
      );
  }

  if (!selectedElement) {
    return (
      <div className="w-full md:w-72 lg:w-80 p-4 bg-brand-light-gray flex flex-col items-center justify-center text-gray-500 border-l border-gray-300">
        <p className="text-center px-6">Select an element to refine its look and behavior</p>
      </div>
    );
  }

  const isInputType = ['text', 'number', 'date', 'email', 'textarea', 'select', 'inputMask', 'password', 'file'].includes(selectedElement.type);
  const isTextType = ['text', 'textarea', 'email'].includes(selectedElement.type);
  const isNumberType = ['number', 'range', 'progress', 'rating'].includes(selectedElement.type);

  return (
    <div className="w-full md:w-72 lg:w-80 bg-brand-light-gray h-full flex flex-col border-l border-gray-300 shadow-xl z-20">
      <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-white">
        <div>
            <h2 className="text-xl font-bold text-brand-text">Properties</h2>
            {onDuplicate && <button onClick={() => onDuplicate(selectedElement.id)} className="text-xs text-brand-primary hover:underline mt-1 font-bold">Duplicate Element</button>}
        </div>
        <button onClick={closePanel} className="text-gray-400 hover:text-gray-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
      </div>
      <div className="flex border-b border-gray-300 bg-white">
        {(['props', 'style', 'logic'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider focus:outline-none transition-all ${activeTab === tab ? 'text-brand-primary border-b-2 border-brand-primary bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>{tab}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'props' && (
          <div className="space-y-4">
             <CollapsibleSection title="General" defaultOpen>
                 <PropertyInput label="Label" name="label" value={selectedElement.label} onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })} />
                 <PropertyInput label="Variable Name" name="name" value={selectedElement.name} onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })} />
                 <PropertyInput label="Accessibility Label (ARIA)" name="ariaLabel" value={selectedElement.ariaLabel} onChange={(e) => updateElement(selectedElement.id, { ariaLabel: e.target.value })} placeholder="Screen reader text" />
                 
                 {['container', 'bootstrap-row', 'bootstrap-col'].includes(selectedElement.type) && (
                     <PropertySelect 
                        label="Semantic HTML Tag" 
                        name="htmlTag" 
                        value={selectedElement.htmlTag || 'div'} 
                        onChange={(e) => updateElement(selectedElement.id, { htmlTag: e.target.value })} 
                        options={[
                            {value:'div',label:'Generic (div)'}, 
                            {value:'section',label:'Section'}, 
                            {value:'article',label:'Article'}, 
                            {value:'header',label:'Header'}, 
                            {value:'footer',label:'Footer'}, 
                            {value:'aside',label:'Aside'}, 
                            {value:'main',label:'Main'}
                        ]} 
                    />
                 )}

                 {isInputType && (
                     <>
                        <PropertyInput label="Placeholder" name="placeholder" value={selectedElement.placeholder} onChange={(e) => updateElement(selectedElement.id, { placeholder: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <PropertyToggle label="Required" checked={!!selectedElement.required} onChange={(val) => updateElement(selectedElement.id, { required: val })} />
                            <PropertyToggle label="Disabled" checked={!!selectedElement.disabled} onChange={(val) => updateElement(selectedElement.id, { disabled: val })} />
                            <PropertyToggle label="Hidden" checked={!!selectedElement.hidden} onChange={(val) => updateElement(selectedElement.id, { hidden: val })} />
                        </div>
                     </>
                 )}
                 
                 {selectedElement.type === 'text' && (
                     <PropertySelect 
                        label="Sub-Type" 
                        name="subType" 
                        value={selectedElement.subType || 'text'} 
                        onChange={(e) => updateElement(selectedElement.id, { subType: e.target.value as any })} 
                        options={[
                            {value:'text',label:'Text'}, 
                            {value:'email',label:'Email'}, 
                            {value:'password',label:'Password'}, 
                            {value:'tel',label:'Telephone'}, 
                            {value:'url',label:'URL'}
                        ]} 
                    />
                 )}
             </CollapsibleSection>
             
             {selectedElement.type === 'code-block' && (
                 <CollapsibleSection title="Code Settings" defaultOpen>
                    <PropertySelect 
                        label="Language" 
                        name="language" 
                        value={selectedElement.language || 'javascript'} 
                        onChange={(e) => updateElement(selectedElement.id, { language: e.target.value })} 
                        options={[
                            {value:'javascript',label:'JavaScript'},
                            {value:'python',label:'Python'},
                            {value:'java',label:'Java'},
                            {value:'html',label:'HTML'},
                            {value:'css',label:'CSS'},
                            {value:'sql',label:'SQL'}
                        ]} 
                    />
                     <PropertyTextarea 
                        label="Code Content" 
                        value={selectedElement.code} 
                        onChange={(e) => updateElement(selectedElement.id, { code: e.target.value })} 
                        placeholder="print('Hello World')" 
                        rows={6}
                        fontFamily="monospace"
                     />
                 </CollapsibleSection>
             )}

             {['video', 'audio', 'image'].includes(selectedElement.type) && (
                 <CollapsibleSection title="Media Source" defaultOpen>
                    <PropertyInput label="Source URL (src)" name="src" value={selectedElement.src} onChange={(e) => updateElement(selectedElement.id, { src: e.target.value })} placeholder="https://example.com/media.mp4" />
                 </CollapsibleSection>
             )}

             {(selectedElement.type === 'htmlContent' || selectedElement.type === 'html-block') && (
                 <CollapsibleSection title="HTML Content" defaultOpen>
                     <PropertyTextarea 
                        label="Raw HTML" 
                        value={selectedElement.htmlContent} 
                        onChange={(e) => updateElement(selectedElement.id, { htmlContent: e.target.value })} 
                        placeholder="<div>Enter custom HTML...</div>" 
                        rows={10}
                        fontFamily="monospace"
                     />
                 </CollapsibleSection>
             )}

             {(isTextType || selectedElement.type === 'inputMask') && (
                 <CollapsibleSection title="Text Constraints">
                     {selectedElement.type === 'inputMask' && (
                        <PropertyInput label="Input Mask" name="inputMask" placeholder="e.g. (999) 999-9999" value={selectedElement.inputMask} onChange={(e) => updateElement(selectedElement.id, { inputMask: e.target.value })} />
                     )}
                     <div className="grid grid-cols-2 gap-2">
                        <PropertyInput label="Min Length" name="minLength" type="number" min={0} value={selectedElement.minLength} onChange={(e) => updateElement(selectedElement.id, { minLength: e.target.value ? Number(e.target.value) : undefined })} />
                        <PropertyInput label="Max Length" name="maxLength" type="number" min={0} value={selectedElement.maxLength} onChange={(e) => updateElement(selectedElement.id, { maxLength: e.target.value ? Number(e.target.value) : undefined })} />
                     </div>
                 </CollapsibleSection>
             )}

             {isNumberType && (
                 <CollapsibleSection title="Number Constraints">
                     <div className="grid grid-cols-2 gap-2">
                        <PropertyInput label="Minimum" name="min" type="number" value={selectedElement.min as number} onChange={(e) => updateElement(selectedElement.id, { min: e.target.value })} />
                        <PropertyInput label="Maximum" name="max" type="number" value={selectedElement.max as number} onChange={(e) => updateElement(selectedElement.id, { max: e.target.value })} />
                        {selectedElement.type === 'number' && <PropertyInput label="Step" name="step" type="number" value={selectedElement.step} onChange={(e) => updateElement(selectedElement.id, { step: e.target.value ? Number(e.target.value) : undefined })} />}
                     </div>
                     {selectedElement.type === 'progress' && <PropertyInput label="Current Value" name="placeholder" type="number" value={selectedElement.placeholder} onChange={(e) => updateElement(selectedElement.id, { placeholder: e.target.value })} />}
                 </CollapsibleSection>
             )}
             
             {selectedElement.type === 'date' && (
                 <CollapsibleSection title="Date Range">
                      <PropertyInput label="Min Date" name="min" type="date" value={selectedElement.min as string} onChange={(e) => updateElement(selectedElement.id, { min: e.target.value })} />
                      <PropertyInput label="Max Date" name="max" type="date" value={selectedElement.max as string} onChange={(e) => updateElement(selectedElement.id, { max: e.target.value })} />
                 </CollapsibleSection>
             )}

             {selectedElement.type === 'file' && (
                 <CollapsibleSection title="File Options">
                      <PropertyInput label="Accept (e.g. .pdf, image/*)" name="accept" value={selectedElement.accept} onChange={(e) => updateElement(selectedElement.id, { accept: e.target.value })} />
                 </CollapsibleSection>
             )}

             {selectedElement.type === 'select' && (
                 <CollapsibleSection title="Dropdown Configuration" defaultOpen>
                     <PropertyToggle label="Allow Multiple Selections" checked={!!selectedElement.multiple} onChange={(val) => updateElement(selectedElement.id, { multiple: val })} />
                     <PropertyToggle label="Searchable (Combobox)" checked={!!selectedElement.searchable} onChange={(val) => updateElement(selectedElement.id, { searchable: val })} />
                     <PropertyToggle label="Treat first option as Placeholder?" checked={!!selectedElement.hasPlaceholderOption} onChange={(val) => updateElement(selectedElement.id, { hasPlaceholderOption: val })} />
                     <PropertyTextarea label="Options (one per line)" value={selectedElement.options?.join('\n') || ''} onChange={(e) => updateElement(selectedElement.id, { options: e.target.value.split('\n') })} />
                     <div className="p-2 bg-yellow-50 border border-yellow-100 rounded text-[10px] text-yellow-800 mb-2">
                         <strong>Accurate Validation:</strong> When placeholder is on, the form will treat the first option as "empty" if required.
                     </div>
                     <PropertyTextarea label="Prohibited Selections (validation error)" value={selectedElement.prohibitedValues?.join('\n') || ''} onChange={(e) => updateElement(selectedElement.id, { prohibitedValues: e.target.value.split('\n') })} />
                 </CollapsibleSection>
             )}

             {['news-card', 'typography', 'image'].includes(selectedElement.type) && (
                 <CollapsibleSection title="AI Content Helper" defaultOpen>
                     <PropertyTextarea label="Tell AI what this element is about" value={aiContentPrompt} onChange={(e) => setAiContentPrompt(e.target.value)} placeholder="e.g. 'Generate a tech news title and summary'" />
                     <button onClick={handleAiContentGenerate} disabled={isGenerating} className="w-full py-2 bg-brand-primary text-white rounded text-xs font-bold uppercase hover:bg-brand-accent transition-colors shadow-sm active:scale-95">
                        {isGenerating ? 'Magic in progress...' : 'Generate with AI ✨'}
                     </button>
                 </CollapsibleSection>
             )}
          </div>
        )}

        {activeTab === 'style' && (
            <div className="space-y-4">
                <CollapsibleSection title="AI Style Assistant" defaultOpen>
                    <PropertyTextarea 
                        label="Describe Desired Style" 
                        value={aiStylePrompt} 
                        onChange={(e) => setAiStylePrompt(e.target.value)} 
                        placeholder="e.g., 'Modern glassmorphism with soft shadows', 'High contrast dark mode', 'Accessible large text layout'" 
                    />
                    <button 
                        onClick={handleAiStyleGenerate} 
                        disabled={isGenerating} 
                        className="w-full py-2 bg-purple-600 text-white rounded text-xs font-bold uppercase hover:bg-purple-700 transition-colors shadow-sm active:scale-95 disabled:bg-gray-400"
                    >
                        {isGenerating ? 'Designing...' : 'Suggest Styles with AI ✨'}
                    </button>
                    {!aiStylePrompt && <p className="text-[10px] text-gray-400 mt-1 italic text-center">Leave empty to use smart modern defaults.</p>}
                </CollapsibleSection>

                <CollapsibleSection title="Dimensions & Layout" defaultOpen>
                    {selectedElement.type === 'bootstrap-col' && (
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Grid Column Span (1-12)</label>
                            <select 
                                className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary focus:outline-none"
                                value={Math.round((parseFloat(styles.width || '0') / 100) * 12) || 12}
                                onChange={(e) => {
                                    const span = parseInt(e.target.value);
                                    const width = (span / 12) * 100;
                                    updateElement(selectedElement.id, { styles: { ...styles, width: `${width}%` } });
                                }}
                            >
                                {Array.from({length: 12}).map((_, i) => (
                                    <option key={i+1} value={i+1}>{i+1} / 12 ({Math.round(((i+1)/12)*100)}%)</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                        <PropertyInput label="Width" name="width" value={styles.width} onChange={(e) => updateElement(selectedElement.id, { styles: { ...styles, width: e.target.value } })} />
                        <PropertyInput label="Height" name="height" value={styles.height} onChange={(e) => updateElement(selectedElement.id, { styles: { ...styles, height: e.target.value } })} />
                    </div>
                    <PropertySelect label="Display" name="display" value={styles.display || 'block'} onChange={(e) => updateElement(selectedElement.id, { styles: { ...styles, display: e.target.value as any } })} options={[{value:'block',label:'Block'}, {value:'flex',label:'Flexbox'}, {value:'grid',label:'Grid'}]} />
                </CollapsibleSection>
                <CollapsibleSection title="Appearance">
                    <ColorPicker label="Background Color" value={styles.backgroundColor} onChange={(val) => updateElement(selectedElement.id, { styles: { ...styles, backgroundColor: val } })} />
                    <ColorPicker label="Text Color" value={styles.textColor} onChange={(val) => updateElement(selectedElement.id, { styles: { ...styles, textColor: val } })} />
                </CollapsibleSection>
            </div>
        )}

        {activeTab === 'logic' && (
          <div className="space-y-4">
              <CollapsibleSection title="Visibility Logic (Show/Hide)" defaultOpen>
                  <p className="text-xs text-gray-500 mb-3">Show this element when:</p>
                  <PropertySelect label="Trigger Input" name="triggerId" value={visibilityLogic.triggerId} onChange={(e) => updateElement(selectedElement.id, { logic: { ...visibilityLogic, triggerId: e.target.value } })} options={[{value:'',label:'-- Always Visible --'}, ...allFlatElements.filter(e => e.id !== selectedElement.id).map(e => ({value:e.id,label:e.label || e.name}))]} />
                  {visibilityLogic.triggerId && (
                      <>
                        <PropertySelect 
                            label="Condition" 
                            name="condition" 
                            value={visibilityLogic.condition} 
                            onChange={(e) => updateElement(selectedElement.id, { logic: { ...visibilityLogic, condition: e.target.value as LogicCondition } })} 
                            options={logicConditions} 
                        />
                        {!['is_empty', 'is_not_empty'].includes(visibilityLogic.condition) && (
                            <PropertyInput label="Value" name="value" value={visibilityLogic.value} onChange={(e) => updateElement(selectedElement.id, { logic: { ...visibilityLogic, value: e.target.value } })} />
                        )}
                        <PropertySelect 
                            label="Action" 
                            name="action" 
                            value={visibilityLogic.action} 
                            onChange={(e) => updateElement(selectedElement.id, { logic: { ...visibilityLogic, action: e.target.value as 'show' | 'hide' } })} 
                            options={[{value:'show',label:'Show'}, {value:'hide',label:'Hide'}]} 
                        />
                      </>
                  )}
              </CollapsibleSection>

              <CollapsibleSection title="JavaScript Events" defaultOpen>
                   <div className="flex border-b border-gray-200 mb-2">
                        <button 
                            className={`flex-1 py-1 text-xs font-semibold ${scriptType === 'onClick' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
                            onClick={() => setScriptType('onClick')}
                        >
                            On Click
                        </button>
                        <button 
                            className={`flex-1 py-1 text-xs font-semibold ${scriptType === 'onChange' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
                            onClick={() => setScriptType('onChange')}
                        >
                            On Change
                        </button>
                   </div>

                  <PropertyTextarea 
                      label={`Describe ${scriptType === 'onClick' ? 'Click' : 'Change'} Action`} 
                      value={aiScriptPrompt} 
                      onChange={(e) => setAiScriptPrompt(e.target.value)} 
                      placeholder={scriptType === 'onClick' ? "e.g., 'Alert the user', 'Toggle visibility of #el_123'" : "e.g., 'Log new value', 'Validate format'"}
                  />
                  <button 
                      onClick={handleAiScriptGenerate} 
                      disabled={isGenerating || !aiScriptPrompt.trim()} 
                      className="w-full py-2 bg-purple-600 text-white rounded text-xs font-bold uppercase hover:bg-purple-700 transition-colors shadow-sm active:scale-95 disabled:bg-gray-400 mb-3"
                  >
                      {isGenerating ? 'Coding...' : 'Generate Script with AI ✨'}
                  </button>
                  
                  {scriptType === 'onClick' ? (
                      <div>
                          <p className="text-[10px] text-gray-500 mb-1 font-mono">Available vars: <code>e</code> (Event), <code>id</code>, <code>name</code></p>
                          <PropertyTextarea 
                              label="Script (onClick)" 
                              value={selectedElement.onClickScript || ''} 
                              onChange={(e) => updateElement(selectedElement.id, { onClickScript: e.target.value })} 
                              placeholder="alert('Clicked ' + id);"
                              rows={5}
                              fontFamily="monospace"
                          />
                          <button 
                            onClick={() => updateElement(selectedElement.id, { onClickScript: `console.log('Element "${selectedElement.label || selectedElement.name}" clicked! (id: ${selectedElement.id})');` })}
                            className="text-xs text-brand-primary underline hover:text-brand-accent mb-2"
                          >
                              + Add 'Log to Console' Script
                          </button>
                      </div>
                  ) : (
                      <div>
                          <p className="text-[10px] text-gray-500 mb-1 font-mono">Available vars: <code>e</code> (Event), <code>value</code>, <code>id</code>, <code>name</code></p>
                           <PropertyTextarea 
                              label="Script (onChange)" 
                              value={selectedElement.onChangeScript || ''} 
                              onChange={(e) => updateElement(selectedElement.id, { onChangeScript: e.target.value })} 
                              placeholder="console.log('New value: ' + value);"
                              rows={5}
                              fontFamily="monospace"
                          />
                      </div>
                  )}
              </CollapsibleSection>

              <CollapsibleSection title="Bulk Conditional Logic">
                  <p className="text-xs text-gray-500 mb-3">
                      When this element's value changes, apply actions to other elements.
                  </p>
                  {conditionalRules.map((rule, ruleIdx) => (
                      <div key={rule.id} className="p-3 bg-blue-50 border border-blue-200 rounded-md mb-3 relative shadow-sm">
                          <button onClick={() => removeConditionalRule(ruleIdx)} className="absolute top-1 right-1 text-red-500 font-bold hover:scale-110 transition-transform">×</button>
                          <div className="mb-2">
                              <span className="text-xs font-bold text-blue-800 uppercase">When value</span>
                              <div className="flex space-x-2 mt-1">
                                  <div className="w-1/2">
                                    <select 
                                        value={rule.condition} 
                                        onChange={(e) => updateConditionalRule(ruleIdx, { condition: e.target.value as any })}
                                        className="w-full p-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-brand-primary"
                                    >
                                        {logicConditions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                  </div>
                                  {!['is_empty', 'is_not_empty'].includes(rule.condition) && (
                                    <input 
                                        type="text" 
                                        value={rule.matchValue} 
                                        onChange={(e) => updateConditionalRule(ruleIdx, { matchValue: e.target.value })} 
                                        placeholder="Value..."
                                        className="w-1/2 p-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-brand-primary"
                                    />
                                  )}
                              </div>
                          </div>
                          
                          <div className="space-y-2 mt-3 pl-2 border-l-2 border-blue-200">
                                {rule.actions.map((action, actionIdx) => (
                                    <div key={actionIdx} className="bg-white p-2 rounded border border-gray-200 text-xs">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-gray-700">Action {actionIdx + 1}</span>
                                            <button onClick={() => removeBulkAction(ruleIdx, actionIdx)} className="text-red-400 hover:text-red-600">Remove</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <select 
                                                value={action.property}
                                                onChange={(e) => updateBulkAction(ruleIdx, actionIdx, { property: e.target.value as any })}
                                                className="p-1 border rounded w-full"
                                            >
                                                <option value="hidden">Visibility (Hidden)</option>
                                                <option value="disabled">Disabled</option>
                                                <option value="required">Required</option>
                                                <option value="value">Set Value</option>
                                                <option value="label">Set Label</option>
                                                <option value="backgroundColor">Background Color</option>
                                            </select>
                                            {action.property === 'hidden' || action.property === 'disabled' || action.property === 'required' ? (
                                                <select 
                                                    value={String(action.value)} 
                                                    onChange={(e) => updateBulkAction(ruleIdx, actionIdx, { value: e.target.value === 'true' })}
                                                    className="p-1 border rounded w-full"
                                                >
                                                    <option value="true">True (Yes)</option>
                                                    <option value="false">False (No)</option>
                                                </select>
                                            ) : (
                                                 <input 
                                                    type="text" 
                                                    value={action.value} 
                                                    onChange={(e) => updateBulkAction(ruleIdx, actionIdx, { value: e.target.value })}
                                                    className="p-1 border rounded w-full"
                                                    placeholder="Value..."
                                                />
                                            )}
                                        </div>
                                        <div className="max-h-32 overflow-y-auto border border-gray-100 bg-gray-50 rounded p-1">
                                            <p className="text-[10px] text-gray-400 mb-1">Target Elements:</p>
                                            {allFlatElements.filter(el => el.id !== selectedElement.id).map(el => (
                                                <div key={el.id} className="flex items-center mb-0.5">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={action.targetIds.includes(el.id)} 
                                                        onChange={(e) => {
                                                            if (e.target.checked) updateBulkAction(ruleIdx, actionIdx, { targetIds: [...action.targetIds, el.id] });
                                                            else updateBulkAction(ruleIdx, actionIdx, { targetIds: action.targetIds.filter(id => id !== el.id) });
                                                        }} 
                                                        className="mr-1.5 h-3 w-3"
                                                    />
                                                    <span className="truncate text-gray-600">{el.label || el.name} <span className="text-gray-400 text-[10px]">({el.type})</span></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => handleAddBulkAction(ruleIdx)} className="text-xs text-brand-primary font-bold hover:underline">+ Add Action</button>
                          </div>
                      </div>
                  ))}
                  <button onClick={handleAddConditionalRule} className="w-full py-2 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">+ Add Conditional Rule</button>
              </CollapsibleSection>

              <CollapsibleSection title="Advanced Data Logic (Legacy)">
                {dataLogic.rules.map((rule, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-md mb-3 relative shadow-sm">
                        <button onClick={() => removeDataLogicRule(idx)} className="absolute top-1 right-1 text-red-500 font-bold hover:scale-110 transition-transform">×</button>
                        <PropertySelect label="If field..." name="triggerId" value={rule.triggerId} onChange={(e) => updateDataLogicRule(idx, { triggerId: e.target.value })} options={[{value:'',label:'-- Select Source --'}, ...allFlatElements.filter(e => e.id !== selectedElement.id).map(e => ({value:e.id,label:e.label || e.name}))]} />
                        <div className="grid grid-cols-2 gap-2">
                             <PropertySelect label="Condition" name="condition" value={rule.condition} onChange={(e) => updateDataLogicRule(idx, { condition: e.target.value as any })} options={logicConditions} />
                             <PropertyInput label="Match Value" name="value" value={rule.value} onChange={(e) => updateDataLogicRule(idx, { value: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                             <PropertySelect 
                                label="Target Prop" 
                                name="targetProperty" 
                                value={rule.targetProperty} 
                                onChange={(e) => updateDataLogicRule(idx, { targetProperty: e.target.value as any })} 
                                options={[
                                    {value:'value',label:'Value'},
                                    {value:'disabled',label:'Disabled'},
                                    {value:'required',label:'Required'},
                                    {value:'label',label:'Label'},
                                    {value:'hidden',label:'Hidden'},
                                    {value:'options',label:'Options (comma sep)'}
                                ]} 
                             />
                             <PropertyInput label="Result" name="result" value={rule.result} onChange={(e) => updateDataLogicRule(idx, { result: e.target.value })} />
                        </div>
                    </div>
                ))}
                <button onClick={handleAddDataLogicRule} className="w-full py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded text-xs font-bold uppercase hover:bg-gray-200 transition-colors">+ Add Legacy Rule</button>
              </CollapsibleSection>

              <CollapsibleSection title="Validation Logic">
                  <PropertySelect 
                    label="Condition" 
                    name="condition" 
                    value={validationLogic.condition} 
                    onChange={(e) => updateElement(selectedElement.id, { validationLogic: { ...validationLogic, condition: e.target.value as any } })} 
                    options={[
                        {value:'matches',label:'Matches Field'},
                        {value:'regex',label:'Regex Pattern'},
                        {value:'prohibited',label:'Prohibited Value'}
                    ]} 
                  />
                  {validationLogic.condition === 'regex' ? (
                       <PropertyInput label="Regex Pattern" name="value" value={validationLogic.value} onChange={(e) => updateElement(selectedElement.id, { validationLogic: { ...validationLogic, value: e.target.value } })} placeholder="e.g. ^[0-9]+$" />
                  ) : validationLogic.condition !== 'prohibited' && (
                       <PropertySelect 
                            label="Target Field" 
                            name="triggerId" 
                            value={validationLogic.triggerId} 
                            onChange={(e) => updateElement(selectedElement.id, { validationLogic: { ...validationLogic, triggerId: e.target.value } })} 
                            options={[{value:'',label:'-- Select Target --'}, ...allFlatElements.filter(e => e.id !== selectedElement.id).map(e => ({value:e.id,label:e.label || e.name}))]} 
                       />
                  )}
                  <PropertyInput label="Error Message" name="errorMessage" value={validationLogic.errorMessage} onChange={(e) => updateElement(selectedElement.id, { validationLogic: { ...validationLogic, errorMessage: e.target.value } })} />
              </CollapsibleSection>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
