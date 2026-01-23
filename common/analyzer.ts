// Context Analyzer - Evaluates input and generates questions

import { DomainConfig, matchDomain } from './domains';

export interface InputContext {
  type?: string; // Optional - will be auto-detected if not provided
  data: Record<string, any>;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  impact: string; // which aspect of UI this affects
}

export interface ContextAnalysis {
  dataTypes: string[];        // metrics, lists, timelines, etc.
  entities: string[];         // primary objects found
  suggestedLayout: string;    // grid, single-column, tabs
  detectedContext: string;    // auto-detected context type
  questions: Question[];
  matchedDomain?: DomainConfig; // If matched to a domain config
}

// Detect data types in the input
function detectDataTypes(data: Record<string, any>): string[] {
  const types = new Set<string>();

  if (!data || Object.keys(data).length === 0) {
    return [];
  }

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'number') {
      types.add('metrics');
    }
    if (Array.isArray(value)) {
      types.add('lists');
      // Check if array contains date/time data
      if (value.length > 0 && value.some(item => 
        typeof item === 'object' && item !== null && 
        ('date' in item || 'time' in item || 'timestamp' in item)
      )) {
        types.add('timeline');
      }
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if ('timestamp' in value || 'date' in value || 'time' in value) {
        types.add('timeline');
      } else {
        types.add('nested');
      }
    }
  }

  return Array.from(types);
}

// Auto-detect context type from data shape and keys
function detectContextType(data: Record<string, any>): string {
  if (!data || Object.keys(data).length === 0) {
    return 'generic';
  }

  const keys = Object.keys(data).map(k => k.toLowerCase());
  const keyString = keys.join(' ');

  // GitHub/Repository context
  if (keys.some(k => ['commits', 'contributors', 'stars', 'forks', 'issues'].includes(k))) {
    return 'github_repo';
  }

  // E-commerce context
  if (keys.some(k => ['products', 'orders', 'revenue', 'customers', 'sales'].includes(k))) {
    return 'ecommerce';
  }

  // Analytics context
  if (keys.some(k => ['pageviews', 'visitors', 'sessions', 'traffic', 'bounce'].includes(k))) {
    return 'analytics';
  }

  // Financial context
  if (keys.some(k => ['revenue', 'expenses', 'profit', 'income', 'costs'].includes(k)) &&
      !keyString.includes('product')) {
    return 'financial';
  }

  // Project Management context
  if (keys.some(k => ['tasks', 'milestones', 'team', 'project', 'completion'].includes(k))) {
    return 'project_management';
  }

  // IoT/Sensor context
  if (keys.some(k => ['sensors', 'devices', 'temperature', 'humidity', 'alerts'].includes(k))) {
    return 'iot';
  }

  // Social Media context
  if (keys.some(k => ['followers', 'posts', 'likes', 'comments', 'engagement'].includes(k))) {
    return 'social_media';
  }

  return 'generic';
}

// Generate questions based on context type and data
function generateQuestions(contextType: string, dataTypes: string[], entities: string[]): Question[] {
  const questions: Question[] = [];

  // Universal question
  questions.push({
    id: 'priority',
    text: 'What is your primary focus?',
    options: ['Overview metrics', 'Detailed lists', 'Activity/timeline', 'All equal'],
    impact: 'layout_weight'
  });

  // Context-specific questions
  if (contextType === 'github_repo') {
    questions.push({
      id: 'focus_area',
      text: 'Which area matters most?',
      options: ['Code activity', 'Issues & PRs', 'Community', 'CI/CD'],
      impact: 'section_priority'
    });
  }

  if (contextType === 'ecommerce') {
    questions.push({
      id: 'focus_area',
      text: 'What should be highlighted?',
      options: ['Sales metrics', 'Product inventory', 'Customer data', 'Recent orders'],
      impact: 'section_priority'
    });
  }

  if (contextType === 'analytics' || contextType === 'financial') {
    questions.push({
      id: 'time_range',
      text: 'Default time range?',
      options: ['Today', 'Week', 'Month', 'Quarter', 'Year'],
      impact: 'data_filter'
    });
  }

  if (contextType === 'project_management') {
    questions.push({
      id: 'focus_area',
      text: 'What needs most attention?',
      options: ['Task progress', 'Team allocation', 'Timeline/milestones', 'All equal'],
      impact: 'section_priority'
    });
  }

  if (contextType === 'iot') {
    questions.push({
      id: 'focus_area',
      text: 'What is most important?',
      options: ['Device status', 'Sensor readings', 'Alerts', 'All equal'],
      impact: 'section_priority'
    });
  }

  // Data-type questions
  if (dataTypes.includes('metrics')) {
    questions.push({
      id: 'metric_style',
      text: 'How should metrics be displayed?',
      options: ['Cards with trends', 'Simple numbers', 'With charts'],
      impact: 'component_selection'
    });
  }

  if (dataTypes.includes('lists')) {
    questions.push({
      id: 'list_actions',
      text: 'Need actions on list items?',
      options: ['View only', 'Quick actions', 'Full management'],
      impact: 'interaction_level'
    });
  }

  if (dataTypes.includes('nested') && entities.length > 0) {
    questions.push({
      id: 'chart_preference',
      text: 'How to display nested data?',
      options: ['Charts/graphs', 'Detailed tables', 'Simple breakdown'],
      impact: 'visualization_style'
    });
  }

  return questions;
}

// Main analyzer function - now accepts raw data without type field
// Can also accept a DomainConfig to use custom domain settings
export function analyzeContext(
  input: Record<string, any> | InputContext,
  customDomain?: DomainConfig
): ContextAnalysis {
  // Handle both formats: raw data object or InputContext with type field
  let data: Record<string, any>;
  let providedType: string | undefined;

  if ('data' in input && typeof input.data === 'object') {
    // InputContext format
    data = input.data;
    providedType = input.type;
  } else {
    // Raw data format
    data = input;
  }

  const dataTypes = detectDataTypes(data);
  
  // Try to match with a domain config if not provided
  const domain = customDomain || matchDomain(data);
  
  // Use domain context or fallback to detection
  const detectedContext = domain?.id || providedType || detectContextType(data);

  // Extract entity names from data keys (arrays and objects)
  const entities = Object.keys(data).filter(k => {
    const value = data[k];
    return Array.isArray(value) || (typeof value === 'object' && value !== null);
  });

  // Suggest layout based on domain hints or data shape
  let suggestedLayout = domain?.layoutHints?.preferredLayout || 'grid';
  if (!domain) {
    // Fallback logic when no domain matched
    if (dataTypes.length === 1 && dataTypes[0] === 'lists') {
      suggestedLayout = 'single-column';
    } else if (entities.length > 5) {
      suggestedLayout = 'tabs';
    } else if (dataTypes.includes('metrics') && entities.length <= 2) {
      suggestedLayout = 'grid';
    }
  }

  // Use domain questions or generate questions
  const questions = domain?.questions || generateQuestions(detectedContext, dataTypes, entities);

  return {
    dataTypes,
    entities,
    suggestedLayout,
    detectedContext,
    questions,
    matchedDomain: domain || undefined
  };
}
