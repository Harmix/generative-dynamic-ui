// AI-powered JSON analysis using Google Gemini
// Determines if JSON matches existing domains or needs new configuration

import { DomainConfig, matchDomain, SYSTEM_DOMAINS } from './domains';
import { Question, ContextAnalysis } from './analyzer';
import { ComponentSchema, COMPONENT_SPECS } from './components';
import { AIGenerationResponseSchema, AIGenerationResponse } from './schema';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { UserAnswers } from './generator';

export interface AIAnalysisResult {
  needsNewDomain: boolean;
  matchedDomain?: DomainConfig;
  suggestedDomain?: DomainConfig;
  reasoning?: string;
}

// Get Gemini API key from parameter or environment
function getGeminiAPIKey(providedKey?: string): string | null {
  const key = providedKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || null;
  console.log('Gemini API key check:', key ? `Found (${key.substring(0, 10)}...)` : 'NOT FOUND');
  return key;
}

// Analyze JSON data with Google Gemini
export async function analyzeJSONWithAI(
  data: Record<string, any>,
  providedApiKey?: string
): Promise<AIAnalysisResult> {
  const apiKey = getGeminiAPIKey(providedApiKey);
  
  if (!apiKey) {
    console.warn('Gemini API key not found. Falling back to local analysis.');
    return fallbackToLocalAnalysis(data);
  }

  try {
    // First, try local domain matching
    const localMatch = matchDomain(data);
    if (localMatch) {
      return {
        needsNewDomain: false,
        matchedDomain: localMatch,
        reasoning: 'Matched existing domain using keyword analysis'
      };
    }

    // If no local match, use AI to analyze
    const prompt = buildAnalysisPrompt(data);
    const result = await callGeminiAPI(apiKey, prompt);
    
    return result;
  } catch (error) {
    console.error('AI analysis failed:', error);
    return fallbackToLocalAnalysis(data);
  }
}

// Build the prompt for Gemini
function buildAnalysisPrompt(data: Record<string, any>): string {
  const dataStructure = analyzeDataStructure(data);
  const existingDomains = SYSTEM_DOMAINS.map(d => ({
    id: d.id,
    name: d.name,
    keywords: d.keywords
  }));

  return `You are an expert at analyzing data structures and categorizing them into domains.

EXISTING DOMAINS:
${JSON.stringify(existingDomains, null, 2)}

JSON DATA TO ANALYZE:
Keys: ${dataStructure.keys.join(', ')}
Structure: ${dataStructure.description}

TASK:
1. Determine if this JSON data fits into one of the existing domains (at least 30% keyword match)
2. If yes, return the matching domain ID and explain why
3. If no, create a NEW domain configuration

OUTPUT FORMAT (JSON only, no markdown):
{
  "needsNewDomain": boolean,
  "matchedDomainId": "domain_id" (if match found),
  "reasoning": "brief explanation",
  "newDomain": {
    "id": "snake_case_id",
    "name": "Human Readable Name",
    "description": "Brief description",
    "keywords": ["key1", "key2", "key3"],
    "questions": [
      {
        "id": "question_id",
        "text": "Question text?",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "impact": "layout_weight|section_priority|component_selection|visualization_style"
      }
    ],
    "layoutHints": {
      "preferredLayout": "grid|single-column|tabs",
      "emphasize": "metrics|lists|timeline|balanced"
    }
  } (only if needsNewDomain is true)
}

IMPORTANT:
- Generate 2-4 specific questions relevant to this data domain
- Questions should help determine UI layout and priorities
- Use clear, actionable question text
- Provide 3-4 options per question
- Keywords should be lowercase and match actual data keys`;
}

// Analyze data structure for the prompt
function analyzeDataStructure(data: Record<string, any>): {
  keys: string[];
  description: string;
} {
  const keys = Object.keys(data);
  const types: Record<string, number> = {
    numbers: 0,
    arrays: 0,
    objects: 0,
    strings: 0
  };

  for (const key in data) {
    const value = data[key];
    if (typeof value === 'number') types.numbers++;
    else if (Array.isArray(value)) types.arrays++;
    else if (typeof value === 'object' && value !== null) types.objects++;
    else if (typeof value === 'string') types.strings++;
  }

  const description = `${types.numbers} metrics, ${types.arrays} lists, ${types.objects} nested objects, ${types.strings} text fields`;
  
  return { keys, description };
}

