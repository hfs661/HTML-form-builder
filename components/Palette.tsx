import React from 'react';
import type { PaletteItem, FormElement } from '../types';
import { STANDARD_ELEMENTS } from '../constants';

interface PaletteProps {
  suggestedElements: Partial<FormElement>[];
  onClearSuggestions: () => void;
}

// FIX: Replaced JSX.Element with React.ReactElement to resolve "Cannot find namespace 'JSX'" error.
const DraggableItem: React.FC<{ item: Partial<FormElement> & { icon?: React.ReactElement, label: string }, isSuggestion?: boolean, index?: number }> = ({ item, isSuggestion = false, index = 0 }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
  };
  
  const animationStyle = isSuggestion ? { animationDelay: `${index * 75}ms`, opacity: 0 } : {};
  const animationClass = isSuggestion ? 'animate-fade-in-staggered' : '';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`flex items-center p-3 mb-2 rounded-md cursor-grab transition-all duration-150 ease-in-out ${isSuggestion ? 'bg-blue-100 hover:bg-blue-200 text-blue-800' : 'bg-white hover:bg-gray-100 text-brand-text'} border border-gray-200 shadow-sm hover:shadow-md ${animationClass}`}
      style={animationStyle}
    >
      {item.icon}
      <span>{item.label}</span>
    </div>
  );
};


const Palette: React.FC<PaletteProps> = ({ suggestedElements, onClearSuggestions }) => {
  return (
    <div className="w-full md:w-72 lg:w-80 p-4 bg-brand-light-gray h-full overflow-y-auto border-r border-gray-300">
      <h2 className="text-xl font-bold text-brand-text mb-4">Form Elements</h2>
      
      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">Standard</h3>
      {STANDARD_ELEMENTS.map((item: PaletteItem) => (
        <DraggableItem key={item.type} item={{...item, name: item.type}} />
      ))}
      
      {suggestedElements.length > 0 && (
         <>
          <div className="flex justify-between items-center mt-6 mb-2">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">AI Suggestions</h3>
            <button onClick={onClearSuggestions} className="text-xs font-medium text-brand-primary hover:underline focus:outline-none">Clear</button>
          </div>
          {suggestedElements.map((item, index) => (
            <DraggableItem key={index} item={item} isSuggestion index={index} />
          ))}
        </>
      )}
    </div>
  );
};

export default Palette;