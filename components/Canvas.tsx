
import React, { useState } from 'react';
import type { FormElement, FormElementType } from '../types';
import FormElementRenderer from './FormElementRenderer';
import ConfirmationDialog from './ConfirmationDialog';

interface CanvasProps {
  elements: FormElement[];
  setElements: (newElements: FormElement[] | ((prev: FormElement[]) => FormElement[])) => void;
  setSelectedElement: (element: FormElement | null) => void;
  selectedElement: FormElement | null;
  updateElement: (id: string, updatedProps: Partial<FormElement>) => void;
}

const TrashIcon: React.FC<{onClick: (e: React.MouseEvent) => void}> = ({onClick}) => (
    <button onClick={onClick} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-opacity opacity-0 group-hover:opacity-100 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
    </button>
);


const Canvas: React.FC<CanvasProps> = ({ elements, setElements, setSelectedElement, selectedElement, updateElement }) => {
  // Identify drop target by { parentId: string | null, index: number }
  // null parentId means root
  const [dragOverTarget, setDragOverTarget] = useState<{ parentId: string | null, index: number } | null>(null);
  const [elementToDelete, setElementToDelete] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetParentId: string | null, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
    
    const itemData = e.dataTransfer.getData('application/json');
    if (!itemData) return;

    const draggedItem = JSON.parse(itemData);

    // Reordering existing element
    if (draggedItem.id) {
        setElements((prev) => {
             // Check if we are trying to drop inside itself (invalid)
             if (draggedItem.id === targetParentId) return prev;
             
             const found = findNodeParent(prev, draggedItem.id);
             if (!found) return prev;
             
             // Remove from old location
             let newTree = recursiveDelete(prev, draggedItem.id);
             
             // Adjust index if dropping in same list and dragged from lower index
             let finalIndex = dropIndex;
             if (found.parentId === targetParentId) {
                 const oldIndex = (found.parentId === null ? prev : prev.find(n => n.id === found.parentId)?.children || []).findIndex(x => x.id === draggedItem.id);
                 if (oldIndex < dropIndex) finalIndex--;
             }
             if (finalIndex < 0) finalIndex = 0;

             // Insert into new location
             newTree = recursiveUpdate(newTree, targetParentId, (list) => {
                 const newList = [...list];
                 newList.splice(finalIndex, 0, found.node);
                 return newList;
             });
             
             return newTree;
        });
        return;
    }
    
    // Helper to create a new element from partial data
    const createNewElement = (data: any): FormElement => ({
      id: `${data.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: data.type as FormElementType,
      label: data.label || (data.type === 'news-card' ? 'Latest News' : data.type === 'container' ? 'Container' : 'New Element'),
      name: data.name || `element${Date.now()}`,
      placeholder: data.placeholder || '',
      options: data.options || (['select', 'radio'].includes(data.type) ? ['Option 1', 'Option 2'] : undefined),
      required: data.required || false,
      children: data.type === 'container' ? [] : undefined,
      ...(data.type === 'text' && { subType: data.subType || 'text' }),
      ...((data.type === 'number' || data.type === 'range') && { min: 0, max: 100, step: 1 }),
      ...(data.type === 'file' && { accept: '' }),
      ...(data.type === 'navbar' && { links: [{ label: 'Home', url: '#' }, { label: 'About', url: '#' }] }),
      ...(data.type === 'news-card' && { 
          newsTitle: 'Breaking News', 
          newsContent: 'This is a summary of the latest news item. Click to expand for more details.',
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

    // Adding new Snippet (multiple elements)
    if (draggedItem.isSnippet && draggedItem.elements) {
        const newSnippetElements = draggedItem.elements.map((elData: any) => createNewElement(elData));
        insertElements(newSnippetElements);
        return;
    }
    
    // Adding new Single element
    insertElements([createNewElement(draggedItem)]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, parentId: string | null, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    // Only update state if changed to avoid flicker
    if (dragOverTarget?.parentId !== parentId || dragOverTarget?.index !== index) {
        setDragOverTarget({ parentId, index });
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.stopPropagation();
      // We don't immediately clear to allow moving between close gaps
      // setDragOverTarget(null); 
  };

  const requestDeleteElement = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setElementToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (elementToDelete) {
      setElements((prev) => recursiveDelete(prev, elementToDelete));
      if (selectedElement?.id === elementToDelete) {
          setSelectedElement(null);
      }
      setElementToDelete(null);
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
            {items.map((element, index) => (
              <div key={element.id} className="relative">
                 {/* Visual Drop Line */}
                 <div 
                    className={`absolute -top-2 left-0 right-0 h-1 bg-brand-primary rounded transition-all z-20 pointer-events-none ${dragOverTarget?.parentId === parentId && dragOverTarget?.index === index ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50'}`}
                 ></div>
                 
                 {/* Invisible Drop Target */}
                 <div 
                    className="h-4 -mt-2 w-full absolute z-10 bg-transparent"
                    onDragOver={(e) => handleDragOver(e, parentId, index)}
                    onDrop={(e) => handleDrop(e, parentId, index)}
                 ></div>
    
                 <div
                    draggable
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
                    className={`group relative p-4 mb-2 border rounded-md cursor-grab active:cursor-grabbing transition-all transform duration-200 ease-in-out ${selectedElement?.id === element.id ? 'border-brand-primary ring-2 ring-brand-primary ring-offset-2' : 'border-gray-300 hover:border-gray-400 hover:shadow-md'} bg-white`}
                 >
                    <FormElementRenderer
                      element={element}
                      isEditing={editingElementId === element.id}
                      onStartEditing={setEditingElementId}
                      onStopEditing={() => setEditingElementId(null)}
                      onUpdate={updateElement}
                    >
                        {/* Render Children if Container */}
                        {element.type === 'container' && (
                            <div className="min-h-[50px] pt-2">
                                <RecursiveList items={element.children || []} parentId={element.id} />
                                {/* Drop Zone inside Container (at the end) */}
                                <div 
                                    className={`h-8 rounded-md transition-all border-2 border-dashed border-brand-primary bg-blue-50 flex items-center justify-center text-brand-primary text-xs font-semibold ${dragOverTarget?.parentId === element.id && dragOverTarget?.index === (element.children?.length || 0) ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
                                    onDragOver={(e) => handleDragOver(e, element.id, element.children?.length || 0)}
                                    onDrop={(e) => handleDrop(e, element.id, element.children?.length || 0)}
                                >
                                    Drop Here
                                </div>
                            </div>
                        )}
                    </FormElementRenderer>
                    <TrashIcon onClick={(e) => requestDeleteElement(e, element.id)} />
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
        onDragOver={(e) => handleDragOver(e, null, elements.length)} // Catch drop at end of root
        onDrop={(e) => handleDrop(e, null, elements.length)}
    >
      <div className={`p-4 min-h-[400px] border-2 border-dashed rounded-lg transition-colors ${dragOverTarget?.parentId === null ? 'border-brand-primary bg-blue-50' : 'border-gray-300'}`}>
        {elements.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 pointer-events-none">
            <p>Drag and drop elements or snippets here to build your form</p>
          </div>
        )}
        
        <RecursiveList items={elements} parentId={null} />
        
         {/* Final Drop Zone Root */}
         <div 
            className={`h-8 rounded-md transition-all border-2 border-dashed border-brand-primary bg-blue-50 flex items-center justify-center text-brand-primary text-xs font-semibold ${dragOverTarget?.parentId === null && dragOverTarget?.index === elements.length ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
            onDragOver={(e) => handleDragOver(e, null, elements.length)}
         >
            Drop Here
         </div>
      </div>

       <ConfirmationDialog
        isOpen={!!elementToDelete}
        onClose={() => setElementToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Element"
        message="Are you sure you want to delete this element? If it is a container, all children will be deleted."
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
      />
    </div>
  );
};

export default Canvas;
