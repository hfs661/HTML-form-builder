
import React, { useState, useEffect } from 'react';
import type { FormElement, ElementStyle } from '../types';

interface FormElementRendererProps {
  element: FormElement;
  isEditing?: boolean;
  onStartEditing?: (id: string) => void;
  onStopEditing?: () => void;
  onUpdate?: (id: string, updatedProps: Partial<FormElement>) => void;
  preview?: boolean;
  hidden?: boolean;
  forceRequired?: boolean; // New prop for conditional validation
  children?: React.ReactNode; // Support nested children
}

const sizeClasses: Record<string, string> = {
  small: 'px-2 py-1 text-sm',
  medium: 'px-3 py-2 text-base',
  large: 'px-4 py-3 text-lg',
};

const checkboxRadioSizeClasses: Record<string, string> = {
  small: 'h-3 w-3',
  medium: 'h-4 w-4',
  large: 'h-5 w-5',
};

// Simple mask helper
const applyMask = (value: string, mask: string) => {
    let i = 0;
    let valIndex = 0;
    let result = '';
    const rawValue = value.replace(/[^a-zA-Z0-9]/g, ''); // strip to alphanumeric

    while (i < mask.length && valIndex < rawValue.length) {
        const maskChar = mask[i];
        const valChar = rawValue[valIndex];
        
        if (maskChar === '9') {
            if (/\d/.test(valChar)) {
                result += valChar;
                valIndex++;
            } else {
                break; // Invalid char for mask
            }
        } else if (maskChar === 'a') {
            if (/[a-zA-Z]/.test(valChar)) {
                result += valChar;
                valIndex++;
            } else {
                break;
            }
        } else if (maskChar === '*') {
             result += valChar;
             valIndex++;
        } else {
            // Literal char in mask
            result += maskChar;
            if (valChar === maskChar) {
                valIndex++; // consume if it matched
            }
        }
        i++;
    }
    return result;
};


