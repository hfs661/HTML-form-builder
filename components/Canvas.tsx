

import React, { useState } from 'react';
import type { FormElement, FormElementType } from '../types';
import FormElementRenderer from './FormElementRenderer';
import ConfirmationDialog from './ConfirmationDialog';

interface CanvasProps {
  elements: FormElement[];
  setElements: React.Dispatch<React.SetStateAction<FormElement[]>>;
  setSelectedElement: (element: FormElement | null) => void;
  selectedElement: FormElement | null;
  updateElement: (id: string, updatedProps: Partial<FormElement>) => void;
}

const TrashIcon: React.FC<{onClick: (e: React.MouseEvent) => void}> = ({onClick}) => (
    <button onClick={onClick} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-opacity opacity-0 group-hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
    </button>
);


const Canvas: React.FC<CanvasProps> = ({ elements, setElements, setSelectedElement, selectedElement, updateElement }) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [elementToDelete, setElementToDelete] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOverIndex(null);
    const itemData = e.dataTransfer.getData('application/json');
    if (!itemData) return;

    const draggedItem = JSON.parse(itemData);

    // Reordering existing element
    if (draggedItem.id) {
        const draggedIndex = elements.findIndex(el => el.id === draggedItem.id);
        if (draggedIndex === -1 || dragOverIndex === null) return;
        const newElements = [...elements];
        const [removed] = newElements.splice(draggedIndex, 1);
        newElements.splice(dragOverIndex, 0, removed);
        setElements(newElements);
        return;
    }
    
    // Adding new element
    const newElement: FormElement = {
      id: `${draggedItem.type}-${Date.now()}`,
      type: draggedItem.type as FormElementType,
      label: draggedItem.label || 'New Element',
      name: draggedItem.name || `element${elements.length + 1}`,
      placeholder: draggedItem.placeholder || '',
      options: draggedItem.options || (['select', 'radio'].includes(draggedItem.type) ? ['Option 1', 'Option 2'] : undefined),
      required: draggedItem.required || false,
      ...(draggedItem.type === 'text' && { subType: 'text' }),
      ...( (draggedItem.type === 'number' || draggedItem.type === 'range') && { min: 0, max: 100, step: 1 }),
      ...( draggedItem.type === 'file' && { accept: '' }),
      styles: {
        color: 'primary',
        size: 'medium',
      },
    };
    
    const newElements = [...elements];
    if (dragOverIndex !== null) {
      newElements.splice(dragOverIndex, 0, newElement);
    } else {
      newElements.push(newElement);
    }
    setElements(newElements);
    setSelectedElement(newElement);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number | null) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  
  const handleElementDragStart = (e: React.DragEvent<HTMLDivElement>, element: FormElement) => {
    e.dataTransfer.setData('application/json', JSON.stringify(element));
  };
  
  const removeElement = (id: string) => {
      setElements(elements.filter(el => el.id !== id));
      if (selectedElement?.id === id) {
          setSelectedElement(null);
      }
  };

  const requestDeleteElement = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent selecting the element when clicking the trash icon
    setElementToDelete(id);
  };

  const handleConfirmDelete = () => {
    if (elementToDelete) {
      removeElement(elementToDelete);
      setElementToDelete(null);
    }
  };

  const handleCanvasClick = () => {
    setSelectedElement(null);
    setEditingElementId(null);
  };

  return (
    <div 
        className="flex-1 p-6 md:p-8 lg:p-12 h-full overflow-y-auto bg-white"
        onDragOver={(e) => handleDragOver(e, elements.length)}
        onDrop={handleDrop}
        onDragLeave={() => setDragOverIndex(null)}
        onClick={handleCanvasClick}
    >
      <div className={`p-4 min-h-[400px] border-2 border-dashed rounded-lg transition-colors ${dragOverIndex !== null ? 'border-brand-primary bg-blue-50' : 'border-gray-300'}`}>
        {elements.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Drag and drop elements here to build your form</p>
          </div>
        )}
        {elements.map((element, index) => (
          <div key={element.id}>
             <div 
                className={`h-2 my-2 rounded-full transition-all ${dragOverIndex === index ? 'bg-brand-primary' : 'bg-transparent'}`}
                onDragOver={(e) => handleDragOver(e, index)}
             ></div>
             <div
                draggable
                onDragStart={(e) => handleElementDragStart(e, element)}
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
                className={`group relative p-4 mb-2 border rounded-md cursor-pointer transition-all ${selectedElement?.id === element.id ? 'border-brand-primary ring-2 ring-brand-primary ring-offset-2' : 'border-gray-300 hover:border-gray-400'}`}
             >
                <FormElementRenderer
                  element={element}
                  isEditing={editingElementId === element.id}
                  onStartEditing={setEditingElementId}
                  onStopEditing={() => setEditingElementId(null)}
                  onUpdate={updateElement}
                />
                <TrashIcon onClick={(e) => requestDeleteElement(e, element.id)} />
             </div>
          </div>
        ))}
         {dragOverIndex === elements.length && elements.length > 0 && <div className="h-2 my-2 rounded-full bg-brand-primary"></div>}
      </div>

       <ConfirmationDialog
        isOpen={!!elementToDelete}
        onClose={() => setElementToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Element"
        message="Are you sure you want to delete this form element? This action cannot be undone."
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
      />
    </div>
  );
};

export default Canvas;