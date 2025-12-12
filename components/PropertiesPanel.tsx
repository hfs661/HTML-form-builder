
import React, { useState, useMemo } from 'react';
import type { FormElement } from '../types';
import { getStyleSuggestions, getScriptSuggestions } from '../services/geminiService';

interface PropertiesPanelProps {
  selectedElement: FormElement | null;
  updateElement: (id: string, updatedProps: Partial<FormElement>) => void;
  closePanel: () => void;
  allElements: FormElement[];
  onDuplicate?: (id: string) => void;
}

const PropertyInput: React.FC<{ label: string; name: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string, type?: string, min?: number, step?: number }> = ({ label, name, value, onChange, placeholder, type = 'text', min, step }) => (
    <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <input 
            type={type}
            name={name}
            value={value} 
            onChange={onChange}
            placeholder={placeholder}
            min={min}
            step={step}
            className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
        />
    </div>
);

const PropertyTextarea: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string, rows?: number, fontFamily?: string }> = ({ label, value, onChange, placeholder, rows=4, fontFamily }) => (
    <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
            style={{ fontFamily }}
        />
    </div>
);

const PropertySelect: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: {value: string, label: string}[] }> = ({ label, name, value, onChange, options }) => (
    <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);

const ColorPicker: React.FC<{ label: string; value: string; onChange: (val: string) => void }> = ({ label, value, onChange }) => (
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
        <div className="border border-gray-200 rounded-md mb-2 overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-gray-700 uppercase tracking-wide focus:outline-none"
            >
                {title}
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && <div className="p-3 bg-white border-t border-gray-200">{children}</div>}
        </div>
    );
};


