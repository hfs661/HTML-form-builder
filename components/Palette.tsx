
import React, { useState, useEffect } from 'react';
import type { PaletteItem, FormElement, SnippetItem } from '../types';
import { STANDARD_ELEMENTS, SNIPPETS, SCRIPT_SNIPPETS, STYLE_SNIPPETS, LAYOUT_SNIPPETS, WEBSITE_SNIPPETS } from '../constants';

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
        if (item.type === 'bootstrap-col') {
             data.styles = { flexGrow: '1' };
        }
        e.dataTransfer.setData('application/json', JSON.stringify(data));
    }
  };
  
  const handleAdd = (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation();
      if (onAdd) {
        const payload = type === 'snippet' ? { isSnippet: true, elements: item.elements } : { ...item };
        if (item.label === 'Grid Row (12-Col)') {
            payload.styles = { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem', padding: '1rem' };
        }
        if (item.type === 'bootstrap-col') {
             payload.styles = { flexGrow: '1' };
        }
        onAdd(payload);
      }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleAdd(e);
    }
  };
  
  const animationStyle = isSuggestion ? { animationDelay: `${index * 75}ms`, opacity: 0 } : {};
  const animationClass = isSuggestion ? 'animate-fade-in-staggered' : '';
  
  const icon = item.icon || (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
      </svg>
  );

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onKeyDown={handleKeyDown}
      onClick={handleAdd}
      tabIndex={0}
      role="button"
      aria-label={`Add ${item.label}`}
      className={`group flex items-center p-2 mb-1.5 rounded border cursor-grab transition-all duration-150 ease-in-out ${isSuggestion ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-100' : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-brand-primary/50'} shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-primary ${animationClass} relative`}
      style={animationStyle}
    >
      <div className="text-gray-400 group-hover:text-brand-primary transition-colors">{icon}</div>
      <span className="text-xs font-medium truncate pr-6">{item.label}</span>
      <div className="ml-auto opacity-0 group-hover:opacity-100 text-brand-primary font-bold text-lg leading-none transition-opacity mr-2" title="Click to add">+</div>
      {onRemove && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity focus:opacity-100"
          title="Delete template"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};


const Palette: React.FC<PaletteProps> = ({ suggestedElements, onClearSuggestions, onAddElement }) => {
  const [userTemplates, setUserTemplates] = useState<SnippetItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadTemplates = () => {
      const saved = localStorage.getItem('formBuilderTemplates');
      if (saved) setUserTemplates(JSON.parse(saved));
    };
    loadTemplates();
    window.addEventListener('storage', loadTemplates);
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
  
  const matchesSearch = (label: string) => label.toLowerCase().includes(searchTerm.toLowerCase());

  return (
    <div className="w-full md:w-64 lg:w-72 bg-white h-full flex flex-col border-r border-gray-200">
      <div className="p-3 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-2">Toolkit</h2>
        <input 
            type="text" 
            placeholder="Search elements..." 
            className="w-full text-xs p-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {userTemplates.length > 0 && (
            <div className="mb-4">
            <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2">My Templates</h3>
            {userTemplates.filter(t => matchesSearch(t.label)).map((template) => (
                <DraggableItem 
                key={template.id} 
                item={template} 
                type="snippet" 
                onRemove={() => template.id && removeTemplate(template.id)}
                onAdd={onAddElement}
                />
            ))}
            </div>
        )}

        <div className="mb-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Basic Elements</h3>
            {STANDARD_ELEMENTS.filter(i => matchesSearch(i.label)).map((item: PaletteItem) => (
                <DraggableItem key={item.label} item={{...item, name: item.type}} type="element" onAdd={onAddElement} />
            ))}
        </div>

        <div className="mb-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Website Sections</h3>
            {WEBSITE_SNIPPETS.filter(s => matchesSearch(s.label)).map((snippet, idx) => (
                <DraggableItem key={`website-snippet-${idx}`} item={snippet} type="snippet" onAdd={onAddElement} />
            ))}
        </div>

        <div className="mb-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Column Layouts</h3>
            {LAYOUT_SNIPPETS.filter(s => matchesSearch(s.label)).map((snippet, idx) => (
                <DraggableItem key={`layout-${idx}`} item={snippet} type="snippet" onAdd={onAddElement} />
            ))}
        </div>
        
        {suggestedElements.length > 0 && (
            <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">AI Generated</h3>
                <button onClick={onClearSuggestions} className="text-[10px] font-medium text-red-400 hover:text-red-600">Clear</button>
            </div>
            {suggestedElements.map((item, index) => (
                <DraggableItem key={index} item={item} isSuggestion index={index} type="element" onAdd={onAddElement} />
            ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Palette;
