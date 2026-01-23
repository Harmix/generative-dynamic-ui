import * as React from "react"
import { cn } from "@/lib/utils"

interface ChartProps extends React.ComponentProps<"div"> {
  type: "bar" | "line" | "pie"
  data: any // Accept any data type, will be normalized by extractChartData
}

// Helper function to format labels from camelCase/snake_case to Title Case
function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim()
}

// Helper function to extract chartable data from nested objects
function extractChartData(data: any): Array<{ label: string; value: number }> {
  if (Array.isArray(data)) {
    // Filter array items to only include those with numeric values
    return data
      .filter(item => typeof item === 'object' && item !== null && typeof item.value === 'number')
      .map(item => ({
        label: formatLabel(item.label || ''),
        value: item.value
      }))
  }
  
  const entries = Object.entries(data)
  const result: Array<{ label: string; value: number }> = []
  
  for (const [key, value] of entries) {
    if (typeof value === 'number') {
      // Direct numeric value - add it
      result.push({ label: formatLabel(key), value })
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Nested object - extract numeric values and sum them
      const nestedNumbers = Object.entries(value).filter(([_, v]) => typeof v === 'number')
      if (nestedNumbers.length > 0) {
        // Sum all numeric values in the nested object
        const sum = nestedNumbers.reduce((acc, [_, v]) => acc + (v as number), 0)
        result.push({ label: formatLabel(key), value: sum })
      }
    }
  }
  
  return result
}

function Chart({ 
  className, 
  type,
  data,
  ...props 
}: ChartProps) {
  const normalizedData = React.useMemo(() => {
    console.log('Chart received data:', data)
    const extracted = extractChartData(data)
    console.log('Chart normalized data:', extracted)
    return extracted
  }, [data])

  // Handle empty or invalid data
  if (!normalizedData || normalizedData.length === 0) {
    console.warn('Chart has no data to display:', { data, normalizedData })
    return (
      <div
        data-slot="chart"
        className={cn("flex items-center justify-center p-8 text-sm text-muted-foreground", className)}
        {...props}
      >
        No chartable data available
      </div>
    )
  }

  const total = normalizedData.reduce((sum, item) => sum + item.value, 0)
  const maxValue = Math.max(...normalizedData.map(item => item.value), 1) // Ensure at least 1 to avoid division by zero
  
  console.log('Chart rendering:', { type, total, maxValue, itemCount: normalizedData.length })
  
  // Safeguard against invalid calculations
  if (total === 0 || maxValue === 0 || !isFinite(total) || !isFinite(maxValue)) {
    console.warn('Chart has invalid totals:', { total, maxValue })
    return (
      <div
        data-slot="chart"
        className={cn("flex items-center justify-center p-8 text-sm text-muted-foreground", className)}
        {...props}
      >
        Invalid chart data (all values are zero)
      </div>
    )
  }

  if (type === "pie") {
    return (
      <div
        data-slot="chart"
        data-type="pie"
        className={cn("flex flex-col gap-4 p-4", className)}
        {...props}
      >
        <div className="flex items-center justify-center">
          <svg width="160" height="160" viewBox="0 0 160 160">
            <defs>
              <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {normalizedData.reduce((acc, item, index) => {
              const percentage = (item.value / total) * 100
              const angle = (percentage / 100) * 360
              const startAngle = acc.currentAngle
              const endAngle = startAngle + angle
              
              const x1 = 80 + 70 * Math.cos((startAngle - 90) * Math.PI / 180)
              const y1 = 80 + 70 * Math.sin((startAngle - 90) * Math.PI / 180)
              const x2 = 80 + 70 * Math.cos((endAngle - 90) * Math.PI / 180)
              const y2 = 80 + 70 * Math.sin((endAngle - 90) * Math.PI / 180)
              
              const largeArc = angle > 180 ? 1 : 0
              
              const colors = [
                "var(--chart-1)",
                "var(--chart-2)",
                "var(--chart-3)",
                "var(--chart-4)",
                "var(--chart-5)"
              ]
              
              acc.paths.push(
                <path
                  key={index}
                  d={`M 80 80 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colors[index % colors.length]}
                  stroke="var(--background)"
                  strokeWidth="2"
                  filter="url(#neon-glow)"
                  style={{
                    transition: 'all 0.3s ease'
                  }}
                />
              )
              
              acc.currentAngle = endAngle
              return acc
            }, { paths: [] as React.ReactNode[], currentAngle: 0 }).paths}
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          {normalizedData.map((item, index) => {
            const percentage = ((item.value / total) * 100).toFixed(1)
            const colors = [
              "bg-[var(--chart-1)] shadow-[0_0_10px_var(--chart-1)]",
              "bg-[var(--chart-2)] shadow-[0_0_10px_var(--chart-2)]",
              "bg-[var(--chart-3)] shadow-[0_0_10px_var(--chart-3)]",
              "bg-[var(--chart-4)] shadow-[0_0_10px_var(--chart-4)]",
              "bg-[var(--chart-5)] shadow-[0_0_10px_var(--chart-5)]"
            ]
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className={cn("h-3 w-3 rounded-sm transition-all duration-300", colors[index % colors.length])} />
                <span className="flex-1">{item.label}</span>
                <span className="font-medium">{percentage}%</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (type === "bar") {
    return (
      <div
        data-slot="chart"
        data-type="bar"
        className={cn("flex flex-col gap-4 p-4", className)}
        {...props}
      >
        <div className="flex h-48 items-end gap-2">
          {normalizedData.map((item, index) => {
            const height = Math.max((item.value / maxValue) * 100, 2) // Minimum 2% height for visibility
            const chartColors = [
              "var(--chart-1)",
              "var(--chart-2)",
              "var(--chart-3)",
              "var(--chart-4)",
              "var(--chart-5)"
            ]
            return (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center h-full">
                  <div
                    className="w-full rounded-t transition-all duration-300 hover:opacity-90"
                    style={{ 
                      height: `${height}%`,
                      backgroundColor: chartColors[index % 5],
                      boxShadow: `0 0 15px ${chartColors[index % 5]}40`,
                      minHeight: '4px' // Ensure minimum visible height
                    }}
                  />
                </div>
                <span className="text-xs text-muted-foreground truncate max-w-full">
                  {item.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Line chart (simplified)
  return (
    <div
      data-slot="chart"
      data-type="line"
      className={cn("flex flex-col gap-4 p-4", className)}
      {...props}
    >
      <div className="relative h-48">
        <svg width="100%" height="100%" className="overflow-visible">
          <defs>
            <filter id="line-glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          {normalizedData.map((item, index) => {
            if (index === 0) return null
            const x1 = ((index - 1) / (normalizedData.length - 1)) * 100
            const y1 = 100 - (normalizedData[index - 1].value / maxValue) * 100
            const x2 = (index / (normalizedData.length - 1)) * 100
            const y2 = 100 - (item.value / maxValue) * 100
            return (
              <line
                key={index}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                stroke="var(--chart-1)"
                strokeWidth="3"
                filter="url(#line-glow)"
                style={{
                  transition: 'all 0.3s ease'
                }}
              />
            )
          })}
          {normalizedData.map((item, index) => {
            const x = (index / (normalizedData.length - 1)) * 100
            const y = 100 - (item.value / maxValue) * 100
            return (
              <circle
                key={`dot-${index}`}
                cx={`${x}%`}
                cy={`${y}%`}
                r="4"
                fill="var(--chart-1)"
                stroke="var(--background)"
                strokeWidth="2"
                filter="url(#line-glow)"
              />
            )
          })}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        {normalizedData.map((item, index) => (
          <span key={index} className="truncate">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export { Chart }

