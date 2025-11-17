import type { ReactElement } from 'react';

export type FormElementType = 'text' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'button' | 'date' | 'number' | 'range' | 'file' | 'color';

export interface FormElement {
  id: string;
  type: FormElementType;
  label: string;
  placeholder?: string;
  name: string;
  options?: string[];
  required?: boolean;
  disabled?: boolean;
  // Validation
  subType?: 'text' | 'email' | 'password' | 'tel' | 'url';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  accept?: string; // For file input
  // Styling
  styles?: {
    color?: 'primary' | 'secondary' | 'danger';
    size?: 'small' | 'medium' | 'large';
  };
}


export interface PaletteItem {
  type: FormElementType;
  label: string;
  // FIX: Replaced JSX.Element with ReactElement to resolve "Cannot find namespace 'JSX'" error.
  icon: ReactElement;
}