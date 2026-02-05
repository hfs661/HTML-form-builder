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
  small: 'px-2 py-1.5 text-[11px]',
  medium: 'px-3 py-2 text-sm',
  large: 'px-4 py-3 text-base',
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
  const orientation = styles?.orientation || 'vertical';

  const calculateColBasis = (span?: number) => {
    if (!span) return '100%';
    return `${(span / 12) * 100}%`;
  };

  const appearanceStyle: React.CSSProperties = {
    color: styles?.textColor,
    backgroundColor: styles?.backgroundColor,
    width: styles?.width,
    height: styles?.height,
    padding: styles?.padding,
    margin: styles?.margin,
    marginTop: styles?.marginTop,
    marginBottom: styles?.marginBottom,
    marginLeft: styles?.marginLeft,
    marginRight: styles?.marginRight,
    borderRadius: styles?.borderRadius,
    borderColor: styles?.borderColor,
    borderWidth: styles?.borderWidth,
    borderTopWidth: styles?.borderTopWidth,
    borderRightWidth: styles?.borderRightWidth,
    borderBottomWidth: styles?.borderBottomWidth,
    borderLeftWidth: styles?.borderLeftWidth,
    borderStyle: styles?.borderStyle,
    textAlign: styles?.textAlign,
    zIndex: styles?.zIndex,
    display: styles?.display,
    flexDirection: styles?.flexDirection,
    gap: styles?.gap,
    rowGap: styles?.rowGap,
    columnGap: styles?.columnGap,
    justifyContent: styles?.justifyContent,
    alignItems: styles?.alignItems,
    flexWrap: styles?.flexWrap,
    flexBasis: styles?.flexBasis || (type === 'bootstrap-col' ? calculateColBasis(colSpan) : undefined),
    flexGrow: styles?.flexGrow ?? (type === 'bootstrap-col' ? 0 : undefined),
    flexShrink: styles?.flexShrink ?? (type === 'bootstrap-col' ? 0 : undefined),
    maxWidth: styles?.maxWidth || (type === 'bootstrap-col' ? calculateColBasis(colSpan) : undefined),
    gridTemplateColumns: styles?.gridTemplateColumns,
  };

  const inputBaseClasses = `w-full border border-gray-200 rounded-lg outline-none transition-all shadow-sm ${preview ? 'focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary' : 'pointer-events-none'} ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-white'}`;

  const renderLabel = (targetId?: string) => (
    <div className="mb-1.5 flex items-center justify-between">
      <label htmlFor={targetId} className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
        {isEditing ? (
          <input 
            autoFocus 
            className="border-b-2 border-brand-primary outline-none bg-transparent" 
            value={label} 
            onChange={e => onUpdate?.(id, { label: e.target.value })} 
            onBlur={onStopEditing}
            aria-label="Edit label"
          />
        ) : label}
        {isRequired && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </label>
    </div>
  );

  const errorId = `${id}-error`;
  const commonProps = {
    'aria-label': ariaLabel || label,
    'aria-required': isRequired,
    'aria-invalid': !!errorMessage,
    'aria-describedby': errorMessage ? `${errorId} ${ariaDescribedBy || ''}`.trim() : ariaDescribedBy,
    'role': ariaRole,
    'aria-live': ariaLive,
    'data-testid': testId,
  };

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
          className={`w-full relative transition-all duration-300 ${preview ? '' : 'p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/10'}`} 
          style={appearanceStyle} 
          {...commonProps}
        >
           {!preview && <span className="text-[10px] font-bold text-gray-300 uppercase absolute top-2 left-4 select-none pointer-events-none">{type}</span>}
           {children}
        </div>
      );

    case 'accordion':
      return (
        <div className={`w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white mb-4 transition-all duration-300`} style={appearanceStyle} {...commonProps}>
          <button 
            type="button"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary"
            aria-expanded={isAccordionOpen}
            aria-controls={`${id}-content`}
          >
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-3 ${isAccordionOpen ? 'bg-brand-primary' : 'bg-gray-300'}`}></span>
              {label}
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isAccordionOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div id={`${id}-content`} role="region" className={`transition-all duration-300 ease-in-out ${isAccordionOpen ? 'max-h-[2000px] opacity-100 p-4 border-t border-gray-100' : 'max-h-0 opacity-0 overflow-hidden p-0'}`}>
            {children}
          </div>
        </div>
      );

    case 'typography':
      const Tag = (headingLevel || 'p') as any;
      const tagStyles: any = {
        h1: 'text-4xl font-extrabold mb-4 tracking-tight',
        h2: 'text-3xl font-bold mb-3 tracking-tight',
        h3: 'text-2xl font-bold mb-2',
        h4: 'text-xl font-bold mb-2',
        p: 'text-base text-gray-600 leading-relaxed',
      };
      return <div className="w-full" style={appearanceStyle} {...commonProps}><Tag className={tagStyles[Tag] || tagStyles.p}>{textContent || 'Type something here...'}</Tag></div>;

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
            className={`${inputBaseClasses} ${sizeClass}`} 
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
            className={`${inputBaseClasses} ${sizeClass} cursor-pointer`} 
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
          className={`font-bold rounded-lg shadow-sm transition-all active:scale-95 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${sizeClass} ${type === 'button' ? 'bg-brand-primary text-white hover:bg-brand-accent' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`} 
          style={appearanceStyle} 
          {...commonProps}
        >
          {label}
        </button>
      );

    case 'checkbox':
      return (
        <div className="flex items-center space-x-3 py-2 cursor-pointer group" style={appearanceStyle}>
          <input 
            type="checkbox" 
            name={name} 
            id={id} 
            disabled={disabled} 
            defaultChecked={defaultValue === 'true' || defaultValue === label}
            className={`w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-all cursor-pointer ${preview ? '' : 'pointer-events-none'}`} 
            {...commonProps} 
          />
          <label htmlFor={id} className="text-sm font-semibold text-gray-700 cursor-pointer select-none group-hover:text-brand-primary transition-colors">{label}</label>
        </div>
      );

    case 'radio':
      return (
        <fieldset className="w-full border-none p-0 m-0" style={appearanceStyle} {...commonProps}>
          <legend className="mb-1.5 block text-[11px] font-bold text-gray-600 uppercase tracking-wider">{label}</legend>
          <div className={`mt-2 flex ${orientation === 'vertical' ? 'flex-col space-y-3' : 'flex-row flex-wrap gap-6'}`}>
            {options?.map((opt, i) => (
              <div key={i} className="flex items-center cursor-pointer group">
                <input 
                  type="radio" 
                  name={preview ? name : `${name}-${id}`} 
                  id={`${id}-${i}`} 
                  disabled={disabled} 
                  value={opt}
                  defaultChecked={defaultValue === opt}
                  className={`appearance-none w-5 h-5 border-2 border-gray-200 rounded-full checked:border-brand-primary checked:border-[6px] transition-all cursor-pointer ${preview ? '' : 'pointer-events-none'} focus:ring-2 focus:ring-brand-primary/20 focus:ring-offset-2`} 
                />
                <label 
                  htmlFor={`${id}-${i}`} 
                  className={`ml-3 text-sm font-semibold transition-colors cursor-pointer select-none ${disabled ? 'text-gray-400' : 'text-gray-700 group-hover:text-brand-primary'}`}
                >
                  {opt}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      );

    case 'image':
      return <img src={src || 'https://images.unsplash.com/photo-1481487196290-c152efe083f5?auto=format&fit=crop&q=80&w=800'} className="w-full h-auto rounded-xl object-cover shadow-panel border border-gray-100 transition-all duration-300" style={appearanceStyle} alt={ariaLabel || label} {...commonProps} />;

    case 'divider':
      return <hr className="border-t border-gray-200 my-4 transition-all duration-300" style={appearanceStyle} role="presentation" {...commonProps} />;

    case 'progress':
      return (
        <div className="w-full" style={appearanceStyle} {...commonProps} role="progressbar" aria-valuenow={45} aria-valuemin={0} aria-valuemax={100}>
          {renderLabel()}
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: '45%' }}></div>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 bg-gray-50 text-gray-400 text-xs rounded-lg border border-dashed border-gray-200 flex items-center justify-center italic">
          Placeholder for {type}
        </div>
      );
  }
};

export default FormElementRenderer;