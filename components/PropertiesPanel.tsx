
import React, { useState, useMemo } from 'react';
import type { FormElement, DataLogicRule, ValidationLogic, ElementStyle } from '../types';
import { getStyleSuggestions, getScriptSuggestions, getContentSuggestion, suggestContainerConfig } from '../services/geminiService';

interface PropertiesPanelProps {
  selectedElement: FormElement | null;
  selectedIds: string[];
  allElements: FormElement[];
  updateElement: (id: string, updatedProps: Partial<FormElement>) => void;
  closePanel: () => void;
  onDuplicate?: (id: string) => void;
  onGroup?: () => void;
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
            className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" 
        />
    </div>
);

const PropertyToggle: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
    <div className="mb-3 flex items-center justify-between">
        <label className="text-xs font-medium text-gray-500">{label}</label>
        <input 
            type="checkbox" 
            checked={!!checked} 
            onChange={(e) => onChange(e.target.checked)} 
            className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary cursor-pointer" 
        />
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
            className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary" 
            style={{ fontFamily }} 
        />
    </div>
);

const PropertySelect: React.FC<{ label: string; name: string; value: string | undefined; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: {value: string, label: string}[] }> = ({ label, name, value, onChange, options }) => (
    <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <select 
            name={name} 
            value={value === undefined || value === null ? '' : value} 
            onChange={onChange} 
            className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const ColorPicker: React.FC<{ label: string; value: string | undefined; onChange: (val: string) => void }> = ({ label, value, onChange }) => (
    <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <div className="flex items-center space-x-2">
            <input 
                type="color" 
                value={value || '#000000'} 
                onChange={(e) => onChange(e.target.value)} 
                className="h-8 w-8 rounded border border-gray-300 cursor-pointer p-0" 
            />
            <input 
                type="text" 
                value={value || ''} 
                onChange={(e) => onChange(e.target.value)} 
                placeholder="#RRGGBB" 
                className="flex-1 p-1 text-sm border border-gray-300 rounded-md" 
            />
        </div>
    </div>
);

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 rounded-md mb-2 overflow-hidden shadow-sm">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 uppercase tracking-wide focus:outline-none">{title}<svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
            {isOpen && <div className="p-3 bg-white border-t border-gray-200">{children}</div>}
        </div>
    );
};

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement, selectedIds, allElements, updateElement, closePanel, onDuplicate, onGroup, onGroupWithAI }) => {
  const [activeTab, setActiveTab] = useState<'props' | 'style' | 'logic'>('props');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGrouping, setIsGrouping] = useState(false);
  const [aiContentPrompt, setAiContentPrompt] = useState('');

  const styles = selectedElement?.styles || {};
  const dataLogic = selectedElement?.dataLogic || { rules: [] };
  const validationLogic = selectedElement?.validationLogic || { triggerId: '', condition: 'matches', value: '', errorMessage: '' };

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
                        onClick={onGroup} 
                        className="w-full py-3 bg-gray-600 text-white rounded-md font-bold text-sm hover:bg-gray-700 transition-all shadow-md mb-2 active:scale-95"
                    >
                        Group Elements
                    </button>
                  )}

                  <button 
                    onClick={handleGroupWithAIMagic} 
                    disabled={isGrouping}
                    className="w-full py-3 bg-indigo-600 text-white rounded-md font-bold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
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
  const isNumberType = ['number', 'range'].includes(selectedElement.type);

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
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider focus:outline-none transition-all ${activeTab === tab ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-gray-600'}`}>{tab}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === 'props' && (
          <div className="space-y-4">
             <CollapsibleSection title="General" defaultOpen>
                 <PropertyInput label="Label" name="label" value={selectedElement.label} onChange={(e) => updateElement(selectedElement.id, { label: e.target.value })} />
                 <PropertyInput label="Variable Name" name="name" value={selectedElement.name} onChange={(e) => updateElement(selectedElement.id, { name: e.target.value })} />
                 
                 {isInputType && (
                     <>
                        <PropertyInput label="Placeholder" name="placeholder" value={selectedElement.placeholder} onChange={(e) => updateElement(selectedElement.id, { placeholder: e.target.value })} />
                        <div className="grid grid-cols-2 gap-4 mt-3">
                            <PropertyToggle label="Required" checked={!!selectedElement.required} onChange={(val) => updateElement(selectedElement.id, { required: val })} />
                            <PropertyToggle label="Disabled" checked={!!selectedElement.disabled} onChange={(val) => updateElement(selectedElement.id, { disabled: val })} />
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
                        <PropertyInput label="Step" name="step" type="number" value={selectedElement.step} onChange={(e) => updateElement(selectedElement.id, { step: e.target.value ? Number(e.target.value) : undefined })} />
                     </div>
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
                     <button onClick={handleAiContentGenerate} disabled={isGenerating} className="w-full py-2 bg-brand-primary text-white rounded text-xs font-bold uppercase hover:bg-brand-accent transition-colors">
                        {isGenerating ? 'Magic in progress...' : 'Generate with AI ✨'}
                     </button>
                 </CollapsibleSection>
             )}
          </div>
        )}

        {activeTab === 'style' && (
            <div className="space-y-4">
                <CollapsibleSection title="Dimensions & Layout" defaultOpen>
                    <div className="grid grid-cols-2 gap-2">
                        <PropertyInput label="Width" name="width" value={styles.width} onChange={(e) => updateElement(selectedElement.id, { styles: { ...styles, width: e.target.value } })} />
                        <PropertyInput label="Height" name="height" value={styles.height} onChange={(e) => updateElement(selectedElement.id, { styles: { ...styles, height: e.target.value } })} />
                    </div>
                    <PropertySelect label="Display" name="display" value={styles.display || 'block'} onChange={(e) => updateElement(selectedElement.id, { styles: { ...styles, display: e.target.value as any } })} options={[{value:'block',label:'Block'}, {value:'flex',label:'Flexbox'}, {value:'grid',label:'12-Col Grid'}]} />
                </CollapsibleSection>
                <CollapsibleSection title="Appearance">
                    <ColorPicker label="Background Color" value={styles.backgroundColor} onChange={(val) => updateElement(selectedElement.id, { styles: { ...styles, backgroundColor: val } })} />
                    <ColorPicker label="Text Color" value={styles.textColor} onChange={(val) => updateElement(selectedElement.id, { styles: { ...styles, textColor: val } })} />
                </CollapsibleSection>
            </div>
        )}

        {activeTab === 'logic' && (
          <div className="space-y-4">
              <CollapsibleSection title="Advanced Data Logic" defaultOpen>
                {dataLogic.rules.map((rule, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-md mb-3 relative shadow-sm">
                        <button onClick={() => removeDataLogicRule(idx)} className="absolute top-1 right-1 text-red-500 font-bold hover:scale-110 transition-transform">×</button>
                        <PropertySelect label="If field..." name="triggerId" value={rule.triggerId} onChange={(e) => updateDataLogicRule(idx, { triggerId: e.target.value })} options={[{value:'',label:'-- Select Source --'}, ...allElements.filter(e => e.id !== selectedElement.id).map(e => ({value:e.id,label:e.label || e.name}))]} />
                        <PropertySelect label="Condition" name="condition" value={rule.condition} onChange={(e) => updateDataLogicRule(idx, { condition: e.target.value as any })} options={[{value:'equals',label:'Equals'},{value:'not_equals',label:'Not Equals'},{value:'greater_than',label:'Is Greater Than'},{value:'is_empty',label:'Is Empty'}]} />
                        <PropertyInput label="Match Value" name="value" value={rule.value} onChange={(e) => updateDataLogicRule(idx, { value: e.target.value })} />
                        <div className="border-t border-gray-200 my-2 pt-2">
                             <PropertySelect label="Then set..." name="targetProperty" value={rule.targetProperty} onChange={(e) => updateDataLogicRule(idx, { targetProperty: e.target.value as any })} options={[
                                 {value:'value',label:'Set Field Value'},
                                 {value:'disabled',label:'Set Disabled State'},
                                 {value:'required',label:'Set Required State'},
                                 {value:'label',label:'Set Label Text'},
                                 {value:'options',label:'Set Options (comma separated)'}
                             ]} />
                             <PropertyInput label="Resulting Value" name="result" value={rule.result} onChange={(e) => updateDataLogicRule(idx, { result: e.target.value })} />
                        </div>
                    </div>
                ))}
                <button onClick={handleAddDataLogicRule} className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded text-xs font-bold uppercase hover:bg-white transition-colors">+ Add New Data Rule</button>
              </CollapsibleSection>

              <CollapsibleSection title="Cross-Field Validation">
                  <PropertySelect label="Compare against field..." name="triggerId" value={validationLogic.triggerId} onChange={(e) => updateElement(selectedElement.id, { validationLogic: { ...validationLogic, triggerId: e.target.value } })} options={[{value:'',label:'-- Select Field --'}, ...allElements.filter(e => e.id !== selectedElement.id).map(e => ({value:e.id,label:e.label || e.name}))]} />
                  <PropertySelect label="Condition" name="condition" value={validationLogic.condition} onChange={(e) => updateElement(selectedElement.id, { validationLogic: { ...validationLogic, condition: e.target.value as any } })} options={[{value:'matches',label:'Value must match field'},{value:'not_equals',label:'Value must be different'},{value:'regex',label:'Match custom pattern (Regex)'},{value:'greater_than',label:'Must be greater than field'},{value:'less_than',label:'Must be less than field'}]} />
                  <PropertyInput label="Value / Pattern" name="value" value={validationLogic.value} onChange={(e) => updateElement(selectedElement.id, { validationLogic: { ...validationLogic, value: e.target.value } })} />
                  <PropertyInput label="Custom Error Message" name="errorMessage" value={validationLogic.errorMessage} onChange={(e) => updateElement(selectedElement.id, { validationLogic: { ...validationLogic, errorMessage: e.target.value } })} />
              </CollapsibleSection>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
