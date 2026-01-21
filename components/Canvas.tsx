
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
    <button onClick={onClick} className="absolute top-2 right-2 p-1.5 bg-white text-red-500 border border-gray-200 rounded shadow-sm hover:bg-red-50 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100 z-20 focus:outline-none focus:opacity-100 transform scale-90 hover:scale-100"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
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
        const newWidth = Math.max(50, resizing.startW + deltaX);
        const newHeight = Math.max(20, resizing.startH + deltaY);
        
        updateElement(resizing.id, { 
            styles: { 
                ...elements.find(el => el.id === resizing.id)?.styles,
                width: `${newWidth}px`, 
                height: `${newHeight}px` 
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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, passedTargetParentId: string | null, passedDropIndex: number) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    setIsDragging(false);
    
    const targetParentId = dragOverTarget ? dragOverTarget.parentId : passedTargetParentId;
    const dropIndex = dragOverTarget ? dragOverTarget.index : passedDropIndex;

    setDragOverTarget(null);
    
    const itemData = e.dataTransfer.getData('application/json');
    if (!itemData) return;
    
    let draggedItem;
    try {
        draggedItem = JSON.parse(itemData);
    } catch(err) {
        console.error("Failed to parse dropped item", err);
        return;
    }

    if (draggedItem.id) {
        setElements((prev) => {
             if (draggedItem.id === targetParentId) return prev;
             const found = findNodeParent(prev, draggedItem.id);
             if (!found) return prev;
             
             let newTree = recursiveDelete(prev, draggedItem.id);
             
             let finalIndex = dropIndex;
             if (found.parentId === targetParentId) {
                 const siblings = found.parentId === null ? prev : prev.find(n => n.id === found.parentId)?.children || [];
                 const oldIndex = siblings.findIndex(x => x.id === draggedItem.id);
                 if (oldIndex < dropIndex) finalIndex--;
             }
             if (finalIndex < 0) finalIndex = 0;

             return recursiveUpdate(newTree, targetParentId, (list) => {
                 const newList = [...list];
                 newList.splice(finalIndex, 0, found.node);
                 return newList;
             });
        });
        return;
    }
    
    const getSmartLabel = (type: string, name?: string, label?: string) => {
        if (label && label !== 'New Element') return label;
        if (name && !name.match(/^(el_|group_|ai_group_)\d+$/) && !name.startsWith('col')) {
             return name.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim().replace(/^\w/, c => c.toUpperCase());
        }
        const typeMap: Record<string, string> = {
            text: 'Text Input', textarea: 'Text Area', number: 'Number Input', 
            email: 'Email', password: 'Password', date: 'Date Picker',
            select: 'Dropdown', checkbox: 'Checkbox', radio: 'Radio Group',
            button: 'Button', 'reset-button': 'Reset Button', file: 'File Upload', 
            container: 'Container', accordion: 'Accordion', 'news-card': 'News Card',
            table: 'Data Table', navbar: 'Navigation Bar', iframe: 'Embedded Frame',
            divider: 'Divider', 'html-block': 'HTML Block', typography: 'Text Block',
            image: 'Image', 'bootstrap-row': 'Flex Row', 'bootstrap-col': 'Flex Column'
        };
        return typeMap[type] || 'New Element';
    };

    const generateUniqueName = (type: string, providedName?: string) => {
        const genericNames = ['text', 'container', 'button', 'header', 'row', 'col', 'bootstrap-row', 'bootstrap-col', 'textarea', 'select', 'checkbox', 'radio', 'image'];
        if (providedName && !genericNames.includes(providedName)) return providedName;
        return `${type}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 4)}`;
    };

    const createNewElement = (data: any): FormElement => ({
      id: `${data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: data.type as FormElementType,
      label: getSmartLabel(data.type, data.name, data.label),
      name: generateUniqueName(data.type, data.name),
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

  const handleDragOverElement = (e: React.DragEvent<HTMLDivElement>, parentId: string | null, index: number, element: FormElement, layoutDirection: 'row' | 'column') => {
    e.preventDefault(); 
    e.stopPropagation(); 
    setIsDragging(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const isContainer = ['container', 'bootstrap-col', 'accordion', 'bootstrap-row'].includes(element.type);
    
    if (isContainer) {
        if (!element.children || element.children.length === 0) {
             setDragOverTarget({ parentId: element.id, index: 0, position: 'inside' });
             return;
        }

        const isRow = layoutDirection === 'row';
        const reorderZoneSize = 15; 
        
        let isInReorderZone = false;
        if (isRow) {
            isInReorderZone = (e.clientX < rect.left + reorderZoneSize) || (e.clientX > rect.right - reorderZoneSize);
        } else {
            isInReorderZone = (e.clientY < rect.top + reorderZoneSize) || (e.clientY > rect.bottom - reorderZoneSize);
        }

        if (!isInReorderZone) {
            setDragOverTarget({ 
                parentId: element.id, 
                index: element.children.length, 
                position: 'inside' 
            });
            return;
        }
    }

    let isAfter = false;
    if (layoutDirection === 'row') {
        const midX = rect.left + rect.width / 2;
        isAfter = e.clientX > midX;
    } else {
        const midY = rect.top + rect.height / 2;
        isAfter = e.clientY > midY;
    }
    
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

  const RecursiveList = ({ items, parentId, layoutDirection = 'column' }: { items: FormElement[], parentId: string | null, layoutDirection?: 'row' | 'column' }) => {
      return (
          <>
            {items.map((element, index) => {
                const isSelected = selectedIds.includes(element.id);
                const s = element.styles || {};
                
                let childLayoutDirection: 'row' | 'column' = 'column';
                if (element.type === 'bootstrap-row' || (s.display === 'flex' && s.flexDirection === 'row')) {
                    childLayoutDirection = 'row';
                }

                const wrapperStyle: React.CSSProperties = { 
                    width: s.width, 
                    height: s.height, 
                    gridColumn: s.gridColumn, 
                    gridRow: s.gridRow, 
                    flexGrow: s.flexGrow ? Number(s.flexGrow) : undefined,
                    flexShrink: s.flexShrink ? Number(s.flexShrink) : undefined,
                    flexBasis: s.flexBasis,
                    alignSelf: s.alignSelf,
                    marginBottom: layoutDirection === 'column' ? '12px' : '0',
                };

                const showDropBefore = dragOverTarget?.parentId === parentId && dragOverTarget?.index === index && dragOverTarget?.position === 'before';
                const showDropAfter = dragOverTarget?.parentId === parentId && dragOverTarget?.index === index + 1 && dragOverTarget?.position === 'after';
                const showDropInside = dragOverTarget?.parentId === element.id && dragOverTarget?.position === 'inside';

                const flexGapClass = (element.type === 'bootstrap-row') ? '' : 'gap-2';

                return (
                  <div key={element.id} style={wrapperStyle} className={`relative transition-all duration-200 ${layoutDirection === 'column' ? 'last:mb-0' : ''}`}>
                     
                     {showDropBefore && (
                        <div className={`absolute z-50 pointer-events-none flex items-center justify-center ${layoutDirection === 'row' ? 'top-0 bottom-0 -left-1.5 w-3' : '-top-3 left-0 right-0 h-1.5'}`}>
                            <div className={`${layoutDirection === 'row' ? 'h-full w-[3px]' : 'w-full h-[3px]'} bg-brand-primary shadow-lg relative rounded-full`}>
                                 <div className={`absolute ${layoutDirection === 'row' ? 'top-0 -left-1.5' : 'left-0 -top-1.5'} w-3.5 h-3.5 bg-brand-primary rounded-full shadow-sm transform -translate-x-1/2 border-2 border-white`}></div>
                            </div>
                        </div>
                     )}

                     <div
                        draggable={!resizing}
                        onClick={(e) => { e.stopPropagation(); handleSelect(element.id, e.ctrlKey || e.metaKey || e.shiftKey); }}
                        onDoubleClick={(e) => { e.stopPropagation(); handleSelect(element.id, false); setEditingElementId(element.id); }}
                        onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('application/json', JSON.stringify(element)); setIsDragging(true); }}
                        onDragOver={(e) => handleDragOverElement(e, parentId, index, element, layoutDirection)}
                        onDrop={(e) => handleDrop(e, parentId, dragOverTarget?.index ?? index)}
                        onKeyDown={(e) => handleKeyDown(e, element.id)}
                        tabIndex={0}
                        role="button"
                        aria-label={`Select ${element.label}`}
                        className={`group relative p-1 rounded transition-all duration-150 outline-none
                            ${isSelected ? 'ring-2 ring-brand-primary ring-offset-2 z-10' : 'hover:ring-1 hover:ring-gray-300'} 
                            ${showDropInside ? 'ring-2 ring-brand-primary bg-blue-50/50' : ''}
                            ${dragOverTarget?.parentId === parentId && (dragOverTarget?.index === index || dragOverTarget?.index === index + 1) ? 'opacity-80' : ''}`}
                     >
                        <FormElementRenderer element={element} isEditing={editingElementId === element.id} onStartEditing={setEditingElementId} onStopEditing={() => setEditingElementId(null)} onUpdate={updateElement}>
                            {['container', 'accordion', 'bootstrap-row', 'bootstrap-col'].includes(element.type) && (
                                <div className={`min-h-[40px] pt-2 flex ${childLayoutDirection === 'row' ? `flex-row flex-wrap ${flexGapClass}` : 'flex-col'} h-full w-full`}>
                                    <RecursiveList items={element.children || []} parentId={element.id} layoutDirection={childLayoutDirection} />
                                    <div 
                                        className={`flex-grow border border-dashed rounded flex items-center justify-center text-xs font-medium transition-colors mt-2 mx-1 cursor-pointer
                                            ${dragOverTarget?.parentId === element.id && dragOverTarget?.position === 'inside' ? 'border-brand-primary bg-blue-100 text-brand-primary' : 'border-gray-200 text-gray-300 hover:border-gray-300 hover:text-gray-400 hover:bg-gray-50'}
                                            ${childLayoutDirection === 'row' ? 'min-w-[50px] w-auto' : 'w-full'}
                                            ${(!element.children || element.children.length === 0) ? 'min-h-[60px] h-full' : 'min-h-[30px]'}
                                            `} 
                                        onDragOver={(e) => handleDragOverContainer(e, element.id, element.children?.length || 0)} 
                                        onDrop={(e) => handleDrop(e, element.id, element.children?.length || 0)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelect(element.id);
                                        }}
                                        title="Drop here or click to select this container"
                                    >
                                        <div className={`transform transition-transform ${isDragging || (!element.children || element.children.length === 0) ? 'scale-100' : 'scale-0'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </FormElementRenderer>
                        
                        {isSelected && selectedIds.length === 1 && element.type !== 'bootstrap-col' && (
                            <div 
                                className="absolute bottom-0 right-0 w-3 h-3 bg-brand-primary cursor-se-resize rounded-tl-sm z-30 flex items-center justify-center hover:w-4 hover:h-4 transition-all" 
                                onMouseDown={(e) => handleResizeStart(e, element)}
                            >
                                <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 19L5 5" /></svg>
                            </div>
                        )}
                        <TrashIcon onClick={(e) => { e.stopPropagation(); setElements(prev => recursiveDelete(prev, element.id)); setSelectedIds([]); }} />
                     </div>

                     {showDropAfter && (
                        <div className={`absolute z-50 pointer-events-none flex items-center justify-center ${layoutDirection === 'row' ? 'top-0 bottom-0 -right-1.5 w-3' : '-bottom-3 left-0 right-0 h-1.5'}`}>
                            <div className={`${layoutDirection === 'row' ? 'h-full w-[3px]' : 'w-full h-[3px]'} bg-brand-primary shadow-lg relative rounded-full`}>
                                 <div className={`absolute ${layoutDirection === 'row' ? 'top-0 -left-1.5' : 'left-0 -top-1.5'} w-3.5 h-3.5 bg-brand-primary rounded-full shadow-sm transform -translate-x-1/2 border-2 border-white`}></div>
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
        className="flex-1 p-8 overflow-y-auto bg-gray-100/50" 
        onClick={() => setSelectedIds([])} 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); setDragOverTarget({ parentId: null, index: elements.length, position: 'inside' }); }} 
        onDrop={(e) => handleDrop(e, null, elements.length)}
    >
      <div 
        className={`max-w-4xl mx-auto min-h-[800px] bg-white shadow-xl rounded-lg transition-all duration-300 relative border border-gray-200
            ${dragOverTarget?.parentId === null ? 'ring-2 ring-brand-primary ring-offset-4 ring-offset-gray-100' : ''}`}
        style={{ padding: '40px' }} 
      >
        {elements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 pointer-events-none">
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <p className="text-lg font-medium">Drag and drop elements to build your form</p>
                <p className="text-sm">or click elements in the sidebar</p>
            </div>
        )}
        
        <RecursiveList items={elements} parentId={null} layoutDirection="column" />
        
        <div className={`h-16 w-full rounded border-2 border-dashed mt-4 flex items-center justify-center text-sm font-medium transition-all
            ${isDragging ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 mt-0'}
            ${dragOverTarget?.parentId === null ? 'border-brand-primary text-brand-primary bg-blue-50' : 'border-gray-200 text-gray-300'}`}>
            Drop here to append to bottom
        </div>
      </div>
    </div>
  );
};

export default Canvas;
