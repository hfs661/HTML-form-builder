
import React from 'react';
import type { FormElement } from '../types';

interface FormElementRendererProps {
  element: FormElement;
  isEditing?: boolean;
  onStartEditing?: (id: string) => void;
  onStopEditing?: () => void;
  onUpdate?: (id: string, updatedProps: Partial<FormElement>) => void;
}

const sizeClasses: Record<string, string> = {
  small: 'p-1 text-sm rounded-sm',
  medium: 'p-2 text-base rounded-md',
  large: 'p-3 text-lg rounded-lg',
};
const buttonSizeClasses: Record<string, string> = {
  small: 'px-3 py-1 text-sm rounded-sm',
  medium: 'px-4 py-2 text-base rounded-md',
  large: 'px-6 py-3 text-lg rounded-lg',
};

const checkboxRadioSizeClasses: Record<string, string> = {
  small: 'h-3 w-3',
  medium: 'h-4 w-4',
  large: 'h-5 w-5',
};


const buttonColorClasses: Record<string, string> = {
  primary: 'bg-brand-primary hover:bg-brand-accent text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

const FormElementRenderer: React.FC<FormElementRendererProps> = ({ element, isEditing, onStartEditing, onStopEditing, onUpdate }) => {
  const { id, type, label, placeholder, options, required, name, subType, styles, disabled } = element;

  const currentSize = styles?.size || 'medium';
  const sizeClass = sizeClasses[currentSize];
  const disabledClass = disabled ? 'opacity-50' : '';

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate?.(id, { label: e.target.value });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onStopEditing?.();
      e.preventDefault();
    }
  };

  const handleBlur = () => {
    onStopEditing?.();
  };

  const EditableLabel = ({ forCheckboxOrRadio = false }: { forCheckboxOrRadio?: boolean }) => {
    const commonInputClass = "w-full p-0 border-0 border-b-2 border-brand-primary focus:ring-0 focus:outline-none bg-transparent text-sm font-medium";
    const textColorClass = forCheckboxOrRadio ? 'text-gray-900' : 'text-gray-700';

    if (isEditing) {
      return (
        <input
          type="text"
          value={label}
          onChange={handleLabelChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          autoFocus
          className={`${commonInputClass} ${textColorClass}`}
          onClick={(e) => e.stopPropagation()}
        />
      );
    }
    const labelText = `${label}${required ? ' *' : ''}`;
    return (
      <span onDoubleClick={(e) => { e.stopPropagation(); onStartEditing?.(id); }}>
        {labelText}
      </span>
    );
  };

  switch (type) {
    case 'text':
      return (
        <div className="w-full">
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type={subType || 'text'} id={name} name={name} placeholder={placeholder} disabled={disabled} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary pointer-events-none ${sizeClass} ${disabledClass}`} />
        </div>
      );
    case 'textarea':
      return (
        <div className="w-full">
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <textarea id={name} name={name} placeholder={placeholder} rows={4} disabled={disabled} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary pointer-events-none ${sizeClass} ${disabledClass}`}></textarea>
        </div>
      );
    case 'select':
      return (
        <div className="w-full">
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <select id={name} name={name} disabled={disabled} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary pointer-events-none ${sizeClass} ${disabledClass}`}>
            {options?.map((option, index) => <option key={index} value={option}>{option}</option>)}
          </select>
        </div>
      );
    case 'checkbox':
      return (
        <div className="flex items-center">
          <input id={name} name={name} type="checkbox" disabled={disabled} className={`text-brand-primary border-gray-300 rounded focus:ring-brand-primary pointer-events-none ${checkboxRadioSizeClasses[currentSize]} ${disabledClass}`} />
          <label htmlFor={name} className="ml-2 block text-sm text-gray-900"><EditableLabel forCheckboxOrRadio={true} /></label>
        </div>
      );
    case 'radio':
      return (
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <div className="pointer-events-none">
            {options?.map((option, index) => (
              <div key={index} className="flex items-center mt-1">
                <input id={`${name}-${index}`} name={name} type="radio" disabled={disabled} className={`text-brand-primary border-gray-300 focus:ring-brand-primary ${checkboxRadioSizeClasses[currentSize]} ${disabledClass}`} />
                <label htmlFor={`${name}-${index}`} className="ml-2 block text-sm text-gray-900">{option}</label>
              </div>
            ))}
          </div>
        </div>
      );
    case 'date':
      return (
        <div className="w-full">
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="date" id={name} name={name} disabled={disabled} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary pointer-events-none ${sizeClass} ${disabledClass}`} />
        </div>
      );
    case 'number':
      return (
        <div className="w-full">
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="number" id={name} name={name} placeholder={placeholder} disabled={disabled} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary pointer-events-none ${sizeClass} ${disabledClass}`} />
        </div>
      );
    case 'range':
      return (
        <div className="w-full">
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="range" id={name} name={name} disabled={disabled} className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer pointer-events-none ${disabledClass}`} />
        </div>
      );
    case 'file':
      return (
        <div className="w-full">
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="file" id={name} name={name} disabled={disabled} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100 pointer-events-none ${sizeClass.replace('p-2', '')} ${disabledClass}`} />
        </div>
      );
    case 'color':
      return (
        <div className="w-full">
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="color" id={name} name={name} disabled={disabled} className={`w-full h-10 border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary pointer-events-none ${disabledClass}`} defaultValue="#0078D4" />
        </div>
      );
    case 'button':
      const buttonColorClass = buttonColorClasses[styles?.color || 'primary'];
      const buttonSizeClass = buttonSizeClasses[currentSize];
      const buttonDisabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';
      if (isEditing) {
        return (
          <input
            type="text"
            value={label}
            onChange={handleLabelChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            autoFocus
            className={`w-full text-center text-brand-text font-semibold border-2 border-brand-primary focus:ring-0 focus:outline-none ${buttonColorClass} ${buttonSizeClass}`}
            onClick={(e) => e.stopPropagation()}
          />
        )
      }
      return <button onDoubleClick={(e) => { e.stopPropagation(); onStartEditing?.(id); }} type="button" disabled={disabled} className={`font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${buttonColorClass} ${buttonSizeClass} ${buttonDisabledClass}`}>{label}</button>;
    default:
      return <div>Unsupported element type</div>;
  }
};

export default FormElementRenderer;