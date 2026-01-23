// Component Library Definition - 12 constrained components

export type ComponentType =
  | 'Container' | 'Card' | 'Section'
  | 'Metric' | 'Table' | 'List' | 'Chart'
  | 'Button' | 'Filter' | 'Tabs'
  | 'Badge' | 'Progress';

export interface ComponentSchema {
  component: ComponentType;
  props: Record<string, any>;
  children?: ComponentSchema[];
}

// Component prop definitions (validation schemas)
export const COMPONENT_SPECS: Record<ComponentType, { props: string[]; required: string[] }> = {
  Container: { props: ['cols', 'gap', 'colspan'], required: [] },
  Card: { props: ['title', 'subtitle', 'actions', 'colspan'], required: ['title'] },
  Section: { props: ['title', 'collapsible'], required: ['title'] },
  Metric: { props: ['label', 'value', 'trend', 'icon'], required: ['label', 'value'] },
  Table: { props: ['columns', 'rows', 'sortable'], required: ['columns', 'rows'] },
  List: { props: ['items', 'avatar', 'template', 'actions'], required: ['items'] },
  Chart: { props: ['type', 'data'], required: ['type', 'data'] },
  Button: { props: ['label', 'variant', 'action'], required: ['label'] },
  Filter: { props: ['options', 'multi', 'target'], required: ['options'] },
  Tabs: { props: ['items', 'default'], required: ['items'] },
  Badge: { props: ['label', 'color'], required: ['label'] },
  Progress: { props: ['value', 'max', 'label'], required: ['value'] },
};

// Validate component schema
export function validateSchema(schema: ComponentSchema): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const spec = COMPONENT_SPECS[schema.component];

  if (!spec) {
    errors.push(`Unknown component: ${schema.component}`);
    return { valid: false, errors };
  }

  for (const req of spec.required) {
    if (!(req in schema.props)) {
      errors.push(`${schema.component} missing required prop: ${req}`);
    }
  }

  if (schema.children) {
    for (const child of schema.children) {
      const childResult = validateSchema(child);
      errors.push(...childResult.errors);
    }
  }

  return { valid: errors.length === 0, errors };
}
