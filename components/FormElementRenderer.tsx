
import React, { useState, useEffect } from 'react';
import type { FormElement } from '../types';

interface FormElementRendererProps {
  element: FormElement;
  isEditing?: boolean;
  onStartEditing?: (id: string) => void;
  onStopEditing?: () => void;
  onUpdate?: (id: string, updatedProps: Partial<FormElement>) => void;
  preview?: boolean;
  hidden?: boolean;
  children?: React.ReactNode; // Support nested children
}

const sizeClasses: Record<string, string> = {
  small: 'p-1 text-sm',
  medium: 'p-2 text-base',
  large: 'p-3 text-lg',
};

const checkboxRadioSizeClasses: Record<string, string> = {
  small: 'h-3 w-3',
  medium: 'h-4 w-4',
  large: 'h-5 w-5',
};


const FormElementRenderer: React.FC<FormElementRendererProps> = ({ element, isEditing, onStartEditing, onStopEditing, onUpdate, preview = false, hidden = false, children }) => {
  if (hidden && element.type !== 'script') return null;

  const { id, type, label, placeholder, options, required, name, subType, styles, disabled, src, rowCount, headers, links, brand, newsTitle, newsContent, newsImage, minLength, maxLength, min, max, step, pattern, scriptContent, htmlContent, textContent, headingLevel, altText } = element;

  // Execute Script in Preview Mode
  useEffect(() => {
      if (preview && type === 'script' && scriptContent) {
          try {
              // Slight delay to ensure DOM elements are rendered in the modal
              const timer = setTimeout(() => {
                  // Wrapping in IIFE to avoid variable collisions if possible, 
                  // though for simple snippets global access via document.querySelector is expected.
                  const func = new Function(scriptContent);
                  func();
              }, 100);
              return () => clearTimeout(timer);
          } catch (e) {
              console.error(`Error executing script for element ${label}:`, e);
          }
      }
  }, [preview, type, scriptContent, label]);


  // Styles Logic
  const customStyle: React.CSSProperties = {
      fontFamily: styles?.fontFamily === 'mono' ? 'monospace' : styles?.fontFamily === 'serif' ? 'serif' : 'inherit',
      fontWeight: styles?.fontWeight || 'normal',
      backgroundColor: styles?.backgroundColor || 'transparent',
      borderColor: styles?.borderColor,
      borderWidth: styles?.borderWidth,
      borderRadius: styles?.borderRadius,
      padding: styles?.padding,
      color: styles?.textColor,
      textAlign: styles?.textAlign || 'left',
      letterSpacing: styles?.letterSpacing,
      lineHeight: styles?.lineHeight,
      textDecoration: styles?.textDecoration,
      boxShadow: styles?.boxShadow,
  };

  const currentSize = styles?.size || 'medium';
  const sizeClass = sizeClasses[currentSize];
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const pointerEvents = preview ? '' : 'pointer-events-none';
  
  // Only apply border/bg styles to the input itself if specified, otherwise use defaults
  const inputStyle = { ...customStyle };
  const containerStyle = { ...customStyle, borderWidth: 0, backgroundColor: 'transparent', boxShadow: 'none' }; // Container handles spacing but not borders usually

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
      <span onDoubleClick={(e) => { if (!preview) { e.stopPropagation(); onStartEditing?.(id); } }}>
        {labelText}
      </span>
    );
  };
  
  const AccordionComponent = () => {
      // By default open in builder, closed in preview or let user toggle
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <div className="w-full border rounded-md overflow-hidden" style={customStyle}>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
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

  // News Card Component Internal State
  const NewsCardComponent = () => {
      const [expanded, setExpanded] = useState(false);
      const [currentNewsContent, setCurrentNewsContent] = useState(newsContent);
      const [isFetching, setIsFetching] = useState(false);

      const handleFetchNews = () => {
          setIsFetching(true);
          // Simulate fetch
          setTimeout(() => {
              setCurrentNewsContent(`Updated News at ${new Date().toLocaleTimeString()}: ${newsContent} (Fresh data fetched!)`);
              setIsFetching(false);
          }, 1500);
      };

      const handleShare = () => {
          alert(`Sharing "${newsTitle}" via Email and Social Media...`);
      };
      
      // Use provided image or a default placeholder
      const displayImage = (newsImage && newsImage.trim() !== '') 
        ? newsImage 
        : "https://via.placeholder.com/600x300?text=Latest+News";

      return (
          <div className={`border rounded-lg overflow-hidden shadow-sm bg-white ${pointerEvents}`} style={{ borderColor: styles?.borderColor || '#e5e7eb', borderWidth: styles?.borderWidth || '1px', borderRadius: styles?.borderRadius || '0.5rem', boxShadow: styles?.boxShadow }}>
              <img src={displayImage} alt={newsTitle || "News"} className="w-full h-48 object-cover" />
              <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: styles?.fontFamily, color: styles?.textColor }}>{newsTitle}</h3>
                  <div 
                    id={`news-content-${id}`}
                    className={`text-gray-600 text-sm mb-4 transition-all duration-300 ${expanded ? '' : 'line-clamp-2'}`}
                    aria-live="polite"
                  >
                      {currentNewsContent}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-between items-center">
                      <button 
                        type="button"
                        onClick={() => setExpanded(!expanded)} 
                        className="text-brand-primary text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-brand-primary rounded p-1"
                        aria-expanded={expanded}
                        aria-controls={`news-content-${id}`}
                      >
                          {expanded ? 'Read Less' : 'Read More'}
                      </button>
                      
                      <div className="space-x-2">
                          <button 
                            type="button"
                            onClick={handleFetchNews} 
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            aria-label={`Fetch latest news for ${newsTitle}`}
                          >
                              {isFetching ? 'Fetching...' : 'Fetch Latest'}
                          </button>
                           <button 
                            type="button"
                            onClick={handleShare} 
                            className="px-3 py-1 bg-brand-primary text-white text-xs rounded hover:bg-brand-accent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary"
                            aria-label={`Share ${newsTitle}`}
                          >
                              Share
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      );
  };


  switch (type) {
    case 'html-block':
        if (!htmlContent && !preview) {
            return (
                <div className="w-full p-4 border border-dashed border-gray-400 bg-gray-50 text-gray-500 text-center text-sm rounded" style={containerStyle}>
                     &lt;HTML /&gt; Block: Edit properties to add content
                </div>
            );
        }
        return (
            <div 
                className="w-full" 
                style={customStyle}
                dangerouslySetInnerHTML={{ __html: htmlContent || '' }}
            />
        );
    case 'divider':
        return (
            <hr className="w-full border-t my-2" style={{ borderColor: styles?.borderColor || '#e5e7eb', borderWidth: styles?.borderWidth || '1px' }} />
        );
    case 'image':
         return (
            <div className="w-full" style={containerStyle}>
                <img 
                    src={src || "https://via.placeholder.com/300x200?text=Image+Placeholder"} 
                    alt={altText || label} 
                    className={`max-w-full h-auto ${pointerEvents}`}
                    style={{
                        borderRadius: styles?.borderRadius,
                        borderColor: styles?.borderColor,
                        borderWidth: styles?.borderWidth,
                        borderStyle: styles?.borderWidth ? 'solid' : 'none',
                        width: styles?.width,
                        height: styles?.height,
                        boxShadow: styles?.boxShadow
                    }}
                />
                {!src && !preview && <div className="text-xs text-gray-500 italic mt-1">Select to set Image URL</div>}
            </div>
         );
    case 'typography':
        const Tag = (headingLevel || 'p') as React.ElementType;
        const textClasses = {
            h1: 'text-4xl font-bold mb-4',
            h2: 'text-3xl font-bold mb-3',
            h3: 'text-2xl font-bold mb-3',
            h4: 'text-xl font-bold mb-2',
            h5: 'text-lg font-bold mb-2',
            h6: 'text-base font-bold mb-2',
            p: 'text-base mb-2',
            span: 'text-base'
        };
        const defaultText = textContent || (isEditing ? '' : 'Double click to edit text');
        
        return (
            <div style={containerStyle} className="w-full">
                 <Tag className={`${textClasses[headingLevel || 'p']}`} style={customStyle}>
                    {defaultText}
                 </Tag>
            </div>
        );
    case 'script':
        if (preview) return null; // Invisible in preview
        return (
            <div className="w-full p-3 border border-yellow-400 bg-yellow-50 rounded-md flex items-center shadow-sm" style={containerStyle}>
                <div className="flex items-center justify-center h-8 w-8 bg-yellow-200 rounded mr-3 text-yellow-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900"><EditableLabel /></label>
                    <p className="text-xs text-gray-500 italic">JavaScript logic (runs in preview)</p>
                </div>
            </div>
        );
    case 'container':
        // Flexbox logic for children wrapper
        const contentStyle: React.CSSProperties = {
            display: styles?.display || 'block', // Default to block if not specified
            flexDirection: styles?.flexDirection,
            justifyContent: styles?.justifyContent,
            alignItems: styles?.alignItems,
            gap: styles?.gap || (styles?.display === 'flex' ? '1rem' : undefined),
            flexWrap: styles?.flexWrap,
        };
        const defaultStackClass = (styles?.display === 'flex') ? '' : 'space-y-2';

        return (
            <div className="w-full p-4 border border-dashed border-gray-300 rounded-md min-h-[100px]" style={customStyle}>
                <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
                </div>
                <div className={`${defaultStackClass}`} style={contentStyle}>
                    {children}
                    {!children && preview && <div className="text-xs text-gray-400 italic">Empty Container</div>}
                </div>
            </div>
        );
    case 'accordion':
        return <AccordionComponent />;
    case 'text':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type={subType || 'text'} id={name} name={name} placeholder={placeholder} disabled={disabled} required={required} minLength={minLength} maxLength={maxLength} pattern={pattern} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary ${pointerEvents} ${sizeClass} ${disabledClass}`} style={inputStyle} aria-required={required} aria-disabled={disabled} />
        </div>
      );
    case 'textarea':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <textarea id={name} name={name} placeholder={placeholder} rows={4} disabled={disabled} required={required} minLength={minLength} maxLength={maxLength} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary ${pointerEvents} ${sizeClass} ${disabledClass}`} style={inputStyle} aria-required={required} aria-disabled={disabled}></textarea>
        </div>
      );
    case 'select':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <select id={name} name={name} disabled={disabled} required={required} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary ${pointerEvents} ${sizeClass} ${disabledClass}`} style={inputStyle} aria-required={required} aria-disabled={disabled}>
            {options?.map((option, index) => <option key={index} value={option}>{option}</option>)}
          </select>
        </div>
      );
    case 'checkbox':
      return (
        <div className="flex items-center" style={containerStyle}>
          <input id={name} name={name} type="checkbox" disabled={disabled} required={required} className={`text-brand-primary border-gray-300 rounded focus:ring-brand-primary ${pointerEvents} ${checkboxRadioSizeClasses[currentSize]} ${disabledClass}`} style={inputStyle} aria-required={required} aria-disabled={disabled} />
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
                <input id={`${name}-${index}`} name={name} type="radio" disabled={disabled} required={required} value={option} className={`text-brand-primary border-gray-300 focus:ring-brand-primary ${checkboxRadioSizeClasses[currentSize]} ${disabledClass}`} style={inputStyle} aria-required={required} aria-disabled={disabled} />
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
          <input type="date" id={name} name={name} disabled={disabled} required={required} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary ${pointerEvents} ${sizeClass} ${disabledClass}`} style={inputStyle} aria-required={required} aria-disabled={disabled} />
        </div>
      );
    case 'number':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="number" id={name} name={name} placeholder={placeholder} disabled={disabled} required={required} min={min} max={max} step={step} className={`w-full border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary ${pointerEvents} ${sizeClass} ${disabledClass}`} style={inputStyle} aria-required={required} aria-disabled={disabled} />
        </div>
      );
    case 'range':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="range" id={name} name={name} disabled={disabled} min={min} max={max} step={step} className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer ${pointerEvents} ${disabledClass}`} aria-disabled={disabled} />
        </div>
      );
    case 'file':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="file" id={name} name={name} disabled={disabled} required={required} accept={element.accept} className={`w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-brand-primary hover:file:bg-blue-100 ${pointerEvents} ${sizeClass.replace('p-2', '')} ${disabledClass}`} style={inputStyle} aria-required={required} aria-disabled={disabled} />
        </div>
      );
    case 'color':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
          <input type="color" id={name} name={name} disabled={disabled} className={`w-full h-10 border border-gray-300 shadow-sm focus:ring-brand-primary focus:border-brand-primary ${pointerEvents} ${disabledClass}`} defaultValue="#0078D4" style={inputStyle} aria-disabled={disabled} />
        </div>
      );
    case 'button':
       // Legacy color support map
      const buttonColorClasses: Record<string, string> = {
        primary: 'bg-brand-primary hover:bg-brand-accent text-white',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
        danger: 'bg-red-600 hover:bg-red-700 text-white',
      };
      const buttonClass = styles?.backgroundColor ? '' : buttonColorClasses[styles?.color || 'primary']; // Use custom bg if present
      
      return (
         <button 
            type="button" 
            disabled={disabled} 
            className={`font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${sizeClass} ${buttonClass} ${disabledClass}`}
            style={{
                backgroundColor: styles?.backgroundColor,
                color: styles?.textColor,
                borderColor: styles?.borderColor,
                borderWidth: styles?.borderWidth,
                borderRadius: styles?.borderRadius,
                fontFamily: styles?.fontFamily,
                fontWeight: styles?.fontWeight,
                padding: styles?.padding,
                letterSpacing: styles?.letterSpacing,
                lineHeight: styles?.lineHeight,
                textDecoration: styles?.textDecoration,
                boxShadow: styles?.boxShadow,
            }}
            onDoubleClick={(e) => { if(!preview) { e.stopPropagation(); onStartEditing?.(id); }}}
            aria-disabled={disabled}
         >
            {label}
         </button>
      );
    case 'reset-button':
        return (
            <button 
               type="reset" 
               disabled={disabled} 
               className={`font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 bg-gray-200 hover:bg-gray-300 text-gray-800 ${sizeClass} ${disabledClass}`}
               style={{
                   backgroundColor: styles?.backgroundColor,
                   color: styles?.textColor,
                   borderColor: styles?.borderColor,
                   borderWidth: styles?.borderWidth,
                   borderRadius: styles?.borderRadius,
                   fontFamily: styles?.fontFamily,
                   fontWeight: styles?.fontWeight,
                   padding: styles?.padding,
                   letterSpacing: styles?.letterSpacing,
                   lineHeight: styles?.lineHeight,
                   textDecoration: styles?.textDecoration,
                   boxShadow: styles?.boxShadow,
               }}
               onDoubleClick={(e) => { if(!preview) { e.stopPropagation(); onStartEditing?.(id); }}}
               aria-disabled={disabled}
            >
               {label}
            </button>
         );
    
    case 'table':
        const cols = element.colCount || 3;
        const rows = rowCount || 3;
        const ths = headers || Array.from({length: cols}, (_, i) => `Header ${i+1}`);
        
        return (
            <div className="w-full overflow-x-auto" style={containerStyle}>
                <label className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
                <table className="min-w-full border-collapse border border-gray-300 bg-white text-sm" style={{ borderColor: styles?.borderColor, boxShadow: styles?.boxShadow }}>
                    <thead className="bg-gray-50">
                        <tr>
                            {ths.map((h, i) => (
                                <th key={i} className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-500" style={{ borderColor: styles?.borderColor, color: styles?.textColor }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({length: rows}).map((_, r) => (
                            <tr key={r}>
                                {Array.from({length: cols}).map((_, c) => (
                                    <td key={c} className="border border-gray-300 px-4 py-2" style={{ borderColor: styles?.borderColor }}>Cell {r+1}-{c+1}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    case 'iframe':
        return (
            <div className="w-full" style={containerStyle}>
                 <label className="block text-sm font-medium text-gray-700 mb-1"><EditableLabel /></label>
                 <iframe 
                    src={src || "about:blank"} 
                    className={`w-full border border-gray-300 bg-gray-100 ${pointerEvents}`}
                    style={{ height: styles?.height || '300px', borderColor: styles?.borderColor, borderWidth: styles?.borderWidth, borderRadius: styles?.borderRadius, boxShadow: styles?.boxShadow }}
                    title={label}
                 />
                 {!src && <div className="text-xs text-gray-500 italic mt-1">Select element to set Source URL in properties.</div>}
            </div>
        );
    case 'navbar':
        return (
            <div className="w-full bg-white border-b border-gray-200 shadow-sm py-3 px-4 flex items-center justify-between" style={customStyle}>
                <div className="font-bold text-xl text-brand-primary" style={{ color: styles?.textColor }}>{brand || label}</div>
                <div className="space-x-4">
                    {links?.map((link, i) => (
                        <a key={i} href={link.url} className={`text-gray-600 hover:text-brand-primary font-medium ${pointerEvents}`} onClick={e => e.preventDefault()} style={{ color: styles?.textColor }}>{link.label}</a>
                    )) || <span className="text-gray-400 italic">No links configured</span>}
                </div>
            </div>
        );
    case 'news-card':
        return <NewsCardComponent />;
    default:
      return <div>Unsupported element type</div>;
  }
};

export default FormElementRenderer;
