import * as React from "react"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const skeletonVariants = cva(
  "relative overflow-hidden rounded-lg bg-gradient-to-r from-muted via-muted/50 to-muted",
  {
    variants: {
      variant: {
        default: "animate-pulse",
        shimmer: "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        wave: "animate-pulse",
        none: "",
      },
      speed: {
        slow: "before:animate-[shimmer_3s_infinite] animate-[pulse_3s_infinite]",
        normal: "before:animate-[shimmer_2s_infinite] animate-[pulse_2s_infinite]",
        fast: "before:animate-[shimmer_1s_infinite] animate-[pulse_1s_infinite]",
      }
    },
    defaultVariants: {
      variant: "shimmer",
      speed: "normal",
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  animate?: boolean
}

function Skeleton({
  className,
  variant,
  speed,
  animate = true,
  children,
  ...props
}: SkeletonProps) {
  if (animate) {
    return (
      <motion.div
        className={cn(skeletonVariants({ variant, speed }), className)}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    )
  }
  
  return (
    <div
      className={cn(skeletonVariants({ variant, speed }), className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Preset skeleton components for common patterns
const SkeletonText = ({ 
  lines = 3, 
  className,
  ...props 
}: { 
  lines?: number 
} & Omit<SkeletonProps, 'children'>) => (
  <div className={cn("space-y-2", className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          "h-4",
          i === lines - 1 ? "w-3/4" : "w-full" // Last line is shorter
        )}
        animate
        style={{ animationDelay: `${i * 100}ms` }}
      />
    ))}
  </div>
)

const SkeletonCard = ({ className, ...props }: Omit<SkeletonProps, 'children'>) => (
  <div className={cn("space-y-4 p-4", className)} {...props}>
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <SkeletonText lines={2} />
  </div>
)

const SkeletonTable = ({ 
  rows = 5, 
  columns = 4,
  className,
  ...props 
}: { 
  rows?: number
  columns?: number 
} & Omit<SkeletonProps, 'children'>) => (
  <div className={cn("space-y-3", className)} {...props}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} className="h-5 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton 
            key={`cell-${rowIndex}-${colIndex}`} 
            className="h-4 flex-1" 
            style={{ animationDelay: `${(rowIndex * columns + colIndex) * 50}ms` }}
          />
        ))}
      </div>
    ))}
  </div>
)

const SkeletonList = ({ 
  items = 5,
  className,
  ...props 
}: { 
  items?: number 
} & Omit<SkeletonProps, 'children'>) => (
  <div className={cn("space-y-3", className)} {...props}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

const SkeletonAvatar = ({ 
  size = "default",
  className,
  ...props 
}: { 
  size?: "sm" | "default" | "lg" 
} & Omit<SkeletonProps, 'children'>) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    default: "h-10 w-10",
    lg: "h-16 w-16"
  }
  
  return (
    <Skeleton 
      className={cn("rounded-full", sizeClasses[size], className)} 
      {...props} 
    />
  )
}

const SkeletonButton = ({ 
  size = "default",
  className,
  ...props 
}: { 
  size?: "sm" | "default" | "lg" 
} & Omit<SkeletonProps, 'children'>) => {
  const sizeClasses = {
    sm: "h-8 w-20",
    default: "h-10 w-24",
    lg: "h-12 w-32"
  }
  
  return (
    <Skeleton 
      className={cn("rounded-md", sizeClasses[size], className)} 
      {...props} 
    />
  )
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonTable, 
  SkeletonList, 
  SkeletonAvatar, 
  SkeletonButton 
}
