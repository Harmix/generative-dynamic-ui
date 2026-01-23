import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"
import { Button } from "./button"
import { Filter as FilterIcon } from "lucide-react"

interface FilterProps extends React.ComponentProps<"div"> {
  options: string[] | Array<{ label: string; value: string }>
  multi?: boolean
  target?: string
  placeholder?: string
  onFilterChange?: (value: string | string[]) => void
}

function Filter({ 
  className, 
  options = [],
  multi = false,
  target,
  placeholder = "Filter...",
  onFilterChange,
  ...props 
}: FilterProps) {
  const [selected, setSelected] = React.useState<string | string[]>(
    multi ? [] : ""
  )

  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => 
      typeof opt === 'string' 
        ? { label: opt, value: opt }
        : opt
    )
  }, [options])

  const handleChange = (value: string) => {
    if (multi) {
      const newSelected = Array.isArray(selected) 
        ? selected.includes(value)
          ? selected.filter(v => v !== value)
          : [...selected, value]
        : [value]
      setSelected(newSelected)
      onFilterChange?.(newSelected)
    } else {
      setSelected(value)
      onFilterChange?.(value)
    }
  }

  if (multi) {
    return (
      <div
        data-slot="filter"
        data-multi="true"
        className={cn("flex flex-wrap gap-2", className)}
        {...props}
      >
        {normalizedOptions.map((option) => {
          const isSelected = Array.isArray(selected) && selected.includes(option.value)
          return (
            <Button
              key={option.value}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => handleChange(option.value)}
            >
              {option.label}
            </Button>
          )
        })}
      </div>
    )
  }

  return (
    <div
      data-slot="filter"
      data-multi="false"
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <FilterIcon className="h-4 w-4 text-muted-foreground" />
      <Select value={selected as string} onValueChange={handleChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {normalizedOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export { Filter }

