// UI Generator - Builds UI schema from context + answers

import { ComponentSchema, validateSchema } from './components';
import { InputContext, ContextAnalysis, Question } from './analyzer';
import { generateSchemaWithGemini } from './ai-analyzer';

export interface UserAnswers {
  [questionId: string]: string;
}

export interface UIState {
  version: string;
  contextHash: string;
  schema: ComponentSchema;
  createdAt: string;
  history: Array<{ version: string; diff: any; timestamp: string }>;
}

export interface EvolutionDiff {
  operation: 'add' | 'remove' | 'update';
  path: string;
  value?: ComponentSchema;
}

// Generate UI based on context analysis and user answers
export function generateUI(
  contextOrData: InputContext | Record<string, any>,
  analysis: ContextAnalysis,
  answers: UserAnswers
): ComponentSchema {
  // Handle both InputContext and raw data
  const data = 'data' in contextOrData && typeof contextOrData.data === 'object' 
    ? contextOrData.data 
    : contextOrData;

  const children: ComponentSchema[] = [];

  // Get user preferences
  const priority = answers.priority || 'All equal';
  const metricStyle = answers.metric_style || 'Cards with trends';
  const listActions = answers.list_actions || 'View only';
  const chartPreference = answers.chart_preference || 'Charts/graphs';
  const focusArea = answers.focus_area;

  // Determine layout based on priority
  let layoutCols = 3;
  let metricColspan = 3;
  let listColspan = 2;

  if (priority === 'Overview metrics') {
    // Emphasize metrics
    metricColspan = 3;
    listColspan = 1;
  } else if (priority === 'Detailed lists') {
    // Emphasize lists
    metricColspan = 2;
    listColspan = 3;
  } else if (priority === 'Activity/timeline') {
    layoutCols = 2;
    metricColspan = 2;
    listColspan = 2;
  }

  // Build metrics section based on user preference
  console.log('Checking for metrics:', { dataTypes: analysis.dataTypes, hasMetrics: analysis.dataTypes.includes('metrics') });
  if (analysis.dataTypes.includes('metrics')) {
    const metricsSection = buildMetricsSection(data, metricStyle, metricColspan, focusArea, analysis.detectedContext);
    console.log('Metrics section result:', metricsSection);
    if (metricsSection) children.push(metricsSection);
  }

  // Build sections based on focus area and priority
  const entities = analysis.entities;
  
  // Sort entities by focus area if specified
  const sortedEntities = focusArea ? sortEntitiesByFocus(entities, focusArea, analysis.detectedContext) : entities;

  // Add list/table sections based on preference
  for (const entity of sortedEntities) {
    if (Array.isArray(data[entity])) {
      // Decide between list and table based on data structure
      const firstItem = data[entity][0];
      const itemKeys = firstItem ? Object.keys(firstItem).length : 0;
      
      if (itemKeys > 4 && chartPreference === 'Detailed tables') {
        // Use table for complex data
        children.push(buildTableSection(entity, data[entity], listColspan));
      } else {
        // Use list
        children.push(buildListSection(entity, data[entity], listActions, listColspan, priority));
      }
    }
  }

  // Add charts for nested objects based on preference
  if (chartPreference !== 'Simple breakdown') {
    const nestedKeys = Object.keys(data).filter(
      k => typeof data[k] === 'object' && !Array.isArray(data[k]) && data[k] !== null
    );
    
    for (const key of nestedKeys) {
      // Check if this nested object is a metrics container (all values are numbers)
      const nestedObj = data[key];
      const values = Object.values(nestedObj);
      const isMetricsContainer = values.length > 0 && values.every(v => typeof v === 'number' || typeof v === 'string');
      
      // Skip metrics containers ONLY if user didn't ask for charts
      if (isMetricsContainer && chartPreference !== 'Charts/graphs') {
        continue;
      }
      
      if (chartPreference === 'Charts/graphs') {
        children.push(buildChartSection(key, data[key], metricStyle === 'With charts' ? 1 : 2));
      } else if (chartPreference === 'Detailed tables') {
        children.push(buildBreakdownTable(key, data[key]));
      }
    }
  }

  const schema: ComponentSchema = {
    component: 'Container',
    props: { cols: layoutCols, gap: priority === 'Detailed lists' ? 'lg' : 'md' },
    children
  };

  // Validate before returning
  const validation = validateSchema(schema);
  if (!validation.valid) {
    console.warn('Schema validation warnings:', validation.errors);
  }

  return schema;
}

