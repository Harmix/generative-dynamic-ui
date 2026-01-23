'use client'

import * as React from "react"
import { Suspense } from "react"
import { DynamicRendererWithBoundary } from "@/components/DynamicRenderer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import type { ComponentSchema } from "@/common/components"

function PreviewContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [schema, setSchema] = React.useState<ComponentSchema | null>(null)
  const [data, setData] = React.useState<Record<string, any> | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    try {
      // Get data from URL params or sessionStorage
      const schemaParam = searchParams.get('schema')
      const dataParam = searchParams.get('data')

      if (schemaParam && dataParam) {
        // From URL params (for sharing)
        const decodedSchema = JSON.parse(decodeURIComponent(schemaParam))
        const decodedData = JSON.parse(decodeURIComponent(dataParam))
        setSchema(decodedSchema)
        setData(decodedData)
      } else {
        // From sessionStorage (for internal navigation)
        const storedSchema = sessionStorage.getItem('preview_schema')
        const storedData = sessionStorage.getItem('preview_data')

        if (storedSchema && storedData) {
          setSchema(JSON.parse(storedSchema))
          setData(JSON.parse(storedData))
        } else {
          setError('No preview data found. Please generate a UI first.')
        }
      }
    } catch (err) {
      console.error('Error loading preview:', err)
      setError('Failed to load preview data.')
    }
  }, [searchParams])

  const handleBack = () => {
    router.push('/')
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background noise-bg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-400 mb-2">
                Preview Error
              </h2>
              <p className="text-sm text-white/60 mb-4">{error}</p>
              <Button onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to PAM Builder
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!schema || !data) {
    return (
      <div className="min-h-screen bg-background noise-bg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center text-white/60 animate-pulse">
              Loading PAM preview...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background noise-bg">
      {/* Header with back button */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to PAM Builder
            </Button>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
                <span className="text-xs font-bold text-white">P</span>
              </div>
              PAM Preview Mode
            </div>
          </div>
        </div>
      </header>

      {/* Full-width rendered UI */}
      <main className="container mx-auto px-4 py-8">
        <div className="glass-card rounded-lg p-6">
          <DynamicRendererWithBoundary
            schema={schema}
            data={data}
          />
        </div>
      </main>
    </div>
  )
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background noise-bg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center text-white/60 animate-pulse">
              Loading PAM preview...
            </div>
          </div>
        </div>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  )
}
