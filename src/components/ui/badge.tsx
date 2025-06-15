import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 cursor-default", 
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm hover:shadow-md",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md",
        outline: 
          "text-foreground border-border hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md",
        success: 
          "border-transparent bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md",
        warning: 
          "border-transparent bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow-md",
        info: 
          "border-transparent bg-blue-500 text-white hover:bg-blue-600 shadow-sm hover:shadow-md",
        muted: 
          "border-transparent bg-muted text-muted-foreground hover:bg-muted/80 shadow-sm",
        gradient: 
          "border-transparent bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 shadow-sm hover:shadow-md",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-sm",
      },
      rounded: {
        default: "rounded-full",
        sm: "rounded-md",
        lg: "rounded-xl",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  animated?: boolean
  pulse?: boolean
  icon?: React.ReactNode
  onRemove?: () => void
}

function Badge({ 
  className, 
  variant, 
  size, 
  rounded, 
  animated = false, 
  pulse = false,
  icon,
  onRemove,
  children,
  ...props 
}: BadgeProps) {
  const badgeContent = (
    <div className={cn(badgeVariants({ variant, size, rounded }), className)} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          aria-label="Remove badge"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M9 3L3 9M3 3L9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  )

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          ...(pulse && {
            scale: [1, 1.05, 1],
          })
        }}
        transition={{ 
          duration: 0.2,
          ...(pulse && {
            repeat: Infinity,
            duration: 2,
          })
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {badgeContent}
      </motion.div>
    )
  }

  if (pulse) {
    return (
      <div className={cn("animate-pulse", pulse && "animate-ping")}>
        {badgeContent}
      </div>
    )
  }

  return badgeContent
}

// Preset badge components for common use cases
const StatusBadge = ({ status, ...props }: { status: 'online' | 'offline' | 'away' | 'busy' } & Omit<BadgeProps, 'variant'>) => {
  const variantMap = {
    online: 'success' as const,
    offline: 'muted' as const,
    away: 'warning' as const,
    busy: 'destructive' as const,
  }
  
  return (
    <Badge 
      variant={variantMap[status]} 
      size="sm" 
      animated 
      icon={<div className="w-2 h-2 rounded-full bg-current" />}
      {...props}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

const CountBadge = ({ count, max = 99, ...props }: { count: number; max?: number } & Omit<BadgeProps, 'children'>) => {
  const displayCount = count > max ? `${max}+` : count.toString()
  
  return (
    <Badge 
      variant="destructive" 
      size="sm" 
      animated 
      pulse={count > 0}
      {...props}
    >
      {displayCount}
    </Badge>
  )
}

export { Badge, badgeVariants, StatusBadge, CountBadge }
