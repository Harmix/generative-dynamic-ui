import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface SectionProps extends React.ComponentProps<"div"> {
  title: string
  collapsible?: boolean
  defaultOpen?: boolean
}

function Section({ 
  className, 
  title,
  collapsible = false,
  defaultOpen = true,
  children,
  ...props 
}: SectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)

  return (
    <div
      data-slot="section"
      data-collapsible={collapsible}
      className={cn("flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_20px_rgba(var(--primary),0.08)]", className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">{title}</h3>
        {collapsible && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-md p-1 hover:bg-accent transition-all duration-300 hover:shadow-[0_0_10px_rgba(var(--primary),0.2)]"
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            <ChevronDown
              className={cn(
                "h-5 w-5 transition-transform duration-300",
                isOpen ? "rotate-180" : ""
              )}
            />
          </button>
        )}
      </div>
      {(!collapsible || isOpen) && (
        <div className="flex flex-col gap-4">
          {children}
        </div>
      )}
    </div>
  )
}

export { Section }

