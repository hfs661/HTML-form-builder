
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
  // Flexbox/Grid Container properties
  display?: 'block' | 'flex' | 'grid';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: string;
  flexWrap?: 'nowrap' | 'wrap';
  // Grid Container properties
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  // Item properties (Flex/Grid children)
  gridColumn?: string; // e.g. "span 6"
  gridRow?: string;
  flexGrow?: string;
  flexShrink?: string;
  flexBasis?: string;
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  // Focus State
  focusBorderColor?: string;
  focusBoxShadow?: string;
}

export interface ElementLogic {
  triggerId: string;
  action: 'show' | 'hide';
  condition: 'equals' | 'not_equals' | 'contains';
  value: string;
}

export interface ValidationLogic {
    triggerId: string;
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
  min?: number | string;
  max?: number | string;
  step?: number;
  pattern?: string;
  accept?: string;
  customErrorMessage?: string;
  inputMask?: string; // e.g. (999) 999-9999
  // Conditional Validation
  validationLogic?: ValidationLogic;
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

export interface SnippetFormElement extends Partial<Omit<FormElement, 'children'>> {
  children?: SnippetFormElement[];
}

export interface PaletteItem {
  type: FormElementType;
  label: string;
  icon: ReactElement;
}

export interface SnippetItem {
  label: string;
  elements: SnippetFormElement[];
}
