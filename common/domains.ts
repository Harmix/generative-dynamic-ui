// Domain Configuration Management
// Handles domain configs (both system-defined and AI-generated)

import { Question } from './analyzer';

export interface LayoutHints {
  preferredLayout?: 'grid' | 'single-column' | 'tabs';
  metricDisplay?: 'cards' | 'simple' | 'with-charts';
  listStyle?: 'avatar' | 'simple' | 'detailed';
  emphasize?: 'metrics' | 'lists' | 'timeline' | 'balanced';
}

export interface DomainConfig {
  id: string;
  name: string;
  description: string;
  keywords: string[];           // Keys that identify this domain
  questions: Question[];        // Domain-specific questions
  layoutHints: LayoutHints;     // UI generation hints
  createdBy: 'system' | 'ai';
  createdAt: string;
}

// System-defined domains (migrated from analyzer.ts)
export const SYSTEM_DOMAINS: DomainConfig[] = [
  {
    id: 'github_repo',
    name: 'GitHub Repository',
    description: 'Repository stats, commits, contributors, and code metrics',
    keywords: ['commits', 'contributors', 'stars', 'forks', 'issues', 'pull_requests'],
    questions: [
      {
        id: 'priority',
        text: 'What is your primary focus?',
        options: ['Overview metrics', 'Detailed lists', 'Activity/timeline', 'All equal'],
        impact: 'layout_weight'
      },
      {
        id: 'focus_area',
        text: 'Which area matters most?',
        options: ['Code activity', 'Issues & PRs', 'Community', 'CI/CD'],
        impact: 'section_priority'
      }
    ],
    layoutHints: {
      preferredLayout: 'grid',
      emphasize: 'metrics'
    },
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Sales, products, orders, and customer data',
    keywords: ['products', 'orders', 'revenue', 'customers', 'sales'],
    questions: [
      {
        id: 'priority',
        text: 'What is your primary focus?',
        options: ['Overview metrics', 'Detailed lists', 'Activity/timeline', 'All equal'],
        impact: 'layout_weight'
      },
      {
        id: 'focus_area',
        text: 'What should be highlighted?',
        options: ['Sales metrics', 'Product inventory', 'Customer data', 'Recent orders'],
        impact: 'section_priority'
      }
    ],
    layoutHints: {
      preferredLayout: 'grid',
      emphasize: 'balanced'
    },
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Website traffic, page views, and user behavior',
    keywords: ['pageviews', 'visitors', 'sessions', 'traffic', 'bounce'],
    questions: [
      {
        id: 'priority',
        text: 'What is your primary focus?',
        options: ['Overview metrics', 'Detailed lists', 'Activity/timeline', 'All equal'],
        impact: 'layout_weight'
      },
      {
        id: 'time_range',
        text: 'Default time range?',
        options: ['Today', 'Week', 'Month', 'Quarter', 'Year'],
        impact: 'data_filter'
      }
    ],
    layoutHints: {
      preferredLayout: 'grid',
      emphasize: 'metrics'
    },
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'financial',
    name: 'Financial',
    description: 'Revenue, expenses, profit, and financial metrics',
    keywords: ['revenue', 'expenses', 'profit', 'income', 'costs'],
    questions: [
      {
        id: 'priority',
        text: 'What is your primary focus?',
        options: ['Overview metrics', 'Detailed lists', 'Activity/timeline', 'All equal'],
        impact: 'layout_weight'
      },
      {
        id: 'time_range',
        text: 'Default time range?',
        options: ['Today', 'Week', 'Month', 'Quarter', 'Year'],
        impact: 'data_filter'
      }
    ],
    layoutHints: {
      preferredLayout: 'grid',
      emphasize: 'metrics'
    },
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'project_management',
    name: 'Project Management',
    description: 'Tasks, team members, milestones, and project tracking',
    keywords: ['tasks', 'milestones', 'team', 'project', 'completion'],
    questions: [
      {
        id: 'priority',
        text: 'What is your primary focus?',
        options: ['Overview metrics', 'Detailed lists', 'Activity/timeline', 'All equal'],
        impact: 'layout_weight'
      },
      {
        id: 'focus_area',
        text: 'What needs most attention?',
        options: ['Task progress', 'Team allocation', 'Timeline/milestones', 'All equal'],
        impact: 'section_priority'
      }
    ],
    layoutHints: {
      preferredLayout: 'grid',
      emphasize: 'lists'
    },
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'iot',
    name: 'IoT/Sensors',
    description: 'Device monitoring, sensor readings, and alerts',
    keywords: ['sensors', 'devices', 'temperature', 'humidity', 'alerts'],
    questions: [
      {
        id: 'priority',
        text: 'What is your primary focus?',
        options: ['Overview metrics', 'Detailed lists', 'Activity/timeline', 'All equal'],
        impact: 'layout_weight'
      },
      {
        id: 'focus_area',
        text: 'What is most important?',
        options: ['Device status', 'Sensor readings', 'Alerts', 'All equal'],
        impact: 'section_priority'
      }
    ],
    layoutHints: {
      preferredLayout: 'grid',
      emphasize: 'metrics'
    },
    createdBy: 'system',
    createdAt: new Date().toISOString()
  },
  {
    id: 'social_media',
    name: 'Social Media',
    description: 'Followers, posts, engagement, and social metrics',
    keywords: ['followers', 'posts', 'likes', 'comments', 'engagement'],
    questions: [
      {
        id: 'priority',
        text: 'What is your primary focus?',
        options: ['Overview metrics', 'Detailed lists', 'Activity/timeline', 'All equal'],
        impact: 'layout_weight'
      }
    ],
    layoutHints: {
      preferredLayout: 'grid',
      emphasize: 'balanced'
    },
    createdBy: 'system',
    createdAt: new Date().toISOString()
  }
];

// Load AI-generated domains from domains.json
let aiDomains: DomainConfig[] = [];

export async function loadAIDomains(): Promise<DomainConfig[]> {
  try {
    const response = await fetch('/api/domains');
    if (response.ok) {
      const data = await response.json();
      aiDomains = data.domains || [];
      return aiDomains;
    }
  } catch (error) {
    console.warn('Failed to load AI domains:', error);
  }
  return [];
}

// Get all domains (system + AI)
export function getAllDomains(): DomainConfig[] {
  return [...SYSTEM_DOMAINS, ...aiDomains];
}

// Match JSON data to a domain config
export function matchDomain(data: Record<string, any>): DomainConfig | null {
  const keys = Object.keys(data).map(k => k.toLowerCase());
  const allDomains = getAllDomains();

  // Find best match by keyword overlap
  let bestMatch: { domain: DomainConfig; score: number } | null = null;

  for (const domain of allDomains) {
    const matchCount = domain.keywords.filter(keyword =>
      keys.some(key => key.includes(keyword.toLowerCase()))
    ).length;

    if (matchCount > 0) {
      const score = matchCount / domain.keywords.length;
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { domain, score };
      }
    }
  }

  // Require at least 30% keyword match
  return bestMatch && bestMatch.score >= 0.3 ? bestMatch.domain : null;
}

// Save a new AI-generated domain
export async function saveAIDomain(domain: DomainConfig): Promise<boolean> {
  try {
    const response = await fetch('/api/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain })
    });

    if (response.ok) {
      aiDomains.push(domain);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to save AI domain:', error);
    return false;
  }
}

