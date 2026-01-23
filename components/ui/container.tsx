import * as React from "react"
import { cn } from "@/lib/utils"

interface ContainerProps extends React.ComponentProps<"div"> {
  cols?: 1 | 2 | 3 | 4
  gap?: "sm" | "md" | "lg"
}

function Container({ 
  className, 
  cols = 1, 
  gap = "md",
  ...props 
}: ContainerProps) {
  const colsClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
  }[cols]

  const gapClass = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6"
  }[gap]

  return (
    <div
      data-slot="container"
      className={cn(
        "grid w-full auto-rows-fr",
        colsClass,
        gapClass,
        className
      )}
      {...props}
    />
  )
}

export { Container }

