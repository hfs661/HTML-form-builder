import React, { useState, useEffect, useRef } from 'react';
import type { FormElement, ElementStyle } from '../types';

interface FormElementRendererProps {
  element: FormElement;
  isEditing?: boolean;
  onStartEditing?: (id: string) => void;
  onStopEditing?: () => void;
  onUpdate?: (id: string, updatedProps: Partial<FormElement>) => void;
  preview?: boolean;
  hidden?: boolean;
  error?: string | null;
  forceRequired?: boolean;
  children?: React.ReactNode;
}

const sizeClasses: Record<string, string> = {
  small: 'px-3 py-1.5 text-xs',
  medium: 'px-4 py-3 text-sm',
  large: 'px-5 py-4 text-base',
};

const checkboxRadioSizeClasses: Record<string, string> = {
  small: 'h-4 w-4',
  medium: 'h-5 w-5',
  large: 'h-6 w-6',
};

const applyMask = (value: string, mask: string) => {
    let i = 0;
    let valIndex = 0;
    let result = '';
    const rawValue = value.replace(/[^a-zA-Z0-9]/g, '');

    while (i < mask.length && valIndex < rawValue.length) {
        const maskChar = mask[i];
        const valChar = rawValue[valIndex];
        
        if (maskChar === '9') {
            if (/\d/.test(valChar)) {
                result += valChar;
                valIndex++;
            } else {
                break;
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
            result += maskChar;
            if (valChar === maskChar) {
                valIndex++;
            }
        }
        i++;
    }
    return result;
};

const FormElementRenderer: React.FC<FormElementRendererProps> = ({ element, isEditing, onStartEditing, onStopEditing, onUpdate, preview = false, hidden = false, error, forceRequired, children }) => {
  if (hidden && element.type !== 'script') return null;

  const { id, type, label, placeholder, options, required, name, subType, styles, disabled, src, rowCount, headers, links, brand, newsTitle, newsContent, newsImage, minLength, maxLength, min, max, step, pattern, scriptContent, onClickScript, onChangeScript, htmlContent, textContent, headingLevel, altText, inputMask, customErrorMessage, language, code, validationLogic, dataLogic, targetId, ariaLabel, searchable, htmlTag } = element;
  
  if (preview && (type === 'validationLogic' || type === 'dataLogic')) return null;

  const isRequired = forceRequired !== undefined ? forceRequired : required;
  const [internalValue, setInternalValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (preview && inputRef.current) {
        if (error) {
            inputRef.current.setCustomValidity(error);
        } else if (customErrorMessage) {
            inputRef.current.setCustomValidity(customErrorMessage);
        } else {
            inputRef.current.setCustomValidity('');
        }
    }
  }, [preview, error, customErrorMessage]);

  useEffect(() => {
      if (preview && (type === 'script' || type === 'html-block' || type === 'htmlContent') && scriptContent) {
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

  const getCombinedStyles = (isLayout: boolean): React.CSSProperties => {
      const s = styles || {};
      if (isLayout) {
          return {
              width: s.width || '100%', 
              height: s.height,
              minHeight: s.minHeight,
              minWidth: s.minWidth,
              gridColumn: s.gridColumn,
              gridRow: s.gridRow,
              flexGrow: (s.flexGrow !== undefined && s.flexGrow !== null && s.flexGrow !== '') ? Number(s.flexGrow) : 0,
              flexShrink: s.flexShrink ? Number(s.flexShrink) : undefined,
              flexBasis: s.flexBasis,
              alignSelf: s.alignSelf,
              display: s.display,
              flexDirection: s.flexDirection,
              justifyContent: s.justifyContent,
              alignItems: s.alignItems,
              flexWrap: s.flexWrap,
              gridTemplateColumns: s.gridTemplateColumns,
              gridTemplateRows: s.gridTemplateRows,
              gap: s.gap,
          };
      } else {
          return {
              fontFamily: s.fontFamily === 'mono' ? 'monospace' : s.fontFamily === 'serif' ? 'serif' : 'inherit',
              fontWeight: s.fontWeight || 'normal',
              fontSize: s.fontSize,
              backgroundColor: s.backgroundColor, 
              borderColor: error ? '#ef4444' : (isFocused && s.focusBorderColor ? s.focusBorderColor : s.borderColor),
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
  
  const hasInteraction = (!!onClickScript || !!onChangeScript) && !disabled;
  const interactiveStyle: React.CSSProperties = hasInteraction ? { cursor: 'pointer' } : {};

  const autoHeightWrapperTypes = ['text', 'textarea', 'select', 'checkbox', 'radio', 'date', 'number', 'range', 'file', 'color', 'iframe', 'table', 'inputMask', 'toggle', 'rating', 'rich-text'];
  const shouldUseAutoHeight = autoHeightWrapperTypes.includes(type);

  const containerStyle: React.CSSProperties = preview ? {
      ...layoutStyles,
      ...appearanceStyles,
      ...interactiveStyle,
      position: 'relative'
  } : {
      ...appearanceStyles,
      width: '100%',
      height: shouldUseAutoHeight ? 'auto' : (styles?.height || 'auto'),
      display: layoutStyles.display,
      flexDirection: layoutStyles.flexDirection,
      justifyContent: layoutStyles.justifyContent,
      alignItems: layoutStyles.alignItems,
      flexWrap: layoutStyles.flexWrap,
      gridTemplateColumns: layoutStyles.gridTemplateColumns,
      gridTemplateRows: layoutStyles.gridTemplateRows,
      gap: layoutStyles.gap,
  };

  const currentSize = styles?.size || 'medium';
  const sizeClass = sizeClasses[currentSize];
  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-gray-50 focus:bg-white';
  const pointerEvents = preview ? '' : 'pointer-events-none';
  
  const inputStyle: React.CSSProperties = { 
      ...appearanceStyles, 
      width: '100%', 
      height: (type === 'container' || type === 'iframe') ? '100%' : (styles?.height || 'auto')
  }; 
  
  const handleElementChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (inputMask || element.inputMask) {
          const val = e.target.value;
          const masked = applyMask(val, inputMask || element.inputMask || '');
          setInternalValue(masked);
          e.target.value = masked;
      }

      if (preview && onChangeScript) {
          try {
              const func = new Function('e', 'value', 'id', 'name', onChangeScript);
              func(e, e.target.value, id, name);
          } catch (err) {
              console.error(`Error executing onChange script for element ${label}:`, err);
          }
      }
  };

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
      setIsFocused(false);
      onStopEditing?.();
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate?.(id, { label: e.target.value });
  };
  
  const handleContainerKeyDown = (e: React.KeyboardEvent) => {
      if (hasInteraction && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleButtonClick(e as any);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      onStopEditing?.();
      e.preventDefault();
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
      if (preview && onClickScript) {
          try {
              const func = new Function('e', 'id', 'name', onClickScript);
              func(e, id, name);
          } catch (err) {
              console.error(`Error executing onClick script for element ${label}:`, err);
          }
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
    return (
      <span onDoubleClick={(e) => { if (!preview) { e.stopPropagation(); onStartEditing?.(id); } }}>
        {label}
        {isRequired && <span className="text-red-500 ml-1 font-bold" title="Required">*</span>}
      </span>
    );
  };
  
  const AccordionComponent = () => {
      const [isOpen, setIsOpen] = useState(true);
      return (
        <div className="w-full border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col" style={containerStyle}>
            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)} 
                className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary flex-shrink-0"
                aria-expanded={isOpen}
                aria-label={ariaLabel || label}
            >
                <div className="font-semibold text-gray-800"><EditableLabel /></div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-5 border-t border-gray-200 bg-white flex-grow flex flex-col">
                    {children}
                    {!children && preview && <div className="text-xs text-gray-400 italic">Empty Accordion</div>}
                </div>
            )}
        </div>
      );
  }

  const NewsCardComponent = () => {
      const [expanded, setExpanded] = useState(false);
      const displayImage = newsImage || element.newsImage || (newsImage && newsImage.trim() !== '' ? newsImage : "https://via.placeholder.com/600x300?text=Latest+News");
      const title = newsTitle || element.newsTitle || "News Title";
      const content = newsContent || element.newsContent || "News Content";
      return (
          <article 
            className={`border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-white ${pointerEvents} focus:outline-none focus:ring-2 focus:ring-brand-primary`} 
            style={containerStyle}
            role={hasInteraction ? 'button' : undefined}
            tabIndex={hasInteraction ? 0 : undefined}
            onClick={hasInteraction ? handleButtonClick : undefined}
            onKeyDown={handleContainerKeyDown}
            aria-label={ariaLabel || `News card: ${title}`}
          >
              <img src={displayImage} alt={title || "News Image"} className="w-full h-48 object-cover" />
              <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-3" style={{ fontFamily: styles?.fontFamily, color: styles?.textColor }}>{title}</h3>
                  <div className={`text-gray-600 text-sm mb-4 transition-all leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>{content}</div>
                   <button type="button" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-brand-primary text-sm font-semibold hover:text-brand-accent focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-primary rounded p-1" aria-label={expanded ? "Read less" : "Read more"}>
                          {expanded ? 'Read Less' : 'Read More'}
                   </button>
              </div>
          </article>
      );
  };
  
  const validationProps = {
      required: isRequired,
      minLength,
      maxLength,
      min: min as string | number,
      max: max as string | number,
      step: step,
      pattern: pattern,
      'aria-required': isRequired,
      'aria-invalid': !!error,
      'aria-label': ariaLabel || label,
      'aria-describedby': error ? `${name}-error` : undefined,
      title: error || customErrorMessage || (inputMask ? `Format: ${inputMask}` : undefined),
      onFocus: handleFocus,
      onBlur: handleBlur
  };

  const commonInputClasses = `form-control w-full border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary placeholder-gray-400 transition-all duration-200 ease-in-out ${pointerEvents} ${sizeClass} ${disabledClass} ${error ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500' : ''}`;

  const effectiveType = (['inputMask', 'text'].includes(type)) ? 'text' : 
                        (['htmlContent', 'html-block'].includes(type)) ? 'html-block' : 
                        (['newsTitle', 'newsContent', 'newsImage'].includes(type)) ? 'news-card' : 
                        (['altText', 'typography'].includes(type)) ? 'typography' : 
                        type;

  switch (effectiveType) {
    case 'validationLogic':
        return (
            <div className="w-full p-4 border border-dashed border-red-300 bg-red-50 rounded-lg shadow-sm" role="alert">
                <div className="flex items-center text-red-700 font-bold text-xs uppercase mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    Validation Rule
                </div>
                <div className="text-xs text-gray-600">
                    {targetId ? `Validates: Element ${targetId}` : "No target selected"}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                    Condition: {validationLogic?.condition || 'N/A'} {validationLogic?.value ? `"${validationLogic.value}"` : ''}
                </div>
            </div>
        );
    case 'dataLogic':
        return (
            <div className="w-full p-4 border border-dashed border-blue-300 bg-blue-50 rounded-lg shadow-sm">
                <div className="flex items-center text-blue-700 font-bold text-xs uppercase mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                    Data Logic
                </div>
                <div className="text-xs text-gray-600">
                    {targetId ? `Modifies: Element ${targetId}` : "No target selected"}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                    Triggers on: {dataLogic?.rules?.[0]?.triggerId || 'N/A'}
                </div>
            </div>
        );
    case 'html-block':
        return (htmlContent || element.htmlContent) || preview ? <div className="w-full" style={containerStyle} dangerouslySetInnerHTML={{ __html: htmlContent || element.htmlContent || '' }} /> : <div className="w-full p-4 border border-dashed border-gray-400 bg-gray-50 text-gray-500 text-center text-sm rounded">HTML Block</div>;
    case 'divider':
        return <hr className="w-full border-t my-4" style={{ borderColor: styles?.borderColor || '#e5e7eb', borderWidth: styles?.borderWidth || '1px' }} aria-hidden="true" />;
    case 'image':
         const finalAlt = (altText !== undefined) ? altText : (element.altText !== undefined ? element.altText : label);
         return (
            <div className="w-full" style={containerStyle}>
                <img 
                    src={src || "https://via.placeholder.com/300x200?text=Image+Placeholder"} 
                    alt={finalAlt} 
                    className={`max-w-full h-auto rounded-md ${pointerEvents}`}
                    style={{...appearanceStyles, width: '100%', height: styles?.height ? '100%' : 'auto', objectFit: 'cover'}}
                    onClick={hasInteraction ? handleButtonClick : undefined}
                    onKeyDown={handleContainerKeyDown}
                    role={hasInteraction ? 'button' : undefined}
                    tabIndex={hasInteraction ? 0 : undefined}
                    aria-label={ariaLabel}
                />
            </div>
         );
    case 'video':
        return (
             <div className="w-full" style={containerStyle}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
                <video 
                    src={src} 
                    controls 
                    className={`w-full rounded-lg shadow-sm bg-black ${pointerEvents}`} 
                    style={{...appearanceStyles, width: '100%', height: styles?.height || 'auto'}}
                    aria-label={ariaLabel || label}
                >
                    Your browser does not support the video tag.
                </video>
                {!src && !preview && <div className="text-xs text-red-500 italic mt-1">No video source set.</div>}
            </div>
        );
    case 'audio':
        return (
             <div className="w-full" style={containerStyle}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
                <audio 
                    src={src} 
                    controls 
                    className={`w-full ${pointerEvents}`} 
                    style={appearanceStyles}
                    aria-label={ariaLabel || label}
                >
                    Your browser does not support the audio tag.
                </audio>
                {!src && !preview && <div className="text-xs text-red-500 italic mt-1">No audio source set.</div>}
            </div>
        );
    case 'progress':
        return (
             <div className="w-full" style={containerStyle}>
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
                 <progress 
                    value={placeholder ? Number(placeholder) : 50} 
                    max={max ? Number(max) : 100} 
                    className={`w-full h-4 rounded-full overflow-hidden ${pointerEvents}`}
                    aria-label={ariaLabel || label}
                />
            </div>
        );
    case 'rating':
        const ratingMax = max ? Number(max) : 5;
        return (
            <div className="w-full" style={containerStyle} role="group" aria-label={ariaLabel || label}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
                <div className={`flex space-x-1 ${pointerEvents}`}>
                    {Array.from({length: ratingMax}).map((_, i) => (
                        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400 cursor-pointer hover:scale-110 transition-transform" fill={i < 3 ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" role="button" aria-label={`Rate ${i+1} out of ${ratingMax}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                    ))}
                </div>
            </div>
        );
    case 'toggle':
        return (
            <div className="flex items-center" style={containerStyle}>
                 <div className={`relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in ${pointerEvents}`}>
                    <input type="checkbox" name={name} id={name} onChange={handleElementChange} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-300 checked:right-0 checked:border-brand-primary" style={{right: 'auto', left: 0}} aria-label={ariaLabel || label} />
                    <label htmlFor={name} className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer" aria-hidden="true"></label>
                </div>
                <label htmlFor={name} className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer"><EditableLabel forCheckboxOrRadio={true} /></label>
            </div>
        );
    case 'code-block':
        return (
            <div className="w-full" style={containerStyle}>
                <div className="flex justify-between items-center bg-gray-800 text-gray-300 px-4 py-2 rounded-t-lg text-xs font-mono">
                    <span>{label}</span>
                    <span className="uppercase text-gray-500">{language || 'text'}</span>
                </div>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto font-mono text-sm border-t border-gray-700" tabIndex={0} aria-label={`Code block: ${label}`}>
                    <code>{code || '// Enter your code here...'}</code>
                </pre>
            </div>
        );
    case 'rich-text':
        return (
            <div className="w-full" style={containerStyle}>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
                <div className={`border border-gray-300 rounded-lg overflow-hidden ${pointerEvents}`} role="textbox" aria-multiline="true" aria-label={ariaLabel || label}>
                    <div className="bg-gray-50 border-b border-gray-300 p-2 flex space-x-2" aria-hidden="true">
                        <div className="h-6 w-6 bg-gray-200 rounded"></div>
                        <div className="h-6 w-6 bg-gray-200 rounded"></div>
                        <div className="h-6 w-6 bg-gray-200 rounded"></div>
                        <div className="h-6 w-20 bg-gray-200 rounded ml-auto"></div>
                    </div>
                    <div className="p-3 min-h-[100px] bg-white text-gray-400 italic">
                        Rich text content area...
                    </div>
                </div>
            </div>
        );
    case 'typography':
        const Tag = (headingLevel || element.headingLevel || 'p') as React.ElementType;
        const textClasses = { h1: 'text-4xl font-extrabold mb-4 tracking-tight', h2: 'text-3xl font-bold mb-3 tracking-tight', h3: 'text-2xl font-bold mb-3', h4: 'text-xl font-bold mb-2', h5: 'text-lg font-bold mb-2', h6: 'text-base font-bold mb-2', p: 'text-base mb-2 leading-relaxed', span: 'text-base' };
        return <div style={containerStyle} className="w-full"><Tag className={`${textClasses[Tag as keyof typeof textClasses] || 'text-base'}`} style={appearanceStyles} aria-label={ariaLabel}>{textContent || element.textContent || (isEditing ? '' : 'Double click to edit text')}</Tag></div>;
    case 'script':
        if (preview) return null;
        return <div className="w-full p-3 border border-yellow-400 bg-yellow-50 rounded-md flex items-center shadow-sm font-mono text-xs text-yellow-800">JS Snippet: {label}</div>;
    case 'container':
    case 'bootstrap-row':
    case 'bootstrap-col':
        const defaultStackClass = (!styles?.display || styles.display === 'block') ? 'space-y-4' : '';
        const borderClass = preview ? '' : 'border border-dashed border-gray-300 rounded-lg min-h-[50px] bg-gray-50/50';
        
        let extraStyles: React.CSSProperties = {};
        
        if (type === 'bootstrap-row') {
            extraStyles = { display: 'flex', flexWrap: 'wrap', marginRight: '-0.5rem', marginLeft: '-0.5rem', flexDirection: 'row' };
        } else if (type === 'bootstrap-col') {
            extraStyles = { paddingRight: '0.5rem', paddingLeft: '0.5rem' };
            if (styles?.width && styles.width !== '100%' && styles.width !== 'auto') {
                extraStyles = { ...extraStyles, flex: 'none', width: '100%', minWidth: '0' };
            } else {
                extraStyles = { ...extraStyles, flex: '1 0 0%', minWidth: '200px' };
            }
        }

        const isRowLayout = type === 'bootstrap-row' || styles?.flexDirection === 'row';
        const flexClasses = `flex ${isRowLayout ? 'flex-row' : 'flex-col'}`;
        const ContainerTag = (htmlTag as React.ElementType) || 'div';
        
        const isSemanticTag = htmlTag && ['section', 'article', 'main', 'nav', 'aside', 'header', 'footer'].includes(htmlTag);
        const hasLabel = !!(ariaLabel || (type === 'container' && label));
        
        let role = undefined;
        if (!isSemanticTag && hasLabel) {
            role = 'region';
        } else if (type === 'bootstrap-row' && !isSemanticTag && !hasLabel) {
            role = 'group';
        }

        return (
            <ContainerTag 
                className={`w-full ${borderClass} ${type === 'container' ? defaultStackClass : ''} p-4 ${flexClasses} focus:outline-none focus:ring-2 focus:ring-brand-primary`} 
                style={{ ...containerStyle, ...extraStyles, ...styles }}
                role={role}
                tabIndex={hasInteraction ? 0 : undefined}
                onClick={hasInteraction ? handleButtonClick : undefined}
                onKeyDown={handleContainerKeyDown}
                aria-label={ariaLabel || (type === 'container' ? label : undefined)}
            >
                {!preview && <div className="mb-2 w-full"><label className="block text-sm font-semibold text-gray-700 mb-1 tracking-wide"><EditableLabel /></label></div>}
                {children}
            </ContainerTag>
        );
    case 'accordion': return <AccordionComponent />;
    case 'text':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
          <input 
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={subType || 'text'} 
            id={name} 
            name={name} 
            placeholder={placeholder} 
            disabled={disabled} 
            {...validationProps}
            onChange={handleElementChange}
            className={commonInputClasses} 
            style={inputStyle} 
          />
        </div>
      );
    case 'textarea':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
          <textarea 
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            id={name} name={name} placeholder={placeholder} rows={4} disabled={disabled} {...validationProps}
            onChange={handleElementChange}
            className={commonInputClasses} style={inputStyle}></textarea>
        </div>
      );
    case 'select':
      const isMultiple = element.multiple;
      const selectClass = isMultiple 
        ? `${commonInputClasses.replace('h-10', '')} p-2` 
        : `${commonInputClasses} appearance-none bg-white pr-10`;
      
      if (searchable && !isMultiple) {
          const datalistId = `datalist-${id}`;
          return (
            <div className="w-full" style={containerStyle}>
              <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
              <div className="relative">
                <input
                    list={datalistId}
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    id={name}
                    name={name}
                    placeholder={placeholder || "Search or select..."}
                    disabled={disabled}
                    {...validationProps}
                    onChange={handleElementChange}
                    className={commonInputClasses}
                    style={inputStyle}
                />
                <datalist id={datalistId}>
                    {options?.map((option, index) => <option key={index} value={option} />)}
                </datalist>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          );
      }

      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
          <div className="relative">
            <select 
                ref={inputRef as React.RefObject<HTMLSelectElement>}
                id={name} name={name} disabled={disabled} multiple={isMultiple} {...validationProps} 
                onChange={handleElementChange}
                className={selectClass} 
                style={{...inputStyle, height: isMultiple && !styles?.height ? 'auto' : inputStyle.height}}
                size={isMultiple && !styles?.height ? 4 : undefined} 
            >
                {options?.map((option, index) => <option key={index} value={option}>{option}</option>)}
            </select>
            {!isMultiple && (
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            )}
          </div>
        </div>
      );
    case 'checkbox':
      return (
        <div className="flex items-center" style={containerStyle}>
          <input 
            ref={inputRef as React.RefObject<HTMLInputElement>}
            id={name} name={name} type="checkbox" disabled={disabled} {...validationProps} 
            onChange={handleElementChange}
            className={`text-brand-primary border-gray-300 rounded focus:ring-brand-primary transition duration-150 ease-in-out cursor-pointer ${pointerEvents} ${checkboxRadioSizeClasses[currentSize]} ${disabledClass}`} 
            style={{...inputStyle, width: 'auto', height: 'auto'}} />
          <label htmlFor={name} className="ml-2.5 block text-sm font-medium text-gray-700 cursor-pointer"><EditableLabel forCheckboxOrRadio={true} /></label>
        </div>
      );
    case 'radio':
      return (
        <div className="w-full" style={containerStyle} role="radiogroup" aria-labelledby={`${name}-label`} aria-label={ariaLabel}>
          <label id={`${name}-label`} className="block text-sm font-semibold text-gray-700 mb-2"><EditableLabel /></label>
          <div className={`${pointerEvents} space-y-2`}>
            {options?.map((option, index) => (
              <div key={index} className="flex items-center">
                <input 
                  id={`${name}-${index}`} name={name} type="radio" disabled={disabled} value={option} {...validationProps} 
                  onChange={handleElementChange}
                  className={`text-brand-primary border-gray-300 focus:ring-brand-primary transition duration-150 ease-in-out cursor-pointer ${checkboxRadioSizeClasses[currentSize]} ${disabledClass}`} 
                  style={{...inputStyle, width: 'auto', height: 'auto'}} />
                <label htmlFor={`${name}-${index}`} className="ml-2.5 block text-sm text-gray-700 cursor-pointer">{option}</label>
              </div>
            ))}
          </div>
        </div>
      );
    case 'date':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
          <input 
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date" id={name} name={name} disabled={disabled} {...validationProps} 
            onChange={handleElementChange}
            className={commonInputClasses} style={inputStyle} />
        </div>
      );
    case 'number':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
          <input 
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number" id={name} name={name} placeholder={placeholder} disabled={disabled} {...validationProps} 
            onChange={handleElementChange}
            className={commonInputClasses} style={inputStyle} />
        </div>
      );
    case 'range':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
          <input 
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="range" id={name} name={name} disabled={disabled} {...validationProps} 
            onChange={handleElementChange}
            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary/50 ${pointerEvents} ${disabledClass}`} />
        </div>
      );
    case 'file':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
          <input 
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="file" id={name} name={name} disabled={disabled} {...validationProps} accept={element.accept} 
            onChange={handleElementChange}
            className={`w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/10 file:text-brand-primary hover:file:bg-brand-primary/20 transition-all ${pointerEvents} ${sizeClass.replace('px-4 py-2.5', '')} ${disabledClass}`} style={inputStyle} />
        </div>
      );
    case 'color':
      return (
        <div className="w-full" style={containerStyle}>
          <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
          <input 
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="color" id={name} name={name} disabled={disabled} 
            onChange={handleElementChange}
            className={`w-full h-10 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-primary/50 cursor-pointer p-1 ${pointerEvents} ${disabledClass}`} defaultValue="#0078D4" style={inputStyle} />
        </div>
      );
    case 'button':
      const buttonColorClasses: Record<string, string> = { primary: 'bg-brand-primary hover:bg-brand-accent text-white shadow-brand-primary/30', secondary: 'bg-gray-600 hover:bg-gray-700 text-white shadow-gray-600/30', danger: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/30' };
      const buttonClass = styles?.backgroundColor ? '' : buttonColorClasses[styles?.color || 'primary']; 
      return (
        <button 
            type="button" 
            disabled={disabled} 
            onClick={handleButtonClick} 
            className={`font-semibold rounded-lg shadow-md transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${sizeClass} ${buttonClass} ${disabledClass}`} 
            style={{...inputStyle, backgroundColor: styles?.backgroundColor || undefined }} 
            onDoubleClick={(e) => { if(!preview) { e.stopPropagation(); onStartEditing?.(id); }}}
            aria-label={ariaLabel || label}
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
                onClick={handleButtonClick}
                className={`font-semibold rounded-lg shadow-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary ${sizeClass} ${disabledClass}`} 
                style={{...inputStyle, backgroundColor: styles?.backgroundColor || undefined }} 
                onDoubleClick={(e) => { if(!preview) { e.stopPropagation(); onStartEditing?.(id); }}}
                aria-label={ariaLabel || label}
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
            <div className="w-full overflow-x-auto border border-gray-200 rounded-lg shadow-sm" style={containerStyle}>
                <div className="p-2 border-b border-gray-200 bg-gray-50"><label className="block text-sm font-semibold text-gray-700"><EditableLabel /></label></div>
                <table className="min-w-full divide-y divide-gray-200 bg-white text-sm" style={{ borderColor: styles?.borderColor, boxShadow: styles?.boxShadow, width: '100%' }}>
                    <thead className="bg-gray-50">
                        <tr>{ths.map((h, i) => <th key={i} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider" style={{ borderColor: styles?.borderColor, color: styles?.textColor }}>{h}</th>)}</tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {Array.from({length: rows}).map((_, r) => <tr key={r}>{Array.from({length: cols}).map((_, c) => <td key={c} className="px-6 py-4 whitespace-nowrap text-gray-600" style={{ borderColor: styles?.borderColor }}>Cell {r+1}-{c+1}</td>)}</tr>)}
                    </tbody>
                </table>
            </div>
        );
    case 'iframe':
        return (
            <div className="w-full" style={containerStyle}>
                 <label className="block text-sm font-semibold text-gray-700 mb-1.5"><EditableLabel /></label>
                 <iframe src={src || "about:blank"} className={`w-full border border-gray-200 rounded-lg bg-gray-50 ${pointerEvents}`} style={{ height: styles?.height || '300px', width: '100%', borderColor: styles?.borderColor, borderWidth: styles?.borderWidth, borderRadius: styles?.borderRadius, boxShadow: styles?.boxShadow }} title={label} />
                 {!src && <div className="text-xs text-gray-500 italic mt-1">Select element to set Source URL in properties.</div>}
            </div>
        );
    case 'navbar':
        return (
            <nav className="w-full bg-white border-b border-gray-200 shadow-sm py-3 px-6 flex items-center justify-between" style={containerStyle} aria-label={ariaLabel || label}>
                <div className="font-bold text-xl text-brand-primary" style={{ color: styles?.textColor }}>{brand || label}</div>
                <div className="space-x-6">{links?.map((link, i) => <a key={i} href={link.url} className={`text-gray-600 hover:text-brand-primary font-medium transition-colors ${pointerEvents}`} onClick={e => e.preventDefault()} style={{ color: styles?.textColor }}>{link.label}</a>) || <span className="text-gray-400 italic">No links configured</span>}</div>
            </nav>
        );
    case 'news-card':
        return <NewsCardComponent />;
    default:
        return <div className="p-2 text-red-500 text-xs border border-red-200 bg-red-50 rounded">Unknown Element: {type}</div>;
  }
};

export default FormElementRenderer;
