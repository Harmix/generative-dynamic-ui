import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-white text-black [a&]:hover:bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.2)]",
        secondary:
          "border-transparent bg-white/10 text-white [a&]:hover:bg-white/20",
        destructive:
          "border-transparent bg-red-500/20 text-red-400 border-red-500/30 [a&]:hover:bg-red-500/30",
        success:
          "border-transparent bg-green-500/20 text-green-400 border-green-500/30 [a&]:hover:bg-green-500/30",
        danger:
          "border-transparent bg-red-500/20 text-red-400 border-red-500/30 [a&]:hover:bg-red-500/30",
        info:
          "border-transparent bg-blue-500/20 text-blue-400 border-blue-500/30 [a&]:hover:bg-blue-500/30",
        outline:
          "text-white/80 border-white/20 [a&]:hover:bg-white/10 [a&]:hover:text-white [a&]:hover:border-white/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
