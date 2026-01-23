'use client'

import * as React from "react"
import { analyzeContext, ContextAnalysis, Question } from "@/common/analyzer"
import { generateUI, createUIState, UIState, generateUIWithAI } from "@/common/generator"
import { DynamicRendererWithBoundary } from "@/components/DynamicRenderer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Copy, Check, ExternalLink, Sparkles, Loader2, Download } from "lucide-react"
import { CodeEditor, validateJSON } from "@/components/ui/code-editor"
import { examples, getExampleById, formatExampleJSON } from "@/common/examples"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { analyzeJSONWithAI, AIAnalysisResult } from "@/common/ai-analyzer"
import { DomainConfig, loadAIDomains, saveAIDomain } from "@/common/domains"
import { generateHTMLExport, downloadHTML, generateFilename } from "@/lib/htmlExport"

export default function Home() {
  const router = useRouter()
  
  // State management
  const [selectedExample, setSelectedExample] = React.useState<string>('github')
  const [rawJson, setRawJson] = React.useState<string>('')
  const [jsonError, setJsonError] = React.useState<string | null>(null)
  const [parsedData, setParsedData] = React.useState<Record<string, any> | null>(null)
  
  const [currentPhase, setCurrentPhase] = React.useState(1)
  const [analysis, setAnalysis] = React.useState<ContextAnalysis | null>(null)
  const [userAnswers, setUserAnswers] = React.useState<Record<string, string>>({})
  const [uiState, setUIState] = React.useState<UIState | null>(null)
  const [showSchema, setShowSchema] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  
  // AI analysis state
  const [aiAnalyzing, setAiAnalyzing] = React.useState(false)
  const [aiResult, setAiResult] = React.useState<AIAnalysisResult | null>(null)
  const [showNewDomainModal, setShowNewDomainModal] = React.useState(false)
  const [newDomainName, setNewDomainName] = React.useState('')
  
  // AI generation state
  const [aiGenerating, setAiGenerating] = React.useState(false)
  const [aiGenerationReasoning, setAiGenerationReasoning] = React.useState<string | null>(null)

  // API key state
  const [geminiApiKey, setGeminiApiKey] = React.useState('')
  
  // Ref for dashboard container for HTML export
  const dashboardRef = React.useRef<HTMLDivElement>(null)

  // Initialize with first example and load AI domains
  React.useEffect(() => {
    const firstExample = getExampleById('github')
    if (firstExample) {
      setRawJson(formatExampleJSON(firstExample))
    }
    // Load AI-generated domains
    loadAIDomains().catch(console.error)
  }, [])

  // Handle example selection
  const handleExampleChange = (exampleId: string) => {
    setSelectedExample(exampleId)
    const example = getExampleById(exampleId)
    if (example) {
      setRawJson(formatExampleJSON(example))
      // Reset state
      setJsonError(null)
      setParsedData(null)
      setAnalysis(null)
      setUserAnswers({})
      setUIState(null)
      setCurrentPhase(1)
      setAiResult(null)
      setShowNewDomainModal(false)
    }
  }

  // Phase 1: Analyze Context with AI
  const handleAnalyze = async () => {
    const validation = validateJSON(rawJson)
    
    if (!validation.valid) {
      setJsonError(validation.error)
      return
    }

    setJsonError(null)
    setParsedData(validation.data)
    setAiAnalyzing(true)

    try {
      // Call AI to analyze JSON
      const aiAnalysis = await analyzeJSONWithAI(validation.data, geminiApiKey || undefined)
      setAiResult(aiAnalysis)
      
      // If new domain needed, show modal for user confirmation
      if (aiAnalysis.needsNewDomain && aiAnalysis.suggestedDomain) {
        setNewDomainName(aiAnalysis.suggestedDomain.name)
        setShowNewDomainModal(true)
      } else {
        // Use matched domain and try AI generation
        const domain = aiAnalysis.matchedDomain
        const result = analyzeContext(validation.data, domain)
        setAnalysis(result)

        // Try AI generation immediately
        await tryAIGeneration(validation.data, result, geminiApiKey || undefined)
      }
    } catch (error) {
      console.error('Phase 1 error:', error)
      setJsonError(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setAiAnalyzing(false)
    }
  }
  
  // Handle new domain confirmation
  const handleConfirmNewDomain = async () => {
    if (!aiResult?.suggestedDomain || !parsedData) return
    
    try {
      // Update domain name if user changed it
      const domain: DomainConfig = {
        ...aiResult.suggestedDomain,
        name: newDomainName
      }
      
      // Save domain to file
      const saved = await saveAIDomain(domain)
      if (!saved) {
        console.warn('Failed to save domain, using temporarily')
      }
      
      // Proceed with analysis using new domain
      const result = analyzeContext(parsedData, domain)
      setAnalysis(result)
      setShowNewDomainModal(false)

      // Try AI generation immediately
      await tryAIGeneration(parsedData, result, geminiApiKey || undefined)
    } catch (error) {
      console.error('Failed to save domain:', error)
    }
  }
  
  // Try AI generation after analysis
  const tryAIGeneration = async (data: Record<string, any>, analysisResult: ContextAnalysis, apiKey?: string) => {
    setAiGenerating(true)

    try {
      const aiGenResult = await generateUIWithAI(data, analysisResult, undefined, apiKey)
      setAiGenerationReasoning(aiGenResult.reasoning || null)
      
      if (aiGenResult.needsQuestions && aiGenResult.questions) {
        // AI wants questions - show Phase 2
        setAnalysis({
          ...analysisResult,
          questions: aiGenResult.questions
        })
        setCurrentPhase(2)
      } else if (aiGenResult.schema) {
        // AI generated schema directly - skip to Phase 3
        const state = createUIState(data, aiGenResult.schema)
        setUIState(state)
        setCurrentPhase(3)
      }
    } catch (error) {
      console.error('AI generation error:', error)
      // Fall back to showing questions
      setCurrentPhase(2)
    } finally {
      setAiGenerating(false)
    }
  }
  
  // Skip AI and use local analysis
  const handleSkipNewDomain = async () => {
    if (!parsedData) return

    const result = analyzeContext(parsedData)
    setAnalysis(result)
    setShowNewDomainModal(false)

    // Try AI generation immediately
    await tryAIGeneration(parsedData, result, geminiApiKey || undefined)
  }

  // Phase 2: Handle question answer selection
  const handleAnswerSelect = (questionId: string, option: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: option
    }))
  }

  // Check if all questions are answered
  const allQuestionsAnswered = analysis?.questions.every(q => userAnswers[q.id]) ?? false

  // Phase 2: Generate UI with answers
  const handleGenerateUI = async () => {
    if (!analysis || !parsedData) return

    setAiGenerating(true)

    try {
      // Try AI generation with user answers
      const aiGenResult = await generateUIWithAI(parsedData, analysis, userAnswers, geminiApiKey || undefined)
      setAiGenerationReasoning(aiGenResult.reasoning || null)
      
      if (aiGenResult.schema) {
        console.log('AI Generated Schema:', JSON.stringify(aiGenResult.schema, null, 2));
        const state = createUIState(parsedData, aiGenResult.schema)
        setUIState(state)
        setCurrentPhase(3)
      } else {
        // Fallback to rule-based if AI didn't return schema
        const schema = generateUI(parsedData, analysis, userAnswers)
        const state = createUIState(parsedData, schema)
        setUIState(state)
        setCurrentPhase(3)
      }
    } catch (error) {
      console.error('Phase 3 error:', error)
      // Fallback to rule-based generation
      const schema = generateUI(parsedData, analysis, userAnswers)
      const state = createUIState(parsedData, schema)
      setUIState(state)
      setCurrentPhase(3)
    } finally {
      setAiGenerating(false)
    }
  }

  // Copy JSON to clipboard
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(rawJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Open preview in new view
  const handleOpenPreview = () => {
    if (!uiState || !parsedData) return

    // Store in sessionStorage for preview page
    sessionStorage.setItem('preview_schema', JSON.stringify(uiState.schema))
    sessionStorage.setItem('preview_data', JSON.stringify(parsedData))

    // Navigate to preview page
    router.push('/preview')
  }

  // Save dashboard as HTML
  const handleSaveAsHTML = () => {
    if (!dashboardRef.current || !uiState) return

    try {
      // Generate the HTML document
      const html = generateHTMLExport(dashboardRef.current, 'Dashboard')
      
      // Generate filename with timestamp
      const filename = generateFilename('dashboard')
      
      // Download the file
      downloadHTML(html, filename)
    } catch (error) {
      console.error('Failed to export HTML:', error)
    }
  }

  const phases = [
    { id: 1, label: 'Context Analysis', status: currentPhase > 1 ? 'completed' : currentPhase === 1 ? 'active' : 'pending' },
    { id: 2, label: 'Requirements', status: currentPhase > 2 ? 'completed' : currentPhase === 2 ? 'active' : 'pending' },
    { id: 3, label: 'Rendered Output', status: currentPhase === 3 ? 'active' : 'pending' }
  ]

  return (
    <div className="min-h-screen bg-background noise-bg">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 glow">
              <span className="text-xl font-bold text-white">P</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gradient">
                PAM Dynamic UI Builder
              </h1>
              <p className="mt-1 text-muted-foreground">
                Context-driven interface generation powered by your Proactive AI Manager
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Phase Indicator */}
      <div className="border-b border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {phases.map((phase, index) => (
              <React.Fragment key={phase.id}>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={
                      phase.status === 'completed' ? 'default' :
                      phase.status === 'active' ? 'default' :
                      'outline'
                    }
                    className={`h-8 px-3 ${phase.status === 'active' ? 'glow' : ''}`}
                  >
                    {phase.id}. {phase.label}
                  </Badge>
                </div>
                {index < phases.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* How PAM Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How PAM Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 glow text-white text-sm font-bold">
                  1
                </div>
                <div className="text-sm font-medium text-white">Analyze Context</div>
                <div className="text-sm text-muted-foreground">
                  PAM detects data types, entities, and suggests optimal layouts automatically
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 glow text-white text-sm font-bold">
                  2
                </div>
                <div className="text-sm font-medium text-white">Answer Questions</div>
                <div className="text-sm text-muted-foreground">
                  PAM asks targeted questions to refine the UI generation based on your priorities
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 glow text-white text-sm font-bold">
                  3
                </div>
                <div className="text-sm font-medium text-white">See Results</div>
                <div className="text-sm text-muted-foreground">
                  PAM generates a complete UI using 12 constrained components with live data binding
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel - Input & Configuration */}
          <div className="space-y-6">
            {/* Phase 1: Context Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Phase 1: Context Analysis</CardTitle>
                <CardDescription>
                  Select an example or paste your own JSON data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Gemini API Key Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Gemini API Key</label>
                  <input
                    type="text"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm font-mono text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
                    placeholder="Enter your Gemini API key..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{' '}
                    <a
                      href="https://aistudio.google.com/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 underline hover:text-white"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>

                {/* Example Selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Example</label>
                  <Select value={selectedExample} onValueChange={handleExampleChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an example..." />
                    </SelectTrigger>
                    <SelectContent>
                      {examples.map(example => (
                        <SelectItem key={example.id} value={example.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{example.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {example.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* JSON Editor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">JSON Data</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyJson}
                      className="h-8"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 h-3 w-3" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <CodeEditor
                    value={rawJson}
                    onChange={setRawJson}
                    error={jsonError}
                    placeholder="Paste your JSON data here..."
                  />
                </div>

                <Button onClick={handleAnalyze} className="w-full" size="lg" disabled={aiAnalyzing}>
                  {aiAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      PAM Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze with PAM
                    </>
                  )}
                </Button>

                {/* AI Analysis Result */}
                {aiResult && !showNewDomainModal && (
                  <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-white" />
                      <div className="text-sm font-medium text-white">
                        PAM Analysis
                      </div>
                    </div>
                    <div className="text-xs text-white/70">
                      {aiResult.reasoning}
                    </div>
                    {aiResult.matchedDomain && (
                      <Badge variant="outline">
                        Matched: {aiResult.matchedDomain.name}
                      </Badge>
                    )}
                  </div>
                )}

                {/* AI Generation Status */}
                {aiGenerating && (
                  <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-4 animate-pulse-glow">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                      <div className="text-sm font-medium text-white">
                        PAM Generating UI Schema...
                      </div>
                    </div>
                    <div className="text-xs text-white/70">
                      Analyzing data complexity and building optimal layout
                    </div>
                  </div>
                )}

                {/* AI Generation Result */}
                {aiGenerationReasoning && !aiGenerating && (
                  <div className="space-y-2 rounded-lg border border-white/20 bg-white/10 p-4 glow">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-white" />
                      <div className="text-sm font-medium text-white">
                        PAM Generation Complete
                      </div>
                    </div>
                    <div className="text-xs text-white/70">
                      {aiGenerationReasoning}
                    </div>
                  </div>
                )}

                {/* Analysis Results */}
                {analysis && (
                  <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-white">Analysis Results</div>
                      {analysis.matchedDomain && (
                        <Badge
                          variant={analysis.matchedDomain.createdBy === 'ai' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {analysis.matchedDomain.createdBy === 'ai' ? (
                            <>
                              <Sparkles className="mr-1 h-3 w-3" />
                              PAM Domain
                            </>
                          ) : (
                            'System Domain'
                          )}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-white/60">Detected Context:</span>{' '}
                        <Badge variant="outline" className="ml-1">
                          {analysis.detectedContext}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium text-white/60">Data Types:</span>{' '}
                        <span className="text-white">
                          {analysis.dataTypes.join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-white/60">Entities:</span>{' '}
                        <span className="text-white">
                          {analysis.entities.join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-white/60">Suggested Layout:</span>{' '}
                        <span className="text-white">
                          {analysis.suggestedLayout}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Phase 2: Requirements */}
            {currentPhase >= 2 && analysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Phase 2: Requirement Gathering</CardTitle>
                  <CardDescription>
                    Click to select your preferences for each question
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {analysis.questions.map((q) => (
                    <div key={q.id} className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-white">{q.text}</div>
                          <div className="text-xs text-white/50">
                            Impact: {q.impact}
                          </div>
                        </div>
                        {userAnswers[q.id] && (
                          <Badge variant="default" className="ml-2">
                            Selected
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => (
                          <Button
                            key={opt}
                            variant={userAnswers[q.id] === opt ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleAnswerSelect(q.id, opt)}
                            className="transition-all"
                          >
                            {opt}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button
                    onClick={handleGenerateUI}
                    className="w-full"
                    size="lg"
                    disabled={!allQuestionsAnswered || aiGenerating}
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        PAM Generating...
                      </>
                    ) : allQuestionsAnswered ? (
                      'Generate UI with PAM'
                    ) : (
                      'Answer all questions to continue'
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Output */}
          <div className="space-y-6">
            {/* Phase 3: Rendered Output */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Phase 3: Rendered Output</CardTitle>
                  <div className="flex gap-2">
                    {uiState && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowSchema(!showSchema)}
                        >
                          {showSchema ? 'Hide' : 'Show'} Schema
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveAsHTML}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Save as HTML
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleOpenPreview}
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          Preview
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentPhase === 3 && uiState ? (
                  <>
                    {/* Schema Display */}
                    {showSchema && (
                      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <div className="mb-2 text-xs font-medium text-white/60">
                          Generated UI Schema
                        </div>
                        <pre className="text-xs overflow-x-auto text-white/80">
                          {JSON.stringify(uiState.schema, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Rendered UI */}
                    <div ref={dashboardRef} className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
                      <DynamicRendererWithBoundary
                        schema={uiState.schema}
                        data={parsedData!}
                      />
                    </div>

                    {/* Metadata */}
                    <div className="flex gap-3 text-xs text-white/50">
                      <div>Version: {uiState.version}</div>
                      <div>•</div>
                      <div>Context: {uiState.contextHash}</div>
                      <div>•</div>
                      <div>Created: {new Date(uiState.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-[400px] items-center justify-center text-center">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-white/60">
                        {currentPhase === 1 && 'Analyze your JSON data to begin'}
                        {currentPhase === 2 && 'Answer the questions to generate UI'}
                      </div>
                      <div className="text-xs text-white/40">
                        Your PAM-generated interface will appear here
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </main>

      {/* New Domain Modal */}
      {showNewDomainModal && aiResult?.suggestedDomain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 glow">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <CardTitle>New Data Domain Detected</CardTitle>
              </div>
              <CardDescription>
                PAM has analyzed your data and suggests creating a new domain configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Reasoning */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-medium text-white mb-2">PAM Analysis</div>
                <div className="text-sm text-white/70">
                  {aiResult.reasoning}
                </div>
              </div>

              {/* Domain Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Domain Name</label>
                <input
                  type="text"
                  value={newDomainName}
                  onChange={(e) => setNewDomainName(e.target.value)}
                  className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
                  placeholder="Enter domain name..."
                />
              </div>

              {/* Domain Details */}
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-white mb-2">Description</div>
                  <div className="text-sm text-white/70">
                    {aiResult.suggestedDomain.description}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-white mb-2">Keywords</div>
                  <div className="flex flex-wrap gap-1">
                    {aiResult.suggestedDomain.keywords.map(keyword => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-white mb-2">
                    Generated Questions ({aiResult.suggestedDomain.questions.length})
                  </div>
                  <div className="space-y-2">
                    {aiResult.suggestedDomain.questions.map((q, idx) => (
                      <div key={q.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="text-sm font-medium text-white mb-1">
                          {idx + 1}. {q.text}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {q.options.map(opt => (
                            <Badge key={opt} variant="secondary" className="text-xs">
                              {opt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleConfirmNewDomain}
                  className="flex-1"
                  size="lg"
                >
                  Use This Configuration
                </Button>
                <Button
                  onClick={handleSkipNewDomain}
                  variant="outline"
                  size="lg"
                >
                  Skip & Use Generic
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
