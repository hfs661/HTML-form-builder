
import type { ReactElement } from 'react';

export type FormElementType = 'text' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'button' | 'date' | 'number' | 'range' | 'file' | 'color' | 'table' | 'iframe' | 'navbar' | 'news-card' | 'container' | 'script' | 'html-block' | 'typography' | 'image' | 'divider' | 'accordion' | 'reset-button';

export interface ElementStyle {
  color?: 'primary' | 'secondary' | 'danger'; // Legacy for buttons
  size?: 'small' | 'medium' | 'large';
  height?: string;
  width?: string;
  fontFamily?: string;
  fontWeight?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  padding?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: string;
  lineHeight?: string;
  textDecoration?: 'none' | 'underline' | 'line-through' | 'overline';
  boxShadow?: string;
  // Flexbox properties for Container
  display?: 'block' | 'flex';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: string;
  flexWrap?: 'nowrap' | 'wrap';
}

export interface ElementLogic {
  triggerId: string;
  action: 'show' | 'hide';
  condition: 'equals' | 'not_equals' | 'contains';
  value: string;
}

export interface FormElement {
  id: string;
  type: FormElementType;
  label: string;
  placeholder?: string;
  name: string;
  options?: string[];
  required?: boolean;
  disabled?: boolean;
  children?: FormElement[]; // For container nesting
  // Validation
  subType?: 'text' | 'email' | 'password' | 'tel' | 'url';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  accept?: string;
  customErrorMessage?: string;
  // Styling
  styles?: ElementStyle;
  // Logic
  logic?: ElementLogic;
  // Specifics
  src?: string; // For iframe or image
  rowCount?: number; // For table
  colCount?: number; // For table
  headers?: string[]; // For table
  links?: { label: string; url: string }[]; // For navbar
  brand?: string; // For navbar
  // News Card Specifics
  newsTitle?: string;
  newsContent?: string;
  newsImage?: string;
  // Script Specifics
  scriptContent?: string;
  // HTML Block Specifics
  htmlContent?: string;
  // Typography Specifics
  textContent?: string;
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  // Image Specifics
  altText?: string;
}

export interface PaletteItem {
  type: FormElementType;
  label: string;
  icon: ReactElement;
}

export interface SnippetItem {
  label: string;
  elements: Partial<FormElement>[];
}
