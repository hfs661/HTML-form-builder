
import React, { useState, useEffect } from 'react';
import type { FormElement, FormElementType } from '../types';
import FormElementRenderer from './FormElementRenderer';

interface CanvasProps {
  elements: FormElement[];
  setElements: (newElements: FormElement[] | ((prev: FormElement[]) => FormElement[])) => void;
  setSelectedIds: (ids: string[]) => void;
  selectedIds: string[];
  updateElement: (id: string, updatedProps: Partial<FormElement>) => void;
}

const Canvas: React.FC<CanvasProps> = ({ elements, setElements, setSelectedIds, selectedIds, updateElement }) => {
  const [dragOverTarget, setDragOverTarget] = useState<{ parentId: string | null; index: number; position: 'top' | 'bottom' | 'inside' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const recursiveDelete = (tree: FormElement[], id: string): FormElement[] => {
    return tree.filter(node => node.id !== id).map(node => ({
      ...node,
      children: node.children ? recursiveDelete(node.children, id) : undefined
    }));
  };

  const findNodeAndParent = (tree: FormElement[], id: string, parentId: string | null = null): { node: FormElement; parentId: string | null } | null => {
    for (const node of tree) {
      if (node.id === id) return { node, parentId };
      if (node.children) {
        const found = findNodeAndParent(node.children, id, node.id);
        if (found) return found;
      }
    }
    return null;
  };

  const recursiveInsert = (tree: FormElement[], parentId: string | null, index: number, node: FormElement): FormElement[] => {
    if (parentId === null) {
      const newList = [...tree];
      newList.splice(index, 0, node);
      return newList;
    }
    return tree.map(item => {
      if (item.id === parentId) {
        const children = [...(item.children || [])];
        children.splice(index, 0, node);
        return { ...item, children };
      }
      if (item.children) return { ...item, children: recursiveInsert(item.children, parentId, index, node) };
      return item;
    });
  };

  const generateNewIds = (el: FormElement): FormElement => {
    const newId = `${el.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    return {
      ...el,
      id: newId,
      name: `${el.type}_${Math.random().toString(36).substring(2, 5)}_${Date.now().toString(36).slice(-3)}`,
      children: el.children ? el.children.map(generateNewIds) : undefined
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const target = dragOverTarget;
    setDragOverTarget(null);

    const itemData = e.dataTransfer.getData('application/json');
    if (!itemData) return;

    let draggedItem;
    try {
      draggedItem = JSON.parse(itemData);
    } catch (err) {
      return;
    }

    setElements(prev => {
      let finalItem: FormElement;
      let workingTree = prev;

      if (draggedItem.id) {
        const found = findNodeAndParent(prev, draggedItem.id);
        if (!found) return prev;
        finalItem = found.node;
        workingTree = recursiveDelete(prev, draggedItem.id);
      } else {
        if (draggedItem.isSnippet) {
          // Flatten snippet elements or handle specifically if needed
          // For now, snippets should already be formatted correctly
          return prev; 
        }
        finalItem = generateNewIds(draggedItem);
      }

      if (!target) return [...workingTree, finalItem];
      return recursiveInsert(workingTree, target.parentId, target.index, finalItem);
    });
  };

  const handleDragOverElement = (e: React.DragEvent, element: FormElement, parentId: string | null, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const midY = rect.height / 2;

    const isContainer = ['container', 'bootstrap-row', 'bootstrap-col', 'accordion'].includes(element.type);

    if (isContainer && relY > rect.height * 0.25 && relY < rect.height * 0.75) {
      setDragOverTarget({ parentId: element.id || null, index: element.children?.length || 0, position: 'inside' });
    } else if (relY < midY) {
      setDragOverTarget({ parentId, index, position: 'top' });
    } else {
      setDragOverTarget({ parentId, index: index + 1, position: 'bottom' });
    }
  };

  const RecursiveList = ({ items, parentId }: { items: FormElement[]; parentId: string | null }) => {
    return (
      <div className={`w-full flex flex-col space-y-4 transition-all duration-300 ${items.length === 0 ? 'min-h-[60px] border-2 border-dashed border-gray-100 rounded-2xl flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase tracking-widest' : ''}`}>
        {items.length === 0 && parentId && 'Empty Section'}
        {items.map((el, idx) => {
          const isSelected = !!el.id && selectedIds.includes(el.id);
          const isDropTarget = dragOverTarget?.parentId === parentId && dragOverTarget?.index === idx;
          const isLastDropTarget = dragOverTarget?.parentId === parentId && dragOverTarget?.index === idx + 1 && dragOverTarget?.position === 'bottom';
          const isBeingDroppedInside = !!el.id && dragOverTarget?.parentId === el.id && dragOverTarget?.position === 'inside';

          return (
            <React.Fragment key={el.id || idx}>
              {isDropTarget && dragOverTarget.position === 'top' && (
                <div className="relative h-2 flex items-center justify-center animate-pulse">
                   <div className="absolute w-full h-1 bg-brand-primary rounded-full shadow-lg" />
                   <div className="w-4 h-4 bg-brand-primary rounded-full border-2 border-white shadow-md z-10" />
                </div>
              )}
              <div 
                onClick={(e) => { e.stopPropagation(); if (el.id) setSelectedIds([el.id]); }}
                onDragOver={(e) => handleDragOverElement(e, el, parentId, idx)}
                className={`relative rounded-2xl transition-all duration-500 group
                  ${isSelected ? 'ring-2 ring-brand-primary shadow-elevated z-10 bg-white scale-[1.02]' : 'hover:ring-1 hover:ring-gray-300 scale-100'}
                  ${isBeingDroppedInside ? 'ring-4 ring-brand-primary/30 bg-brand-primary/10 shadow-inner' : ''}`}
              >
                <FormElementRenderer element={el} preview={false}>
                  {el.children && <RecursiveList items={el.children} parentId={el.id || null} />}
                </FormElementRenderer>
                
                {isSelected && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (el.id) { setElements(prev => recursiveDelete(prev, el.id!)); setSelectedIds([]); } }}
                    className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-red-600 transition-all z-20 scale-0 group-hover:scale-100 origin-center duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                )}
              </div>
              {isLastDropTarget && (
                <div className="relative h-2 flex items-center justify-center animate-pulse">
                   <div className="absolute w-full h-1 bg-brand-primary rounded-full shadow-lg" />
                   <div className="w-4 h-4 bg-brand-primary rounded-full border-2 border-white shadow-md z-10" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      className="flex-1 h-full overflow-y-auto bg-[#F0F2F5] p-16 custom-scrollbar"
      onClick={() => setSelectedIds([])}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDrop={handleDrop}
    >
      <div className={`max-w-4xl mx-auto min-h-[900px] bg-white rounded-[2.5rem] shadow-panel p-16 transition-all duration-700 relative border border-gray-100 ${isDragging && !dragOverTarget ? 'ring-8 ring-brand-primary/10 bg-brand-primary/[0.02]' : ''}`}>
        {elements.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none p-16 text-center animate-fade-in-staggered">
            <div className="w-32 h-32 rounded-[2rem] border-4 border-dashed border-gray-100 flex items-center justify-center mb-10 bg-gray-50/50 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Interactive Designer</h3>
            <p className="max-w-md text-base font-semibold text-gray-400 leading-relaxed px-4">Start your design journey by dragging elements from the library. Watch as the form adapts in real-time.</p>
          </div>
        ) : (
          <RecursiveList items={elements} parentId={null} />
        )}
      </div>
    </div>
  );
};

export default Canvas;
