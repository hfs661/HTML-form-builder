
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { FormElement, DataLogicRule } from '../types';
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

  // Helper to find an element in the nested tree
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

  const evaluateCondition = (condition: string, value: any, targetValue: string) => {
    const valStr = value?.toString().toLowerCase() || '';
    const targetStr = targetValue?.toLowerCase() || '';
    const valNum = Number(value);
    const targetNum = Number(targetValue);

    switch(condition) {
        case 'equals': return valStr === targetStr;
        case 'not_equals': return valStr !== targetStr;
        case 'contains': return valStr.includes(targetStr);
        case 'starts_with': return valStr.startsWith(targetStr);
        case 'ends_with': return valStr.endsWith(targetStr);
        case 'greater_than': return !isNaN(valNum) && !isNaN(targetNum) && valNum > targetNum;
        case 'less_than': return !isNaN(valNum) && !isNaN(targetNum) && valNum < targetNum;
        case 'is_empty': return !value || valStr === '';
        case 'is_not_empty': return !!value && valStr !== '';
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
                let isVisible = true;
                
                // 1. Visibility Logic (Legacy Pull)
                if (el.logic?.triggerId) {
                    const triggerEl = findElementById(elements, el.logic.triggerId);
                    if (triggerEl) {
                        const val = formData[triggerEl.name];
                        const matches = evaluateCondition(el.logic.condition, val, el.logic.value);
                        // If action is show: visible if matches. If action is hide: visible if NOT matches.
                        isVisible = el.logic.action === 'show' ? matches : !matches;
                    }
                }

                if (isVisible) {
                    visible.push(el.id);
                    
                    // 2. Data Logic Rules (Legacy Pull)
                    if (el.dataLogic?.rules) {
                        el.dataLogic.rules.forEach(rule => {
                            const triggerEl = findElementById(elements, rule.triggerId);
                            if (triggerEl) {
                                const val = formData[triggerEl.name];
                                const matches = evaluateCondition(rule.condition, val, rule.value);
                                if (matches) {
                                    let result: any = rule.result;
                                    if (rule.targetProperty === 'options' && typeof rule.result === 'string') {
                                        result = rule.result.split(',').map(s => s.trim());
                                    }
                                    overrides[el.id] = { ...overrides[el.id], [rule.targetProperty]: result };
                                }
                            }
                        });
                    }

                    // 3. Conditional Rules (Push Logic)
                    if (el.conditionalRules) {
                        const myVal = formData[el.name];
                        el.conditionalRules.forEach(rule => {
                            const matches = evaluateCondition(rule.condition, myVal, rule.matchValue);

                            if (matches) {
                                rule.actions.forEach(action => {
                                    action.targetIds.forEach(tId => {
                                        let finalValue = action.value;
                                        if (action.property === 'backgroundColor') {
                                             const targetEl = findElementById(elements, tId);
                                             const currentStyles = targetEl?.styles || {};
                                             overrides[tId] = { ...overrides[tId], styles: { ...currentStyles, backgroundColor: finalValue } };
                                        } else {
                                             overrides[tId] = { ...overrides[tId], [action.property]: finalValue };
                                        }
                                    });
                                });
                            }
                        });
                    }

                    // 4. Validation Logic (Accurate real-time check)
                    let myVal = formData[el.name]?.toString() || '';
                    let isInvalid = false;
                    let validationMsg = "Invalid value";

                    // Handle Dropdown Placeholders as "empty"
                    if (el.type === 'select' && el.hasPlaceholderOption && el.options && myVal === el.options[0]) {
                        myVal = '';
                    }

                    if (el.required && myVal === '') {
                        isInvalid = true;
                        validationMsg = "This field is required";
                    } else if (el.type === 'select' && el.prohibitedValues && el.prohibitedValues.includes(myVal)) {
                        isInvalid = true;
                        validationMsg = "This selection is prohibited";
                    } else if (el.validationLogic?.triggerId || el.validationLogic?.condition === 'regex') {
                        if (el.validationLogic?.condition === 'regex' && el.validationLogic.value) {
                             try {
                                 const regex = new RegExp(el.validationLogic.value);
                                 isInvalid = !regex.test(myVal);
                             } catch(e) { console.warn("Invalid regex pattern"); }
                        } else if (el.validationLogic?.triggerId) {
                            const triggerEl = findElementById(elements, el.validationLogic.triggerId);
                            if (triggerEl) {
                                const triggerVal = formData[triggerEl.name]?.toString() || '';
                                switch (el.validationLogic.condition) {
                                    case 'matches':
                                    case 'equals':
                                        isInvalid = myVal !== triggerVal;
                                        break;
                                    case 'not_equals':
                                        isInvalid = myVal === triggerVal;
                                        break;
                                    case 'contains':
                                        isInvalid = !myVal.includes(triggerVal);
                                        break;
                                    case 'greater_than':
                                        isInvalid = Number(myVal) <= Number(triggerVal);
                                        break;
                                    case 'less_than':
                                        isInvalid = Number(myVal) >= Number(triggerVal);
                                        break;
                                    // Reuse generic evaluator for others if applicable in future
                                }
                            }
                        }
                        validationMsg = el.validationLogic?.errorMessage || validationMsg;
                    }
                    
                    if (isInvalid && (myVal !== '' || el.required)) {
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
      
      let finalValue: any = value;
      if (type === 'checkbox') finalValue = checked;
      if (type === 'number' || type === 'range') finalValue = value === '' ? '' : Number(value);
      // Handle multiple select
      if (type === 'select-multiple') {
          const select = target as unknown as HTMLSelectElement;
          finalValue = Array.from(select.selectedOptions).map(opt => opt.value);
      }
      
      setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(errors).length === 0 && formRef.current?.reportValidity()) {
        alert("Success! Form data is valid and accurate.");
        console.log("Submitted Data:", formData);
    } else {
        alert("Please correct the errors in the form before submitting.");
    }
  };

  const renderElements = (list: FormElement[]) => {
      return list.map(el => {
          const isVisibleByPull = visibleElements.includes(el.id);
          const override = dynamicOverrides[el.id] || {};
          const isHiddenByPush = override.hidden === true;
          const isShownByPush = override.hidden === false;
          
          let finalVisible = isVisibleByPull;
          // Push logic (overrides) takes precedence for hiding
          if (isHiddenByPush) finalVisible = false;
          // Push logic takes precedence for showing (re-enabling visibility if it was hidden by Pull?)
          if (isShownByPush) finalVisible = true;
          
          if (!finalVisible) return null;

          return (
             <div key={el.id} className="relative w-full">
                <FormElementRenderer 
                    element={{ ...el, ...override }} 
                    preview={true}
                    error={errors[el.name] || null}
                >
                    {el.children && renderElements(el.children)}
                </FormElementRenderer>
                {errors[el.name] && (
                    <p className="text-red-500 text-[10px] mt-0.5 font-bold animate-pulse px-1">
                        {errors[el.name]}
                    </p>
                )}
             </div>
          );
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-brand-secondary">
          <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              <h2 className="text-xl font-bold text-brand-text">Interactive Preview</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-grow bg-white custom-scrollbar">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" onChange={handleInputChange}>
                {renderElements(elements)}
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button type="submit" className="px-8 py-3 bg-brand-primary text-white rounded-md font-bold hover:bg-brand-accent shadow-md transition-all active:scale-95">
                        Submit and Verify
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;