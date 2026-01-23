// Type definitions for the Dynamic UI Builder

export type ComponentType =
  | 'Container'
  | 'Card'
  | 'Section'
  | 'Metric'
  | 'Table'
  | 'List'
  | 'Chart'
  | 'Button'
  | 'Filter'
  | 'Tabs'
  | 'Badge'
  | 'Progress';

export interface ComponentSchema {
  component: ComponentType;
  props: Record<string, any>;
  children?: ComponentSchema[];
}

export interface InputContext {
  type: string;
  data: Record<string, any>;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  impact: string;
}

export interface ContextAnalysis {
  dataTypes: string[];
  entities: string[];
  suggestedLayout: string;
  questions: Question[];
}

export interface UserAnswers {
  [questionId: string]: string;
}

export interface UIState {
  version: string;
  contextHash: string;
  schema: ComponentSchema;
  createdAt: string;
  history: Array<{
    version: string;
    diff: EvolutionDiff;
    timestamp: string;
  }>;
}

export interface EvolutionDiff {
  operation: 'add' | 'remove' | 'update';
  path: string;
  value?: ComponentSchema;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Component prop interfaces
export interface ContainerProps {
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  colspan?: number;
}

export interface CardProps {
  title?: string;
  subtitle?: string;
  actions?: string[];
  colspan?: number;
}

export interface SectionProps {
  title: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface MetricProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'warning' | 'neutral';
  icon?: string;
}

export interface TableProps {
  columns: string[];
  rows: Record<string, any>[];
  sortable?: boolean;
}

export interface ListProps {
  items: Array<{
    primary?: string;
    secondary?: string;
    avatar?: string;
    [key: string]: any;
  }>;
  avatar?: boolean;
  template?: {
    primary: string;
    secondary?: string;
  };
  actions?: Array<'view' | 'edit' | string>;
}

export interface ChartProps {
  type: 'bar' | 'line' | 'pie';
  data: Record<string, number> | Array<{ label: string; value: number }>;
}

export interface FilterProps {
  options: string[] | Array<{ label: string; value: string }>;
  multi?: boolean;
  target?: string;
  placeholder?: string;
  onFilterChange?: (value: string | string[]) => void;
}

export interface TabsProps {
  items: string[];
  default?: string;
}

export interface BadgeProps {
  label: string;
  color?: string;
}

export interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
}