// Sort entities by focus area
function sortEntitiesByFocus(entities: string[], focusArea: string, contextType: string): string[] {
  const priorities: Record<string, string[]> = {
    'Code activity': ['commits', 'recent_commits', 'activity'],
    'Issues & PRs': ['issues', 'pull_requests', 'prs'],
    'Community': ['contributors', 'members', 'users'],
    'Sales metrics': ['orders', 'recent_orders', 'sales'],
    'Product inventory': ['products', 'inventory'],
    'Customer data': ['customers', 'users', 'clients'],
    'Task progress': ['tasks', 'todos'],
    'Team allocation': ['team', 'members', 'team_members'],
    'Device status': ['devices', 'sensors'],
    'Sensor readings': ['sensors', 'readings', 'metrics'],
    'Alerts': ['alerts', 'warnings', 'notifications']
  };

  const priorityKeys = priorities[focusArea] || [];
  
  return [...entities].sort((a, b) => {
    const aMatch = priorityKeys.some(key => a.toLowerCase().includes(key));
    const bMatch = priorityKeys.some(key => b.toLowerCase().includes(key));
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });
}

// Build metrics row from numeric values based on style preference
function buildMetricsSection(
  data: Record<string, any>, 
  style: string,
  colspan: number,
  focusArea?: string,
  contextType?: string
): ComponentSchema | null {
  const metrics: ComponentSchema[] = [];
  
  // Collect all numeric metrics (including nested ones)
  const metricEntries: Array<[string, number]> = [];
  
  console.log('buildMetricsSection called with data:', Object.keys(data));
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'number') {
      console.log('Found top-level metric:', key, value);
      metricEntries.push([key, value]);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Check if nested object contains only numbers (metrics object)
      const nestedValues = Object.entries(value);
      const allNumbers = nestedValues.every(([_, v]) => typeof v === 'number' || typeof v === 'string');
      
      console.log('Checking nested object:', key, { allNumbers, nestedValues: nestedValues.length });
      
      if (allNumbers && nestedValues.length > 0) {
        // Extract nested metrics with full path
        for (const [nestedKey, nestedValue] of nestedValues) {
          if (typeof nestedValue === 'number') {
            console.log('Found nested metric:', `${key}.${nestedKey}`, nestedValue);
            metricEntries.push([`${key}.${nestedKey}`, nestedValue]);
          }
        }
      }
    }
  }
  
  console.log('Total metrics found:', metricEntries.length, metricEntries);
  
  if (metricEntries.length === 0) return null;

  // Filter metrics by focus area
  let relevantMetrics = metricEntries;
  if (focusArea && contextType) {
    const focusKeywords = getFocusKeywords(focusArea, contextType);
    if (focusKeywords.length > 0) {
      const focused = metricEntries.filter(([key]) => 
        focusKeywords.some(keyword => key.toLowerCase().includes(keyword))
      );
      if (focused.length > 0) {
        relevantMetrics = focused;
      }
    }
  }

  for (const [key, value] of relevantMetrics) {
    const metricProps: any = {
      label: formatLabel(key),
      value: `$data.${key}`,
      icon: guessIcon(key)
    };

    // Debug logging
    console.log('Creating metric:', { key, value, binding: `$data.${key}` });

    // Add trend based on style
    if (style === 'Cards with trends') {
      metricProps.trend = guessTrend(key);
    }

    metrics.push({
      component: 'Metric',
      props: metricProps
    });
  }

  // Adjust display based on style
  if (style === 'Simple numbers') {
    return {
      component: 'Section',
      props: { title: 'Key Metrics' },
      children: [{
        component: 'Container',
        props: { cols: Math.min(metrics.length, 4), gap: 'sm' },
        children: metrics
      }]
    };
  } else if (style === 'With charts') {
    return {
      component: 'Card',
      props: { title: 'Performance Overview', colspan },
      children: [{
        component: 'Container',
        props: { cols: Math.min(metrics.length, 3), gap: 'md' },
        children: metrics
      }]
    };
  } else {
    // Cards with trends (default)
    return {
      component: 'Card',
      props: { title: 'Overview', colspan },
      children: [{
        component: 'Container',
        props: { cols: Math.min(metrics.length, 4), gap: 'sm' },
        children: metrics
      }]
    };
  }
}

