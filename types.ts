
import type { ReactElement } from 'react';

export type FormElementType = 
  | 'text' | 'textarea' | 'checkbox' | 'radio' | 'select' | 'button' 
  | 'date' | 'number' | 'range' | 'file' | 'color' | 'table' 
  | 'iframe' | 'navbar' | 'news-card' | 'container' | 'script' 
  | 'html-block' | 'typography' | 'image' | 'divider' | 'accordion' | 'reset-button'
  | 'progress' | 'rating' | 'toggle' | 'rich-text' | 'code-block'
  | 'bootstrap-row' | 'bootstrap-col' | 'video' | 'validationLogic' | 'dataLogic' | 'htmlContent';

export interface ElementStyle {
  color?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  fontSize?: string;
  fontWeight?: string;
  height?: string;
  minHeight?: string;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  margin?: string;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  padding?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderTopWidth?: string;
  borderRightWidth?: string;
  borderBottomWidth?: string;
  borderLeftWidth?: string;
  borderStyle?: string;
  borderRadius?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  boxShadow?: string;
  display?: 'block' | 'flex' | 'grid';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  rowGap?: string;
  columnGap?: string;
  flexGrow?: string;
  flexShrink?: string;
  flexBasis?: string;
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gridTemplateColumns?: string;
  orientation?: 'horizontal' | 'vertical';
  zIndex?: number;
}

export type LogicCondition = 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';

export interface ElementLogic {
  triggerId: string;
  action: 'show' | 'hide';
  condition: LogicCondition;
  value: string;
}

export interface ValidationLogic {
  triggerId?: string;
  condition: LogicCondition | 'matches' | 'regex' | 'none';
  value: string; 
  errorMessage: string;
}

export interface BulkAction {
  targetIds: string[];
  property: 'hidden' | 'disabled' | 'required' | 'value' | 'label' | 'backgroundColor' | 'textColor';
  value: any;
}

export interface ConditionalRule {
  id: string;
  condition: LogicCondition;
  matchValue: string;
  actions: BulkAction[];
}

export interface DataLogicRule {
  triggerId: string;
  condition: LogicCondition;
  value: string;
  targetProperty: string;
  result: any;
}

export interface FormElement {
  id?: string;
  type: FormElementType;
  label?: string;
  placeholder?: string;
  name?: string;
  options?: string[];
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  multiple?: boolean;
  children?: FormElement[];
  subType?: 'text' | 'email' | 'password' | 'tel' | 'url';
  htmlTag?: string;
  minLength?: number;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number;
  styles?: ElementStyle;
  logic?: ElementLogic; 
  validationLogic?: ValidationLogic;
  conditionalRules?: ConditionalRule[];
  dataLogic?: {
    rules: DataLogicRule[];
  };
  src?: string;
  textContent?: string;
  headingLevel?: string;
  altText?: string;
  code?: string;
  language?: string;
  onClickScript?: string;
  onChangeScript?: string;
  htmlContent?: string;
  searchable?: boolean;
  defaultValue?: string;
  colSpan?: number; // 1 to 12
  // Accessibility & Custom Attributes
  ariaLabel?: string;
  ariaRole?: string;
  ariaLive?: 'off' | 'polite' | 'assertive';
  ariaDescribedBy?: string;
  testId?: string;
}

export interface PaletteItem {
  type: FormElementType;
  label: string;
  icon?: ReactElement;
}

export interface SnippetItem {
  label: string;
  elements: Partial<FormElement>[];
  icon?: ReactElement;
  id?: string;
}
