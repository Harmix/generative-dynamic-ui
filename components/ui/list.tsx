import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Button } from "./button"
import { Eye, Edit } from "lucide-react"

interface ListItemData {
  primary?: string
  secondary?: string
  avatar?: string
  [key: string]: any
}

interface ListProps extends React.ComponentProps<"div"> {
  items: ListItemData[]
  avatar?: boolean
  template?: {
    primary: string
    secondary?: string
  }
  actions?: Array<"view" | "edit" | string>
}

function List({ 
  className, 
  items = [],
  avatar: showAvatar = false,
  template,
  actions = [],
  ...props 
}: ListProps) {
  const getInitials = (text: string) => {
    return text
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderItem = (item: ListItemData, index: number) => {
    // Smart field detection with template support
    let primary: any;
    let secondary: any;
    
    if (template?.primary) {
      // Use template if provided
      primary = item[template.primary];
      secondary = template.secondary ? item[template.secondary] : undefined;
    } else {
      // Fallback: Smart detection
      // Try common primary field names first
      const primaryCandidates = ['name', 'title', 'orderId', 'id', 'month', 'status', 'message', 'primary'];
      primary = primaryCandidates.map(field => item[field]).find(val => val !== undefined);
      
      // If no match, use first string or first value
      if (primary === undefined) {
        const stringValues = Object.entries(item)
          .filter(([_, val]) => typeof val === 'string')
          .map(([_, val]) => val);
        primary = stringValues[0] || Object.values(item)[0];
      }
      
      // Try common secondary field names
      const secondaryCandidates = ['description', 'email', 'date', 'total', 'revenue', 'author', 'secondary'];
      secondary = secondaryCandidates.map(field => item[field]).find(val => val !== undefined);
      
      // If no match, use first numeric or second value
      if (secondary === undefined) {
        const numericValues = Object.entries(item)
          .filter(([key, val]) => typeof val === 'number' && key !== 'id')
          .map(([_, val]) => val);
        secondary = numericValues[0];
        
        // Format numbers nicely
        if (typeof secondary === 'number') {
          // Format as currency if it looks like money (large numbers)
          if (secondary > 100) {
            secondary = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(secondary);
          } else {
            secondary = new Intl.NumberFormat('en-US').format(secondary);
          }
        }
      }
    }
    
    // Format secondary if it's a number and not yet formatted
    if (typeof secondary === 'number') {
      if (secondary > 100) {
        secondary = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(secondary);
      } else {
        secondary = new Intl.NumberFormat('en-US').format(secondary);
      }
    }

    return (
      <div
        key={index}
        className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-all duration-300 hover:bg-accent/50 hover:border-primary/40 hover:shadow-[0_0_15px_rgba(var(--primary),0.1)]"
      >
        {showAvatar && (
          <Avatar className="h-8 w-8 ring-2 ring-transparent hover:ring-primary/50 transition-all duration-300">
            <AvatarImage src={item.avatar} />
            <AvatarFallback className="text-xs">
              {getInitials(primary?.toString() || secondary?.toString() || "?")}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {primary}
          </div>
          {secondary && (
            <div className="text-xs text-muted-foreground truncate">
              {secondary}
            </div>
          )}
        </div>
        {actions.length > 0 && (
          <div className="flex gap-1">
            {actions.map((action) => (
              <Button
                key={action}
                variant="ghost"
                size="icon-sm"
                onClick={() => console.log(`${action}:`, item)}
              >
                {action === "view" && <Eye className="h-3 w-3" />}
                {action === "edit" && <Edit className="h-3 w-3" />}
              </Button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      data-slot="list"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {items.map(renderItem)}
    </div>
  )
}

export { List }