// Get focus keywords for filtering
function getFocusKeywords(focusArea: string, contextType: string): string[] {
  const keywords: Record<string, string[]> = {
    'Code activity': ['commit', 'push', 'branch', 'merge'],
    'Sales metrics': ['revenue', 'sales', 'orders', 'conversion'],
    'Product inventory': ['product', 'stock', 'inventory'],
    'Task progress': ['task', 'completion', 'progress'],
    'Device status': ['device', 'online', 'offline', 'status'],
    'Sensor readings': ['temperature', 'humidity', 'sensor', 'reading']
  };
  return keywords[focusArea] || [];
}

// Find best primary field for list display
function findBestPrimaryField(keys: string[], firstItem: any): string {
  // Priority order for primary field
  const preferredFields = ['name', 'title', 'orderId', 'id', 'month', 'status', 'source', 'region', 'ageGroup'];
  
  // Try preferred fields first
  for (const field of preferredFields) {
    if (keys.includes(field)) return field;
  }
  
  // Fallback to first string or first field
  const stringFields = keys.filter(k => typeof firstItem[k] === 'string');
  if (stringFields.length > 0) return stringFields[0];
  
  return keys[0] || 'id';
}

// Find best secondary field for list display
function findBestSecondaryField(keys: string[], firstItem: any, primaryField: string): string | undefined {
  // Priority order for secondary field
  const preferredFields = ['description', 'email', 'date', 'total', 'revenue', 'count', 'value', 'customerName'];
  
  // Try preferred fields first (excluding primary)
  for (const field of preferredFields) {
    if (keys.includes(field) && field !== primaryField) return field;
  }
  
  // Fallback to first numeric field or second field
  const numericFields = keys.filter(k => typeof firstItem[k] === 'number' && k !== primaryField);
  if (numericFields.length > 0) return numericFields[0];
  
  // Use second field if different from primary
  if (keys.length > 1 && keys[1] !== primaryField) return keys[1];
  
  return undefined;
}

// Build list section with action support
function buildListSection(
  name: string,
  items: any[],
  actionLevel: string,
  colspan: number,
  priority: string
): ComponentSchema {
  const actions: string[] = [];
  
  if (actionLevel === 'Quick actions') {
    actions.push('view', 'edit');
  } else if (actionLevel === 'Full management') {
    actions.push('view', 'edit', 'delete');
  }

  const showAvatar = items.length > 0 && items[0] && ('name' in items[0] || 'author' in items[0] || 'customer' in items[0] || 'customerName' in items[0]);

  // Generate smart template if items exist
  let template = undefined;
  if (items.length > 0 && items[0]) {
    const firstItem = items[0];
    const keys = Object.keys(firstItem);
    const primary = findBestPrimaryField(keys, firstItem);
    const secondary = findBestSecondaryField(keys, firstItem, primary);
    
    template = {
      primary,
      secondary
    };
  }

  return {
    component: 'Card',
    props: { 
      title: formatLabel(name), 
      colspan: priority === 'Detailed lists' ? 3 : colspan 
    },
    children: [{
      component: 'List',
      props: {
        items: `$data.${name}`,
        avatar: showAvatar,
        actions,
        template
      }
    }]
  };
}

