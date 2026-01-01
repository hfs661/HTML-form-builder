
import type { ReactElement } from 'react';

export type FormElementType = 
  | 'text' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'button' 
  | 'date' | 'number' | 'range' | 'file' | 'color' | 'table' 
  | 'iframe' | 'navbar' | 'news-card' | 'container' | 'script' 
  | 'html-block' | 'typography' | 'image' | 'divider' | 'accordion' | 'reset-button'
  | 'inputMask' | 'dataLogic' | 'validationLogic' | 'htmlContent' 
  | 'newsTitle' | 'newsContent' | 'newsImage' | 'altText' | 'headingLevel'
  | 'video' | 'audio' | 'progress' | 'rating' | 'toggle' | 'rich-text' | 'code-block'
  | 'bootstrap-row' | 'bootstrap-col';

export interface ElementStyle {
  color?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fontSize?: string;
  height?: string;
  minHeight?: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  margin?: string;
  marginTop?: string;
  marginBottom?: string;
  fontFamily?: string;
  fontWeight?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderRadius?: string;
  padding?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  letterSpacing?: string;
  lineHeight?: string;
  textDecoration?: 'none' | 'underline' | 'line-through' | 'overline';
  boxShadow?: string;
  display?: 'block' | 'flex' | 'grid';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: string;
  flexWrap?: 'nowrap' | 'wrap';
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridColumn?: string;
  gridRow?: string;
  flexGrow?: string;
  flexShrink?: string;
  flexBasis?: string;
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  focusBorderColor?: string;
  focusBoxShadow?: string;
}

export type LogicCondition = 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';

export interface ElementLogic {
  triggerId: string;
  action: 'show' | 'hide';
  condition: LogicCondition;
  value: string;
}

export interface ValidationLogic {
    triggerId: string;
    condition: LogicCondition | 'matches' | 'regex' | 'prohibited';
    value: string; 
    errorMessage: string;
}

export interface DataLogicRule {
    triggerId: string;
    condition: LogicCondition;
    value: string;
    result: string;
    targetProperty: 'value' | 'disabled' | 'required' | 'label' | 'options' | 'hidden';
}

export interface DataLogic {
    rules: DataLogicRule[];
    defaultValue?: string;
}

export interface BulkAction {
    targetIds: string[];
    property: 'hidden' | 'disabled' | 'required' | 'value' | 'label' | 'backgroundColor';
    value: any;
}

export interface ConditionalRule {
    id: string;
    condition: LogicCondition;
    matchValue: string;
    actions: BulkAction[];
}

export type PartialFormElement = Partial<Omit<FormElement, 'children'>> & {
    children?: PartialFormElement[];
};

export interface FormElement {
  id: string;
  type: FormElementType;
  label: string;
  placeholder?: string;
  name: string;
  options?: string[];
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  multiple?: boolean;
  children?: FormElement[];
  subType?: 'text' | 'email' | 'password' | 'tel' | 'url';
  minLength?: number;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number;
  pattern?: string;
  accept?: string;
  customErrorMessage?: string;
  inputMask?: string;
  validationLogic?: ValidationLogic;
  dataLogic?: DataLogic;
  conditionalRules?: ConditionalRule[];
  styles?: ElementStyle;
  logic?: ElementLogic; // Pull logic (Visibility)
  src?: string;
  rowCount?: number;
  colCount?: number;
  headers?: string[];
  links?: { label: string; url: string }[];
  brand?: string;
  scriptContent?: string;
  onClickScript?: string;
  onChangeScript?: string;
  htmlContent?: string;
  headingLevel?: string;
  textContent?: string;
  altText?: string;
  newsTitle?: string;
  newsContent?: string;
  newsImage?: string;
  // New props for accurate validation
  hasPlaceholderOption?: boolean;
  prohibitedValues?: string[];
  // New props for code/media
  language?: string;
  code?: string;
  // For standalone logic elements
  targetId?: string;
  // Accessibility
  ariaLabel?: string;
  // Searchable select
  searchable?: boolean;
}

export interface PaletteItem {
  type: FormElementType;
  label: string;
  icon?: ReactElement;
}

export interface SnippetItem {
  label: string;
  elements: PartialFormElement[];
  icon?: ReactElement;
  id?: string; // Optional for user templates
}