const FormElementRenderer: React.FC<FormElementRendererProps> = ({ element, isEditing, onStartEditing, onStopEditing, onUpdate, preview = false, hidden = false, forceRequired, children }) => {
  if (hidden && element.type !== 'script') return null;

  const { id, type, label, placeholder, options, required, name, subType, styles, disabled, src, rowCount, headers, links, brand, newsTitle, newsContent, newsImage, minLength, maxLength, min, max, step, pattern, scriptContent, htmlContent, textContent, headingLevel, altText, inputMask, customErrorMessage } = element;
  
  // Determine if required: override takes precedence if defined (for preview logic), otherwise fall back to static prop
  const isRequired = forceRequired !== undefined ? forceRequired : required;

  // Local state for value in preview mode to handle masking 'controlled' input behavior
  const [internalValue, setInternalValue] = useState('');
  // Local state for focus tracking
  const [isFocused, setIsFocused] = useState(false);

  // Execute Script in Preview Mode
  useEffect(() => {
      if (preview && type === 'script' && scriptContent) {
          try {
              const timer = setTimeout(() => {
                  const func = new Function(scriptContent);
                  func();
              }, 100);
              return () => clearTimeout(timer);
          } catch (e) {
              console.error(`Error executing script for element ${label}:`, e);
          }
      }
  }, [preview, type, scriptContent, label]);

  // Style Logic Extraction
  // We need to separate layout styles (applied to wrapper in Canvas) from appearance styles (applied to element here).
  // If preview=true, we apply EVERYTHING here.
  // If preview=false, layout styles are handled by Canvas wrapper, so we force width/height 100% to fill wrapper.
  
  const getCombinedStyles = (isLayout: boolean): React.CSSProperties => {
      const s = styles || {};
      if (isLayout) {
          return {
              width: s.width,
              height: s.height,
              gridColumn: s.gridColumn,
              gridRow: s.gridRow,
              flexGrow: s.flexGrow ? Number(s.flexGrow) : undefined,
              flexShrink: s.flexShrink ? Number(s.flexShrink) : undefined,
              flexBasis: s.flexBasis,
              alignSelf: s.alignSelf,
              // Layout container props (if this element IS a container)
              display: s.display, // block, flex, grid
              flexDirection: s.flexDirection,
              justifyContent: s.justifyContent,
              alignItems: s.alignItems,
              flexWrap: s.flexWrap,
              gridTemplateColumns: s.gridTemplateColumns,
              gridTemplateRows: s.gridTemplateRows,
              gap: s.gap,
          };
      } else {
          // Appearance
          return {
              fontFamily: s.fontFamily === 'mono' ? 'monospace' : s.fontFamily === 'serif' ? 'serif' : 'inherit',
              fontWeight: s.fontWeight || 'normal',
              backgroundColor: s.backgroundColor || 'transparent',
              borderColor: isFocused && s.focusBorderColor ? s.focusBorderColor : s.borderColor,
              borderWidth: s.borderWidth,
              borderRadius: s.borderRadius,
              padding: s.padding,
              color: s.textColor,
              textAlign: s.textAlign || 'left',
              letterSpacing: s.letterSpacing,
              lineHeight: s.lineHeight,
              textDecoration: s.textDecoration,
              boxShadow: isFocused && s.focusBoxShadow ? s.focusBoxShadow : s.boxShadow,
          };
      }
  };

  const layoutStyles = getCombinedStyles(true);
  const appearanceStyles = getCombinedStyles(false);
  
  const containerStyle: React.CSSProperties = preview ? {
      ...layoutStyles,
      ...appearanceStyles,
      position: 'relative' // Needed for offset calculations sometimes
  } : {
      ...appearanceStyles,
      width: '100%',
      height: '100%', // Fill the canvas wrapper
      // In edit mode, grid/flex item props are on the wrapper, so we ignore them here
      display: layoutStyles.display, // But internal display (flex/grid) MUST be preserved if it's a container
      flexDirection: layoutStyles.flexDirection,
      justifyContent: layoutStyles.justifyContent,
      alignItems: layoutStyles.alignItems,
      flexWrap: layoutStyles.flexWrap,
      gridTemplateColumns: layoutStyles.gridTemplateColumns,
      gridTemplateRows: layoutStyles.gridTemplateRows,
      gap: layoutStyles.gap,
  };

  // Special handling: If element is NOT a container type, 'display' prop in styles usually refers to container behavior. 
  // Standard inputs (text, select) are block or inline-block. 
  // We generally enforce block for inputs in this builder for simplicity, unless customized.
  
  const currentSize = styles?.size || 'medium';
  const sizeClass = sizeClasses[currentSize];
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const pointerEvents = preview ? '' : 'pointer-events-none';
  
  // Input specific style (excludes container layout props)
  const inputStyle: React.CSSProperties = { 
      ...appearanceStyles, 
      width: '100%', 
      height: type === 'container' || type === 'iframe' || type === 'image' ? '100%' : styles?.height 
  }; 
  
  // Masking Handler
  const handleMaskedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!inputMask) return;
      
      const val = e.target.value;
      const masked = applyMask(val, inputMask);
      setInternalValue(masked);
      e.target.value = masked; // force update
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
      setIsFocused(false);
      onStopEditing?.();
  };


  // Handle input change for label editing
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate?.(id, { label: e.target.value });
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onStopEditing?.();
      e.preventDefault();
    }
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
    const labelText = `${label}${isRequired ? ' *' : ''}`;
    return (
      <span onDoubleClick={(e) => { if (!preview) { e.stopPropagation(); onStartEditing?.(id); } }}>
        {labelText}
      </span>
    );
  };
  
  const AccordionComponent = () => {
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <div className="w-full border rounded-md overflow-hidden" style={containerStyle}>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
                aria-expanded={isOpen}
            >
                <div className="font-medium text-gray-700"><EditableLabel /></div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-200">
                    {children}
                    {!children && preview && <div className="text-xs text-gray-400 italic">Empty Accordion</div>}
                </div>
            )}
        </div>
      );
  }

  // News Card Logic
  const NewsCardComponent = () => {
      const [expanded, setExpanded] = useState(false);
      const displayImage = (newsImage && newsImage.trim() !== '') ? newsImage : "https://via.placeholder.com/600x300?text=Latest+News";
      return (
          <div className={`border rounded-lg overflow-hidden shadow-sm bg-white ${pointerEvents}`} style={containerStyle}>
              <img src={displayImage} alt={newsTitle || "News"} className="w-full h-48 object-cover" />
              <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: styles?.fontFamily, color: styles?.textColor }}>{newsTitle}</h3>
                  <div className={`text-gray-600 text-sm mb-4 transition-all ${expanded ? '' : 'line-clamp-2'}`}>{newsContent}</div>
                   <button type="button" onClick={() => setExpanded(!expanded)} className="text-brand-primary text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-brand-primary rounded p-1">
                          {expanded ? 'Read Less' : 'Read More'}
                   </button>
              </div>
          </div>
      );
  };
  
  // Shared props for validation and a11y
  const validationProps = {
      required: isRequired,
      minLength,
      maxLength,
      min: min as string | number,
      max: max as string | number,
      step: step,
      pattern: pattern,
      'aria-required': isRequired,
      'aria-invalid': false, 
      title: customErrorMessage || (inputMask ? `Format: ${inputMask}` : undefined),
      onFocus: handleFocus,
      onBlur: handleBlur
  };
  
  if (customErrorMessage) {
      // @ts-ignore
      validationProps['data-custom-error'] = customErrorMessage;
  }

  switch (type) {
    case 'html-block':
        return htmlContent || preview ? <div className="w-full" style={containerStyle} dangerouslySetInnerHTML={{ __html: htmlContent || '' }} /> : <div className="w-full p-4 border border-dashed border-gray-400 bg-gray-50 text-gray-500 text-center text-sm rounded">HTML Block</div>;
    case 'divider':
        return <hr className="w-full border-t my-2" style={{ borderColor: styles?.borderColor || '#e5e7eb', borderWidth: styles?.borderWidth || '1px' }} />;
    case 'image':
         return (
            <div className="w-full" style={containerStyle}>
                <img 
                    src={src || "https://via.placeholder.com/300x200?text=Image+Placeholder"} 
                    alt={altText || label} 
                    className={`max-w-full h-auto ${pointerEvents}`}
                    style={{...appearanceStyles, width: '100%', height: '100%', objectFit: 'cover'}}
                />
            </div>
         );
    case 'typography':
        const Tag = (headingLevel || 'p') as React.ElementType;
        const textClasses = { h1: 'text-4xl font-bold mb-4', h2: 'text-3xl font-bold mb-3', h3: 'text-2xl font-bold mb-3', h4: 'text-xl font-bold mb-2', h5: 'text-lg font-bold mb-2', h6: 'text-base font-bold mb-2', p: 'text-base mb-2', span: 'text-base' };
        return <div style={containerStyle} className="w-full"><Tag className={`${textClasses[headingLevel || 'p']}`} style={appearanceStyles}>{textContent || (isEditing ? '' : 'Double click to edit text')}</Tag></div>;
    case 'script':
        if (preview) return null;
        return <div className="w-full p-3 border border-yellow-400 bg-yellow-50 rounded-md flex items-center shadow-sm">Script Element</div>;
    case 'container':
        // Default stack class only if display is not set or block. Increased spacing.
        const defaultStackClass = (!styles?.display || styles.display === 'block') ? 'space-y-4' : '';
        const borderClass = preview ? '' : 'border border-dashed border-gray-300 rounded-md min-h-[50px]';

        return (
            <div className={`w-full ${borderClass} ${defaultStackClass} p-4`} style={containerStyle}>
                {!preview && <div className="mb-2"><label className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label></div>}
                {children}
            </div>
        );
    case 'accordion': return <AccordionComponent />;
    case 'text':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input 
            type={subType || 'text'} 
            id={name} 
            name={name} 
            placeholder={placeholder} 
            disabled={disabled} 
            {...validationProps}
            onChange={inputMask ? handleMaskedChange : undefined}
            className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary ${pointerEvents} ${sizeClass} ${disabledClass}`} 
            style={inputStyle} 
          />
        </div>
      );
    case 'textarea':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <textarea id={name} name={name} placeholder={placeholder} rows={4} disabled={disabled} {...validationProps} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary ${pointerEvents} ${sizeClass} ${disabledClass}`} style={inputStyle}></textarea>
        </div>
      );
    case 'select':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <select id={name} name={name} disabled={disabled} {...validationProps} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary ${pointerEvents} ${sizeClass} ${disabledClass}`} style={inputStyle}>
            {options?.map((option, index) => <option key={index} value={option}>{option}</option>)}
          </select>
        </div>
      );
    case 'checkbox':
      return (
        <div className="flex items-center" style={containerStyle}>
          <input id={name} name={name} type="checkbox" disabled={disabled} {...validationProps} className={`text-brand-primary border-gray-300 rounded focus:ring-brand-primary ${pointerEvents} ${checkboxRadioSizeClasses[currentSize]} ${disabledClass}`} style={{...inputStyle, width: 'auto', height: 'auto'}} />
          <label htmlFor={name} className="ml-2 block text-sm text-gray-900"><EditableLabel forCheckboxOrRadio={true} /></label>
        </div>
      );
    case 'radio':
      return (
        <div className="w-full" style={containerStyle} role="radiogroup" aria-labelledby={`${name}-label`}>
          <label id={`${name}-label`} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <div className={`${pointerEvents}`}>
            {options?.map((option, index) => (
              <div key={index} className="flex items-center mt-1">
                <input id={`${name}-${index}`} name={name} type="radio" disabled={disabled} value={option} {...validationProps} className={`text-brand-primary border-gray-300 focus:ring-brand-primary ${checkboxRadioSizeClasses[currentSize]} ${disabledClass}`} style={{...inputStyle, width: 'auto', height: 'auto'}} />
                <label htmlFor={`${name}-${index}`} className="ml-2 block text-sm text-gray-900">{option}</label>
              </div>
            ))}
          </div>
        </div>
      );
    case 'date':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="date" id={name} name={name} disabled={disabled} {...validationProps} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary ${pointerEvents} ${sizeClass} ${disabledClass}`} style={inputStyle} />
        </div>
      );
    case 'number':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="number" id={name} name={name} placeholder={placeholder} disabled={disabled} {...validationProps} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary ${pointerEvents} ${sizeClass} ${disabledClass}`} style={inputStyle} />
        </div>
      );
    case 'range':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="range" id={name} name={name} disabled={disabled} {...validationProps} className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${pointerEvents} ${disabledClass}`} />
        </div>
      );
    case 'file':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="file" id={name} name={name} disabled={disabled} {...validationProps} accept={element.accept} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100 ${pointerEvents} ${sizeClass.replace('px-3 py-2', '')} ${disabledClass}`} style={inputStyle} />
        </div>
      );
    case 'color':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="color" id={name} name={name} disabled={disabled} className={`w-full h-10 border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary ${pointerEvents} ${disabledClass}`} defaultValue="#0078D4" style={inputStyle} />
        </div>
      );
    case 'button':
      // Legacy color support map
      const buttonColorClasses: Record<string, string> = { primary: 'bg-brand-primary hover:bg-brand-accent text-white', secondary: 'bg-gray-600 hover:bg-gray-700 text-white', danger: 'bg-red-600 hover:bg-red-700 text-white' };
      const buttonClass = styles?.backgroundColor ? '' : buttonColorClasses[styles?.color || 'primary']; 
      return <button type="button" disabled={disabled} className={`font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${sizeClass} ${buttonClass} ${disabledClass}`} style={{...inputStyle, backgroundColor: styles?.backgroundColor || undefined }} onDoubleClick={(e) => { if(!preview) { e.stopPropagation(); onStartEditing?.(id); }}}>{label}</button>;
    case 'reset-button':
        return <button type="reset" disabled={disabled} className={`font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 bg-gray-200 hover:bg-gray-300 text-gray-800 ${sizeClass} ${disabledClass}`} style={{...inputStyle, backgroundColor: styles?.backgroundColor || undefined }} onDoubleClick={(e) => { if(!preview) { e.stopPropagation(); onStartEditing?.(id); }}}>{label}</button>;
    case 'table':
        const cols = element.colCount || 3;
        const rows = rowCount || 3;
        const ths = headers || Array.from({length: cols}, (_, i) => `Header ${i+1}`);
        return (
            <div className="w-full overflow-x-auto" style={containerStyle}>
                <label className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
                <table className="min-w-full border-collapse border border-gray-300 bg-white text-sm" style={{ borderColor: styles?.borderColor, boxShadow: styles?.boxShadow, width: '100%' }}>
                    <thead className="bg-gray-50">
                        <tr>{ths.map((h, i) => <th key={i} className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-500" style={{ borderColor: styles?.borderColor, color: styles?.textColor }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                        {Array.from({length: rows}).map((_, r) => <tr key={r}>{Array.from({length: cols}).map((_, c) => <td key={c} className="border border-gray-300 px-4 py-2" style={{ borderColor: styles?.borderColor }}>Cell {r+1}-{c+1}</td>)}</tr>)}
                    </tbody>
                </table>
            </div>
        );
    case 'iframe':
        return (
            <div className="w-full" style={containerStyle}>
                 <label className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
                 <iframe src={src || "about:blank"} className={`w-full border border-gray-300 bg-gray-100 ${pointerEvents}`} style={{ height: styles?.height || '300px', width: '100%', borderColor: styles?.borderColor, borderWidth: styles?.borderWidth, borderRadius: styles?.borderRadius, boxShadow: styles?.boxShadow }} title={label} />
                 {!src && <div className="text-xs text-gray-500 italic mt-1">Select element to set Source URL in properties.</div>}
            </div>
        );
    case 'navbar':
        return (
            <div className="w-full bg-white border-b border-gray-200 shadow-sm py-3 px-4 flex items-center justify-between" style={containerStyle}>
                <div className="font-bold text-xl text-brand-primary" style={{ color: styles?.textColor }}>{brand || label}</div>
                <div className="space-x-4">{links?.map((link, i) => <a key={i} href={link.url} className={`text-gray-600 hover:text-brand-primary font-medium ${pointerEvents}`} onClick={e => e.preventDefault()} style={{ color: styles?.textColor }}>{link.label}</a>) || <span className="text-gray-400 italic">No links configured</span>}</div>
            </div>
        );
    case 'news-card': return <NewsCardComponent />;
    default: return <div>Unsupported element type</div>;
  }
};

export default FormElementRenderer;
