import React, { useState, useMemo } from 'react';
import type { FormElement, ElementStyle, LogicCondition, ConditionalRule, BulkAction } from '../types';
import { getStyleSuggestions } from '../services/geminiService';

interface PropertiesPanelProps {
  selectedElement: FormElement | null;
  selectedIds: string[];
  allElements: FormElement[];
  updateElement: (id: string, updatedProps: Partial<FormElement>) => void;
  closePanel: () => void;
  onDuplicate?: (id: string) => void;
  onSaveTemplate?: (id: string) => void;
  onGroup?: () => void;
  onApplyStyleToChildren?: (parentId: string, styles: ElementStyle) => void;
}

const PropertyInput: React.FC<{ label: string; value: any; onChange: (val: any) => void; placeholder?: string; type?: string }> = ({ label, value, onChange, placeholder, type = 'text' }) => (
  <div className="mb-4">
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
    <input 
      type={type} 
      value={value ?? ''} 
      onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} 
      placeholder={placeholder}
      className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white outline-none transition-all shadow-sm"
    />
  </div>
);

const PropertySelect: React.FC<{ label: string; value: string | undefined; onChange: (val: string) => void; options: { value: string; label: string }[] }> = ({ label, value, onChange, options }) => (
  <div className="mb-4">
    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
    <select 
      value={value ?? ''} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all shadow-sm cursor-pointer"
    >
      <option value="">Select...</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

const PropertyToggle: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void; danger?: boolean }> = ({ label, checked, onChange, danger }) => (
  <label className="flex items-center justify-between mb-4 cursor-pointer group">
    <span className={`text-xs font-semibold transition-colors ${danger && checked ? 'text-red-500' : 'text-gray-600 group-hover:text-brand-primary'}`}>{label}</span>
    <div className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${danger ? 'peer-checked:bg-amber-500' : 'peer-checked:bg-brand-primary'} shadow-inner`}></div>
    </div>
  </label>
);

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; icon?: React.ReactNode }> = ({ title, children, defaultOpen = true, icon }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between py-4 px-1 text-xs font-extrabold text-gray-800 uppercase tracking-wider group hover:text-brand-primary transition-colors"
      >
        <div className="flex items-center">
          {icon && <span className="mr-2 text-gray-400 group-hover:text-brand-primary">{icon}</span>}
          {title}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && <div className="pb-6 animate-fade-in-staggered">{children}</div>}
    </div>
  );
};

const LogicOperators = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts With' },
  { value: 'ends_with', label: 'Ends With' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'is_empty', label: 'Is Empty / Unchecked' },
  { value: 'is_not_empty', label: 'Is Not Empty / Checked' },
];

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement, selectedIds, allElements, updateElement, closePanel, onDuplicate, onSaveTemplate, onGroup, onApplyStyleToChildren }) => {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'logic'>('content');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stylePrompt, setStylePrompt] = useState('');

  const flatten = (items: FormElement[]): FormElement[] => {
    let result: FormElement[] = [];
    items.forEach(item => {
      result.push(item);
      if (item.children) result = result.concat(flatten(item.children));
    });
    return result;
  };

  const fieldOptions = useMemo(() => {
    return flatten(allElements)
      .filter(el => el.id !== selectedElement?.id && !!el.name)
      .map(el => ({ 
        value: el.id!, 
        label: `${el.label || el.name} (${el.type})` 
      }));
  }, [allElements, selectedElement]);

  const handleAiStyle = async () => {
    if (!selectedElement || !selectedElement.id) return;
    setIsGenerating(true);
    try {
      const styles = await getStyleSuggestions(selectedElement, stylePrompt);
      updateElement(selectedElement.id, { styles: { ...selectedElement.styles, ...styles } });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionsChange = (text: string) => {
    if (!selectedElement || !selectedElement.id) return;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    updateElement(selectedElement.id, { options: lines });
  };

  if (selectedIds.length > 1) {
    return (
      <div className="h-full flex flex-col p-8 bg-white animate-slide-in-right">
        <h2 className="text-xl font-black text-gray-900 mb-6">Multi-Select</h2>
        <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-3xl p-8 text-center shadow-panel">
          <p className="text-sm font-bold text-brand-primary mb-6">{selectedIds.length} elements selected</p>
          <button 
            onClick={() => onGroup?.()} 
            className="w-full py-4 px-6 bg-brand-primary text-white rounded-2xl font-black shadow-elevated hover:bg-brand-accent transition-all active:scale-95 text-xs uppercase tracking-widest"
          >
            Group into Container
          </button>
        </div>
      </div>
    );
  }

  if (!selectedElement) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-gray-300">
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-6 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <p className="text-xs font-bold uppercase tracking-widest">Select an element to configure</p>
        </div>
      </div>
    );
  }

  const { id = '', type, styles = {}, logic = {}, validationLogic = {}, conditionalRules = [] } = selectedElement;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden shadow-panel border-l border-gray-100">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-brand-primary">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 leading-none mb-1">Properties</h2>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{type}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button onClick={() => onSaveTemplate?.(id)} title="Save as Snippet" className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          </button>
          <button onClick={() => onDuplicate?.(id)} title="Duplicate" className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
          </button>
          <button onClick={closePanel} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex bg-gray-50/30">
        {(['content', 'style', 'logic'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-brand-primary border-b-2 border-brand-primary bg-white' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-2 bg-white">
        {activeTab === 'content' && (
          <>
            <CollapsibleSection title="General Config">
              <PropertyInput label="Display Label" value={selectedElement.label || ''} onChange={(val) => updateElement(id, { label: val })} />
              <PropertyInput label="ID / Variable Name" value={selectedElement.name || ''} onChange={(val) => updateElement(id, { name: val })} />
              
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-4">
                <PropertyToggle 
                  label="Hidden by Default" 
                  checked={!!selectedElement.hidden} 
                  onChange={(val) => updateElement(id, { hidden: val })} 
                  danger
                />
                <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter leading-tight">
                  Start hidden. Use "Logic" to reveal this component.
                </p>
              </div>

              {type === 'bootstrap-col' && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Responsive Column Span (1-12)</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="12" 
                    value={selectedElement.colSpan || 12} 
                    onChange={(e) => updateElement(id, { colSpan: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <div className="flex justify-between text-[10px] text-brand-primary mt-2 font-black">
                    <span>1</span>
                    <span className="bg-brand-primary text-white px-2 py-0.5 rounded shadow-sm">{selectedElement.colSpan || 12}</span>
                    <span>12</span>
                  </div>
                </div>
              )}

              {['text', 'number', 'textarea', 'email', 'select', 'radio'].includes(type) && (
                <PropertyInput label="Initial Value" value={selectedElement.defaultValue} onChange={(val) => updateElement(id, { defaultValue: val })} placeholder="Default selection..." />
              )}
              {['text', 'number', 'textarea', 'email', 'select'].includes(type) && (
                <PropertyInput label="Placeholder Text" value={selectedElement.placeholder} onChange={(val) => updateElement(id, { placeholder: val })} />
              )}
              <div className="grid grid-cols-2 gap-4 mt-2">
                <PropertyToggle label="Required" checked={!!selectedElement.required} onChange={(val) => updateElement(id, { required: val })} />
                <PropertyToggle label="Disabled" checked={!!selectedElement.disabled} onChange={(val) => updateElement(id, { disabled: val })} />
              </div>
            </CollapsibleSection>

            {(type === 'select' || type === 'radio') && (
              <CollapsibleSection title="Choices Configuration">
                 <div className="mb-4">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Options List (One per line)</label>
                    <textarea 
                      value={selectedElement.options?.join('\n') || ''}
                      onChange={(e) => handleOptionsChange(e.target.value)}
                      placeholder="Choice A&#10;Choice B"
                      className="w-full h-40 p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-primary/5 focus:bg-white transition-all shadow-inner font-mono"
                    />
                 </div>
              </CollapsibleSection>
            )}

            <CollapsibleSection title="A11Y & ARIA">
               <PropertyInput label="ARIA Label" value={selectedElement.ariaLabel} onChange={(val) => updateElement(id, { ariaLabel: val })} />
               <PropertyInput label="ARIA Role" value={selectedElement.ariaRole} onChange={(val) => updateElement(id, { ariaRole: val })} />
            </CollapsibleSection>
          </>
        )}

        {activeTab === 'style' && (
          <>
            <CollapsibleSection title="AI Styling Assistant ✨">
              <div className="p-4 bg-gray-900 rounded-2xl shadow-panel mb-4">
                <textarea 
                  value={stylePrompt}
                  onChange={(e) => setStylePrompt(e.target.value)}
                  placeholder="e.g. 'rounded glass button' or 'corporate style'"
                  className="w-full p-3 text-xs bg-gray-800 text-white border border-gray-700 rounded-xl outline-none mb-4 min-h-[80px]"
                />
                <button 
                  onClick={handleAiStyle}
                  disabled={isGenerating}
                  className="w-full py-3 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-elevated hover:bg-brand-accent transition-all flex items-center justify-center space-x-2"
                >
                  {isGenerating ? "Processing..." : "Generate Styling"}
                </button>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Visual Controls">
              <PropertyInput label="Background" type="text" value={styles.backgroundColor} onChange={(val) => updateElement(id, { styles: { ...styles, backgroundColor: val } })} />
              <PropertyInput label="Text Color" type="text" value={styles.textColor} onChange={(val) => updateElement(id, { styles: { ...styles, textColor: val } })} />
              <div className="grid grid-cols-2 gap-4">
                <PropertyInput label="Radius" value={styles.borderRadius} onChange={(val) => updateElement(id, { styles: { ...styles, borderRadius: val } })} />
                <PropertyInput label="Border" value={styles.borderWidth} onChange={(val) => updateElement(id, { styles: { ...styles, borderWidth: val } })} />
              </div>
              <PropertyInput label="Padding" value={styles.padding} onChange={(val) => updateElement(id, { styles: { ...styles, padding: val } })} />
            </CollapsibleSection>
          </>
        )}

        {activeTab === 'logic' && (
          <div className="space-y-4 animate-fade-in-staggered">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 text-[10px] font-medium text-blue-800 leading-relaxed">
              <p className="font-bold uppercase tracking-wider mb-2">💡 Logic Pro-Tips:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Checkboxes:</strong> Use "true" to match checked, "false" for unchecked.</li>
                <li><strong>Radios:</strong> Match against the exact label text of the choice.</li>
                <li><strong>Visibility:</strong> Controls whether THIS component is seen based on others.</li>
                <li><strong>Conditional Actions:</strong> Changes OTHER components when THIS one changes.</li>
              </ul>
            </div>

            <CollapsibleSection 
              title="Visibility Rules (PULL)" 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>}
            >
              <div className="space-y-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                <PropertySelect 
                  label="Display State" 
                  value={logic.action || 'show'} 
                  onChange={(val) => updateElement(id, { logic: { ...logic, action: val as any } })}
                  options={[{ value: 'show', label: 'Show if...' }, { value: 'hide', label: 'Hide if...' }]}
                />
                <PropertySelect 
                  label="Field to Monitor" 
                  value={logic.triggerId} 
                  onChange={(val) => updateElement(id, { logic: { ...logic, triggerId: val } })}
                  options={fieldOptions}
                />
                {logic.triggerId && (
                  <>
                    <PropertySelect 
                      label="Logical Condition" 
                      value={logic.condition} 
                      onChange={(val) => updateElement(id, { logic: { ...logic, condition: val as any } })}
                      options={LogicOperators}
                    />
                    <PropertyInput 
                      label="Trigger Value" 
                      value={logic.value} 
                      onChange={(val) => updateElement(id, { logic: { ...logic, value: val } })} 
                      placeholder="e.g. true or Choice Label"
                    />
                  </>
                )}
                {logic.triggerId && (
                   <button 
                    onClick={() => updateElement(id, { logic: undefined })}
                    className="w-full mt-2 py-2 text-[9px] font-black uppercase text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    Clear Visibility Rule
                  </button>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection 
              title="Conditional Actions (PUSH)" 
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}
            >
              <div className="space-y-4">
                {conditionalRules.map((rule, index) => (
                  <div key={rule.id} className="p-4 bg-white rounded-xl border border-indigo-100 space-y-3 relative shadow-sm">
                    <button 
                      onClick={() => updateElement(id, { conditionalRules: conditionalRules.filter(r => r.id !== rule.id) })}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg>
                    </button>
                    <div className="text-[10px] font-black text-indigo-500 uppercase">Rule {index + 1}</div>
                    <PropertySelect 
                      label="If this field is..." 
                      value={rule.condition} 
                      onChange={(val) => {
                        const newRules = [...conditionalRules];
                        newRules[index].condition = val as any;
                        updateElement(id, { conditionalRules: newRules });
                      }}
                      options={LogicOperators}
                    />
                    <PropertyInput 
                      label="Matches value..." 
                      value={rule.matchValue} 
                      onChange={(val) => {
                        const newRules = [...conditionalRules];
                        newRules[index].matchValue = val;
                        updateElement(id, { conditionalRules: newRules });
                      }}
                      placeholder="e.g. true"
                    />
                    
                    <div className="border-t border-indigo-50 pt-3 space-y-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Then Apply Actions:</span>
                      {rule.actions.map((action, aIdx) => (
                        <div key={aIdx} className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 space-y-2">
                           <PropertySelect 
                              label="Target Component" 
                              value={action.targetIds[0]} 
                              onChange={(val) => {
                                const newRules = [...conditionalRules];
                                newRules[index].actions[aIdx].targetIds = [val];
                                updateElement(id, { conditionalRules: newRules });
                              }}
                              options={fieldOptions}
                           />
                           <div className="grid grid-cols-2 gap-2">
                             <PropertySelect 
                                label="Update Property" 
                                value={action.property} 
                                onChange={(val) => {
                                  const newRules = [...conditionalRules];
                                  newRules[index].actions[aIdx].property = val as any;
                                  updateElement(id, { conditionalRules: newRules });
                                }}
                                options={[
                                  { value: 'hidden', label: 'Visibility' },
                                  { value: 'disabled', label: 'Disabled' },
                                  { value: 'required', label: 'Required' },
                                  { value: 'backgroundColor', label: 'Background' }
                                ]}
                             />
                             <PropertyInput 
                                label="New Value" 
                                value={action.value} 
                                onChange={(val) => {
                                  const newRules = [...conditionalRules];
                                  newRules[index].actions[aIdx].value = val === 'true' ? true : val === 'false' ? false : val;
                                  updateElement(id, { conditionalRules: newRules });
                                }}
                             />
                           </div>
                           <button 
                            onClick={() => {
                              const newRules = [...conditionalRules];
                              newRules[index].actions = newRules[index].actions.filter((_, i) => i !== aIdx);
                              updateElement(id, { conditionalRules: newRules });
                            }}
                            className="text-[9px] text-red-400 hover:text-red-600 font-bold uppercase"
                           >
                            - Remove Action
                           </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newRules = [...conditionalRules];
                          newRules[index].actions.push({ targetIds: [], property: 'hidden', value: true });
                          updateElement(id, { conditionalRules: newRules });
                        }}
                        className="w-full py-2 text-[9px] font-black uppercase text-indigo-500 border border-dashed border-indigo-200 rounded-lg hover:bg-indigo-50"
                      >
                        + Add Target Action
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const newRule: ConditionalRule = {
                      id: `rule-${Date.now()}`,
                      condition: 'equals',
                      matchValue: '',
                      actions: [{ targetIds: [], property: 'hidden', value: true }]
                    };
                    updateElement(id, { conditionalRules: [...conditionalRules, newRule] });
                  }}
                  className="w-full py-4 bg-indigo-600 text-white text-[10px] font-black uppercase rounded-2xl shadow-elevated hover:bg-indigo-700 transition-all"
                >
                  Create Action Rule
                </button>
              </div>
            </CollapsibleSection>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;