const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement, updateElement, closePanel, allElements, onDuplicate }) => {
  const [activeTab, setActiveTab] = useState<'props' | 'style' | 'logic'>('props');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [stylePrompt, setStylePrompt] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Accessibility Checker Logic
  const accessibilityIssues = useMemo(() => {
    if (!selectedElement) return [];
    const issues = [];
    if (selectedElement.type === 'image' && !selectedElement.altText) {
        issues.push({ level: 'error', message: "Missing Alt Text for Image" });
    }
    if (['text', 'textarea', 'select', 'number', 'date', 'file'].includes(selectedElement.type) && !selectedElement.label) {
        issues.push({ level: 'error', message: "Missing Label for Input" });
    }
    // Simple contrast warning stub
    const s = selectedElement.styles;
    if (s?.backgroundColor && s?.textColor && s.backgroundColor === s.textColor) {
        issues.push({ level: 'warning', message: "Background and Text color appear identical" });
    }
    return issues;
  }, [selectedElement]);


  if (!selectedElement) {
    return (
      <div className="w-full md:w-72 lg:w-80 p-4 bg-brand-light-gray flex items-center justify-center text-gray-500 border-l border-gray-300">
        Select an element to see its properties.
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox' && e.target instanceof HTMLInputElement;
    const isNumber = type === 'number';

    let finalValue: string | boolean | number | undefined = value;
    if (isCheckbox) finalValue = (e.target as HTMLInputElement).checked;
    if (isNumber) finalValue = value === '' ? undefined : Number(value);

    updateElement(selectedElement.id, { [name]: finalValue });
  };
  
  const handleOptionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateElement(selectedElement.id, { options: e.target.value.split('\n') });
  };
  
  const handleHeadersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateElement(selectedElement.id, { headers: e.target.value.split(',').map(s => s.trim()) });
  };

  const handleLinksChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split('\n');
    const newLinks = lines.map(line => {
        const [label, url] = line.split('|');
        return { label: (label || '').trim(), url: (url || '#').trim() };
    }).filter(l => l.label);
    updateElement(selectedElement.id, { links: newLinks });
  };
  
  const handleStyleChange = (name: string, value: string) => {
      const currentStyles = selectedElement.styles || {};
      updateElement(selectedElement.id, {
        styles: { ...currentStyles, [name]: value },
      });
  };

  const handleLogicChange = (name: string, value: string) => {
      const currentLogic = selectedElement.logic || { triggerId: '', action: 'show', condition: 'equals', value: '' };
      updateElement(selectedElement.id, {
          logic: { ...currentLogic, [name]: value }
      });
  };

  const handleAiStyleSuggest = async (usePrompt: boolean = true) => {
      setIsAiSuggesting(true);
      try {
          const promptToUse = usePrompt ? stylePrompt : undefined;
          const styles = await getStyleSuggestions(selectedElement, promptToUse);
          updateElement(selectedElement.id, { styles: { ...selectedElement.styles, ...styles } });
      } catch (error) {
          console.error("Failed to get AI styles", error);
          alert("Failed to get AI suggestions. Please try again.");
      } finally {
          setIsAiSuggesting(false);
      }
  }

  const handleAiFocusSuggest = async () => {
    setIsAiSuggesting(true);
    try {
        const styles = await getStyleSuggestions(selectedElement, "Suggest accessible, high-contrast visible outline or border styles for the focus state.");
        const currentStyles = selectedElement.styles || {};
        updateElement(selectedElement.id, { 
            styles: { 
                ...currentStyles, 
                focusBorderColor: styles.focusBorderColor || styles.borderColor || '#0078D4',
                focusBoxShadow: styles.focusBoxShadow || '0 0 0 3px rgba(0, 120, 212, 0.3)'
            } 
        });
    } catch (error) {
        console.error("Failed to get AI focus styles", error);
        alert("Failed to get suggestions.");
    } finally {
        setIsAiSuggesting(false);
    }
  };

  const handleGenerateScript = async () => {
      if (!scriptPrompt.trim()) return;
      setIsGeneratingScript(true);
      try {
          const script = await getScriptSuggestions(scriptPrompt);
          updateElement(selectedElement.id, { scriptContent: script });
      } catch (error) {
          console.error("Failed to generate script", error);
          alert("Failed to generate script. Please try again.");
      } finally {
          setIsGeneratingScript(false);
      }
  }


  const linksString = (selectedElement.links || []).map(l => `${l.label}|${l.url}`).join('\n');
  const headersString = (selectedElement.headers || []).join(', ');
  const styles = selectedElement.styles || {};
  const logic = selectedElement.logic || { triggerId: '', action: 'show', condition: 'equals', value: '' };

  return (
    <div className="w-full md:w-72 lg:w-80 bg-brand-light-gray h-full flex flex-col border-l border-gray-300">
      <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-white">
        <div>
            <h2 className="text-xl font-bold text-brand-text">Properties</h2>
            {onDuplicate && (
                <button 
                    onClick={() => onDuplicate(selectedElement.id)} 
                    className="text-xs text-brand-primary hover:underline mt-1"
                >
                    Duplicate Element
                </button>
            )}
        </div>
        <button onClick={closePanel} className="text-gray-500 hover:text-gray-800 focus:outline-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex border-b border-gray-300 bg-white">
        {(['props', 'style', 'logic'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium focus:outline-none ${
              activeTab === tab
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {accessibilityIssues.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-xs font-bold text-red-800 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Accessibility Issues
                </h4>
                <ul className="text-xs text-red-700 space-y-1">
                    {accessibilityIssues.map((issue, idx) => (
                        <li key={idx} className={issue.level === 'warning' ? 'text-yellow-700' : ''}>• {issue.message}</li>
                    ))}
                </ul>
            </div>
        )}

        {activeTab === 'props' && (
          <div className="space-y-4">
             <div className="bg-blue-50 p-2 rounded text-xs text-blue-700 mb-2">
                 Type: <span className="font-bold uppercase">{selectedElement.type}</span> <br/>
                 ID: <span className="font-mono">{selectedElement.id.slice(-8)}</span>
             </div>
             
             <PropertyInput label="Label" name="label" value={selectedElement.label} onChange={handleChange} />
             <PropertyInput label="Name (camelCase)" name="name" value={selectedElement.name} onChange={handleChange} />
             
             {['text', 'textarea', 'number', 'password', 'email', 'tel', 'url'].includes(selectedElement.type) && (
                 <PropertyInput label="Placeholder" name="placeholder" value={selectedElement.placeholder || ''} onChange={handleChange} />
             )}
             
             {['text', 'tel'].includes(selectedElement.type) && (
                 <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                    <PropertyInput label="Input Mask (e.g. (999) 999-9999)" name="inputMask" value={selectedElement.inputMask || ''} onChange={handleChange} placeholder="9=num, a=letter, *=any" />
                    <p className="text-xs text-gray-500 mt-[-8px]">Use 9 for numbers, a for letters.</p>
                 </div>
             )}

             {['text', 'password', 'email', 'tel', 'url'].includes(selectedElement.type) && (
                <>
                    <PropertyInput label="Min Length" name="minLength" value={selectedElement.minLength || ''} onChange={handleChange} type="number" />
                    <PropertyInput label="Max Length" name="maxLength" value={selectedElement.maxLength || ''} onChange={handleChange} type="number" />
                    <PropertyInput label="Pattern (Regex)" name="pattern" value={selectedElement.pattern || ''} onChange={handleChange} />
                </>
             )}

             {['number', 'range', 'date'].includes(selectedElement.type) && (
                 <>
                    <PropertyInput label="Minimum" name="min" value={selectedElement.min || ''} onChange={handleChange} type={selectedElement.type === 'date' ? 'date' : 'number'} />
                    <PropertyInput label="Maximum" name="max" value={selectedElement.max || ''} onChange={handleChange} type={selectedElement.type === 'date' ? 'date' : 'number'} />
                 </>
             )}
             
             {['number', 'range'].includes(selectedElement.type) && (
                 <PropertyInput label="Step" name="step" value={selectedElement.step || ''} onChange={handleChange} type="number" />
             )}

             {selectedElement.type === 'file' && (
                 <PropertyInput label="Accept (e.g. image/*)" name="accept" value={selectedElement.accept || ''} onChange={handleChange} />
             )}
             
             {selectedElement.type === 'image' && (
                 <>
                    <PropertyInput label="Image Source URL" name="src" value={selectedElement.src || ''} onChange={handleChange} />
                    <PropertyInput label="Alt Text" name="altText" value={selectedElement.altText || ''} onChange={handleChange} />
                 </>
             )}
             
             {selectedElement.type === 'iframe' && (
                 <PropertyInput label="Source URL" name="src" value={selectedElement.src || ''} onChange={handleChange} />
             )}

             {selectedElement.type === 'typography' && (
                 <>
                    <PropertySelect 
                        label="Heading Level" 
                        name="headingLevel" 
                        value={selectedElement.headingLevel || 'p'} 
                        onChange={handleChange} 
                        options={['h1','h2','h3','h4','h5','h6','p','span'].map(h => ({ value: h, label: h.toUpperCase() }))} 
                    />
                    <PropertyTextarea label="Content" value={selectedElement.textContent || ''} onChange={(e) => updateElement(selectedElement.id, { textContent: e.target.value })} />
                 </>
             )}
             
             {selectedElement.type === 'html-block' && (
                 <PropertyTextarea label="HTML Content" value={selectedElement.htmlContent || ''} onChange={(e) => updateElement(selectedElement.id, { htmlContent: e.target.value })} rows={10} fontFamily="monospace" />
             )}

             {['select', 'radio', 'checkbox'].includes(selectedElement.type) && selectedElement.type !== 'checkbox' && (
                 <PropertyTextarea label="Options (one per line)" value={selectedElement.options?.join('\n') || ''} onChange={handleOptionsChange} />
             )}
             
             {selectedElement.type === 'table' && (
                 <>
                    <PropertyInput label="Rows" name="rowCount" value={selectedElement.rowCount || 3} onChange={handleChange} type="number" min={1} />
                    <PropertyInput label="Columns" name="colCount" value={selectedElement.colCount || 3} onChange={handleChange} type="number" min={1} />
                    <PropertyTextarea label="Headers (comma separated)" value={headersString} onChange={handleHeadersChange} />
                 </>
             )}
             
             {selectedElement.type === 'navbar' && (
                 <>
                     <PropertyInput label="Brand Name" name="brand" value={selectedElement.brand || ''} onChange={handleChange} />
                     <PropertyTextarea label="Links (Label|URL per line)" value={linksString} onChange={handleLinksChange} />
                 </>
             )}
             
             {selectedElement.type === 'news-card' && (
                 <>
                    <PropertyInput label="News Title" name="newsTitle" value={selectedElement.newsTitle || ''} onChange={handleChange} />
                    <PropertyInput label="Image URL" name="newsImage" value={selectedElement.newsImage || ''} onChange={handleChange} />
                    <PropertyTextarea label="News Content" value={selectedElement.newsContent || ''} onChange={(e) => updateElement(selectedElement.id, { newsContent: e.target.value })} />
                 </>
             )}

             {selectedElement.type === 'script' && (
                 <div className="space-y-3">
                     <PropertyTextarea label="JavaScript Code" value={selectedElement.scriptContent || ''} onChange={(e) => updateElement(selectedElement.id, { scriptContent: e.target.value })} rows={12} fontFamily="monospace" />
                     <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                         <label className="block text-xs font-bold text-gray-700 mb-2">AI Script Generator</label>
                         <textarea
                             className="w-full p-2 text-sm border border-gray-300 rounded-md mb-2"
                             rows={3}
                             placeholder="Describe what the script should do..."
                             value={scriptPrompt}
                             onChange={(e) => setScriptPrompt(e.target.value)}
                         ></textarea>
                         <button
                             onClick={handleGenerateScript}
                             disabled={isGeneratingScript}
                             className="w-full py-2 bg-purple-600 text-white text-sm font-semibold rounded-md hover:bg-purple-700 disabled:opacity-50"
                         >
                             {isGeneratingScript ? 'Generating...' : 'Generate Script'}
                         </button>
                     </div>
                 </div>
             )}

             <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center space-x-2">
                    <input type="checkbox" name="required" checked={selectedElement.required || false} onChange={handleChange} className="rounded text-brand-primary focus:ring-brand-primary" />
                    <span className="text-sm text-gray-700">Required</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input type="checkbox" name="disabled" checked={selectedElement.disabled || false} onChange={handleChange} className="rounded text-brand-primary focus:ring-brand-primary" />
                    <span className="text-sm text-gray-700">Disabled</span>
                </label>
             </div>
             
             <PropertyInput label="Custom Error Message" name="customErrorMessage" value={selectedElement.customErrorMessage || ''} onChange={handleChange} />
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
              <div className="bg-purple-50 p-3 rounded-md border border-purple-200 mb-4">
                <label className="block text-xs font-bold text-purple-800 mb-2">AI Style Designer</label>
                <textarea
                    className="w-full p-2 text-sm border border-purple-300 rounded-md mb-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={2}
                    placeholder="E.g., 'Modern minimal look with blue borders'"
                    value={stylePrompt}
                    onChange={(e) => setStylePrompt(e.target.value)}
                ></textarea>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleAiStyleSuggest(true)}
                        disabled={isAiSuggesting}
                        className="flex-1 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                        {isAiSuggesting ? 'Designing...' : 'Apply AI Styles'}
                    </button>
                    <button
                         onClick={() => handleAiStyleSuggest(false)}
                         disabled={isAiSuggesting}
                         className="px-3 py-1.5 bg-white border border-purple-600 text-purple-600 text-xs font-semibold rounded hover:bg-purple-50 disabled:opacity-50"
                         title="Auto-suggest based on element type"
                    >
                        Auto
                    </button>
                </div>
              </div>
          
              <CollapsibleSection title="Dimensions & Spacing" defaultOpen>
                  <div className="grid grid-cols-2 gap-2">
                    <PropertyInput label="Width" name="width" value={styles.width || ''} onChange={(e) => handleStyleChange('width', e.target.value)} placeholder="e.g. 100%, 200px" />
                    <PropertyInput label="Height" name="height" value={styles.height || ''} onChange={(e) => handleStyleChange('height', e.target.value)} placeholder="e.g. auto, 100px" />
                    <PropertyInput label="Padding" name="padding" value={styles.padding || ''} onChange={(e) => handleStyleChange('padding', e.target.value)} placeholder="e.g. 10px 20px" />
                    <PropertySelect label="Size Preset" name="size" value={styles.size || 'medium'} onChange={(e) => handleStyleChange('size', e.target.value)} options={[{value:'small',label:'Small'}, {value:'medium',label:'Medium'}, {value:'large',label:'Large'}]} />
                  </div>
              </CollapsibleSection>
              
              <CollapsibleSection title="Typography">
                  <PropertySelect label="Font Family" name="fontFamily" value={styles.fontFamily || ''} onChange={(e) => handleStyleChange('fontFamily', e.target.value)} options={[{value:'',label:'Default'}, {value:'sans',label:'Sans-Serif'}, {value:'serif',label:'Serif'}, {value:'mono',label:'Monospace'}]} />
                  <PropertySelect label="Font Weight" name="fontWeight" value={styles.fontWeight || ''} onChange={(e) => handleStyleChange('fontWeight', e.target.value)} options={[{value:'normal',label:'Normal'}, {value:'bold',label:'Bold'}, {value:'300',label:'Light'}, {value:'600',label:'Semi-Bold'}]} />
                  <PropertySelect label="Text Align" name="textAlign" value={styles.textAlign || 'left'} onChange={(e) => handleStyleChange('textAlign', e.target.value)} options={[{value:'left',label:'Left'}, {value:'center',label:'Center'}, {value:'right',label:'Right'}, {value:'justify',label:'Justify'}]} />
                  <ColorPicker label="Text Color" value={styles.textColor || ''} onChange={(val) => handleStyleChange('textColor', val)} />
              </CollapsibleSection>

              <CollapsibleSection title="Colors & Borders">
                  <ColorPicker label="Background Color" value={styles.backgroundColor || ''} onChange={(val) => handleStyleChange('backgroundColor', val)} />
                  <ColorPicker label="Border Color" value={styles.borderColor || ''} onChange={(val) => handleStyleChange('borderColor', val)} />
                  <div className="grid grid-cols-2 gap-2">
                    <PropertyInput label="Border Width" name="borderWidth" value={styles.borderWidth || ''} onChange={(e) => handleStyleChange('borderWidth', e.target.value)} placeholder="e.g. 1px" />
                    <PropertyInput label="Border Radius" name="borderRadius" value={styles.borderRadius || ''} onChange={(e) => handleStyleChange('borderRadius', e.target.value)} placeholder="e.g. 4px" />
                  </div>
                  <PropertyInput label="Box Shadow" name="boxShadow" value={styles.boxShadow || ''} onChange={(e) => handleStyleChange('boxShadow', e.target.value)} placeholder="e.g. 0 2px 4px rgba(0,0,0,0.1)" />
                  
                  <div className="mt-2 pt-2 border-t border-gray-100">
                      <label className="block text-xs font-bold text-gray-700 mb-2">Focus State</label>
                      <ColorPicker label="Focus Border Color" value={styles.focusBorderColor || ''} onChange={(val) => handleStyleChange('focusBorderColor', val)} />
                      <PropertyInput label="Focus Box Shadow" name="focusBoxShadow" value={styles.focusBoxShadow || ''} onChange={(e) => handleStyleChange('focusBoxShadow', e.target.value)} placeholder="0 0 0 3px blue" />
                      <button 
                        onClick={handleAiFocusSuggest}
                        disabled={isAiSuggesting}
                        className="w-full mt-1 py-1 text-xs bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
                      >
                          ✨ Suggest Focus Styles
                      </button>
                  </div>
              </CollapsibleSection>
              
              {selectedElement.type === 'container' && (
                  <CollapsibleSection title="Layout">
                      <PropertySelect label="Display" name="display" value={styles.display || 'block'} onChange={(e) => handleStyleChange('display', e.target.value)} options={[{value:'block',label:'Block'}, {value:'flex',label:'Flexbox'}, {value:'grid',label:'Grid'}]} />
                      {styles.display === 'flex' && (
                          <>
                            <PropertySelect label="Direction" name="flexDirection" value={styles.flexDirection || 'row'} onChange={(e) => handleStyleChange('flexDirection', e.target.value)} options={[{value:'row',label:'Row'}, {value:'column',label:'Column'}]} />
                            <PropertySelect label="Justify Content" name="justifyContent" value={styles.justifyContent || 'flex-start'} onChange={(e) => handleStyleChange('justifyContent', e.target.value)} options={[{value:'flex-start',label:'Start'}, {value:'center',label:'Center'}, {value:'flex-end',label:'End'}, {value:'space-between',label:'Space Between'}]} />
                            <PropertySelect label="Align Items" name="alignItems" value={styles.alignItems || 'stretch'} onChange={(e) => handleStyleChange('alignItems', e.target.value)} options={[{value:'flex-start',label:'Start'}, {value:'center',label:'Center'}, {value:'flex-end',label:'End'}, {value:'stretch',label:'Stretch'}]} />
                            <PropertyInput label="Gap" name="gap" value={styles.gap || ''} onChange={(e) => handleStyleChange('gap', e.target.value)} placeholder="e.g. 1rem" />
                            <PropertySelect label="Wrap" name="flexWrap" value={styles.flexWrap || 'nowrap'} onChange={(e) => handleStyleChange('flexWrap', e.target.value)} options={[{value:'nowrap',label:'No Wrap'}, {value:'wrap',label:'Wrap'}]} />
                          </>
                      )}
                      {styles.display === 'grid' && (
                          <>
                            <PropertyInput label="Grid Columns" name="gridTemplateColumns" value={styles.gridTemplateColumns || ''} onChange={(e) => handleStyleChange('gridTemplateColumns', e.target.value)} placeholder="e.g. 1fr 1fr" />
                            <PropertyInput label="Grid Rows" name="gridTemplateRows" value={styles.gridTemplateRows || ''} onChange={(e) => handleStyleChange('gridTemplateRows', e.target.value)} placeholder="e.g. auto auto" />
                            <PropertyInput label="Grid Gap" name="gap" value={styles.gap || ''} onChange={(e) => handleStyleChange('gap', e.target.value)} placeholder="e.g. 1rem" />
                          </>
                      )}
                  </CollapsibleSection>
              )}
          </div>
        )}

        {activeTab === 'logic' && (
          <div className="space-y-4">
              <p className="text-xs text-gray-500 mb-2">Configure when this element should be visible based on other field values.</p>
              
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  <PropertySelect 
                    label="Trigger Field" 
                    name="triggerId" 
                    value={logic.triggerId} 
                    onChange={(e) => handleLogicChange('triggerId', e.target.value)} 
                    options={[
                        { value: '', label: '-- Select Field --' },
                        ...allElements
                            .filter(el => el.id !== selectedElement.id && ['text', 'select', 'radio', 'checkbox', 'number'].includes(el.type))
                            .map(el => ({ value: el.id, label: el.label || el.name }))
                    ]} 
                  />
                  
                  {logic.triggerId && (
                      <>
                        <PropertySelect 
                            label="Condition" 
                            name="condition" 
                            value={logic.condition} 
                            onChange={(e) => handleLogicChange('condition', e.target.value)} 
                            options={[
                                { value: 'equals', label: 'Equals' },
                                { value: 'not_equals', label: 'Not Equals' },
                                { value: 'contains', label: 'Contains' },
                            ]} 
                        />
                        <PropertyInput 
                            label="Value to match" 
                            name="value" 
                            value={logic.value} 
                            onChange={(e) => handleLogicChange('value', e.target.value)} 
                            placeholder="e.g. true, yes, 10"
                        />
                        
                        <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
                            <div className="flex space-x-4">
                                <label className="flex items-center">
                                    <input 
                                        type="radio" 
                                        name="action" 
                                        value="show" 
                                        checked={logic.action === 'show'} 
                                        onChange={(e) => handleLogicChange('action', e.target.value)}
                                        className="text-brand-primary"
                                    />
                                    <span className="ml-2 text-sm">Show</span>
                                </label>
                                <label className="flex items-center">
                                    <input 
                                        type="radio" 
                                        name="action" 
                                        value="hide" 
                                        checked={logic.action === 'hide'} 
                                        onChange={(e) => handleLogicChange('action', e.target.value)}
                                        className="text-brand-primary"
                                    />
                                    <span className="ml-2 text-sm">Hide</span>
                                </label>
                            </div>
                        </div>
                      </>
                  )}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
