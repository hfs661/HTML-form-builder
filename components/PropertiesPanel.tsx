

import React, { useState } from 'react';
import type { FormElement } from '../types';

interface PropertiesPanelProps {
  selectedElement: FormElement | null;
  updateElement: (id: string, updatedProps: Partial<FormElement>) => void;
  closePanel: () => void;
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

const PropertyTextarea: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string }> = ({ label, value, onChange, placeholder }) => (
    <div className="mb-3">
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <textarea
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={4}
            className="w-full p-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary"
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

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-gray-200">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-3 text-left font-semibold text-brand-text">
                <span>{title}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
            {isOpen && <div className="pb-4">{children}</div>}
        </div>
    );
}


const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedElement, updateElement, closePanel }) => {
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
  
  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      const currentStyles = selectedElement.styles || {};
      updateElement(selectedElement.id, {
        styles: { ...currentStyles, [name]: value },
      });
  };

  return (
    <div className="w-full md:w-72 lg:w-80 p-4 bg-brand-light-gray h-full overflow-y-auto border-l border-gray-300">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-brand-text">Properties</h2>
        <button onClick={closePanel} className="text-gray-500 hover:text-gray-800">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
        </button>
      </div>
      
      <div className="bg-white p-4 rounded-md shadow-sm">
        <Accordion title="General" defaultOpen={true}>
          <PropertyInput label="Label Text" name="label" value={selectedElement.label} onChange={handleChange} />
          <PropertyInput label="Name Attribute" name="name" value={selectedElement.name} onChange={handleChange} placeholder="e.g., firstName" />

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
        </Accordion>

        {!['color', 'range'].includes(selectedElement.type) &&(
           <Accordion title="Validation">
             <div className="flex items-center my-3">
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
             <div className="flex items-center my-3">
                  <input
                      type="checkbox"
                      id="required"
                      name="required"
                      checked={selectedElement.required || false}
                      onChange={handleChange}
                      className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                  />
                  <label htmlFor="required" className="ml-2 block text-sm text-gray-900">Required</label>
              </div>

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
                  <PropertyInput 
                    label="Min Length" 
                    name="minLength" 
                    value={selectedElement.minLength ?? ''} 
                    onChange={handleChange} 
                    type="number"
                    min={0}
                  />
                  <PropertyInput 
                    label="Max Length" 
                    name="maxLength" 
                    value={selectedElement.maxLength ?? ''} 
                    onChange={handleChange} 
                    type="number"
                    min={0}
                  />
                 </>
              )}

              {selectedElement.type === 'number' && (
                <>
                  <PropertyInput label="Min Value" name="min" value={selectedElement.min ?? ''} onChange={handleChange} type="number" />
                  <PropertyInput label="Max Value" name="max" value={selectedElement.max ?? ''} onChange={handleChange} type="number" />
                  <PropertyInput label="Step" name="step" value={selectedElement.step ?? ''} onChange={handleChange} type="number" min={0} step={0.1}/>
                </>
              )}

              {selectedElement.type === 'file' && (
                  <PropertyInput 
                    label="Accepted File Types" 
                    name="accept" 
                    value={selectedElement.accept || ''} 
                    onChange={handleChange} 
                    placeholder="e.g., image/*, .pdf"
                />
              )}
           </Accordion>
        )}
        
        <Accordion title="Styling">
            <PropertySelect
                label="Size"
                name="size"
                value={selectedElement.styles?.size || 'medium'}
                onChange={handleStyleChange}
                options={[
                    { value: 'small', label: 'Small' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'large', label: 'Large' },
                ]}
            />
            {selectedElement.type === 'button' && (
                <PropertySelect
                    label="Button Color"
                    name="color"
                    value={selectedElement.styles?.color || 'primary'}
                    onChange={handleStyleChange}
                    options={[
                        { value: 'primary', label: 'Primary (Blue)' },
                        { value: 'secondary', label: 'Secondary (Gray)' },
                        { value: 'danger', label: 'Danger (Red)' },
                    ]}
                />
            )}
        </Accordion>
      </div>
    </div>
  );
};

export default PropertiesPanel;