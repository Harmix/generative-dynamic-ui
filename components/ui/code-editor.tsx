'use client'

import * as React from "react"
import { cn } from "@/lib/utils"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  error?: string | null
  className?: string
  placeholder?: string
  readOnly?: boolean
}

export function CodeEditor({
  value,
  onChange,
  error,
  className,
  placeholder = "Enter JSON here...",
  readOnly = false
}: CodeEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [lineCount, setLineCount] = React.useState(1)

  // Update line count when value changes
  React.useEffect(() => {
    const lines = value.split('\n').length
    setLineCount(lines)
  }, [value])

  // Handle tab key for indentation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)
      
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2
        }
      }, 0)
    }
  }

  return (
    <div className={cn("relative rounded-lg border bg-muted/30", className)}>
      <div className="flex">
        {/* Line Numbers */}
        <div className="select-none border-r bg-muted/50 px-2 py-3 text-right">
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className="font-mono text-xs leading-6 text-muted-foreground"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Input */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            readOnly={readOnly}
            className={cn(
              "h-full min-h-[300px] w-full resize-none bg-transparent px-4 py-3",
              "font-mono text-sm leading-6 text-foreground",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-0",
              readOnly && "cursor-default"
            )}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border-t border-destructive/50 bg-destructive/10 px-4 py-2">
          <p className="font-mono text-xs text-destructive">{error}</p>
        </div>
      )}
    </div>
  )
}

// JSON validation helper
export function validateJSON(text: string): { valid: boolean; error: string | null; data: any } {
  if (!text.trim()) {
    return { valid: false, error: 'JSON cannot be empty', data: null }
  }

  try {
    const data = JSON.parse(text)
    return { valid: true, error: null, data }
  } catch (e) {
    const error = e as Error
    return { valid: false, error: error.message, data: null }
  }
}

