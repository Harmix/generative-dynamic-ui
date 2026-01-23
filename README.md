# Dynamic UI Builder

A constrained UI generation system where interfaces are built using only a predefined component library. The system evaluates context, gathers requirements through questions, then generates and evolves UIs predictably.

## Overview

This project demonstrates a novel approach to UI generation:

- **Constrained Palette** - Limited to 12 components (no arbitrary HTML/CSS)
- **Context-Driven** - UI structure derived from input data shape
- **Iterative Refinement** - Questions narrow down requirements before generation
- **Persistent Evolution** - Changes are additive/predictable, not random rebuilds

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up AI analysis (optional but recommended)
# 1. Get a free API key from https://aistudio.google.com/apikey
# 2. Create .env.local file in the project root
# 3. Add: NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here

# Run development server
pnpm dev

# Open http://localhost:3000
```

## AI-Powered JSON Analysis

The system now includes AI-powered analysis using Google Gemini to automatically:
- Detect if your JSON matches existing domain configurations
- Generate new domain configurations for unknown data types
- Create context-specific questions for better UI generation
- Save new configurations for future use

### Setup
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a `.env.local` file in the project root
3. Add your key:
```
NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

Without the API key, the system falls back to local pattern matching.

## System Architecture

The system operates in 4 phases:

```
Input Context → Analyze → Questions → Generate → Render UI
```

### Phase 1: Context Analysis
- Parses input data (API response, file, URL)
- Identifies data types (metrics, lists, timelines, relationships)
- Determines primary entities and actions

### Phase 2: Requirement Gathering
- Generates 3-5 targeted questions based on context
- Questions cover: priority metrics, interaction needs, update frequency
- User answers shape component selection

### Phase 3: UI Generation
- Maps requirements to component combinations
- Generates layout structure using only allowed components
- Outputs as serializable JSON schema

### Phase 4: Rendering
- Dynamic renderer interprets the schema
- Resolves data bindings (`$data.path` syntax)
- Renders actual React components

## Component Library

### Layout Components
- **Container** - Grid wrapper with configurable columns
- **Card** - Content container with header/footer
- **Section** - Collapsible grouped content

### Data Display
- **Metric** - Single KPI with trend indicator
- **Table** - Tabular data with sorting
- **List** - Item collection with avatars
- **Chart** - Bar/line/pie visualizations

### Interactive
- **Button** - Action triggers
- **Filter** - Data filtering controls
- **Tabs** - View switching

### Status
- **Badge** - Status indicators
- **Progress** - Completion states

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: TailwindCSS v4
- **UI Components**: Radix UI
- **Language**: TypeScript

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── page.tsx           # Demo page
│   └── globals.css        # Global styles
├── common/                # Core logic
│   ├── analyzer.ts        # Context analysis
│   ├── generator.ts       # Schema generation
│   ├── components.ts      # Component definitions
│   └── demo.ts           # Demo examples
├── components/
│   ├── DynamicRenderer.tsx # Schema → React renderer
│   └── ui/               # UI component library
├── lib/
│   ├── dataBinding.ts    # Data resolution utilities
│   └── utils.ts          # Utility functions
└── dynamic-ui-plan.md    # Detailed system plan
```

## Example Usage

```typescript
import { analyzeContext } from '@/common/analyzer'
import { generateUI } from '@/common/generator'
import { DynamicRenderer } from '@/components/DynamicRenderer'

// 1. Define context
const context = {
  type: 'github_repo',
  data: {
    stars: 1247,
    forks: 89,
    recent_commits: [...]
  }
}

// 2. Analyze context
const analysis = analyzeContext(context)

// 3. Answer questions
const answers = {
  priority: 'Overview metrics',
  list_actions: 'Quick actions'
}

// 4. Generate UI schema
const schema = generateUI(context, analysis, answers)

// 5. Render
<DynamicRenderer schema={schema} data={context.data} />
```

## Data Binding

The system supports dynamic data binding:

```json
{
  "component": "Metric",
  "props": {
    "label": "Stars",
    "value": "$data.stars"
  }
}
```

Supported patterns:
- `$data.path` - Bind to context data
- `$item.field` - Bind to list item (in loops)
- Nested paths: `$data.user.profile.name`

## Development

```bash
# Run linter
pnpm lint

# Build for production
pnpm build

# Start production server
pnpm start
```

## Key Features

- ✅ Type-safe schema validation
- ✅ Error boundaries for failed renders
- ✅ Responsive layouts
- ✅ Dark mode support
- ✅ Zero arbitrary HTML/CSS
- ✅ Predictable UI evolution
- ✅ Data binding system

## Learn More

See [`dynamic-ui-plan.md`](./dynamic-ui-plan.md) for the complete system design and philosophy.

## License

MIT
