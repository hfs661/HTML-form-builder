
import React, { useState, useEffect } from 'react';
import type { FormElement, FormElementType } from '../types';
import FormElementRenderer from './FormElementRenderer';

interface CanvasProps {
  elements: FormElement[];
  setElements: (newElements: FormElement[] | ((prev: FormElement[]) => FormElement[])) => void;
  setSelectedElement: (element: FormElement | null) => void;
  selectedElement: FormElement | null;
  updateElement: (id: string, updatedProps: Partial<FormElement>) => void;
}

const TrashIcon: React.FC<{onClick: (e: React.MouseEvent) => void}> = ({onClick}) => (
    <button 
        onClick={onClick} 
        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-opacity opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus:opacity-100 z-10 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-sm"
        title="Delete Element"
        aria-label="Delete Element"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
    </button>
);


const Canvas: React.FC<CanvasProps> = ({ elements, setElements, setSelectedElement, selectedElement, updateElement }) => {
  const [dragOverTarget, setDragOverTarget] = useState<{ parentId: string | null, index: number } | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  
  // Resize State
  const [resizing, setResizing] = useState<{ id: string, startX: number, startY: number, startW: number, startH: number } | null>(null);

  // Helper to recursively find and update tree
  const recursiveUpdate = (tree: FormElement[], parentId: string | null, updateFn: (list: FormElement[]) => FormElement[]): FormElement[] => {
      if (parentId === null) {
          return updateFn(tree);
      }
      return tree.map(node => {
          if (node.id === parentId) {
              return { ...node, children: updateFn(node.children || []) };
          }
          if (node.children) {
              return { ...node, children: recursiveUpdate(node.children, parentId, updateFn) };
          }
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

  // Resize Effects
  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - resizing.startX;
        const deltaY = e.clientY - resizing.startY;
        
        const newW = resizing.startW + deltaX;
        const newH = resizing.startH + deltaY;
        
        // Use updated updateElement which supports deep merge (preserves other styles)
        updateElement(resizing.id, { 
            styles: { 
                width: `${Math.max(50, newW)}px`,
                height: `${Math.max(20, newH)}px`
            }
        });
    };

    const handleMouseUp = () => {
        setResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, updateElement]); 
  
  const handleResizeStart = (e: React.MouseEvent, element: FormElement) => {
      e.stopPropagation();
      e.preventDefault();
      const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
      if (!rect) return;
      setResizing({
          id: element.id,
          startX: e.clientX,
          startY: e.clientY,
          startW: rect.width,
          startH: rect.height
      });
  };


  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetParentId: string | null, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
    
    const itemData = e.dataTransfer.getData('application/json');
    if (!itemData) return;

    const draggedItem = JSON.parse(itemData);

    if (draggedItem.id) {
        setElements((prev) => {
             if (draggedItem.id === targetParentId) return prev;
             const found = findNodeParent(prev, draggedItem.id);
             if (!found) return prev;
             let newTree = recursiveDelete(prev, draggedItem.id);
             let finalIndex = dropIndex;
             if (found.parentId === targetParentId) {
                 const oldIndex = (found.parentId === null ? prev : prev.find(n => n.id === found.parentId)?.children || []).findIndex(x => x.id === draggedItem.id);
                 if (oldIndex < dropIndex) finalIndex--;
             }
             if (finalIndex < 0) finalIndex = 0;
             newTree = recursiveUpdate(newTree, targetParentId, (list) => {
                 const newList = [...list];
                 newList.splice(finalIndex, 0, found.node);
                 return newList;
             });
             return newTree;
        });
        return;
    }
    
    const createNewElement = (data: any): FormElement => ({
      id: `${data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: data.type as FormElementType,
      label: data.label || (data.type === 'news-card' ? 'Latest News' : data.type === 'container' ? 'Container' : data.type === 'accordion' ? 'Accordion Section' : 'New Element'),
      name: data.name || `element${Date.now()}`,
      placeholder: data.placeholder || '',
      options: data.options || (['select', 'radio'].includes(data.type) ? ['Option 1', 'Option 2'] : undefined),
      required: data.required || false,
      children: ['container', 'accordion'].includes(data.type) ? [] : undefined,
      ...(data.type === 'text' && { subType: data.subType || 'text' }),
      ...((data.type === 'number' || data.type === 'range') && { min: 0, max: 100, step: 1 }),
      ...(data.type === 'file' && { accept: '' }),
      ...(data.type === 'navbar' && { links: [{ label: 'Home', url: '#' }, { label: 'About', url: '#' }] }),
      ...(data.type === 'news-card' && { 
          newsTitle: 'Breaking News', 
          newsContent: 'Latest news content...',
          newsImage: 'https://via.placeholder.com/300x150?text=News+Image' 
      }),
      styles: {
        size: 'medium',
        ...(data.styles || {})
      },
    });

    const insertElements = (elementsToAdd: FormElement[]) => {
        setElements((prev) => {
            return recursiveUpdate(prev, targetParentId, (list) => {
                const newList = [...list];
                newList.splice(dropIndex, 0, ...elementsToAdd);
                return newList;
            });
        });
        if (elementsToAdd.length > 0) {
            setSelectedElement(elementsToAdd[0]);
        }
    };

    if (draggedItem.isSnippet && draggedItem.elements) {
        const newSnippetElements = draggedItem.elements.map((elData: any) => createNewElement(elData));
        insertElements(newSnippetElements);
        return;
    }
    insertElements([createNewElement(draggedItem)]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, parentId: string | null, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverTarget?.parentId !== parentId || dragOverTarget?.index !== index) {
        setDragOverTarget({ parentId, index });
    }
  };

  const handleDeleteElement = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setElements((prev) => recursiveDelete(prev, id));
    if (selectedElement?.id === id) {
        setSelectedElement(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedElement(null);
    setEditingElementId(null);
  };
  

  // Recursive Component to Render List
  const RecursiveList = ({ items, parentId }: { items: FormElement[], parentId: string | null }) => {
      return (
          <>
            {items.map((element, index) => {
                // Determine layout styles to apply to wrapper
                const s = element.styles || {};
                const wrapperStyle: React.CSSProperties = {
                    width: s.width,
                    height: s.height,
                    gridColumn: s.gridColumn,
                    gridRow: s.gridRow,
                    flexGrow: s.flexGrow ? Number(s.flexGrow) : undefined,
                    flexShrink: s.flexShrink ? Number(s.flexShrink) : undefined,
                    flexBasis: s.flexBasis,
                    alignSelf: s.alignSelf,
                };

                return (
                  <div key={element.id} className="relative contents-wrapper" style={wrapperStyle}>
                     {/* Insertion Indicator */}
                     <div 
                        className={`absolute -top-2 left-0 right-0 h-1 bg-brand-primary rounded transition-all z-20 pointer-events-none ${dragOverTarget?.parentId === parentId && dragOverTarget?.index === index ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50'}`}
                     ></div>
                     
                     {/* Drag Target Area (before element) */}
                     <div 
                        className="h-4 -mt-2 w-full absolute z-10 bg-transparent"
                        onDragOver={(e) => handleDragOver(e, parentId, index)}
                        onDrop={(e) => handleDrop(e, parentId, index)}
                     ></div>
        
                     <div
                        draggable={!resizing} 
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedElement(element);
                                setEditingElementId(null);
                            }
                        }}
                        onDragStart={(e) => {
                            e.stopPropagation();
                            e.dataTransfer.setData('application/json', JSON.stringify(element));
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedElement(element);
                          setEditingElementId(null);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setSelectedElement(element);
                          setEditingElementId(element.id);
                        }}
                        // We use h-full to fill the wrapper if specific height is set
                        className={`group relative p-4 border rounded-md cursor-grab active:cursor-grabbing transition-all transform duration-200 ease-in-out outline-none 
                            ${selectedElement?.id === element.id 
                                ? 'border-brand-primary ring-2 ring-brand-primary ring-offset-2' 
                                : 'border-gray-300 hover:border-gray-400 hover:shadow-md focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50'} 
                            bg-white h-full`}
                     >
                        <FormElementRenderer
                          element={element}
                          isEditing={editingElementId === element.id}
                          onStartEditing={setEditingElementId}
                          onStopEditing={() => setEditingElementId(null)}
                          onUpdate={updateElement}
                        >
                            {/* Children rendering for containers */}
                            {['container', 'accordion'].includes(element.type) && (
                                <>
                                    <RecursiveList items={element.children || []} parentId={element.id} />
                                    {/* Drop Zone at end of list */}
                                    <div 
                                        className={`min-h-[30px] rounded-md transition-all border-2 border-dashed flex items-center justify-center text-xs font-semibold mt-2 
                                        ${dragOverTarget?.parentId === element.id && dragOverTarget?.index === (element.children?.length || 0) 
                                            ? 'opacity-100 border-brand-primary bg-blue-100 text-brand-primary' 
                                            : 'opacity-50 border-gray-200 text-gray-400 h-8 hover:opacity-100'}`}
                                        style={{ gridColumn: '1 / -1', width: '100%' }} // Make sure drop zone spans full width in grid
                                        onDragOver={(e) => handleDragOver(e, element.id, element.children?.length || 0)}
                                        onDrop={(e) => handleDrop(e, element.id, element.children?.length || 0)}
                                    >
                                        Drop Here
                                    </div>
                                </>
                            )}
                        </FormElementRenderer>
                        
                        {/* Resize Handle for Selected Element */}
                        {selectedElement?.id === element.id && (
                            <div 
                                className="absolute bottom-0 right-0 w-4 h-4 bg-brand-primary cursor-se-resize rounded-tl-md z-30 flex items-center justify-center"
                                onMouseDown={(e) => handleResizeStart(e, element)}
                                title="Drag to resize"
                            >
                                <svg className="w-3 h-3 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" transform="rotate(-45 12 12)"/></svg>
                            </div>
                        )}
    
                        <TrashIcon onClick={(e) => handleDeleteElement(e, element.id)} />
                     </div>
                  </div>
                );
            })}
          </>
      );
  };

  return (
    <div 
        className="flex-1 p-6 md:p-8 lg:p-12 h-full overflow-y-auto bg-white custom-scrollbar"
        onClick={handleCanvasClick}
        onDragOver={(e) => handleDragOver(e, null, elements.length)}
        onDrop={(e) => handleDrop(e, null, elements.length)}
    >
      {/* Root Canvas Area - default stack layout */}
      <div className={`p-4 min-h-[400px] border-2 border-dashed rounded-lg transition-all duration-300 space-y-2 ${dragOverTarget?.parentId === null ? 'border-brand-primary bg-blue-50 shadow-inner' : 'border-gray-300'}`}>
        {elements.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 pointer-events-none p-10">
            <p>Drag and drop elements or snippets here to build your form</p>
          </div>
        )}
        
        <RecursiveList items={elements} parentId={null} />
        
         <div 
            className={`h-8 rounded-md transition-all border-2 border-dashed border-brand-primary bg-blue-50 flex items-center justify-center text-brand-primary text-xs font-semibold ${dragOverTarget?.parentId === null && dragOverTarget?.index === elements.length ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
            onDragOver={(e) => handleDragOver(e, null, elements.length)}
         >
            Drop Here
         </div>
      </div>
    </div>
  );
};

export default Canvas;
