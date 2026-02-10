
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FormElement } from '../types';
import FormElementRenderer from './FormElementRenderer';

interface PreviewModalProps {
  elements: FormElement[];
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ elements, onClose }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [dynamicOverrides, setDynamicOverrides] = useState<Record<string, Partial<FormElement>>>({});
  const [visibleElements, setVisibleElements] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const initialData: Record<string, any> = {};
    const extractDefaults = (list: FormElement[]) => {
      list.forEach(el => {
        if (el.name && el.defaultValue !== undefined) {
          initialData[el.name] = el.defaultValue;
        }
        // Handle radio defaults if specified
        if (el.type === 'radio' && el.defaultValue && el.name) {
          initialData[el.name] = el.defaultValue;
        }
        // Handle checkbox defaults
        if (el.type === 'checkbox' && el.name) {
          // Fix: defaultValue is defined as string in types.ts.
          // Comparing it to boolean true is a type error. Only comparing against string 'true'.
          initialData[el.name] = el.defaultValue === 'true';
        }
        if (el.children) extractDefaults(el.children);
      });
    };
    extractDefaults(elements);
    setFormData(initialData);
  }, [elements]);

  const findElementById = useCallback((list: FormElement[], id: string): FormElement | null => {
      for (const el of list) {
          if (el.id === id) return el;
          if (el.children) {
              const found = findElementById(el.children, id);
              if (found) return found;
          }
      }
      return null;
  }, []);

  const evaluateCondition = (condition: string, actualValue: any, targetValue: string) => {
    // Standardize inputs for comparison
    const valStr = (actualValue ?? '').toString().toLowerCase();
    const targetStr = (targetValue ?? '').toLowerCase();
    
    // Support boolean comparison specifically for checkboxes
    if (typeof actualValue === 'boolean') {
      const targetBool = targetStr === 'true' || targetStr === 'checked' || targetStr === '1';
      if (condition === 'equals') return actualValue === targetBool;
      if (condition === 'not_equals') return actualValue !== targetBool;
    }

    const valNum = Number(actualValue);
    const targetNum = Number(targetValue);

    switch(condition) {
        case 'equals': return valStr === targetStr;
        case 'not_equals': return valStr !== targetStr;
        case 'contains': return valStr.includes(targetStr);
        case 'starts_with': return valStr.startsWith(targetStr);
        case 'ends_with': return valStr.endsWith(targetStr);
        case 'greater_than': return !isNaN(valNum) && !isNaN(targetNum) && valNum > targetNum;
        case 'less_than': return !isNaN(valNum) && !isNaN(targetNum) && valNum < targetNum;
        case 'is_empty': return !actualValue || valStr === '' || actualValue === false;
        case 'is_not_empty': return !!actualValue && valStr !== '' && actualValue !== false;
        default: return false;
    }
  };

  useEffect(() => {
    const calculateLogicAndValidation = () => {
        const overrides: Record<string, Partial<FormElement>> = {};
        const visible: string[] = [];
        const newErrors: Record<string, string> = {};

        const evaluate = (list: FormElement[]) => {
            list.forEach(el => {
                let isVisible = !el.hidden;
                
                // Visibility Logic (PULL)
                if (el.logic?.triggerId) {
                    const triggerEl = findElementById(elements, el.logic.triggerId);
                    if (triggerEl) {
                        const val = formData[triggerEl.name || ''];
                        const matches = evaluateCondition(el.logic.condition, val, el.logic.value);
                        isVisible = el.logic.action === 'show' ? matches : !matches;
                    }
                }

                if (isVisible && el.id) {
                    visible.push(el.id);
                    
                    // Conditional Rules (PUSH) - when THIS field changes, it affects OTHERS
                    if (el.conditionalRules) {
                        const myVal = formData[el.name || ''];
                        el.conditionalRules.forEach(rule => {
                            const matches = evaluateCondition(rule.condition, myVal, rule.matchValue);
                            if (matches) {
                                rule.actions.forEach(action => {
                                    action.targetIds.forEach(tId => {
                                        overrides[tId] = { 
                                          ...overrides[tId], 
                                          [action.property]: action.value 
                                        };
                                        // Handle nested style overrides
                                        if (['backgroundColor', 'textColor'].includes(action.property)) {
                                          const targetEl = findElementById(elements, tId);
                                          const existingStyles = { ...(targetEl?.styles || {}), ...(overrides[tId]?.styles || {}) };
                                          overrides[tId].styles = { ...existingStyles, [action.property]: action.value };
                                        }
                                    });
                                });
                            }
                        });
                    }

                    // Validation Logic
                    let myVal = formData[el.name || ''];
                    let isInvalid = false;
                    let validationMsg = "Invalid value";

                    if (el.required && (myVal === undefined || myVal === null || myVal === '' || myVal === false)) {
                        isInvalid = true;
                        validationMsg = `${el.label || 'Field'} is required`;
                    } else if (el.validationLogic?.condition && el.validationLogic.condition !== 'none') {
                        if (el.validationLogic.condition === 'regex' && el.validationLogic.value) {
                             try {
                                 const regex = new RegExp(el.validationLogic.value);
                                 isInvalid = !regex.test(String(myVal || ''));
                             } catch(e) { console.warn("Invalid regex pattern"); }
                        } else if (el.validationLogic?.triggerId) {
                            const triggerEl = findElementById(elements, el.validationLogic.triggerId);
                            if (triggerEl) {
                                const triggerVal = formData[triggerEl.name || ''];
                                switch (el.validationLogic.condition) {
                                    case 'matches':
                                    case 'equals': isInvalid = String(myVal) !== String(triggerVal); break;
                                    case 'not_equals': isInvalid = String(myVal) === String(triggerVal); break;
                                    case 'contains': isInvalid = !String(myVal).includes(String(triggerVal)); break;
                                    case 'greater_than': isInvalid = Number(myVal) <= Number(triggerVal); break;
                                    case 'less_than': isInvalid = Number(myVal) >= Number(triggerVal); break;
                                }
                            }
                        }
                        validationMsg = el.validationLogic?.errorMessage || validationMsg;
                    }
                    
                    if (isInvalid && el.name) {
                        newErrors[el.name] = validationMsg;
                    }
                }
                if (el.children) evaluate(el.children);
            });
        };

        evaluate(elements);
        setVisibleElements(visible);
        setDynamicOverrides(overrides);
        setErrors(newErrors);
    };

    calculateLogicAndValidation();
  }, [formData, elements, findElementById]);

  const handleInputChange = (e: React.ChangeEvent<HTMLFormElement>) => {
      const target = e.target as unknown as HTMLInputElement;
      const { name, value, type, checked } = target;
      if (!name) return;

      let finalValue: any = value;
      if (type === 'checkbox') {
          finalValue = checked;
      } else if (type === 'radio') {
          if (!checked) return;
          finalValue = value;
      } else if (type === 'number' || type === 'range') {
          finalValue = value === '' ? '' : Number(value);
      } else if (type === 'select-multiple') {
          const select = target as unknown as HTMLSelectElement;
          finalValue = Array.from(select.selectedOptions).map(opt => opt.value);
      }
      
      setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length === 0) {
        alert("Success! Data collected:\n" + JSON.stringify(formData, null, 2));
    } else {
        alert("Validation Errors:\n" + Object.values(errors).join('\n'));
    }
  };

  const renderElements = (list: FormElement[]) => {
      return list.map(el => {
          if (!el.id) return null;
          const override = dynamicOverrides[el.id] || {};
          let finalVisible = visibleElements.includes(el.id);
          
          // Direct override visibility has highest precedence
          if (override.hidden === true) finalVisible = false;
          if (override.hidden === false) finalVisible = true;
          
          if (!finalVisible) return null;

          const errorText = el.name ? errors[el.name] : undefined;

          return (
             <div key={el.id} className="relative w-full">
                <FormElementRenderer 
                  element={{ ...el, ...override } as FormElement} 
                  preview={true}
                  errorMessage={errorText}
                >
                    {el.children && renderElements(el.children)}
                </FormElementRenderer>
                {el.name && errorText && (
                    <p id={`${el.id}-error`} role="alert" className="text-red-500 text-[10px] mt-2 font-black uppercase tracking-widest px-2">
                        {errorText}
                    </p>
                )}
             </div>
          );
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-6 backdrop-blur-md">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-fade-in-staggered border border-white/20">
        <div className="flex justify-between items-center p-8 border-b bg-brand-secondary/30">
          <div className="flex items-center space-x-6">
              <div className="w-14 h-14 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-elevated">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-brand-text tracking-tighter">Interactive Form Simulator</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logic: Active | Validation: Active</p>
              </div>
          </div>
          <button onClick={onClose} className="p-4 text-gray-400 hover:text-gray-900 transition-colors rounded-2xl hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-12 overflow-y-auto flex-grow bg-white custom-scrollbar">
            <div className="max-w-3xl mx-auto">
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-12" onChange={handleInputChange}>
                  {renderElements(elements)}
                  <div className="pt-12 border-t border-gray-100 flex justify-end">
                      <button type="submit" className="px-16 py-5 bg-brand-primary text-white rounded-[2rem] font-black shadow-elevated hover:bg-brand-accent transition-all active:scale-95 text-xs uppercase tracking-widest">
                          Submit & Test Logic
                      </button>
                  </div>
              </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
