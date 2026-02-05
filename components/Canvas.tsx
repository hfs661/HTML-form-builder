import React, { useState } from 'react';
import type { FormElement } from '../types';
import FormElementRenderer from './FormElementRenderer';

interface CanvasProps {
  elements: FormElement[];
  setElements: (newElements: FormElement[] | ((prev: FormElement[]) => FormElement[])) => void;
  setSelectedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
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
      name: `${el.name}_${Math.random().toString(36).substring(2, 5)}`,
      children: el.children ? el.children.map(generateNewIds) : undefined
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const isCopy = e.ctrlKey || e.metaKey;
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
        
        if (isCopy) {
          finalItem = generateNewIds(found.node);
        } else {
          finalItem = found.node;
          workingTree = recursiveDelete(prev, draggedItem.id);
        }
      } else {
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

    if (isContainer && relY > rect.height * 0.2 && relY < rect.height * 0.8) {
      setDragOverTarget({ parentId: element.id || null, index: element.children?.length || 0, position: 'inside' });
    } else if (relY < midY) {
      setDragOverTarget({ parentId, index, position: 'top' });
    } else {
      setDragOverTarget({ parentId, index: index + 1, position: 'bottom' });
    }
  };

  const RecursiveList = ({ items, parentId }: { items: FormElement[]; parentId: string | null }) => {
    return (
      <div className={`w-full flex flex-col space-y-3 transition-all duration-300 ${items.length === 0 && parentId ? 'min-h-[100px] border-2 border-dashed border-gray-100 rounded-3xl flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase tracking-widest bg-gray-50/20' : ''}`}>
        {items.length === 0 && parentId && <div className="pointer-events-none opacity-40">Drop items here</div>}
        {items.map((el, idx) => {
          const isSelected = !!el.id && selectedIds.includes(el.id);
          const isDropTarget = dragOverTarget?.parentId === parentId && dragOverTarget?.index === idx;
          const isLastDropTarget = dragOverTarget?.parentId === parentId && dragOverTarget?.index === idx + 1 && dragOverTarget?.position === 'bottom';
          const isBeingDroppedInside = !!el.id && dragOverTarget?.parentId === el.id && dragOverTarget?.position === 'inside';

          return (
            <React.Fragment key={el.id || idx}>
              {isDropTarget && dragOverTarget.position === 'top' && (
                <div className="relative h-2 flex items-center justify-center animate-pulse z-50">
                   <div className="absolute w-full h-1 bg-brand-primary rounded-full shadow-lg" />
                </div>
              )}
              <div 
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                aria-label={`Select ${el.label || el.type}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (el.id) {
                      if (e.shiftKey || e.ctrlKey || e.metaKey) {
                        setSelectedIds(prev => prev.includes(el.id!) ? prev.filter(id => id !== el.id) : [...prev, el.id!]);
                      } else {
                        setSelectedIds([el.id]);
                      }
                    }
                  } else if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (isSelected && el.id) {
                      setElements(prev => recursiveDelete(prev, el.id!));
                      setSelectedIds([]);
                    }
                  }
                }}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (el.id) {
                    if (e.shiftKey || e.ctrlKey || e.metaKey) {
                      setSelectedIds(prev => prev.includes(el.id!) ? prev.filter(id => id !== el.id) : [...prev, el.id!]);
                    } else {
                      setSelectedIds([el.id]);
                    }
                  } 
                }}
                onDragOver={(e) => handleDragOverElement(e, el, parentId, idx)}
                className={`relative rounded-3xl transition-all duration-300 outline-none
                  ${isSelected ? 'ring-2 ring-brand-primary ring-offset-2 shadow-elevated z-10 bg-white' : 'hover:ring-1 hover:ring-gray-200'}
                  ${isBeingDroppedInside ? 'ring-4 ring-brand-primary/30 bg-brand-primary/10 scale-[0.98]' : 'scale-100'} group`}
              >
                <FormElementRenderer element={el} preview={false}>
                  {el.children && <RecursiveList items={el.children} parentId={el.id || null} />}
                </FormElementRenderer>
                
                {isSelected && (
                  <div className="absolute -top-3 -right-3 flex space-x-1 z-20 scale-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); if (el.id) { setElements(prev => recursiveDelete(prev, el.id!)); setSelectedIds([]); } }}
                      className="w-7 h-7 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-lg hover:bg-red-600 transition-all focus:ring-2 focus:ring-red-400 outline-none"
                      title="Delete"
                      aria-label="Delete element"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                )}
              </div>
              {isLastDropTarget && (
                <div className="relative h-2 flex items-center justify-center animate-pulse z-50">
                   <div className="absolute w-full h-1 bg-brand-primary rounded-full shadow-lg" />
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
      className="flex-1 h-full overflow-y-auto bg-[#F0F2F5] p-12 lg:p-16 custom-scrollbar"
      onClick={() => setSelectedIds([])}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDrop={handleDrop}
    >
      <div className={`max-w-5xl mx-auto min-h-[900px] bg-white rounded-[3rem] shadow-panel p-12 lg:p-16 transition-all duration-500 relative border border-gray-100 ${isDragging && !dragOverTarget ? 'ring-8 ring-brand-primary/10 bg-brand-primary/[0.01]' : ''}`}>
        {elements.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none p-16 text-center">
            <div className="w-24 h-24 rounded-[2rem] border-4 border-dashed border-gray-100 flex items-center justify-center mb-10 bg-gray-50/50 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Design Interface</h3>
            <p className="max-w-xs text-sm font-semibold text-gray-400 leading-relaxed px-4">Start by dragging components from the toolkit on the left.</p>
          </div>
        ) : (
          <RecursiveList items={elements} parentId={null} />
        )}
      </div>
    </div>
  );
};

export default Canvas;