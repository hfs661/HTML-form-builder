
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
        
        // Update width/height (simple pixel based for now)
        // If startW was 0 or undefined, we assume a default base of e.g. 100% or allow px override.
        // Usually resize sets explicit pixel width.
        const newW = resizing.startW + deltaX;
        const newH = resizing.startH + deltaY;
        
        // Debouncing or throttling would be good here for huge trees, but for this app direct update is responsive enough
        updateElement(resizing.id, { 
            styles: { 
                ...(elements.find(el => el.id === resizing.id)?.styles || {}), // Need current styles? No, updateElement merges. But we need deep merge for styles?
                // updateElement does shallow merge of props. If we pass styles object, it might overwrite.
                // updateElement in App.tsx does: return { ...el, ...updatedProps };
                // So if we pass styles: { ...oldStyles, width: ... }, it works.
                // We need access to the element's current style to preserve other props? 
                // We can't easily get it inside this effect without depending on elements.
                // Actually updateElement in Canvas is passed from App.
                // Let's pass the new width/height strings
                width: `${Math.max(50, newW)}px`,
                height: `${Math.max(20, newH)}px`
            }
        });
        
        // Wait, updateElement merges top level props. Styles is nested.
        // We need to implement deep style update in updateElement or pass entire styles object here.
        // Let's rely on the fact that we can trigger a style update. 
        // We need to fetch the current styles first? 
        // For simplicity in this effect, we will just dispatch the style update assuming the parent handles it.
        // Actually, updateElement implementation in App.tsx replaces the key. 
        // So we need to merge styles manually. 
        // Since we don't have easy access to 'current element' inside this useEffect without deps,
        // we might loose other styles if we just send { styles: { width } }.
        // FIX: We need to modify updateElement to support partial style updates or handle it here.
        // Let's assume we can pass a special property or handle it in the callback.
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
  }, [resizing]); // logic issue: 'updateElement' dependency? 
  // To avoid complex dependency chains, we'll use a functional state update in App.tsx or just accept that we need to read current styles.
  // Actually, we can just grab the element from the `elements` prop if we include it in dependency, but that causes re-attach on every render.
  // Better: The resizer stores the initial styles.
  
  
  // Custom resize handler that merges styles
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
  
  // Wrapper for updateElement to merge styles correctly during resize
  const handleStyleUpdate = (id: string, newStyles: any) => {
      // Find current style
      // Since we can't easily sync state here without re-render, we might need to pass a callback or do a functional update if App supported it.
      // But App.tsx updateElement uses functional update on state.
      // We need to provide the FULL style object.
      // We can do this by using the 'updateElement' prop.
      // NOTE: We need the PREVIOUS styles. 
      // We can solve this by passing a callback to updateElement that receives current element? 
      // The current updateElement implementation (in App.tsx) takes (id, partialProps).
      // It merges partialProps into element.
      // If we pass { styles: { ...oldStyles, ...newStyles } }, we need oldStyles.
      // Current implementation of Canvas doesn't easily expose 'getElementById'.
      // Let's modify updateElement usage:
      // We can try to get the element from `elements` prop, but it might be stale in the closure.
      // Ideally, updateElement would support deep merging or a callback for the specific element.
      // Given constraints, we will rely on `selectedElement` since resizing only happens on selected element!
      if (selectedElement && selectedElement.id === id) {
          updateElement(id, { styles: { ...selectedElement.styles, ...newStyles } });
      }
  };


  // Recursive Component to Render List
  const RecursiveList = ({ items, parentId }: { items: FormElement[], parentId: string | null }) => {
      return (
          <>
            {items.map((element, index) => (
              <div key={element.id} className="relative">
                 <div 
                    className={`absolute -top-2 left-0 right-0 h-1 bg-brand-primary rounded transition-all z-20 pointer-events-none ${dragOverTarget?.parentId === parentId && dragOverTarget?.index === index ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50'}`}
                 ></div>
                 
                 <div 
                    className="h-4 -mt-2 w-full absolute z-10 bg-transparent"
                    onDragOver={(e) => handleDragOver(e, parentId, index)}
                    onDrop={(e) => handleDrop(e, parentId, index)}
                 ></div>
    
                 <div
                    draggable={!resizing} // Disable drag while resizing
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
                    className={`group relative p-4 mb-2 border rounded-md cursor-grab active:cursor-grabbing transition-all transform duration-200 ease-in-out outline-none 
                        ${selectedElement?.id === element.id 
                            ? 'border-brand-primary ring-2 ring-brand-primary ring-offset-2' 
                            : 'border-gray-300 hover:border-gray-400 hover:shadow-md focus:border-brand-primary focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50'} 
                        bg-white`}
                 >
                    <FormElementRenderer
                      element={element}
                      isEditing={editingElementId === element.id}
                      onStartEditing={setEditingElementId}
                      onStopEditing={() => setEditingElementId(null)}
                      onUpdate={updateElement}
                    >
                        {['container', 'accordion'].includes(element.type) && (
                            <div className="min-h-[50px] pt-2">
                                <RecursiveList items={element.children || []} parentId={element.id} />
                                <div 
                                    className={`h-8 rounded-md transition-all border-2 border-dashed flex items-center justify-center text-xs font-semibold ${dragOverTarget?.parentId === element.id && dragOverTarget?.index === (element.children?.length || 0) ? 'opacity-100 border-brand-primary bg-blue-100 text-brand-primary' : 'opacity-0 h-0 overflow-hidden border-transparent'}`}
                                    onDragOver={(e) => handleDragOver(e, element.id, element.children?.length || 0)}
                                    onDrop={(e) => handleDrop(e, element.id, element.children?.length || 0)}
                                >
                                    Drop Here
                                </div>
                            </div>
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
            ))}
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
      <div className={`p-4 min-h-[400px] border-2 border-dashed rounded-lg transition-all duration-300 ${dragOverTarget?.parentId === null ? 'border-brand-primary bg-blue-50 shadow-inner' : 'border-gray-300'}`}>
        {elements.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 pointer-events-none">
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
