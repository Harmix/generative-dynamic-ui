// Demo: Full flow from input to generated UI

import { analyzeContext, InputContext } from './analyzer';
import { generateUI, createUIState, evolveUI } from './generator';

// ============================================
// EXAMPLE 1: GitHub Repository Dashboard
// ============================================

const githubContext: InputContext = {
  type: 'github_repo',
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
};

console.log('='.repeat(60));
console.log('PHASE 1: Context Analysis');
console.log('='.repeat(60));

const analysis = analyzeContext(githubContext);
console.log('\nDetected data types:', analysis.dataTypes);
console.log('Entities found:', analysis.entities);
console.log('Suggested layout:', analysis.suggestedLayout);

console.log('\n--- Generated Questions ---');
analysis.questions.forEach((q, i) => {
  console.log(`\n${i + 1}. ${q.text}`);
  q.options.forEach((opt, j) => console.log(`   [${j + 1}] ${opt}`));
});

// Simulate user answers
const userAnswers = {
  priority: 'Overview metrics',
  focus_area: 'Code activity',
  metric_style: 'Cards with trends',
  list_actions: 'Quick actions'
};

console.log('\n--- User Answers ---');
Object.entries(userAnswers).forEach(([k, v]) => console.log(`${k}: ${v}`));

console.log('\n' + '='.repeat(60));
console.log('PHASE 2: UI Generation');
console.log('='.repeat(60));

const schema = generateUI(githubContext, analysis, userAnswers);
console.log('\nGenerated Schema:');
console.log(JSON.stringify(schema, null, 2));

console.log('\n' + '='.repeat(60));
console.log('PHASE 3: State Persistence');
console.log('='.repeat(60));

let uiState = createUIState(githubContext, schema);
console.log('\nInitial state version:', uiState.version);
console.log('Context hash:', uiState.contextHash);

console.log('\n' + '='.repeat(60));
console.log('PHASE 4: Evolution');
console.log('='.repeat(60));

// Simulate adding a new section
const newSection = {
  component: 'Card' as const,
  props: { title: 'CI Status', colspan: 3 },
  children: [{
    component: 'Table' as const,
    props: {
      columns: ['Pipeline', 'Status', 'Duration'],
      rows: '$data.ci_runs'
    }
  }]
};

uiState = evolveUI(uiState, 'add', 'root.children[4]', newSection);
console.log('\nAfter evolution - version:', uiState.version);
console.log('History entries:', uiState.history.length);
console.log('Latest diff:', JSON.stringify(uiState.history[0].diff, null, 2));

console.log('\n' + '='.repeat(60));
console.log('FINAL SCHEMA STRUCTURE');
console.log('='.repeat(60));

// Print visual representation
function printStructure(schema: any, indent = 0): void {
  const pad = '  '.repeat(indent);
  const props = Object.entries(schema.props || {})
    .filter(([k]) => k !== 'children')
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(' ');
  console.log(`${pad}<${schema.component} ${props}>`);

  if (schema.children) {
    for (const child of schema.children) {
      printStructure(child, indent + 1);
    }
  }
}

console.log('\n');
printStructure(uiState.schema);

console.log('\n' + '='.repeat(60));
console.log('VISUAL MOCKUP');
console.log('='.repeat(60));
console.log(`
┌─────────────────────────────────────────────────────────────┐
│ Overview                                              [3col]│
│ ┌───────────┬───────────┬───────────┬───────────┐          │
│ │ ⭐ Stars  │ 🍴 Forks  │ 🔴 Issues │ 👥 Contri │          │
│ │   1,247   │    89     │    23     │    3      │          │
│ └───────────┴───────────┴───────────┴───────────┘          │
├─────────────────────────────────────┬───────────────────────┤
│ Recent commits                [2col]│ Languages       [1col]│
│ ┌─────────────────────────────────┐ │ ┌───────────────────┐ │
│ │ • fix: resolve auth issue       │ │ │ TypeScript  65%   │ │
│ │   alice · 2h ago          [edit]│ │ │ Python      30%   │ │
│ │ • feat: add rate limiting       │ │ │ Shell        5%   │ │
│ │   bob · 5h ago            [edit]│ │ └───────────────────┘ │
│ └─────────────────────────────────┘ │                       │
├─────────────────────────────────────┴───────────────────────┤
│ Contributors                                          [2col]│
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ • alice (142 commits)                             [edit]│ │
│ │ • bob (89 commits)                                [edit]│ │
│ │ • carol (34 commits)                              [edit]│ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ CI Status (added via evolution)                       [3col]│
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Pipeline        │ Status    │ Duration                  │ │
│ │ main            │ ✅ pass   │ 2m 34s                    │ │
│ │ feature/auth    │ 🔴 fail   │ 1m 12s                    │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
`);
