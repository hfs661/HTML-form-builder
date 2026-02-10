import React, { useState } from 'react';
import type { FormElement } from '../types';

interface FormElementRendererProps {
  element: FormElement;
  isEditing?: boolean;
  onStartEditing?: (id: string) => void;
  onStopEditing?: () => void;
  onUpdate?: (id: string, updatedProps: Partial<FormElement>) => void;
  preview?: boolean;
  children?: React.ReactNode;
  errorMessage?: string;
}

const sizeClasses: Record<string, string> = {
  small: 'px-3 py-2 text-[12px]',
  medium: 'px-4 py-3 text-sm',
  large: 'px-5 py-4 text-base',
};

const FormElementRenderer: React.FC<FormElementRendererProps> = ({ element, isEditing, onStopEditing, onUpdate, preview = false, children, errorMessage }) => {
  const { 
    id = '', 
    type, 
    label = '', 
    placeholder, 
    options, 
    required, 
    name = '', 
    styles, 
    disabled, 
    hidden,
    src, 
    textContent, 
    headingLevel, 
    multiple, 
    ariaLabel, 
    ariaRole,
    ariaLive,
    ariaDescribedBy,
    testId,
    defaultValue,
    colSpan
  } = element;
  
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  const isRequired = !!required;
  const currentSize = styles?.size || 'medium';
  const sizeClass = sizeClasses[currentSize];
  
  // Base styling for consistency across all standard inputs
  const inputBaseClasses = `
    w-full 
    border border-gray-200 
    rounded-xl 
    outline-none 
    transition-all 
    duration-200
    shadow-sm
    ${preview ? 'focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:shadow-md' : 'pointer-events-none'} 
    ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700'}
    ${errorMessage ? 'border-red-500 bg-red-50/30 ring-red-500/10' : ''}
  `.trim().replace(/\s+/g, ' ');

  // Common accessibility props
  const commonProps = {
    'aria-label': ariaLabel || label,
    'aria-required': isRequired,
    'aria-invalid': !!errorMessage,
    'aria-describedby': errorMessage ? `${id}-error ${ariaDescribedBy || ''}`.trim() : ariaDescribedBy,
    'role': ariaRole,
    'aria-live': ariaLive,
    'data-testid': testId,
  };

  const appearanceStyle: React.CSSProperties = {
    color: styles?.textColor,
    backgroundColor: styles?.backgroundColor,
    width: styles?.width,
    height: styles?.height,
    padding: styles?.padding,
    margin: styles?.margin,
    borderRadius: styles?.borderRadius,
    borderColor: styles?.borderColor,
    borderWidth: styles?.borderWidth,
    borderStyle: styles?.borderStyle,
    textAlign: styles?.textAlign,
    display: styles?.display,
    flexDirection: styles?.flexDirection,
    gap: styles?.gap,
    justifyContent: styles?.justifyContent,
    alignItems: styles?.alignItems,
    flexBasis: styles?.flexBasis || (type === 'bootstrap-col' ? `${(colSpan || 12) / 12 * 100}%` : undefined),
    flexGrow: styles?.flexGrow ?? (type === 'bootstrap-col' ? 0 : undefined),
    maxWidth: styles?.maxWidth || (type === 'bootstrap-col' ? `${(colSpan || 12) / 12 * 100}%` : undefined),
    opacity: (hidden && !preview) ? 0.4 : 1,
  };

  if (hidden && preview) return null;

  const renderLabel = (targetId?: string) => (
    <div className="mb-2 flex items-center justify-between">
      <label 
        htmlFor={targetId} 
        id={`${id}-label`}
        className={`block text-[11px] font-bold uppercase tracking-widest ${errorMessage ? 'text-red-600' : 'text-gray-500'}`}
      >
        {isEditing ? (
          <input 
            autoFocus 
            className="border-b-2 border-brand-primary outline-none bg-transparent w-full" 
            value={label} 
            onChange={e => onUpdate?.(id, { label: e.target.value })} 
            onBlur={onStopEditing}
            aria-label="Edit label text"
          />
        ) : label || (preview ? '' : '(No Label)')}
        {isRequired && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
      {hidden && !preview && (
        <span className="text-[9px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 uppercase tracking-tighter">
          Hidden by Default
        </span>
      )}
    </div>
  );

  switch (type) {
    case 'bootstrap-row':
      return (
        <section 
          className={`w-full relative flex flex-wrap transition-all duration-300 ${preview ? '' : 'p-2 border border-dashed border-blue-200 rounded-xl bg-blue-50/5 mb-4'}`} 
          style={{ ...appearanceStyle, display: 'flex', flexWrap: 'wrap' }}
          {...commonProps}
        >
           {!preview && <span className="text-[9px] font-black text-blue-400/50 uppercase absolute top-0 left-2 select-none pointer-events-none z-0">Bootstrap Row</span>}
           {children}
        </section>
      );

    case 'bootstrap-col':
      return (
        <div 
          className={`relative transition-all duration-300 ${preview ? '' : 'p-2 border border-dotted border-gray-300 rounded-lg hover:bg-gray-50/50'}`} 
          style={{ ...appearanceStyle, minHeight: !preview ? '40px' : undefined }}
          {...commonProps}
        >
           {!preview && <span className="text-[8px] font-bold text-gray-300 uppercase absolute top-0 left-1 select-none pointer-events-none">{colSpan || 12}/12</span>}
           {children}
        </div>
      );

    case 'container':
      return (
        <div 
          role={ariaRole || 'region'} 
          aria-labelledby={label ? `${id}-label` : undefined}
          className={`w-full relative transition-all duration-300 ${preview ? '' : 'p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/10'}`} 
          style={appearanceStyle} 
          {...commonProps}
        >
           {!preview && label && renderLabel()}
           {!preview && !label && <span className="text-[10px] font-bold text-gray-300 uppercase absolute top-2 left-4 select-none pointer-events-none">{type}</span>}
           {children}
        </div>
      );

    case 'accordion':
      return (
        <div className={`w-full border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white mb-4 transition-all duration-300`} style={appearanceStyle} {...commonProps}>
          <button 
            type="button"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full flex items-center justify-between p-5 bg-gray-50/50 hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary"
            aria-expanded={isAccordionOpen}
            aria-controls={`${id}-content`}
          >
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-3 ${isAccordionOpen ? 'bg-brand-primary shadow-sm' : 'bg-gray-300'}`}></span>
              {label}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isAccordionOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div id={`${id}-content`} role="region" className={`transition-all duration-300 ease-in-out ${isAccordionOpen ? 'max-h-[2000px] opacity-100 p-6 border-t border-gray-100' : 'max-h-0 opacity-0 overflow-hidden p-0'}`}>
            {children}
          </div>
        </div>
      );

    case 'text':
    case 'date':
    case 'number':
      const inputId = `${id}-input`;
      return (
        <div className="w-full" style={appearanceStyle}>
          {renderLabel(inputId)}
          <input 
            id={inputId}
            type={type} 
            name={name} 
            placeholder={placeholder} 
            disabled={disabled} 
            defaultValue={defaultValue}
            className={`${inputBaseClasses} ${sizeClass}`} 
            style={appearanceStyle} 
            {...commonProps} 
          />
        </div>
      );

    case 'textarea':
      const textareaId = `${id}-textarea`;
      return (
        <div className="w-full" style={appearanceStyle}>
          {renderLabel(textareaId)}
          <textarea 
            id={textareaId}
            name={name} 
            placeholder={placeholder} 
            disabled={disabled} 
            rows={4} 
            defaultValue={defaultValue}
            className={`${inputBaseClasses} ${sizeClass} resize-none`} 
            style={appearanceStyle} 
            {...commonProps} 
          />
        </div>
      );

    case 'select':
      const selectId = `${id}-select`;
      return (
        <div className="w-full" style={appearanceStyle}>
          {renderLabel(selectId)}
          <select 
            id={selectId}
            name={name} 
            disabled={disabled} 
            multiple={multiple} 
            defaultValue={defaultValue}
            className={`${inputBaseClasses} ${sizeClass} cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-right-4 bg-no-repeat`} 
            style={appearanceStyle} 
            {...commonProps}
          >
            {options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
          </select>
        </div>
      );

    case 'button':
    case 'reset-button':
      return (
        <button 
          type={type === 'reset-button' ? 'reset' : 'button'} 
          className={`
            font-black rounded-2xl shadow-elevated transition-all active:scale-95 outline-none focus:ring-4 focus:ring-brand-primary/20 
            ${sizeClass} 
            ${type === 'button' ? 'bg-brand-primary text-white hover:bg-brand-accent hover:shadow-lg' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}
          `} 
          style={appearanceStyle} 
          {...commonProps}
        >
          {label}
        </button>
      );

    case 'checkbox':
      return (
        <div className={`flex items-center space-x-4 py-3 cursor-pointer group rounded-xl px-2 hover:bg-gray-50 transition-colors ${errorMessage ? 'bg-red-50/50' : ''}`} style={appearanceStyle}>
          <div className="relative flex items-center">
            <input 
              type="checkbox" 
              name={name} 
              id={id} 
              disabled={disabled} 
              defaultChecked={defaultValue === 'true' || defaultValue === label}
              className={`w-6 h-6 rounded-lg border-2 border-gray-200 text-brand-primary focus:ring-brand-primary transition-all cursor-pointer ${preview ? '' : 'pointer-events-none'}`} 
              {...commonProps} 
            />
          </div>
          <label htmlFor={id} className={`text-sm font-bold select-none cursor-pointer transition-colors ${disabled ? 'text-gray-400' : 'text-gray-700 group-hover:text-brand-primary'}`}>{label}</label>
        </div>
      );

    case 'radio':
      return (
        <fieldset className={`w-full border-none p-0 m-0 ${errorMessage ? 'bg-red-50/20 p-4 rounded-2xl' : ''}`} style={appearanceStyle} {...commonProps}>
          <legend className="mb-3 block text-[11px] font-extrabold text-gray-500 uppercase tracking-widest">{label}</legend>
          {/* Fix: Specifically use styles.orientation to avoid comparison with global window.orientation (which is a number) */}
          <div className={`flex ${styles?.orientation === 'vertical' ? 'flex-col space-y-3' : 'flex-row flex-wrap gap-6'}`}>
            {options?.map((opt, i) => (
              <div key={i} className="flex items-center cursor-pointer group">
                <input 
                  type="radio" 
                  name={preview ? name : `${name}-${id}`} 
                  id={`${id}-${i}`} 
                  disabled={disabled} 
                  value={opt}
                  defaultChecked={defaultValue === opt}
                  className={`appearance-none w-6 h-6 border-2 border-gray-200 rounded-full checked:border-brand-primary checked:border-[6px] transition-all cursor-pointer ${preview ? '' : 'pointer-events-none'} focus:ring-4 focus:ring-brand-primary/10`} 
                />
                <label 
                  htmlFor={`${id}-${i}`} 
                  className={`ml-3 text-sm font-bold transition-colors cursor-pointer select-none ${disabled ? 'text-gray-400' : 'text-gray-700 group-hover:text-brand-primary'}`}
                >
                  {opt}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      );

    case 'progress':
      return (
        <div className="w-full" style={appearanceStyle} {...commonProps} role="progressbar" aria-valuenow={45} aria-valuemin={0} aria-valuemax={100}>
          {renderLabel()}
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200">
            <div className="h-full bg-brand-primary transition-all duration-700 ease-out shadow-sm" style={{ width: '45%' }}></div>
          </div>
        </div>
      );

    case 'typography':
      const TypographyTag = (headingLevel || 'p') as any;
      const typographyStyles: any = {
        h1: 'text-4xl font-black mb-6 tracking-tighter text-gray-900',
        h2: 'text-3xl font-black mb-4 tracking-tighter text-gray-800',
        h3: 'text-2xl font-extrabold mb-3 tracking-tight text-gray-800',
        h4: 'text-xl font-bold mb-2 text-gray-700',
        p: 'text-base text-gray-600 leading-relaxed font-medium',
      };
      return <div className="w-full" style={appearanceStyle} {...commonProps}><TypographyTag className={typographyStyles[TypographyTag] || typographyStyles.p}>{textContent || (preview ? '' : 'Double click to edit text content')}</TypographyTag></div>;

    default:
      return (
        <div className="p-4 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-xl border border-dashed border-gray-200 flex items-center justify-center italic">
          {type} Component Placeholder
        </div>
      );
  }
};

export default FormElementRenderer;