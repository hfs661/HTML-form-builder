
import React, { useState } from 'react';
import type { FormElement } from '../types';
import { getStyleSuggestions, getScriptSuggestions } from '../services/geminiService';

interface PropertiesPanelProps {
  selectedElement: FormElement | null;
  updateElement: (id: string, updatedProps: Partial<FormElement>) => void;
  closePanel: () => void;
  allElements: FormElement[];
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


const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement, updateElement, closePanel, allElements }) => {
  const [activeTab, setActiveTab] = useState<'props' | 'style' | 'logic'>('props');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [scriptPrompt, setScriptPrompt] = useState('');
  const [stylePrompt, setStylePrompt] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

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
    if (isCheckbox) finalValue = e.target.checked;
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

  const handleAiStyleSuggest = async () => {
      setIsAiSuggesting(true);
      try {
          const styles = await getStyleSuggestions(selectedElement, stylePrompt);
          updateElement(selectedElement.id, { styles: { ...selectedElement.styles, ...styles } });
      } catch (error) {
          console.error("Failed to get AI styles", error);
          alert("Failed to get AI suggestions. Please try again.");
      } finally {
          setIsAiSuggesting(false);
      }
  }

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
        <h2 className="text-xl font-bold text-brand-text">Properties</h2>
        <button onClick={closePanel} className="text-gray-500 hover:text-gray-800">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button>
      </div>
      
      <div className="flex border-b border-gray-300 bg-white">
          <button onClick={() => setActiveTab('props')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'props' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500'}`}>Properties</button>
          <button onClick={() => setActiveTab('style')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'style' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500'}`}>Style</button>
          <button onClick={() => setActiveTab('logic')} className={`flex-1 py-2 text-sm font-medium ${activeTab === 'logic' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-500'}`}>Logic</button>
      </div>
      
      <div className="p-4 overflow-y-auto custom-scrollbar flex-grow">
        {activeTab === 'props' && (
            <div className="space-y-4">
                {!['html-block', 'divider'].includes(selectedElement.type) && (
                     <PropertyInput label="Label Text" name="label" value={selectedElement.label} onChange={handleChange} />
                )}
                
                {selectedElement.type === 'html-block' && (
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Raw HTML Content</label>
                        <div className="relative">
                            <textarea
                                value={selectedElement.htmlContent || ''}
                                onChange={(e) => updateElement(selectedElement.id, { htmlContent: e.target.value })}
                                rows={12}
                                className="w-full p-2 text-sm font-mono border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-gray-50"
                                placeholder="<div><p>Your HTML here</p></div>"
                            />
                        </div>
                         <p className="text-xs text-gray-400 mt-1">
                            Enter standard HTML. Styling can be inline or via style tag.
                        </p>
                    </div>
                )}

                {selectedElement.type === 'typography' && (
                    <>
                        <PropertySelect
                            label="Heading Level / Type"
                            name="headingLevel"
                            value={selectedElement.headingLevel || 'p'}
                            onChange={handleChange}
                            options={[
                                { value: 'h1', label: 'Heading 1 (H1)' },
                                { value: 'h2', label: 'Heading 2 (H2)' },
                                { value: 'h3', label: 'Heading 3 (H3)' },
                                { value: 'h4', label: 'Heading 4 (H4)' },
                                { value: 'h5', label: 'Heading 5 (H5)' },
                                { value: 'h6', label: 'Heading 6 (H6)' },
                                { value: 'p', label: 'Paragraph (P)' },
                                { value: 'span', label: 'Span (Inline)' },
                            ]}
                        />
                        <PropertyTextarea 
                            label="Text Content" 
                            value={selectedElement.textContent || ''} 
                            onChange={(e) => updateElement(selectedElement.id, { textContent: e.target.value })} 
                            placeholder="Enter text..."
                        />
                    </>
                )}

                {selectedElement.type === 'image' && (
                     <>
                        <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    name="src"
                                    value={selectedElement.src || ''} 
                                    onChange={handleChange}
                                    placeholder="https://example.com/image.jpg"
                                    className="flex-1 p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                                />
                            </div>
                        </div>
                        <PropertyInput label="Alt Text" name="altText" value={selectedElement.altText || ''} onChange={handleChange} />
                     </>
                )}

                {selectedElement.type === 'script' && (
                    <div className="mb-3">
                         <div className="bg-blue-50 p-3 rounded-md mb-3 border border-blue-100">
                             <label className="block text-xs font-bold text-blue-800 mb-1">AI Script Generator</label>
                             <textarea 
                                value={scriptPrompt}
                                onChange={(e) => setScriptPrompt(e.target.value)}
                                placeholder="Describe what you want the script to do (e.g., 'Calculate sum of Field A and Field B and show in Field C')"
                                className="w-full p-2 text-xs border border-blue-200 rounded mb-2 h-16"
                             />
                             <button 
                                onClick={handleGenerateScript} 
                                disabled={isGeneratingScript || !scriptPrompt}
                                className="w-full py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 disabled:opacity-50"
                             >
                                {isGeneratingScript ? 'Generating...' : 'Generate Script Code'}
                             </button>
                         </div>

                        <label className="block text-xs font-medium text-gray-500 mb-1">JavaScript Code</label>
                        <div className="relative">
                            <textarea
                                value={selectedElement.scriptContent || ''}
                                onChange={(e) => updateElement(selectedElement.id, { scriptContent: e.target.value })}
                                rows={12}
                                className="w-full p-2 text-sm font-mono border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-gray-50"
                                placeholder="// Write your JS here... e.g. document.querySelector('input').value = 'Hello';"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Code runs in global scope in Preview. Use <code>document.querySelector</code> to target elements by name attribute.
                        </p>
                    </div>
                )}

                {!['script', 'html-block', 'typography', 'divider', 'image'].includes(selectedElement.type) && <PropertyInput label="Name Attribute" name="name" value={selectedElement.name} onChange={handleChange} placeholder="e.g., firstName" />}
                
                {selectedElement.type === 'news-card' && (
                    <>
                        <PropertyInput label="News Title" name="newsTitle" value={selectedElement.newsTitle || ''} onChange={handleChange} />
                        <PropertyTextarea label="News Content" value={selectedElement.newsContent || ''} onChange={(e) => updateElement(selectedElement.id, { newsContent: e.target.value })} />
                        <PropertyInput label="Image URL" name="newsImage" value={selectedElement.newsImage || ''} onChange={handleChange} />
                    </>
                )}

                {selectedElement.type === 'navbar' && (
                    <PropertyInput label="Brand Name" name="brand" value={selectedElement.brand || ''} onChange={handleChange} />
                )}

                {['text', 'textarea', 'number'].includes(selectedElement.type) && (
                    <PropertyInput label="Placeholder" name="placeholder" value={selectedElement.placeholder || ''} onChange={handleChange} />
                )}

                {(selectedElement.type === 'select' || selectedElement.type === 'radio') && (
                    <PropertyTextarea
                        label="Options (one per line)"
                        value={(selectedElement.options || []).join('\n')}
                        onChange={handleOptionsChange}
                    />
                )}
                
                {selectedElement.type === 'iframe' && (
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Source URL</label>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                name="src"
                                value={selectedElement.src || ''} 
                                onChange={handleChange}
                                placeholder="https://example.com"
                                className="flex-1 p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if(selectedElement.src) {
                                        navigator.clipboard.writeText(selectedElement.src);
                                    }
                                }}
                                title="Copy URL"
                                className="p-2 bg-white border border-gray-300 text-gray-500 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
                
                {selectedElement.type === 'table' && (
                    <>
                        <PropertyInput label="Columns" name="colCount" value={selectedElement.colCount || 3} onChange={handleChange} type="number" min={1} />
                        <PropertyInput label="Rows" name="rowCount" value={selectedElement.rowCount || 3} onChange={handleChange} type="number" min={1} />
                        <PropertyTextarea label="Headers (comma separated)" value={headersString} onChange={handleHeadersChange} placeholder="Col 1, Col 2, Col 3" />
                    </>
                )}

                {selectedElement.type === 'navbar' && (
                        <PropertyTextarea 
                            label="Links (Label|URL per line)" 
                            value={linksString} 
                            onChange={handleLinksChange} 
                            placeholder="Home|/home&#10;About|/about" 
                        />
                )}

                {!['color', 'range', 'iframe', 'table', 'navbar', 'news-card', 'script', 'html-block', 'typography', 'divider', 'image', 'accordion', 'reset-button'].includes(selectedElement.type) &&(
                    <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Validation</h3>
                        <div className="flex items-center my-2">
                            <input
                                type="checkbox"
                                id="required"
                                name="required"
                                checked={selectedElement.required || false}
                                onChange={handleChange}
                                className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                            />
                            <label htmlFor="required" className="ml-2 block text-sm text-gray-900">Required Field</label>
                        </div>
                         <div className="flex items-center my-2 mb-4">
                            <input
                                type="checkbox"
                                id="disabled"
                                name="disabled"
                                checked={selectedElement.disabled || false}
                                onChange={handleChange}
                                className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                            />
                            <label htmlFor="disabled" className="ml-2 block text-sm text-gray-900">Disabled</label>
                        </div>
                        
                         <PropertyInput label="Custom Error Message" name="customErrorMessage" value={selectedElement.customErrorMessage || ''} onChange={handleChange} placeholder="e.g., Please enter a valid email" />


                        {(selectedElement.type === 'text' || selectedElement.type === 'textarea') && (
                            <>
                                {selectedElement.type === 'text' && (
                                    <PropertySelect
                                        label="Text Type"
                                        name="subType"
                                        value={selectedElement.subType || 'text'}
                                        onChange={handleChange}
                                        options={[
                                            {value: 'text', label: 'Text'},
                                            {value: 'email', label: 'Email'},
                                            {value: 'password', label: 'Password'},
                                            {value: 'url', label: 'URL'},
                                            {value: 'tel', label: 'Telephone'},
                                        ]}
                                    />
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <PropertyInput label="Min Length" name="minLength" value={selectedElement.minLength ?? ''} onChange={handleChange} type="number" min={0} />
                                    <PropertyInput label="Max Length" name="maxLength" value={selectedElement.maxLength ?? ''} onChange={handleChange} type="number" min={0} />
                                </div>
                                <PropertyInput label="Regex Pattern" name="pattern" value={selectedElement.pattern || ''} onChange={handleChange} placeholder="e.g. [A-Za-z]{3}" />
                            </>
                        )}

                        {selectedElement.type === 'number' && (
                            <div className="grid grid-cols-2 gap-2">
                                <PropertyInput label="Min Value" name="min" value={selectedElement.min ?? ''} onChange={handleChange} type="number" />
                                <PropertyInput label="Max Value" name="max" value={selectedElement.max ?? ''} onChange={handleChange} type="number" />
                                <PropertyInput label="Step" name="step" value={selectedElement.step ?? ''} onChange={handleChange} type="number" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {activeTab === 'style' && (
            <div className="space-y-4">
                 <div className="bg-indigo-50 p-3 rounded-md mb-4 border border-indigo-100">
                    <label className="block text-xs font-bold text-indigo-800 mb-1">AI Style Assistant</label>
                    <textarea
                        value={stylePrompt}
                        onChange={(e) => setStylePrompt(e.target.value)}
                        placeholder="Describe the look (e.g., 'Modern purple button with shadow', 'Minimalist text input')"
                        className="w-full p-2 text-xs border border-indigo-200 rounded mb-2 h-14 bg-white"
                    />
                    <button 
                        onClick={handleAiStyleSuggest}
                        disabled={isAiSuggesting}
                        className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-md shadow hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isAiSuggesting ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Applying Magic Style...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                                </svg>
                                Apply Magic Style
                            </>
                        )}
                    </button>
                </div>
                
                <CollapsibleSection title="Typography" defaultOpen={true}>
                    <PropertySelect
                        label="Font Family"
                        name="fontFamily"
                        value={styles.fontFamily || 'sans'}
                        onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                        options={[
                            { value: 'sans', label: 'Sans Serif' },
                            { value: 'serif', label: 'Serif' },
                            { value: 'mono', label: 'Monospace' },
                        ]}
                    />
                    <PropertySelect
                        label="Font Weight"
                        name="fontWeight"
                        value={styles.fontWeight || 'normal'}
                        onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                        options={[
                            { value: 'normal', label: 'Normal' },
                            { value: 'bold', label: 'Bold' },
                        ]}
                    />
                    <PropertySelect
                        label="Text Align"
                        name="textAlign"
                        value={styles.textAlign || 'left'}
                        onChange={(e) => handleStyleChange('textAlign', e.target.value)}
                        options={[
                            { value: 'left', label: 'Left' },
                            { value: 'center', label: 'Center' },
                            { value: 'right', label: 'Right' },
                            { value: 'justify', label: 'Justify' },
                        ]}
                    />
                    <PropertyInput label="Letter Spacing" name="letterSpacing" value={styles.letterSpacing || ''} onChange={(e) => handleStyleChange('letterSpacing', e.target.value)} placeholder="normal, 1px, 0.1em" />
                    <PropertyInput label="Line Height" name="lineHeight" value={styles.lineHeight || ''} onChange={(e) => handleStyleChange('lineHeight', e.target.value)} placeholder="normal, 1.5, 24px" />
                     <PropertySelect
                        label="Text Decoration"
                        name="textDecoration"
                        value={styles.textDecoration || 'none'}
                        onChange={(e) => handleStyleChange('textDecoration', e.target.value)}
                        options={[
                            { value: 'none', label: 'None' },
                            { value: 'underline', label: 'Underline' },
                            { value: 'line-through', label: 'Line Through' },
                            { value: 'overline', label: 'Overline' },
                        ]}
                    />
                    <ColorPicker label="Text Color" value={styles.textColor || ''} onChange={(val) => handleStyleChange('textColor', val)} />
                </CollapsibleSection>
                
                <CollapsibleSection title="Appearance" defaultOpen={true}>
                     <ColorPicker label="Background Color" value={styles.backgroundColor || ''} onChange={(val) => handleStyleChange('backgroundColor', val)} />
                     <PropertyInput label="Box Shadow" name="boxShadow" value={styles.boxShadow || ''} onChange={(e) => handleStyleChange('boxShadow', e.target.value)} placeholder="0 4px 6px rgba(0,0,0,0.1)" />
                </CollapsibleSection>

                <CollapsibleSection title="Border">
                    <ColorPicker label="Border Color" value={styles.borderColor || ''} onChange={(val) => handleStyleChange('borderColor', val)} />
                    <div className="grid grid-cols-2 gap-2">
                        <PropertyInput label="Border Width" name="borderWidth" value={styles.borderWidth || ''} onChange={(e) => handleStyleChange('borderWidth', e.target.value)} placeholder="1px" />
                        <PropertyInput label="Border Radius" name="borderRadius" value={styles.borderRadius || ''} onChange={(e) => handleStyleChange('borderRadius', e.target.value)} placeholder="4px" />
                    </div>
                </CollapsibleSection>

                {selectedElement.type === 'container' && (
                    <CollapsibleSection title="Flexbox Layout" defaultOpen={true}>
                         <PropertySelect
                            label="Display"
                            name="display"
                            value={styles.display || 'block'}
                            onChange={(e) => handleStyleChange('display', e.target.value)}
                            options={[
                                { value: 'block', label: 'Block' },
                                { value: 'flex', label: 'Flex' },
                            ]}
                        />
                        {styles.display === 'flex' && (
                            <>
                                <PropertySelect
                                    label="Direction"
                                    name="flexDirection"
                                    value={styles.flexDirection || 'row'}
                                    onChange={(e) => handleStyleChange('flexDirection', e.target.value)}
                                    options={[
                                        { value: 'row', label: 'Row (Horizontal)' },
                                        { value: 'column', label: 'Column (Vertical)' },
                                        { value: 'row-reverse', label: 'Row Reverse' },
                                        { value: 'column-reverse', label: 'Column Reverse' },
                                    ]}
                                />
                                <PropertySelect
                                    label="Justify Content"
                                    name="justifyContent"
                                    value={styles.justifyContent || 'flex-start'}
                                    onChange={(e) => handleStyleChange('justifyContent', e.target.value)}
                                    options={[
                                        { value: 'flex-start', label: 'Start' },
                                        { value: 'center', label: 'Center' },
                                        { value: 'flex-end', label: 'End' },
                                        { value: 'space-between', label: 'Space Between' },
                                        { value: 'space-around', label: 'Space Around' },
                                    ]}
                                />
                                <PropertySelect
                                    label="Align Items"
                                    name="alignItems"
                                    value={styles.alignItems || 'stretch'}
                                    onChange={(e) => handleStyleChange('alignItems', e.target.value)}
                                    options={[
                                        { value: 'stretch', label: 'Stretch' },
                                        { value: 'flex-start', label: 'Start' },
                                        { value: 'center', label: 'Center' },
                                        { value: 'flex-end', label: 'End' },
                                    ]}
                                />
                                <PropertyInput label="Gap" name="gap" value={styles.gap || ''} onChange={(e) => handleStyleChange('gap', e.target.value)} placeholder="e.g. 1rem" />
                                <PropertySelect
                                    label="Wrap"
                                    name="flexWrap"
                                    value={styles.flexWrap || 'nowrap'}
                                    onChange={(e) => handleStyleChange('flexWrap', e.target.value)}
                                    options={[
                                        { value: 'nowrap', label: 'No Wrap' },
                                        { value: 'wrap', label: 'Wrap' },
                                    ]}
                                />
                            </>
                        )}
                    </CollapsibleSection>
                )}

                <CollapsibleSection title="Layout">
                    <PropertySelect
                        label="Size"
                        name="size"
                        value={styles.size || 'medium'}
                        onChange={(e) => handleStyleChange('size', e.target.value)}
                        options={[
                            { value: 'small', label: 'Small' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'large', label: 'Large' },
                        ]}
                    />
                    <PropertyInput label="Padding" name="padding" value={styles.padding || ''} onChange={(e) => handleStyleChange('padding', e.target.value)} placeholder="10px" />
                    {(selectedElement.type === 'iframe' || selectedElement.type === 'image') && (
                         <div className="grid grid-cols-2 gap-2">
                            <PropertyInput label="Width" name="width" value={styles.width || ''} onChange={(e) => handleStyleChange('width', e.target.value)} placeholder="e.g., 100%, 300px" />
                            <PropertyInput label="Height" name="height" value={styles.height || ''} onChange={(e) => handleStyleChange('height', e.target.value)} placeholder="e.g., 200px" />
                        </div>
                    )}
                </CollapsibleSection>
            </div>
        )}

        {activeTab === 'logic' && (
            <div className="space-y-4">
                <p className="text-xs text-gray-500 italic mb-4">Logic rules are applied in Preview mode.</p>
                <div className="mb-3">
                     <label className="block text-xs font-medium text-gray-500 mb-1">Trigger Field</label>
                     <select 
                        value={logic.triggerId} 
                        onChange={(e) => handleLogicChange('triggerId', e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
                     >
                         <option value="">-- Select Field --</option>
                         {allElements.filter(el => el.id !== selectedElement.id).map(el => (
                             <option key={el.id} value={el.id}>{el.label} ({el.name})</option>
                         ))}
                     </select>
                </div>
                {logic.triggerId && (
                    <>
                        <PropertySelect
                            label="Condition"
                            name="condition"
                            value={logic.condition}
                            onChange={(e) => handleLogicChange('condition', e.target.value)}
                            options={[
                                { value: 'equals', label: 'Equals' },
                                { value: 'not_equals', label: 'Does Not Equal' },
                                { value: 'contains', label: 'Contains' },
                            ]}
                        />
                         <PropertyInput label="Value" name="value" value={logic.value} onChange={(e) => handleLogicChange('value', e.target.value)} placeholder="Value to match" />
                         <PropertySelect
                            label="Action"
                            name="action"
                            value={logic.action}
                            onChange={(e) => handleLogicChange('action', e.target.value)}
                            options={[
                                { value: 'show', label: 'Show This Field' },
                                { value: 'hide', label: 'Hide This Field' },
                            ]}
                        />
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPanel;
