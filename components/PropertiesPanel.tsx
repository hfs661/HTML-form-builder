
import React, { useState, useMemo } from 'react';
import type { FormElement, LogicCondition, ElementStyle, ConditionalRule, BulkAction } from '../types';
import { getStyleSuggestions, suggestContainerConfig } from '../services/geminiService';

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

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between py-4 px-1 text-xs font-extrabold text-gray-800 uppercase tracking-wider group hover:text-brand-primary transition-colors"
      >
        {title}
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {isOpen && <div className="pb-6 animate-fade-in-staggered">{children}</div>}
    </div>
  );
};

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement, selectedIds, allElements, updateElement, closePanel, onDuplicate, onGroup, onGroupWithAI }) => {
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
  const flatElements = useMemo(() => flatten(allElements).filter(el => el.id !== selectedElement?.id), [allElements, selectedElement]);

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
          <p className="text-sm font-medium">Select an element on the canvas to configure properties</p>
        </div>
      </div>
    );
  }

  const { type, styles = {} } = selectedElement;

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden shadow-panel border-l border-gray-100">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900 leading-none mb-1">Properties</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{type}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => selectedElement.id && onDuplicate?.(selectedElement.id)} title="Duplicate" className="p-2 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/5 rounded-lg transition-all">
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
              <PropertyInput label="Display Label" value={selectedElement.label || ''} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { label: val })} />
              <PropertyInput label="ID / Variable Name" value={selectedElement.name || ''} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { name: val })} />
              
              {type === 'bootstrap-col' && (
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Column Span (1-12)</label>
                  <input 
                    type="range" 
                    min="1" 
                    max="12" 
                    value={selectedElement.colSpan || 12} 
                    onChange={(e) => selectedElement.id && updateElement(selectedElement.id, { colSpan: parseInt(e.target.value) })}
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
                <PropertyInput label="Default Value" value={selectedElement.defaultValue} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { defaultValue: val })} placeholder="Initial value..." />
              )}
              {['text', 'number', 'textarea', 'email', 'select'].includes(type) && (
                <PropertyInput label="Placeholder" value={selectedElement.placeholder} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { placeholder: val })} />
              )}
              <div className="grid grid-cols-2 gap-4">
                <PropertyToggle label="Required" checked={!!selectedElement.required} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { required: val })} />
                <PropertyToggle label="Disabled" checked={!!selectedElement.disabled} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { disabled: val })} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Advanced Attributes">
              <PropertyInput label="Aria Label" value={selectedElement.ariaLabel} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { ariaLabel: val })} placeholder="Screen reader description" />
              <PropertyInput label="Data TestID" value={selectedElement.testId} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { testId: val })} placeholder="Unique ID for tests" />
            </CollapsibleSection>

            {['radio', 'select', 'checkbox'].includes(type) && (
              <CollapsibleSection title="Options">
                {type === 'radio' && (
                  <PropertySelect 
                    label="Layout Orientation" 
                    value={styles.orientation || 'vertical'} 
                    onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, orientation: val as any } })}
                    options={[{ value: 'vertical', label: 'Stacked (Vertical)' }, { value: 'horizontal', label: 'Inline (Horizontal)' }]}
                  />
                )}
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Values (New Line Separated)</label>
                  <textarea 
                    value={selectedElement.options?.join('\n') || ''}
                    onChange={(e) => selectedElement.id && updateElement(selectedElement.id, { options: e.target.value.split('\n').filter(l => l.trim()) })}
                    className="w-full p-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white outline-none transition-all shadow-sm min-h-[120px]"
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                  />
                  <p className="mt-1 text-[10px] text-gray-500 italic">Each line becomes one radio option label and value.</p>
                </div>
              </CollapsibleSection>
            )}

            {['image', 'video'].includes(type) && (
              <CollapsibleSection title="Media">
                <PropertyInput label="Source URL" value={selectedElement.src} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { src: val })} />
                <PropertyInput label="Alt Text" value={selectedElement.altText} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { altText: val })} />
              </CollapsibleSection>
            )}

            {type === 'typography' && (
              <CollapsibleSection title="Text Content">
                <PropertySelect 
                  label="Type" 
                  value={selectedElement.headingLevel || 'p'} 
                  onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { headingLevel: val })}
                  options={[{ value: 'h1', label: 'Heading 1' }, { value: 'h2', label: 'Heading 2' }, { value: 'h3', label: 'Heading 3' }, { value: 'p', label: 'Paragraph' }]}
                />
                <PropertyInput label="Text" value={selectedElement.textContent} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { textContent: val })} />
              </CollapsibleSection>
            )}
          </>
        )}

        {activeTab === 'style' && (
          <>
            <CollapsibleSection title="AI Styling ✨">
              <p className="text-[10px] text-gray-500 mb-3 font-medium">Describe how this component should look:</p>
              <textarea 
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                placeholder="e.g. 'modern professional rounded card with soft shadows and blue accents'"
                className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none mb-3 min-h-[60px]"
              />
              <button 
                onClick={handleAiStyle}
                disabled={isGenerating}
                className="w-full py-2 bg-brand-primary text-white text-[10px] font-black uppercase rounded-lg shadow-soft hover:bg-brand-accent transition-all flex items-center justify-center space-x-2"
              >
                {isGenerating ? <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : "Apply AI Styles"}
              </button>
            </CollapsibleSection>

            {(type === 'bootstrap-row' || type === 'bootstrap-col' || type === 'container') && (
              <CollapsibleSection title="Layout Engine">
                <PropertySelect 
                  label="Display Mode" 
                  value={styles.display || 'block'} 
                  onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, display: val as any } })}
                  options={[{ value: 'block', label: 'Block' }, { value: 'flex', label: 'Flex' }, { value: 'grid', label: 'Grid' }]}
                />
                {styles.display === 'flex' && (
                  <>
                    <PropertySelect 
                      label="Direction" 
                      value={styles.flexDirection || 'row'} 
                      onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, flexDirection: val as any } })}
                      options={[{ value: 'row', label: 'Row' }, { value: 'column', label: 'Column' }]}
                    />
                    <PropertySelect 
                      label="Flex Wrap" 
                      value={styles.flexWrap || 'nowrap'} 
                      onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, flexWrap: val as any } })}
                      options={[{ value: 'nowrap', label: 'No Wrap' }, { value: 'wrap', label: 'Wrap' }]}
                    />
                    <PropertySelect 
                      label="Justify Content" 
                      value={styles.justifyContent || 'flex-start'} 
                      onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, justifyContent: val } })}
                      options={[
                        { value: 'flex-start', label: 'Start' }, 
                        { value: 'center', label: 'Center' }, 
                        { value: 'flex-end', label: 'End' }, 
                        { value: 'space-between', label: 'Space Between' }
                      ]}
                    />
                  </>
                )}
              </CollapsibleSection>
            )}

            <CollapsibleSection title="Spacing & Stacking">
              <div className="grid grid-cols-2 gap-4">
                <PropertyInput label="Width" value={styles.width} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, width: val } })} />
                <PropertyInput label="Height" value={styles.height} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, height: val } })} />
                <PropertyInput label="Padding" value={styles.padding} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, padding: val } })} />
                <PropertyInput label="Margin" value={styles.margin} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, margin: val } })} />
                <PropertyInput label="Row Gap" value={styles.rowGap} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, rowGap: val } })} />
                <PropertyInput label="Col Gap" value={styles.columnGap} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, columnGap: val } })} />
              </div>
              <PropertyInput label="Z-Index" type="number" value={styles.zIndex} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, zIndex: val } })} />
            </CollapsibleSection>

            <CollapsibleSection title="Appearance">
              <PropertyInput label="BG Color" type="color" value={styles.backgroundColor} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, backgroundColor: val } })} />
              <PropertyInput label="Text Color" type="color" value={styles.textColor} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, textColor: val } })} />
              <div className="grid grid-cols-2 gap-4">
                <PropertyInput label="Radius" value={styles.borderRadius} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, borderRadius: val } })} />
                <PropertyInput label="B-Width" value={styles.borderWidth} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { styles: { ...styles, borderWidth: val } })} />
              </div>
            </CollapsibleSection>
          </>
        )}

        {activeTab === 'logic' && (
          <>
            <CollapsibleSection title="Visibility Logic">
              <p className="text-[10px] text-gray-500 mb-3 font-medium italic">Automatically show/hide this field based on another input's value.</p>
              <PropertySelect 
                label="Trigger Element" 
                value={selectedElement.logic?.triggerId} 
                onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { logic: { ...(selectedElement.logic || { condition: 'equals', action: 'show', value: '' }), triggerId: val } })}
                options={[{ value: '', label: '-- None --' }, ...flatElements.map(el => ({ value: el.id || '', label: `${el.label} (${el.name})` }))]}
              />
              {selectedElement.logic?.triggerId && (
                <>
                  <PropertySelect 
                    label="Condition" 
                    value={selectedElement.logic.condition} 
                    onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { logic: { ...selectedElement.logic!, condition: val as any } })}
                    options={[
                      { value: 'equals', label: 'Equals' }, 
                      { value: 'not_equals', label: 'Not Equals' }, 
                      { value: 'contains', label: 'Contains' },
                      { value: 'greater_than', label: 'Greater Than' },
                      { value: 'less_than', label: 'Less Than' },
                      { value: 'is_empty', label: 'Is Empty' },
                      { value: 'is_not_empty', label: 'Is Not Empty' }
                    ]}
                  />
                  <PropertyInput label="Target Value" value={selectedElement.logic.value} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { logic: { ...selectedElement.logic!, value: val } })} />
                </>
              )}
            </CollapsibleSection>

            <CollapsibleSection title="Validation Logic">
              <p className="text-[10px] text-gray-500 mb-3 font-medium italic">Add regex matching or compare values against other fields.</p>
              <PropertySelect 
                label="Type" 
                value={selectedElement.validationLogic?.condition} 
                onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { validationLogic: { ...(selectedElement.validationLogic || { errorMessage: '', value: '' }), condition: val as any } })}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'regex', label: 'Regex Pattern' },
                  { value: 'matches', label: 'Matches Other Field' },
                  { value: 'equals', label: 'Equals' },
                  { value: 'greater_than', label: 'Greater Than (Numeric)' }
                ]}
              />
              {selectedElement.validationLogic?.condition && selectedElement.validationLogic.condition !== 'none' && (
                <>
                   {selectedElement.validationLogic.condition === 'regex' ? (
                     <PropertyInput label="Regex" value={selectedElement.validationLogic.value} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { validationLogic: { ...selectedElement.validationLogic!, value: val } })} placeholder="e.g. ^[0-9]{5}$" />
                   ) : (
                     <PropertySelect 
                        label="Compare Field" 
                        value={selectedElement.validationLogic.triggerId} 
                        onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { validationLogic: { ...selectedElement.validationLogic!, triggerId: val } })}
                        options={[{ value: '', label: '-- Select --' }, ...flatElements.map(el => ({ value: el.id || '', label: `${el.label} (${el.name})` }))]}
                     />
                   )}
                   <PropertyInput label="Error Message" value={selectedElement.validationLogic.errorMessage} onChange={(val) => selectedElement.id && updateElement(selectedElement.id, { validationLogic: { ...selectedElement.validationLogic!, errorMessage: val } })} />
                </>
              )}
            </CollapsibleSection>
          </>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
