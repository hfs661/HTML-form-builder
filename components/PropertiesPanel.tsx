
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

const PropertyToggle: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between mb-4 cursor-pointer group">
    <span className="text-xs font-semibold text-gray-600 group-hover:text-brand-primary transition-colors">{label}</span>
    <div className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary shadow-inner"></div>
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
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement, selectedIds, allElements, updateElement, closePanel, onDuplicate, onGroup, onApplyStyleToChildren }) => {
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
      <div className="h-full flex flex-col p-6 bg-white animate-slide-in-right">
        <h2 className="text-xl font-black text-gray-900 mb-6">Multi-Select</h2>
        <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-6 text-center shadow-soft">
          <p className="text-sm font-bold text-brand-primary mb-4">{selectedIds.length} elements selected</p>
          <button 
            onClick={() => onGroup?.()} 
            className="w-full py-3 px-4 bg-brand-primary text-white rounded-xl font-bold shadow-soft hover:bg-brand-accent transition-all active:scale-95"
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          <p className="text-sm font-medium">Select an element to configure</p>
        </div>
      </div>
    );
  }

  const { id = '', type, styles = {}, logic = {}, validationLogic = {}, conditionalRules = [] } = selectedElement;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden shadow-panel border-l border-gray-100">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900 leading-none mb-1">Properties</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{type}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => onDuplicate?.(id)} title="Duplicate" className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
          </button>
          <button onClick={closePanel} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-50 bg-gray-50/30">
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

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-2">
        {activeTab === 'content' && (
          <>
            <CollapsibleSection title="General">
              <PropertyInput label="Display Label" value={selectedElement.label || ''} onChange={(val) => updateElement(id, { label: val })} />
              <PropertyInput label="ID / Variable Name" value={selectedElement.name || ''} onChange={(val) => updateElement(id, { name: val })} />
              
              {type === 'bootstrap-col' && (
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Column Span (1-12)</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="12" 
                    value={selectedElement.colSpan || 12} 
                    onChange={(e) => updateElement(id, { colSpan: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-bold">
                    <span>1</span>
                    <span>{selectedElement.colSpan || 12} / 12</span>
                    <span>12</span>
                  </div>
                </div>
              )}

              {['text', 'number', 'textarea', 'email', 'select', 'radio'].includes(type) && (
                <PropertyInput label="Default Value" value={selectedElement.defaultValue} onChange={(val) => updateElement(id, { defaultValue: val })} placeholder="Initial value..." />
              )}
              {['text', 'number', 'textarea', 'email', 'select'].includes(type) && (
                <PropertyInput label="Placeholder" value={selectedElement.placeholder} onChange={(val) => updateElement(id, { placeholder: val })} />
              )}
              <div className="grid grid-cols-2 gap-4">
                <PropertyToggle label="Required" checked={!!selectedElement.required} onChange={(val) => updateElement(id, { required: val })} />
                <PropertyToggle label="Disabled" checked={!!selectedElement.disabled} onChange={(val) => updateElement(id, { disabled: val })} />
              </div>
            </CollapsibleSection>

            {/* Options Management for Select/Radio elements */}
            {(type === 'select' || type === 'radio') && (
              <CollapsibleSection title="Options Management">
                 <div className="mb-4">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Options List (One per line)</label>
                    <textarea 
                      value={selectedElement.options?.join('\n') || ''}
                      onChange={(e) => handleOptionsChange(e.target.value)}
                      placeholder="Enter options here..."
                      className="w-full h-32 p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-all shadow-sm font-mono"
                    />
                    <p className="mt-2 text-[9px] text-brand-primary font-bold italic">
                      💡 By default: Name = Value = ID
                    </p>
                 </div>
              </CollapsibleSection>
            )}

            <CollapsibleSection title="Accessibility">
               <PropertyInput label="ARIA Label" value={selectedElement.ariaLabel} onChange={(val) => updateElement(id, { ariaLabel: val })} placeholder="Screen reader label" />
               <PropertyInput label="ARIA Role" value={selectedElement.ariaRole} onChange={(val) => updateElement(id, { ariaRole: val })} placeholder="e.g. status, alert" />
            </CollapsibleSection>
          </>
        )}

        {activeTab === 'style' && (
          <>
            <CollapsibleSection title="AI Styling ✨">
              <textarea 
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                placeholder="Describe a style: e.g. 'luxury glassmorphism card'"
                className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none mb-3 min-h-[60px]"
              />
              <button 
                onClick={handleAiStyle}
                disabled={isGenerating}
                className="w-full py-2 bg-brand-primary text-white text-[10px] font-black uppercase rounded-lg shadow-soft hover:bg-brand-accent transition-all flex items-center justify-center space-x-2"
              >
                {isGenerating ? "..." : "Generate Styling"}
              </button>
            </CollapsibleSection>

            <CollapsibleSection title="Appearance">
              <PropertyInput label="BG Color" type="text" value={styles.backgroundColor} onChange={(val) => updateElement(id, { styles: { ...styles, backgroundColor: val } })} placeholder="#ffffff" />
              <PropertyInput label="Text Color" type="text" value={styles.textColor} onChange={(val) => updateElement(id, { styles: { ...styles, textColor: val } })} placeholder="#000000" />
              <div className="grid grid-cols-2 gap-4">
                <PropertyInput label="Radius" value={styles.borderRadius} onChange={(val) => updateElement(id, { styles: { ...styles, borderRadius: val } })} />
                <PropertyInput label="B-Width" value={styles.borderWidth} onChange={(val) => updateElement(id, { styles: { ...styles, borderWidth: val } })} />
              </div>
              <PropertyInput label="Padding" value={styles.padding} onChange={(val) => updateElement(id, { styles: { ...styles, padding: val } })} />
            </CollapsibleSection>
          </>
        )}

        {activeTab === 'logic' && (
          <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
            {/* Visibility Rules (PULL Logic) */}
            <CollapsibleSection 
              title="Visibility Engine" 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>}
            >
              <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <PropertySelect 
                  label="Action Type" 
                  value={logic.action || 'show'} 
                  onChange={(val) => updateElement(id, { logic: { ...logic, action: val as any } })}
                  options={[{ value: 'show', label: 'Show if...' }, { value: 'hide', label: 'Hide if...' }]}
                />
                <PropertySelect 
                  label="Trigger Source" 
                  value={logic.triggerId} 
                  onChange={(val) => updateElement(id, { logic: { ...logic, triggerId: val } })}
                  options={fieldOptions}
                />
                {logic.triggerId && (
                  <>
                    <PropertySelect 
                      label="Logic Operator" 
                      value={logic.condition} 
                      onChange={(val) => updateElement(id, { logic: { ...logic, condition: val as any } })}
                      options={LogicOperators}
                    />
                    <PropertyInput 
                      label="Target Value" 
                      value={logic.value} 
                      onChange={(val) => updateElement(id, { logic: { ...logic, value: val } })} 
                    />
                  </>
                )}
                <button 
                  onClick={() => updateElement(id, { logic: undefined })}
                  className="w-full mt-2 py-2 text-[9px] font-black uppercase text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  Clear Visibility Rules
                </button>
              </div>
            </CollapsibleSection>

            {/* Validation Rules */}
            <CollapsibleSection 
              title="Validation Suite" 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>}
            >
              <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <PropertySelect 
                  label="Condition" 
                  value={validationLogic.condition || 'none'} 
                  onChange={(val) => updateElement(id, { validationLogic: { ...validationLogic, condition: val as any } })}
                  options={[{ value: 'none', label: 'No Validation' }, { value: 'matches', label: 'Must Match Field' }, { value: 'regex', label: 'Regex Pattern' }, ...LogicOperators]}
                />
                {validationLogic.condition === 'matches' && (
                  <PropertySelect 
                    label="Compare with" 
                    value={validationLogic.triggerId} 
                    onChange={(val) => updateElement(id, { validationLogic: { ...validationLogic, triggerId: val } })}
                    options={fieldOptions}
                  />
                )}
                {validationLogic.condition === 'regex' && (
                  <PropertyInput label="Regex Pattern" value={validationLogic.value} onChange={(val) => updateElement(id, { validationLogic: { ...validationLogic, value: val } })} />
                )}
                {validationLogic.condition !== 'none' && (
                  <PropertyInput label="Error Message" value={validationLogic.errorMessage} onChange={(val) => updateElement(id, { validationLogic: { ...validationLogic, errorMessage: val } })} placeholder="e.g. 'Email is required'" />
                )}
              </div>
            </CollapsibleSection>

            {/* Conditional Actions (PUSH Logic) */}
            <CollapsibleSection 
              title="Conditional Actions" 
              icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>}
            >
              <div className="space-y-4">
                {conditionalRules.map((rule, index) => (
                  <div key={rule.id} className="p-4 bg-slate-50 rounded-xl border border-indigo-100 space-y-3 relative group/rule">
                    <button 
                      onClick={() => updateElement(id, { conditionalRules: conditionalRules.filter(r => r.id !== rule.id) })}
                      className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg>
                    </button>
                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center mb-2">
                       Rule #{index + 1}
                    </div>
                    <PropertySelect 
                      label="If this value..." 
                      value={rule.condition} 
                      onChange={(val) => {
                        const newRules = [...conditionalRules];
                        newRules[index].condition = val as any;
                        updateElement(id, { conditionalRules: newRules });
                      }}
                      options={LogicOperators}
                    />
                    <PropertyInput 
                      label="Matches" 
                      value={rule.matchValue} 
                      onChange={(val) => {
                        const newRules = [...conditionalRules];
                        newRules[index].matchValue = val;
                        updateElement(id, { conditionalRules: newRules });
                      }}
                    />
                    
                    <div className="border-t border-indigo-50 pt-3 space-y-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Apply Actions</span>
                      {rule.actions.map((action, aIdx) => (
                        <div key={aIdx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm space-y-2">
                           <PropertySelect 
                              label="Target Fields" 
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
                                label="Property" 
                                value={action.property} 
                                onChange={(val) => {
                                  const newRules = [...conditionalRules];
                                  newRules[index].actions[aIdx].property = val as any;
                                  updateElement(id, { conditionalRules: newRules });
                                }}
                                options={[
                                  { value: 'hidden', label: 'Hidden' },
                                  { value: 'disabled', label: 'Disabled' },
                                  { value: 'required', label: 'Required' },
                                  { value: 'backgroundColor', label: 'BG Color' }
                                ]}
                             />
                             <PropertyInput 
                                label="To Value" 
                                value={action.value} 
                                onChange={(val) => {
                                  const newRules = [...conditionalRules];
                                  newRules[index].actions[aIdx].value = val === 'true' ? true : val === 'false' ? false : val;
                                  updateElement(id, { conditionalRules: newRules });
                                }}
                                placeholder="e.g. true"
                             />
                           </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          const newRules = [...conditionalRules];
                          newRules[index].actions.push({ targetIds: [], property: 'hidden', value: true });
                          updateElement(id, { conditionalRules: newRules });
                        }}
                        className="w-full py-1.5 text-[8px] font-bold uppercase text-indigo-400 hover:text-indigo-600 border border-dashed border-indigo-100 rounded"
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
                  className="w-full py-3 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all"
                >
                  Create New Action Rule
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
