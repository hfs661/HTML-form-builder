
import React, { useState, useEffect } from 'react';
import type { FormElement } from '../types';
import FormElementRenderer from './FormElementRenderer';

interface PreviewModalProps {
  elements: FormElement[];
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ elements, onClose }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [visibleElements, setVisibleElements] = useState<string[]>([]);
  const [requiredElements, setRequiredElements] = useState<Record<string, boolean>>({});

  // Initialize logic on mount and when form data changes
  useEffect(() => {
      // 1. Calculate Visibility
      const newVisibleElements = elements.map(el => {
          if (!el.logic || !el.logic.triggerId) return el.id;

          const triggerEl = elements.find(e => e.id === el.logic!.triggerId);
          if (!triggerEl) return el.id;

          const triggerValue = formData[triggerEl.name]?.toString() || '';
          const conditionValue = el.logic.value;
          let matches = false;

          if (el.logic.condition === 'equals') {
              matches = triggerValue === conditionValue;
          } else if (el.logic.condition === 'not_equals') {
              matches = triggerValue !== conditionValue;
          } else if (el.logic.condition === 'contains') {
              matches = triggerValue.includes(conditionValue);
          }

          if (el.logic.action === 'show') {
              return matches ? el.id : null;
          } else { // hide
              return matches ? null : el.id;
          }
      }).filter((id): id is string => id !== null);

      setVisibleElements(newVisibleElements);

      // 2. Calculate Conditional Validation
      const newRequiredElements: Record<string, boolean> = {};
      elements.forEach(el => {
          // Default to static requirement
          let isReq = !!el.required;

          if (el.validationLogic && el.validationLogic.triggerId) {
              const triggerEl = elements.find(e => e.id === el.validationLogic!.triggerId);
              if (triggerEl) {
                  const triggerValue = formData[triggerEl.name]?.toString() || '';
                  const conditionValue = el.validationLogic.value;
                  let matches = false;

                  if (el.validationLogic.condition === 'equals') {
                      matches = triggerValue === conditionValue;
                  } else if (el.validationLogic.condition === 'not_equals') {
                      matches = triggerValue !== conditionValue;
                  } else if (el.validationLogic.condition === 'contains') {
                      matches = triggerValue.includes(conditionValue);
                  }
                  
                  // If matches, it becomes required. If not, it falls back to static setting (usually false if using conditional)
                  if (matches) {
                      isReq = true;
                  } else {
                      // If condition not met, revert to base state (often false for conditional logic fields)
                      isReq = el.required || false;
                  }
              }
          }
          newRequiredElements[el.id] = isReq;
      });
      setRequiredElements(newRequiredElements);

  }, [formData, elements]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      let finalValue: any = value;
      if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
          finalValue = e.target.checked;
      }
      setFormData(prev => ({ ...prev, [name]: finalValue }));
  };
  
  // Wrap submit to validate only visible elements
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Basic HTML5 validation works on visible fields. 
    // We filter formData to only include visible fields for the output.
    const visibleData: Record<string, any> = {};
    elements.forEach(el => {
        if (visibleElements.includes(el.id) && el.type !== 'button' && el.type !== 'news-card' && el.type !== 'iframe' && el.type !== 'navbar' && el.type !== 'table') {
            visibleData[el.name] = formData[el.name];
        }
    });
    
    alert(JSON.stringify(visibleData, null, 2));
    console.log("Form Submission Data:", visibleData);
  };
  
  // Recursive renderer for preview to handle layouts properly
  const renderPreviewElements = (list: FormElement[]) => {
      return list.map(el => {
          // Logic check for visibility
          if (!visibleElements.includes(el.id)) return null;
          
          return (
             <FormElementRenderer 
                key={el.id}
                element={el} 
                preview={true} 
                hidden={false}
                forceRequired={requiredElements[el.id]}
            >
                {el.children && renderPreviewElements(el.children)}
            </FormElementRenderer>
          );
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b bg-brand-secondary rounded-t-lg">
          <h2 className="text-xl font-bold text-brand-text">Form Preview</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-white flex-grow">
            <form onSubmit={handleSubmit} className="space-y-4" onChange={(e) => handleInputChange(e as any)}>
                {elements.length === 0 ? (
                    <p className="text-center text-gray-500">No elements to preview.</p>
                ) : (
                    renderPreviewElements(elements)
                )}
                
                {elements.length > 0 && !elements.some(el => el.type === 'button') && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                        <button type="submit" className="px-6 py-2 bg-brand-primary text-white rounded-md font-semibold hover:bg-brand-accent">
                            Submit Form
                        </button>
                    </div>
                )}
            </form>
        </div>
        
        <div className="p-4 border-t bg-gray-50 rounded-b-lg text-right">
            <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Close Preview
            </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
