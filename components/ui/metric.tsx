import * as React from "react"
import { cn } from "@/lib/utils"
import { 
  TrendingUp, 
  TrendingDown, 
  Star, 
  GitFork, 
  AlertCircle, 
  Users, 
  GitCommit,
  DollarSign,
  Eye,
  Info,
  type LucideIcon
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  star: Star,
  fork: GitFork,
  issue: AlertCircle,
  users: Users,
  "git-commit": GitCommit,
  dollar: DollarSign,
  eye: Eye,
  info: Info
}

interface MetricProps extends React.ComponentProps<"div"> {
  label: string
  value: string | number
  trend?: "up" | "down" | "warning" | "neutral"
  icon?: string
}

function Metric({ 
  className, 
  label,
  value,
  trend,
  icon,
  ...props 
}: MetricProps) {
  // Debug logging
  React.useEffect(() => {
    console.log('Metric render:', { label, value, type: typeof value });
  }, [label, value]);
  
  const IconComponent = icon ? iconMap[icon] || Info : null
  
  const trendConfig = {
    up: { icon: TrendingUp, color: "text-success", bgClass: "bg-success/10 border-success/30 shadow-[0_0_20px_rgba(132,204,22,0.1)]" },
    down: { icon: TrendingDown, color: "text-danger", bgClass: "bg-danger/10 border-danger/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]" },
    warning: { icon: AlertCircle, color: "text-amber-400", bgClass: "bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.1)]" },
    neutral: { icon: null, color: "text-info", bgClass: "bg-info/10 border-info/30" }
  }

  const trendData = trend ? trendConfig[trend] : null
  const TrendIcon = trendData?.icon

  return (
    <div
      data-slot="metric"
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-card p-4 transition-all duration-300",
        trendData?.bgClass,
        "hover:shadow-[0_0_25px_rgba(var(--primary),0.15)] hover:border-primary/40",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        {IconComponent && (
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight">
          {value === undefined || value === null ? (
            <span className="text-muted-foreground text-sm">No data</span>
          ) : typeof value === 'number' ? (
            value.toLocaleString()
          ) : (
            value
          )}
        </span>
        {TrendIcon && (
          <TrendIcon className={cn("h-4 w-4", trendData?.color)} data-slot="trend-icon" />
        )}
      </div>
    </div>
  )
}

export { Metric }

