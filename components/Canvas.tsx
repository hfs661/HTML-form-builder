
import React, { useState, useEffect, useRef } from 'react';
import type { FormElement, FormElementType } from '../types';
import FormElementRenderer from './FormElementRenderer';

interface CanvasProps {
  elements: FormElement[];
  setElements: (newElements: FormElement[] | ((prev: FormElement[]) => FormElement[])) => void;
  setSelectedIds: (ids: string[]) => void;
  selectedIds: string[];
  updateElement: (id: string, updatedProps: Partial<FormElement>) => void;
}

const TrashIcon: React.FC<{onClick: (e: React.MouseEvent) => void}> = ({onClick}) => (
    <button onClick={onClick} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-opacity opacity-0 group-hover:opacity-100 z-10 focus:outline-none focus:opacity-100 shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
);

const Canvas: React.FC<CanvasProps> = ({ elements, setElements, setSelectedIds, selectedIds, updateElement }) => {
  const [dragOverTarget, setDragOverTarget] = useState<{ parentId: string | null, index: number, position: 'before' | 'after' | 'inside' } | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [resizing, setResizing] = useState<{ id: string, startX: number, startY: number, startW: number, startH: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const recursiveUpdate = (tree: FormElement[], parentId: string | null, updateFn: (list: FormElement[]) => FormElement[]): FormElement[] => {
      if (parentId === null) return updateFn(tree);
      return tree.map(node => {
          if (node.id === parentId) return { ...node, children: updateFn(node.children || []) };
          if (node.children) return { ...node, children: recursiveUpdate(node.children, parentId, updateFn) };
          return node;
      });
  };

  const recursiveDelete = (tree: FormElement[], id: string): FormElement[] => {
      return tree.filter(node => node.id !== id).map(node => ({
          ...node,
          children: node.children ? recursiveDelete(node.children, id) : undefined
      }));
  };
  
  const findNodeParent = (tree: FormElement[], id: string, parentId: string | null = null): { node: FormElement, parentId: string | null } | null => {
      for (const node of tree) {
          if (node.id === id) return { node, parentId };
          if (node.children) {
              const found = findNodeParent(node.children, id, node.id);
              if (found) return found;
          }
      }
      return null;
  };

  useEffect(() => {
    if (!resizing) return;
    const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - resizing.startX;
        const deltaY = e.clientY - resizing.startY;
        updateElement(resizing.id, { 
            styles: { 
                ...elements.find(el => el.id === resizing.id)?.styles,
                width: `${Math.max(50, resizing.startW + deltaX)}px`, 
                height: `${Math.max(20, resizing.startH + deltaY)}px` 
            } 
        });
    };
    const handleMouseUp = () => setResizing(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [resizing, updateElement, elements]); 
  
  const handleResizeStart = (e: React.MouseEvent, element: FormElement) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect();
      if (!rect) return;
      setResizing({ id: element.id, startX: e.clientX, startY: e.clientY, startW: rect.width, startH: rect.height });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetParentId: string | null, dropIndex: number) => {
    e.preventDefault(); 
    e.stopPropagation(); // Critical to stop parent containers from also accepting
    setIsDragging(false);
    setDragOverTarget(null);
    
    const itemData = e.dataTransfer.getData('application/json');
    if (!itemData) return;
    const draggedItem = JSON.parse(itemData);

    // If moving an existing item
    if (draggedItem.id) {
        setElements((prev) => {
             // Don't drop on self
             if (draggedItem.id === targetParentId) return prev;
             
             const found = findNodeParent(prev, draggedItem.id);
             if (!found) return prev;
             
             // Remove from old location
             let newTree = recursiveDelete(prev, draggedItem.id);
             
             // Adjust index if moving within same container
             let finalIndex = dropIndex;
             if (found.parentId === targetParentId) {
                 const oldIndex = (found.parentId === null ? prev : prev.find(n => n.id === found.parentId)?.children || []).findIndex(x => x.id === draggedItem.id);
                 if (oldIndex < dropIndex) finalIndex--;
             }
             if (finalIndex < 0) finalIndex = 0;

             // Add to new location
             return recursiveUpdate(newTree, targetParentId, (list) => {
                 const newList = [...list];
                 newList.splice(finalIndex, 0, found.node);
                 return newList;
             });
        });
        return;
    }
    
    // If adding a new item
    const createNewElement = (data: any): FormElement => ({
      id: `${data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: data.type as FormElementType,
      label: data.label || 'New Element',
      name: data.name || `el_${Date.now()}`,
      options: data.options,
      children: data.children?.map((c: any) => createNewElement(c)),
      styles: { size: 'medium', ...(data.styles || {}) },
      textContent: data.textContent,
      headingLevel: data.headingLevel,
      src: data.src,
      altText: data.altText
    });

    setElements((prev) => recursiveUpdate(prev, targetParentId, (list) => {
        const newList = [...list];
        const elementsToAdd = draggedItem.isSnippet ? draggedItem.elements.map(createNewElement) : [createNewElement(draggedItem)];
        newList.splice(dropIndex, 0, ...elementsToAdd);
        return newList;
    }));
  };

  const handleDragOverElement = (e: React.DragEvent<HTMLDivElement>, parentId: string | null, index: number, elementId: string) => {
    e.preventDefault(); 
    e.stopPropagation(); // Critical!
    setIsDragging(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const isAfter = e.clientY > midY;
    
    // If hovering an empty container, or specific types, we might want to drop *inside*
    // but here we are handling the 'between' logic on the wrapper.
    
    setDragOverTarget({ 
        parentId, 
        index: isAfter ? index + 1 : index,
        position: isAfter ? 'after' : 'before'
    });
  };

  const handleDragOverContainer = (e: React.DragEvent<HTMLDivElement>, elementId: string, currentLength: number) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      // Appending to the end of the container
      setDragOverTarget({
          parentId: elementId,
          index: currentLength,
          position: 'inside'
      });
  }

  const handleSelect = (id: string, multiSelect: boolean = false) => {
      if (multiSelect) {
          if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(x => x !== id));
          else setSelectedIds([...selectedIds, id]);
      } else {
          setSelectedIds([id]);
      }
      setEditingElementId(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          handleSelect(id, e.ctrlKey || e.metaKey || e.shiftKey);
      }
  };

  const RecursiveList = ({ items, parentId }: { items: FormElement[], parentId: string | null }) => {
      return (
          <>
            {items.map((element, index) => {
                const isSelected = selectedIds.includes(element.id);
                const s = element.styles || {};
                const wrapperStyle: React.CSSProperties = { 
                    width: s.width, 
                    height: s.height, 
                    gridColumn: s.gridColumn, 
                    gridRow: s.gridRow, 
                    flexGrow: s.flexGrow ? Number(s.flexGrow) : undefined,
                    marginBottom: '8px' // spacing between items
                };

                // Check if the drop target is immediately before this item
                const showDropBefore = dragOverTarget?.parentId === parentId && dragOverTarget?.index === index && dragOverTarget?.position === 'before';
                // Check if the drop target is immediately after this item
                const showDropAfter = dragOverTarget?.parentId === parentId && dragOverTarget?.index === index + 1 && dragOverTarget?.position === 'after';

                return (
                  <div key={element.id} style={wrapperStyle} className="relative transition-all duration-200">
                     
                     {/* Drop Indicator - Before */}
                     {showDropBefore && (
                        <div className="absolute -top-3 left-0 right-0 h-1.5 z-50 pointer-events-none flex items-center justify-center animate-fade-in-staggered">
                            <div className="w-full h-[3px] bg-brand-primary shadow-lg relative rounded-full">
                                 <div className="absolute left-0 -top-1.5 w-3.5 h-3.5 bg-brand-primary rounded-full shadow-sm transform -translate-x-1/2 border-2 border-white"></div>
                            </div>
                        </div>
                     )}

                     <div
                        draggable={!resizing}
                        onClick={(e) => { e.stopPropagation(); handleSelect(element.id, e.ctrlKey || e.metaKey || e.shiftKey); }}
                        onDoubleClick={(e) => { e.stopPropagation(); handleSelect(element.id, false); setEditingElementId(element.id); }}
                        onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('application/json', JSON.stringify(element)); setIsDragging(true); }}
                        onDragOver={(e) => handleDragOverElement(e, parentId, index, element.id)}
                        onDrop={(e) => handleDrop(e, parentId, dragOverTarget?.index ?? index)} // Use the calculated index from dragOver
                        onKeyDown={(e) => handleKeyDown(e, element.id)}
                        tabIndex={0}
                        role="button"
                        aria-label={`Select ${element.label}`}
                        className={`group relative p-4 border rounded-md cursor-grab active:cursor-grabbing transition-all duration-150 outline-none 
                            ${isSelected ? 'border-brand-primary ring-2 ring-brand-primary ring-offset-1 z-10' : 'border-gray-300 hover:border-gray-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50'} 
                            ${dragOverTarget?.parentId === parentId && (dragOverTarget?.index === index || dragOverTarget?.index === index + 1) ? 'bg-blue-50/50' : 'bg-white'} 
                            h-full shadow-sm hover:shadow-md`}
                     >
                        <FormElementRenderer element={element} isEditing={editingElementId === element.id} onStartEditing={setEditingElementId} onStopEditing={() => setEditingElementId(null)} onUpdate={updateElement}>
                            {['container', 'accordion'].includes(element.type) && (
                                <div className="min-h-[40px] pt-2 flex flex-col h-full">
                                    <RecursiveList items={element.children || []} parentId={element.id} />
                                    
                                    {/* Container Append Zone */}
                                    <div 
                                        className={`flex-grow min-h-[30px] border-2 border-dashed rounded flex items-center justify-center text-xs font-medium transition-colors mt-2 
                                            ${dragOverTarget?.parentId === element.id && dragOverTarget?.position === 'inside' ? 'border-brand-primary bg-blue-50 text-brand-primary' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`} 
                                        onDragOver={(e) => handleDragOverContainer(e, element.id, element.children?.length || 0)} 
                                        onDrop={(e) => handleDrop(e, element.id, element.children?.length || 0)}
                                    >
                                        {element.children && element.children.length === 0 ? "Drop items inside" : (isDragging ? "Drop here to append" : "")}
                                    </div>
                                </div>
                            )}
                        </FormElementRenderer>
                        
                        {isSelected && selectedIds.length === 1 && (
                            <div 
                                className="absolute bottom-0 right-0 w-3 h-3 bg-brand-primary cursor-se-resize rounded-tl-sm z-30 flex items-center justify-center hover:w-4 hover:h-4 transition-all" 
                                onMouseDown={(e) => handleResizeStart(e, element)}
                            >
                                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 19L5 5" /></svg>
                            </div>
                        )}
                        <TrashIcon onClick={(e) => { e.stopPropagation(); setElements(prev => recursiveDelete(prev, element.id)); setSelectedIds([]); }} />
                     </div>

                     {/* Drop Indicator - After */}
                     {showDropAfter && (
                        <div className="absolute -bottom-3 left-0 right-0 h-1.5 z-50 pointer-events-none flex items-center justify-center animate-fade-in-staggered">
                            <div className="w-full h-[3px] bg-brand-primary shadow-lg relative rounded-full">
                                 <div className="absolute left-0 -top-1.5 w-3.5 h-3.5 bg-brand-primary rounded-full shadow-sm transform -translate-x-1/2 border-2 border-white"></div>
                            </div>
                        </div>
                     )}
                  </div>
                );
            })}
          </>
      );
  };

  return (
    <div 
        className="flex-1 p-6 md:p-8 lg:p-12 min-h-full" 
        onClick={() => setSelectedIds([])} 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); setDragOverTarget({ parentId: null, index: elements.length, position: 'inside' }); }} 
        onDrop={(e) => handleDrop(e, null, elements.length)}
    >
      <div className={`p-6 min-h-[600px] border-2 border-dashed rounded-xl transition-all duration-300 space-y-4 shadow-sm bg-white ${dragOverTarget?.parentId === null ? 'border-brand-primary bg-blue-50/10' : 'border-gray-200'}`}>
        {elements.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 pointer-events-none animate-fade-in-staggered">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <p className="text-xl font-medium text-gray-500">Drag elements here to start building</p>
                <p className="text-sm opacity-75 mt-2">or select a template from the left</p>
            </div>
        )}
        <RecursiveList items={elements} parentId={null} />
        
        {/* Main Canvas Append Zone */}
        <div className={`h-24 w-full rounded-lg border-2 border-dashed flex items-center justify-center text-sm font-medium text-gray-400 transition-colors ${dragOverTarget?.parentId === null ? 'border-brand-primary text-brand-primary bg-blue-50' : 'border-gray-100 bg-gray-50/50 hover:border-gray-300'}`}>
            {isDragging ? "Drop here to append to bottom" : ""}
        </div>
      </div>
    </div>
  );
};

export default Canvas;
