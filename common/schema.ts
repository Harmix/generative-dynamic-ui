// Zod schemas for ComponentSchema - used for AI structured output generation
import { z } from 'zod';

// Component type enum
export const ComponentTypeSchema = z.enum([
  'Container',
  'Card',
  'Section',
  'Metric',
  'Table',
  'List',
  'Chart',
  'Button',
  'Filter',
  'Tabs',
  'Badge',
  'Progress'
]);

// Base component props schemas
export const ContainerPropsSchema = z.object({
  cols: z.number().min(1).max(4).optional().describe('Number of columns in grid layout (1-4)'),
  gap: z.enum(['sm', 'md', 'lg']).optional().describe('Gap size between items'),
  colspan: z.number().optional().describe('How many columns this container spans')
});

export const CardPropsSchema = z.object({
  title: z.string().describe('Card title (required)'),
  subtitle: z.string().optional().describe('Optional subtitle'),
  actions: z.array(z.string()).optional().describe('Optional action buttons'),
  colspan: z.number().optional().describe('How many columns this card spans')
});

export const SectionPropsSchema = z.object({
  title: z.string().describe('Section title (required)'),
  collapsible: z.boolean().optional().describe('Whether section can be collapsed'),
  defaultOpen: z.boolean().optional().describe('Whether section is open by default')
});

export const MetricPropsSchema = z.object({
  label: z.string().describe('Metric label (required)'),
  value: z.union([z.string(), z.number()]).describe('Metric value - can be number or data binding like $data.revenue'),
  trend: z.enum(['up', 'down', 'warning', 'neutral']).optional().describe('Trend indicator'),
  icon: z.string().optional().describe('Icon name')
});

export const TablePropsSchema = z.object({
  columns: z.array(z.string()).describe('Array of column names (required)'),
  rows: z.union([
    z.array(z.record(z.string(), z.any())),
    z.string()
  ]).describe('Array of row objects or data binding like $data.products'),
  sortable: z.boolean().optional().describe('Whether table is sortable')
});

export const ListPropsSchema = z.object({
  items: z.union([
    z.array(z.record(z.string(), z.any())),
    z.string()
  ]).describe('Array of items or data binding like $data.orders'),
  avatar: z.boolean().optional().describe('Whether to show avatars'),
  template: z.object({
    primary: z.string().describe('Field name for primary text'),
    secondary: z.string().optional().describe('Field name for secondary text')
  }).optional().describe('Template for displaying list items'),
  actions: z.array(z.string()).optional().describe('Available actions like view, edit, delete')
});

export const ChartPropsSchema = z.object({
  type: z.enum(['bar', 'line', 'pie']).describe('Chart type (required)'),
  data: z.union([
    z.record(z.string(), z.number()),
    z.array(z.object({
      label: z.string(),
      value: z.number()
    })),
    z.string()
  ]).describe('Chart data object or data binding like $data.traffic_sources')
});

export const ButtonPropsSchema = z.object({
  label: z.string().describe('Button text (required)'),
  variant: z.enum(['default', 'outline', 'ghost']).optional().describe('Button style variant'),
  action: z.string().optional().describe('Action to perform on click')
});

export const FilterPropsSchema = z.object({
  options: z.union([
    z.array(z.string()),
    z.array(z.object({
      label: z.string(),
      value: z.string()
    }))
  ]).describe('Filter options (required)'),
  multi: z.boolean().optional().describe('Allow multiple selections'),
  target: z.string().optional().describe('Target data field to filter'),
  placeholder: z.string().optional().describe('Placeholder text')
});

export const TabsPropsSchema = z.object({
  items: z.array(z.string()).describe('Array of tab names (required)'),
  default: z.string().optional().describe('Default selected tab')
});

export const BadgePropsSchema = z.object({
  label: z.string().describe('Badge text (required)'),
  color: z.string().optional().describe('Badge color')
});

export const ProgressPropsSchema = z.object({
  value: z.number().describe('Current progress value (required)'),
  max: z.number().optional().describe('Maximum value'),
  label: z.string().optional().describe('Progress label')
});

// Union of all props schemas
export const ComponentPropsSchema = z.union([
  ContainerPropsSchema,
  CardPropsSchema,
  SectionPropsSchema,
  MetricPropsSchema,
  TablePropsSchema,
  ListPropsSchema,
  ChartPropsSchema,
  ButtonPropsSchema,
  FilterPropsSchema,
  TabsPropsSchema,
  BadgePropsSchema,
  ProgressPropsSchema
]);

// Recursive component schema
export type ComponentSchemaZod = z.infer<typeof ComponentSchemaZodType>;

export const ComponentSchemaZodType: z.ZodType<{
  component: z.infer<typeof ComponentTypeSchema>;
  props: Record<string, any>;
  children?: Array<{
    component: z.infer<typeof ComponentTypeSchema>;
    props: Record<string, any>;
    children?: any[];
  }>;
}> = z.object({
  component: ComponentTypeSchema.describe('Component type from the 12 available components'),
  props: z.record(z.string(), z.any()).describe('Component props - must match the component type requirements'),
  children: z.lazy(() => z.array(ComponentSchemaZodType)).optional().describe('Optional child components')
});

// Schema for AI generation response
export const AIGenerationResponseSchema = z.object({
  needsQuestions: z.boolean().describe('Whether user questions are needed. Set to false for simple data (1-3 metrics, 1-2 lists). Set to true for complex data (5+ entities, nested structures, ambiguous priorities)'),
  reasoning: z.string().describe('Brief explanation of why questions are or are not needed'),
  questions: z.array(z.object({
    id: z.string().describe('Unique question ID like priority, metric_style, etc'),
    text: z.string().describe('Question text to ask the user'),
    options: z.array(z.string()).describe('3-4 answer options'),
    impact: z.string().describe('What this affects: layout_weight, section_priority, component_selection, visualization_style, etc')
  })).optional().describe('Questions to ask user if needsQuestions is true'),
  schema: ComponentSchemaZodType.optional().describe('Generated UI schema if needsQuestions is false')
});

export type AIGenerationResponse = z.infer<typeof AIGenerationResponseSchema>;