// Select best columns for table display
function selectBestColumns(firstItem: any): string[] {
  const allKeys = Object.keys(firstItem);
  
  // Priority fields to show first
  const priorityFields = ['id', 'name', 'title', 'status', 'date', 'total', 'revenue', 'count'];
  
  const selected: string[] = [];
  
  // Add priority fields that exist
  for (const field of priorityFields) {
    if (allKeys.includes(field)) {
      selected.push(field);
      if (selected.length >= 6) break;
    }
  }
  
  // Fill remaining slots with other fields
  for (const key of allKeys) {
    if (!selected.includes(key)) {
      selected.push(key);
      if (selected.length >= 6) break;
    }
  }
  
  return selected;
}

// Build table section for complex data
function buildTableSection(name: string, items: any[], colspan: number): ComponentSchema {
  if (items.length === 0) {
    return buildListSection(name, items, 'View only', colspan, 'All equal');
  }

  const firstItem = items[0];
  const columns = selectBestColumns(firstItem);

  return {
    component: 'Card',
    props: { title: formatLabel(name), colspan: 3 },
    children: [{
      component: 'Table',
      props: {
        columns,
        rows: `$data.${name}`,
        sortable: true
      }
    }]
  };
}

// Build chart section
function buildChartSection(name: string, data: Record<string, any>, colspan: number = 1): ComponentSchema {
  // Determine best chart type based on data
  const values = Object.values(data);
  const hasOnlyNumbers = values.every(v => typeof v === 'number');
  
  return {
    component: 'Card',
    props: { title: formatLabel(name), colspan },
    children: [{
      component: 'Chart',
      props: {
        type: hasOnlyNumbers ? 'pie' : 'bar',
        data: `$data.${name}`
      }
    }]
  };
}

// Build breakdown as table
function buildBreakdownTable(name: string, data: Record<string, any>): ComponentSchema {
  return {
    component: 'Card',
    props: { title: formatLabel(name) },
    children: [{
      component: 'Container',
      props: { cols: 1, gap: 'sm' },
      children: Object.entries(data).map(([key, value]) => ({
        component: 'Metric',
        props: {
          label: formatLabel(key),
          value: String(value),
          icon: 'info'
        }
      }))
    }]
  };
}

// Guess trend indicator
function guessTrend(key: string): 'up' | 'down' | 'neutral' {
  const positiveKeys = ['revenue', 'sales', 'growth', 'profit', 'users', 'followers', 'stars'];
  const negativeKeys = ['issues', 'errors', 'bounce', 'churn', 'expenses'];
  
  const lowerKey = key.toLowerCase();
  if (positiveKeys.some(k => lowerKey.includes(k))) return 'up';
  if (negativeKeys.some(k => lowerKey.includes(k))) return 'down';
  return 'neutral';
}

// Utility: format key to label
function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
}

// Utility: guess icon from key name
function guessIcon(key: string): string {
  const iconMap: Record<string, string> = {
    stars: 'star',
    forks: 'fork',
    issues: 'issue',
    open_issues: 'issue',
    contributors: 'users',
    commits: 'git-commit',
    revenue: 'dollar',
    users: 'users',
    views: 'eye'
  };
  return iconMap[key.toLowerCase()] || 'info';
}

// Create initial UI state with versioning
export function createUIState(
  contextOrData: InputContext | Record<string, any>,
  schema: ComponentSchema
): UIState {
  return {
    version: '1.0.0',
    contextHash: hashContext(contextOrData),
    schema,
    createdAt: new Date().toISOString(),
    history: []
  };
}