// Call Google Gemini API
async function callGeminiAPI(apiKey: string, prompt: string): Promise<AIAnalysisResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('No response from Gemini API');
  }

  // Parse the JSON response (strip markdown if present)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON from AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  // Convert to AIAnalysisResult format
  if (parsed.needsNewDomain && parsed.newDomain) {
    return {
      needsNewDomain: true,
      suggestedDomain: {
        ...parsed.newDomain,
        createdBy: 'ai' as const,
        createdAt: new Date().toISOString()
      },
      reasoning: parsed.reasoning
    };
  } else if (parsed.matchedDomainId) {
    const matched = SYSTEM_DOMAINS.find(d => d.id === parsed.matchedDomainId);
    return {
      needsNewDomain: false,
      matchedDomain: matched,
      reasoning: parsed.reasoning
    };
  }

  throw new Error('Invalid AI response format');
}

// Fallback to local analysis if AI fails
function fallbackToLocalAnalysis(data: Record<string, any>): AIAnalysisResult {
  const localMatch = matchDomain(data);
  
  if (localMatch) {
    return {
      needsNewDomain: false,
      matchedDomain: localMatch,
      reasoning: 'Local keyword matching (AI unavailable)'
    };
  }

  // Generate a basic generic domain
  return {
    needsNewDomain: true,
    suggestedDomain: {
      id: 'generic_' + Date.now(),
      name: 'Generic Data',
      description: 'Custom data structure',
      keywords: Object.keys(data).slice(0, 5).map(k => k.toLowerCase()),
      questions: [
        {
          id: 'priority',
          text: 'What is your primary focus?',
          options: ['Overview metrics', 'Detailed lists', 'Activity/timeline', 'All equal'],
          impact: 'layout_weight'
        },
        {
          id: 'metric_style',
          text: 'How should metrics be displayed?',
          options: ['Cards with trends', 'Simple numbers', 'With charts'],
          impact: 'component_selection'
        }
      ],
      layoutHints: {
        preferredLayout: 'grid',
        emphasize: 'balanced'
      },
      createdBy: 'ai',
      createdAt: new Date().toISOString()
    },
    reasoning: 'No match found, generated generic configuration (AI unavailable)'
  };
}

// Generate UI schema using Gemini with structured output
export async function generateSchemaWithGemini(
  data: Record<string, any>,
  analysis: ContextAnalysis,
  answers?: UserAnswers,
  providedApiKey?: string
): Promise<AIGenerationResponse> {
  const apiKey = getGeminiAPIKey(providedApiKey);

  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const prompt = buildSchemaGenerationPrompt(data, analysis, answers);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

  // Try with structured output first, fallback to plain JSON if it fails
  const tryGeneration = async (useStructuredOutput: boolean) => {
    const generationConfig: Record<string, any> = {
      temperature: 0.3,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    };

    if (useStructuredOutput) {
      const jsonSchema = zodToJsonSchema(AIGenerationResponseSchema as any);
      generationConfig.responseMimeType = 'application/json';
      generationConfig.responseSchema = jsonSchema;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: useStructuredOutput ? prompt : prompt + '\n\nRespond with valid JSON only, no markdown code blocks.'
          }]
        }],
        generationConfig
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No response from Gemini API');
    }

    return text;
  };

  try {
    // First try with structured output
    let text: string;
    try {
      text = await tryGeneration(true);
    } catch (structuredError) {
      console.warn('Structured output failed, trying plain JSON:', structuredError);
      text = await tryGeneration(false);
    }

    // Parse JSON (strip markdown if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = AIGenerationResponseSchema.parse(parsed);

    return validated;
  } catch (error) {
    console.error('Gemini schema generation failed:', error);
    throw error;
  }
}

