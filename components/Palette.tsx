
import React from 'react';
import type { PaletteItem, FormElement, SnippetItem } from '../types';
import { STANDARD_ELEMENTS, SNIPPETS, SCRIPT_SNIPPETS, STYLE_SNIPPETS } from '../constants';

interface PaletteProps {
  suggestedElements: Partial<FormElement>[];
  onClearSuggestions: () => void;
}

const DraggableItem: React.FC<{ item: any, type: 'element' | 'snippet', isSuggestion?: boolean, index?: number }> = ({ item, type, isSuggestion = false, index = 0 }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (type === 'snippet') {
        e.dataTransfer.setData('application/json', JSON.stringify({ isSnippet: true, elements: item.elements }));
    } else {
        e.dataTransfer.setData('application/json', JSON.stringify(item));
    }
  };
  
  const animationStyle = isSuggestion ? { animationDelay: `${index * 75}ms`, opacity: 0 } : {};
  const animationClass = isSuggestion ? 'animate-fade-in-staggered' : '';
  
  const icon = item.icon || (
      // Default icon for snippets
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
      </svg>
  );

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`flex items-center p-3 mb-2 rounded-md cursor-grab transition-all duration-150 ease-in-out ${isSuggestion ? 'bg-blue-100 hover:bg-blue-200 text-blue-800' : 'bg-white hover:bg-gray-100 text-brand-text'} border border-gray-200 shadow-sm hover:shadow-md ${animationClass}`}
      style={animationStyle}
    >
      {icon}
      <span>{item.label}</span>
    </div>
  );
};


const Palette: React.FC<PaletteProps> = ({ suggestedElements, onClearSuggestions }) => {
  return (
    <div className="w-full md:w-72 lg:w-80 p-4 bg-brand-light-gray h-full overflow-y-auto border-r border-gray-300 custom-scrollbar">
      <h2 className="text-xl font-bold text-brand-text mb-4">Components</h2>
      
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-2">Elements</h3>
      {STANDARD_ELEMENTS.map((item: PaletteItem) => (
        <DraggableItem key={item.type} item={{...item, name: item.type}} type="element" />
      ))}

      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6">Styled Templates</h3>
      {STYLE_SNIPPETS.map((snippet: SnippetItem, index) => (
          <DraggableItem key={`style-snippet-${index}`} item={snippet} type="snippet" />
      ))}

      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6">Function Templates</h3>
      {SCRIPT_SNIPPETS.map((snippet: SnippetItem, index) => (
          <DraggableItem key={`script-snippet-${index}`} item={snippet} type="snippet" />
      ))}

      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 mt-6">Form Layouts</h3>
      {SNIPPETS.map((snippet: SnippetItem, index) => (
          <DraggableItem key={`snippet-${index}`} item={snippet} type="snippet" />
      ))}
      
      
      {suggestedElements.length > 0 && (
         <>
          <div className="flex justify-between items-center mt-6 mb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Suggestions</h3>
            <button onClick={onClearSuggestions} className="text-xs font-medium text-brand-primary hover:underline focus:outline-none">Clear</button>
          </div>
          {suggestedElements.map((item, index) => (
            <DraggableItem key={index} item={item} isSuggestion index={index} type="element" />
          ))}
        </>
      )}
    </div>
  );
};

export default Palette;
