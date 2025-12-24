
import React, { useState, useEffect } from 'react';
import type { PaletteItem, FormElement, SnippetItem } from '../types';
import { STANDARD_ELEMENTS, SNIPPETS, SCRIPT_SNIPPETS, STYLE_SNIPPETS, LAYOUT_SNIPPETS } from '../constants';

interface PaletteProps {
  suggestedElements: Partial<FormElement>[];
  onClearSuggestions: () => void;
  onAddElement: (item: any) => void;
}

const DraggableItem: React.FC<{ item: any, type: 'element' | 'snippet', isSuggestion?: boolean, index?: number, onRemove?: () => void, onAdd?: (item: any) => void }> = ({ item, type, isSuggestion = false, index = 0, onRemove, onAdd }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (type === 'snippet') {
        e.dataTransfer.setData('application/json', JSON.stringify({ isSnippet: true, elements: item.elements }));
    } else {
        let data = { ...item };
        if (item.label === 'Grid Row (12-Col)') {
            data.styles = { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem', padding: '1rem' };
        }
        e.dataTransfer.setData('application/json', JSON.stringify(data));
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onAdd) {
        e.preventDefault();
        const payload = type === 'snippet' ? { isSnippet: true, elements: item.elements } : { ...item };
        if (item.label === 'Grid Row (12-Col)') {
            payload.styles = { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem', padding: '1rem' };
        }
        onAdd(payload);
    }
  };
  
  const animationStyle = isSuggestion ? { animationDelay: `${index * 75}ms`, opacity: 0 } : {};
  const animationClass = isSuggestion ? 'animate-fade-in-staggered' : '';
  
  const icon = item.icon || (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
      </svg>
  );

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Add ${item.label}`}
      className={`group flex items-center p-3 mb-2 rounded-md cursor-grab transition-all duration-150 ease-in-out ${isSuggestion ? 'bg-blue-100 hover:bg-blue-200 text-blue-800' : 'bg-white hover:bg-gray-100 text-brand-text'} border border-gray-200 shadow-sm hover:shadow-md hover:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 ${animationClass} relative`}
      style={animationStyle}
    >
      {icon}
      <span className="text-sm font-medium truncate pr-6">{item.label}</span>
      {onRemove && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity focus:opacity-100"
          title="Delete template"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};


const Palette: React.FC<PaletteProps> = ({ suggestedElements, onClearSuggestions, onAddElement }) => {
  const [userTemplates, setUserTemplates] = useState<SnippetItem[]>([]);

  useEffect(() => {
    const loadTemplates = () => {
      const saved = localStorage.getItem('formBuilderTemplates');
      if (saved) setUserTemplates(JSON.parse(saved));
    };
    loadTemplates();
    window.addEventListener('storage', loadTemplates);
    // Custom event to refresh when saving within same window
    window.addEventListener('templatesUpdated', loadTemplates);
    return () => {
      window.removeEventListener('storage', loadTemplates);
      window.removeEventListener('templatesUpdated', loadTemplates);
    };
  }, []);

  const removeTemplate = (id: string) => {
    const updated = userTemplates.filter(t => t.id !== id);
    localStorage.setItem('formBuilderTemplates', JSON.stringify(updated));
    setUserTemplates(updated);
  };

  return (
    <div className="w-full md:w-72 lg:w-80 p-4 bg-brand-light-gray h-full overflow-y-auto border-r border-gray-300 custom-scrollbar">
      <h2 className="text-xl font-bold text-brand-text mb-4">Toolkit</h2>
      
      {userTemplates.length > 0 && (
        <>
          <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">My Templates</h3>
          {userTemplates.map((template) => (
            <DraggableItem 
              key={template.id} 
              item={template} 
              type="snippet" 
              onRemove={() => template.id && removeTemplate(template.id)}
              onAdd={onAddElement}
            />
          ))}
          <div className="border-b border-gray-300 my-4"></div>
        </>
      )}

      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Grid Layouts</h3>
      {LAYOUT_SNIPPETS.map((snippet, idx) => (
          <DraggableItem key={`layout-${idx}`} item={snippet} type="snippet" onAdd={onAddElement} />
      ))}

      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6">Basic Elements</h3>
      {STANDARD_ELEMENTS.map((item: PaletteItem) => (
        <DraggableItem key={item.label} item={{...item, name: item.type}} type="element" onAdd={onAddElement} />
      ))}

      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6">Logic Snippets</h3>
      {SCRIPT_SNIPPETS.map((snippet, index) => (
          <DraggableItem key={`script-snippet-${index}`} item={snippet} type="snippet" onAdd={onAddElement} />
      ))}

      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6">UI Templates</h3>
      {STYLE_SNIPPETS.map((snippet: SnippetItem, index) => (
          <DraggableItem key={`style-snippet-${index}`} item={snippet} type="snippet" onAdd={onAddElement} />
      ))}
      
      {suggestedElements.length > 0 && (
         <>
          <div className="flex justify-between items-center mt-6 mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Generated</h3>
            <button onClick={onClearSuggestions} className="text-xs font-medium text-brand-primary hover:underline focus:outline-none">Clear</button>
          </div>
          {suggestedElements.map((item, index) => (
            <DraggableItem key={index} item={item} isSuggestion index={index} type="element" onAdd={onAddElement} />
          ))}
        </>
      )}
    </div>
  );
};

export default Palette;
