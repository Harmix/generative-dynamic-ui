'use client'

import * as React from "react"
import { ComponentSchema } from "@/common/components"
import { resolveProps, resolveValue } from "@/lib/dataBinding"
import { cn } from "@/lib/utils"

// Import all UI components
import { Container } from "./ui/container"
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card"
import { Section } from "./ui/section"
import { Metric } from "./ui/metric"
import { Table } from "./ui/table"
import { List } from "./ui/list"
import { Chart } from "./ui/chart"
import { Button } from "./ui/button"
import { Filter } from "./ui/filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Badge } from "./ui/badge"
import { Progress } from "./ui/progress"

interface DynamicRendererProps {
  schema: ComponentSchema
  data: Record<string, any>
  item?: Record<string, any>
}

// Map component names to actual React components
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  Container,
  Card,
  Section,
  Metric,
  Table,
  List,
  Chart,
  Button,
  Filter,
  Tabs,
  Badge,
  Progress,
}

export function DynamicRenderer({ schema, data, item }: DynamicRendererProps) {
  // Error boundary for invalid schemas
  if (!schema || !schema.component) {
    console.error('Invalid schema:', schema)
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
        Error: Invalid component schema
      </div>
    )
  }

  const Component = COMPONENT_MAP[schema.component]

  if (!Component) {
    console.error(`Component not found: ${schema.component}`)
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
        Error: Component &quot;{schema.component}&quot; not found
      </div>
    )
  }

  // Resolve all props with data bindings
  const resolvedProps = resolveProps(schema.props || {}, data, item)

  // Special handling for different components
  
  // Handle Card with title/subtitle in CardHeader
  if (schema.component === 'Card') {
    const { title, subtitle, colspan, ...restProps } = resolvedProps
    const colspanClass = colspan === 3 ? 'md:col-span-3' : colspan === 2 ? 'md:col-span-2' : ''
    
    // Check if children contain List or Table components for height constraint
    const hasListOrTable = schema.children?.some(child => 
      child.component === 'List' || child.component === 'Table'
    )
    
    return (
      <Card className={cn('h-full', colspanClass)} {...restProps}>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
          </CardHeader>
        )}
        {schema.children && schema.children.length > 0 && (
          <CardContent className={cn(
            'flex-1',
            hasListOrTable && 'max-h-[400px] overflow-y-auto'
          )}>
            {schema.children.map((child, index) => (
              <DynamicRenderer
                key={index}
                schema={child}
                data={data}
                item={item}
              />
            ))}
          </CardContent>
        )}
      </Card>
    )
  }

  // Handle List with items resolution
  if (schema.component === 'List') {
    const { items, ...restProps } = resolvedProps
    
    // Resolve items if it's a data binding
    let resolvedItems = items
    if (typeof items === 'string' && items.startsWith('$data.')) {
      resolvedItems = resolveValue(items, data, item)
    }

    return (
      <List items={resolvedItems || []} {...restProps} />
    )
  }

  // Handle Chart with data resolution
  if (schema.component === 'Chart') {
    const { data: chartData, type: chartType = 'pie', ...restProps } = resolvedProps
    
    // Resolve chart data if it's a binding
    let resolvedData = chartData
    if (typeof chartData === 'string' && chartData.startsWith('$data.')) {
      resolvedData = resolveValue(chartData, data, item)
    }

    return (
      <Chart type={chartType} data={resolvedData || {}} {...restProps} />
    )
  }

  // Handle Tabs with children
  if (schema.component === 'Tabs') {
    const { items, default: defaultValue, ...restProps } = resolvedProps
    const tabItems = items || []

    return (
      <Tabs defaultValue={defaultValue || tabItems[0]} {...restProps}>
        <TabsList>
          {tabItems.map((item: string, index: number) => (
            <TabsTrigger key={index} value={item}>
              {item}
            </TabsTrigger>
          ))}
        </TabsList>
        {schema.children?.map((child, index) => (
          <TabsContent key={index} value={tabItems[index] || `tab-${index}`}>
            <DynamicRenderer
              schema={child}
              data={data}
              item={item}
            />
          </TabsContent>
        ))}
      </Tabs>
    )
  }

  // Handle Table with rows resolution
  if (schema.component === 'Table') {
    const { rows, columns = [], ...restProps } = resolvedProps
    
    // Resolve rows if it's a data binding
    let resolvedRows = rows
    if (typeof rows === 'string' && rows.startsWith('$data.')) {
      resolvedRows = resolveValue(rows, data, item)
    }

    return (
      <Table columns={columns} rows={resolvedRows || []} {...restProps} />
    )
  }

  // Handle Progress with value resolution
  if (schema.component === 'Progress') {
    const { value, max = 100, ...restProps } = resolvedProps
    const numValue = typeof value === 'number' ? value : parseInt(value, 10) || 0

    return (
      <div className="space-y-2">
        <Progress value={numValue} max={max} {...restProps} />
        {restProps.label && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{restProps.label}</span>
            <span>{numValue}/{max}</span>
          </div>
        )}
      </div>
    )
  }

  // Default rendering for components with children
  if (schema.children && schema.children.length > 0) {
    return (
      <Component {...resolvedProps}>
        {schema.children.map((child, index) => (
          <DynamicRenderer
            key={index}
            schema={child}
            data={data}
            item={item}
          />
        ))}
      </Component>
    )
  }

  // Render component without children
  return <Component {...resolvedProps} />
}

// Error boundary wrapper component
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class DynamicRendererErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DynamicRenderer error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">
              Failed to render component
            </p>
            <p className="mt-1 text-xs text-destructive/80">
              {this.state.error?.message}
            </p>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Main export with error boundary
export function DynamicRendererWithBoundary(props: DynamicRendererProps) {
  return (
    <DynamicRendererErrorBoundary>
      <DynamicRenderer {...props} />
    </DynamicRendererErrorBoundary>
  )
}