// Apply evolution (diff) to existing state
export function evolveUI(
  state: UIState,
  operation: EvolutionDiff['operation'],
  path: string,
  value?: ComponentSchema
): UIState {
  const newVersion = incrementVersion(state.version);

  // Store diff in history
  const diff: EvolutionDiff = { operation, path, value };
  state.history.push({
    version: state.version,
    diff,
    timestamp: new Date().toISOString()
  });

  // Apply diff to schema (simplified - real impl would parse path)
  if (operation === 'add' && value) {
    state.schema.children = state.schema.children || [];
    state.schema.children.push(value);
  }

  state.version = newVersion;
  return state;
}

function hashContext(contextOrData: InputContext | Record<string, any>): string {
  // Use a simple hash for now - in production, use a proper hash function
  const str = JSON.stringify(contextOrData);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36).substring(0, 12);
}

function incrementVersion(version: string): string {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
}

// AI-powered UI generation with fallback to rule-based generation
export async function generateUIWithAI(
  data: Record<string, any>,
  analysis: ContextAnalysis,
  answers?: UserAnswers,
  apiKey?: string
): Promise<{
  schema?: ComponentSchema;
  needsQuestions: boolean;
  questions?: Question[];
  reasoning?: string;
}> {
  try {
    console.log('[Generator] Attempting AI-powered UI generation...', {
      dataKeys: Object.keys(data),
      analysisContext: analysis.detectedContext,
      hasAnswers: !!answers
    });

    // Call Gemini to generate schema or questions
    const aiResponse = await generateSchemaWithGemini(data, analysis, answers, apiKey);

    console.log('[Generator] AI response received:', {
      needsQuestions: aiResponse.needsQuestions,
      hasQuestions: !!aiResponse.questions,
      questionsCount: aiResponse.questions?.length,
      hasSchema: !!aiResponse.schema,
      schemaComponent: aiResponse.schema?.component,
      reasoning: aiResponse.reasoning?.substring(0, 100)
    });

    if (aiResponse.needsQuestions && aiResponse.questions && aiResponse.questions.length > 0) {
      // AI determined questions are needed
      console.log('[Generator] AI determined questions are needed:', aiResponse.reasoning);
      return {
        needsQuestions: true,
        questions: aiResponse.questions,
        reasoning: aiResponse.reasoning
      };
    } else if (aiResponse.schema) {
      // AI generated schema directly
      console.log('[Generator] AI generated schema directly:', aiResponse.reasoning);

      console.log('[Generator] Schema structure:', JSON.stringify(aiResponse.schema, null, 2).substring(0, 500));

      // Validate the schema
      const validation = validateSchema(aiResponse.schema);
      if (!validation.valid) {
        console.warn('[Generator] AI-generated schema has validation warnings:', validation.errors);
      }

      return {
        needsQuestions: false,
        schema: aiResponse.schema,
        reasoning: aiResponse.reasoning
      };
    } else if (!aiResponse.needsQuestions) {
      // AI said no questions needed but didn't provide schema - generate with rules
      console.warn('[Generator] AI said needsQuestions=false but no schema provided, using rule-based generation');
      const schema = generateUI(data, analysis, answers || {});
      return {
        needsQuestions: false,
        schema,
        reasoning: aiResponse.reasoning || 'AI provided no schema, used rule-based generation'
      };
    } else {
      console.error('[Generator] Invalid AI response structure:', JSON.stringify(aiResponse, null, 2));
      throw new Error('Invalid AI response: neither questions nor schema provided');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('[Generator] AI generation failed, falling back to rule-based generation:', errorMessage);

    // Fallback to rule-based generation
    const schema = generateUI(data, analysis, answers || {});
    console.log('Rule-based Generated Schema:', JSON.stringify(schema, null, 2));

    return {
      needsQuestions: false,
      schema,
      reasoning: `Generated using rule-based fallback (${errorMessage})`
    };
  }
}
