// Pre-built JSON examples for the Dynamic UI Builder

export interface ExampleData {
  id: string
  name: string
  description: string
  data: Record<string, any>
}

export const examples: ExampleData[] = [
  {
    id: 'github',
    name: 'GitHub Repository',
    description: 'Repository stats with commits, contributors, and languages',
    data: {
      name: 'acme/widget-api',
      stars: 1247,
      forks: 89,
      open_issues: 23,
      recent_commits: [
        { message: 'fix: resolve auth issue', author: 'alice', time: '2h ago' },
        { message: 'feat: add rate limiting', author: 'bob', time: '5h ago' },
        { message: 'docs: update README', author: 'carol', time: '1d ago' }
      ],
      contributors: [
        { name: 'alice', commits: 142 },
        { name: 'bob', commits: 89 },
        { name: 'carol', commits: 34 }
      ],
      languages: { TypeScript: 65, Python: 30, Shell: 5 }
    }
  },
  {
    id: 'ecommerce',
    name: 'E-commerce Dashboard',
    description: 'Sales metrics with products and orders',
    data: {
      total_revenue: 125430,
      orders_today: 47,
      active_customers: 1893,
      conversion_rate: 3.2,
      products: [
        { name: 'Widget Pro', price: 49.99, stock: 142, sales: 89 },
        { name: 'Gadget X', price: 89.99, stock: 38, sales: 56 },
        { name: 'Tool Plus', price: 29.99, stock: 234, sales: 123 }
      ],
      recent_orders: [
        { id: '#1234', customer: 'John D.', total: 149.99, status: 'shipped', date: '2024-01-15' },
        { id: '#1235', customer: 'Sarah M.', total: 89.99, status: 'processing', date: '2024-01-15' },
        { id: '#1236', customer: 'Mike R.', total: 249.98, status: 'delivered', date: '2024-01-14' }
      ],
      top_categories: { Electronics: 45, Accessories: 30, Tools: 15, Other: 10 }
    }
  },
  {
    id: 'analytics',
    name: 'Analytics Report',
    description: 'Website analytics with traffic sources and top pages',
    data: {
      pageviews: 45678,
      unique_visitors: 12340,
      bounce_rate: 34.5,
      avg_session_duration: 245,
      traffic_sources: { organic: 45, direct: 30, social: 15, referral: 10 },
      top_pages: [
        { path: '/home', views: 15000, avg_time: 180 },
        { path: '/products', views: 8900, avg_time: 320 },
        { path: '/blog', views: 5600, avg_time: 420 },
        { path: '/about', views: 3200, avg_time: 95 }
      ],
      devices: { desktop: 60, mobile: 35, tablet: 5 }
    }
  },
  {
    id: 'project',
    name: 'Project Management',
    description: 'Project tasks, team members, and milestones',
    data: {
      project_name: 'Website Redesign',
      completion: 67,
      tasks_total: 45,
      tasks_completed: 30,
      tasks: [
        { title: 'Design homepage mockup', status: 'completed', assignee: 'Alice', priority: 'high' },
        { title: 'Implement navigation', status: 'in_progress', assignee: 'Bob', priority: 'high' },
        { title: 'Write content', status: 'pending', assignee: 'Carol', priority: 'medium' },
        { title: 'Setup CI/CD', status: 'in_progress', assignee: 'Dave', priority: 'low' }
      ],
      team_members: [
        { name: 'Alice', role: 'Designer', tasks: 12 },
        { name: 'Bob', role: 'Developer', tasks: 18 },
        { name: 'Carol', role: 'Content Writer', tasks: 8 },
        { name: 'Dave', role: 'DevOps', tasks: 7 }
      ],
      milestones: [
        { name: 'Design Phase', date: '2024-01-20', completed: true },
        { name: 'Development Phase', date: '2024-02-15', completed: false },
        { name: 'Testing Phase', date: '2024-03-01', completed: false }
      ]
    }
  },
  {
    id: 'iot',
    name: 'IoT Device Monitor',
    description: 'IoT sensors and device status monitoring',
    data: {
      devices_online: 24,
      devices_offline: 2,
      alerts_active: 3,
      avg_temperature: 72.4,
      avg_humidity: 45.2,
      sensors: [
        { id: 'TEMP-01', name: 'Living Room Temp', value: 72.1, unit: '°F', status: 'normal' },
        { id: 'HUM-01', name: 'Living Room Humidity', value: 45.2, unit: '%', status: 'warning' },
        { id: 'TEMP-02', name: 'Bedroom Temp', value: 68.5, unit: '°F', status: 'normal' },
        { id: 'MOTION-01', name: 'Front Door Motion', value: 0, unit: 'events', status: 'normal' }
      ],
      device_status: { online: 24, offline: 2, maintenance: 1 },
      recent_alerts: [
        { sensor: 'HUM-01', message: 'Humidity above threshold', time: '10m ago', severity: 'warning' },
        { sensor: 'TEMP-03', message: 'Sensor offline', time: '1h ago', severity: 'error' },
        { sensor: 'MOTION-02', message: 'Motion detected', time: '2h ago', severity: 'info' }
      ]
    }
  },
  {
    id: 'financial',
    name: 'Financial Summary',
    description: 'Financial metrics with expenses and revenue breakdown',
    data: {
      total_revenue: 284500,
      total_expenses: 156200,
      net_profit: 128300,
      profit_margin: 45.1,
      expenses_breakdown: { salaries: 60, operations: 25, marketing: 10, other: 5 },
      revenue_by_quarter: [
        { quarter: 'Q1', revenue: 65000, expenses: 38000 },
        { quarter: 'Q2', revenue: 72000, expenses: 39500 },
        { quarter: 'Q3', revenue: 68500, expenses: 37200 },
        { quarter: 'Q4', revenue: 79000, expenses: 41500 }
      ],
      top_clients: [
        { name: 'Acme Corp', revenue: 45000, projects: 3 },
        { name: 'TechStart Inc', revenue: 38000, projects: 2 },
        { name: 'Global Solutions', revenue: 32000, projects: 4 }
      ]
    }
  },
  {
    id: 'social',
    name: 'Social Media Dashboard',
    description: 'Social media engagement metrics and posts',
    data: {
      followers: 15420,
      posts_today: 8,
      engagement_rate: 4.8,
      total_likes: 2345,
      total_comments: 456,
      platform_breakdown: { instagram: 45, twitter: 30, facebook: 15, linkedin: 10 },
      recent_posts: [
        { content: 'New product launch! 🚀', likes: 234, comments: 45, shares: 12, platform: 'instagram' },
        { content: 'Behind the scenes look', likes: 189, comments: 23, shares: 8, platform: 'instagram' },
        { content: 'Thank you for 15k followers!', likes: 567, comments: 89, shares: 34, platform: 'twitter' }
      ],
      top_hashtags: [
        { tag: '#product', uses: 45 },
        { tag: '#innovation', uses: 32 },
        { tag: '#tech', uses: 28 }
      ]
    }
  }
]

// Helper to get example by ID
export function getExampleById(id: string): ExampleData | undefined {
  return examples.find(ex => ex.id === id)
}

// Helper to format example data for display
export function formatExampleJSON(example: ExampleData): string {
  return JSON.stringify(example.data, null, 2)
}