// Build the prompt for schema generation
function buildSchemaGenerationPrompt(
  data: Record<string, any>,
  analysis: ContextAnalysis,
  answers?: UserAnswers
): string {
  const dataStructure = analyzeDataStructure(data);
  const componentSpecs = Object.entries(COMPONENT_SPECS).map(([name, spec]) => ({
    component: name,
    required: spec.required,
    optional: spec.props.filter(p => !spec.required.includes(p))
  }));

  let prompt = `You are an expert UI generator. Generate a dashboard UI schema from the provided data.

AVAILABLE COMPONENTS (you must use ONLY these 12 components):
${JSON.stringify(componentSpecs, null, 2)}

DATA TO VISUALIZE:
Keys: ${dataStructure.keys.join(', ')}
Structure: ${dataStructure.description}
Sample: ${JSON.stringify(data, null, 2).substring(0, 500)}...

CONTEXT ANALYSIS:
- Detected Context: ${analysis.detectedContext}
- Data Types: ${analysis.dataTypes.join(', ')}
- Entities: ${analysis.entities.join(', ')}
- Suggested Layout: ${analysis.suggestedLayout}
${analysis.matchedDomain ? `- Domain: ${analysis.matchedDomain.name}` : ''}

`;

  if (answers && Object.keys(answers).length > 0) {
    prompt += `USER PREFERENCES:
${Object.entries(answers).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

TASK: Generate the complete UI schema based on the data and user preferences.
Set needsQuestions to FALSE and provide the schema.

`;

    // Add specific instructions for chart preference
    if (answers.chart_preference === 'Charts/graphs') {
      prompt += `CHART PREFERENCE: User wants charts/graphs for nested data.

RULES FOR CHARTS:
- For nested objects with numeric values (like { TypeScript: 65, Python: 30 }), 
  create Chart components with type "pie" or "bar"
- Point to the SPECIFIC nested path containing numbers, NOT the parent object
  - Good: "$data.healthcare.hospitalOverview" (flat object with numbers)
  - Bad: "$data.healthcare" (complex nested object)
- Use "pie" for percentage/distribution data, "bar" for comparisons
- The Chart component can now handle nested objects, so it's safe to use

`;
    } else {
      // Default behavior when not asking for charts
      prompt += `IMPORTANT RULES FOR METRICS:
- When you find a nested object where ALL values are numbers (like gymMetrics: {totalMembers: 3456, activeMembers: 2789}), 
  create INDIVIDUAL Metric components for EACH number inside
- Use full dot notation paths: "$data.gymMetrics.totalMembers", "$data.gymMetrics.activeMembers", etc.
- DO NOT create a Chart component for objects containing only numbers - use Metric components instead
- Wrap metrics in a Card with a Container inside to display them in a grid

`;
    }

    prompt += `GENERAL RULES:
- Use data bindings like "$data.fieldName" for dynamic values
- Container component should be the root with cols and gap props
- Wrap content in Card components with titles
- For arrays, use List or Table components with "$data.arrayName" as items/rows
- Follow the component prop requirements strictly
- Create a well-structured, hierarchical layout
`;
  } else {
    prompt += `TASK: Analyze the data complexity and decide:

1. If data is SIMPLE (1-3 metrics, 1-2 lists, clear structure):
   - Set needsQuestions to FALSE
   - Generate a complete UI schema directly
   - Use sensible defaults for layout

2. If data is COMPLEX (5+ entities, nested structures, ambiguous priorities):
   - Set needsQuestions to TRUE
   - Generate 2-4 relevant questions to clarify user preferences
   - Do NOT generate schema yet

IMPORTANT RULES FOR METRICS (default behavior):
- When you find a nested object where ALL values are numbers (like gymMetrics: {totalMembers: 3456, activeMembers: 2789}), 
  create INDIVIDUAL Metric components for EACH number inside
- Use full dot notation paths: "$data.gymMetrics.totalMembers", "$data.gymMetrics.activeMembers", etc.
- Wrap metrics in a Card with a Container inside to display them in a grid
- The Chart component can handle nested objects if needed for visualization

GENERAL RULES:
- Use data bindings like "$data.fieldName" for dynamic values
- Container component should be the root with cols and gap props
- Wrap content in Card components with titles
- For arrays, use List or Table components with "$data.arrayName" as items/rows
- Follow the component prop requirements strictly
- Create a well-structured, hierarchical layout

EXAMPLE for nested metrics:
If data has: { "gymMetrics": { "totalMembers": 3456, "activeMembers": 2789 } }
Generate:
{
  "component": "Card",
  "props": { "title": "Gym Metrics", "colspan": 3 },
  "children": [{
    "component": "Container",
    "props": { "cols": 4, "gap": "sm" },
    "children": [
      { "component": "Metric", "props": { "label": "Total Members", "value": "$data.gymMetrics.totalMembers", "icon": "users" }},
      { "component": "Metric", "props": { "label": "Active Members", "value": "$data.gymMetrics.activeMembers", "icon": "users" }}
    ]
  }]
}
`;
  }

  return prompt;
}

