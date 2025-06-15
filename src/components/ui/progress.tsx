"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-secondary/50 backdrop-blur-sm border border-border/20",
  {
    variants: {
      size: {
        sm: "h-2",
        default: "h-3",
        lg: "h-4",
      },
      variant: {
        default: "shadow-inner",
        elevated: "shadow-lg",
        minimal: "shadow-none border-0",
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

const indicatorVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out rounded-full relative overflow-hidden",
  {
    variants: {
      color: {
        default: "bg-gradient-to-r from-primary via-primary to-primary/90",
        success: "bg-gradient-to-r from-emerald-500 via-emerald-500 to-emerald-400",
        warning: "bg-gradient-to-r from-amber-500 via-amber-500 to-amber-400",
        destructive: "bg-gradient-to-r from-red-500 via-red-500 to-red-400",
        info: "bg-gradient-to-r from-blue-500 via-blue-500 to-blue-400",
        purple: "bg-gradient-to-r from-purple-500 via-purple-500 to-purple-400",
      },
      animated: {
        true: "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:animate-shimmer",
        false: "",
      }
    },
    defaultVariants: {
      color: "default",
      animated: false,
    },
  }
)

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  showValue?: boolean
  showLabel?: boolean
  label?: string
  animated?: boolean
  striped?: boolean
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  value, 
  size, 
  variant, 
  color, 
  animated = false, 
  striped = false,
  showValue = false,
  showLabel = false,
  label,
  ...props 
}, ref) => {
  const progressValue = Math.min(Math.max(value || 0, 0), 100)
  
  return (
    <div className="w-full space-y-2">
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-foreground">{label || "Progress"}</span>
          {showValue && (
            <span className="text-muted-foreground font-medium">
              {Math.round(progressValue)}%
            </span>
          )}
        </div>
      )}
      
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(progressVariants({ size, variant }), className)}
        {...props}
      >        <motion.div
          className={cn(
            indicatorVariants({ 
              color: color as VariantProps<typeof indicatorVariants>['color'], 
              animated 
            }),
            striped && "bg-striped bg-striped-animate"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progressValue}%` }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut",
            delay: 0.1 
          }}
        >
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          )}
        </motion.div>
      </ProgressPrimitive.Root>
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

// Circular Progress Component
export interface CircularProgressProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: VariantProps<typeof indicatorVariants>['color']
  showValue?: boolean
  className?: string
}

const CircularProgress = React.forwardRef<
  SVGSVGElement,
  CircularProgressProps
>(({ 
  value, 
  size = 60, 
  strokeWidth = 4, 
  color = "default", 
  showValue = true,
  className,
  ...props 
}, ref) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progressValue = Math.min(Math.max(value || 0, 0), 100)
  const strokeDashoffset = circumference - (progressValue / 100) * circumference

  const colorMap = {
    default: "stroke-primary",
    success: "stroke-emerald-500",
    warning: "stroke-amber-500",
    destructive: "stroke-red-500",
    info: "stroke-blue-500",
    purple: "stroke-purple-500",
  }

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        ref={ref}
        width={size}
        height={size}
        className="transform -rotate-90"
        {...props}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-secondary"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={colorMap[color || 'default']}
          style={{
            strokeDasharray: circumference,
          }}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-foreground">
            {Math.round(progressValue)}%
          </span>
        </div>
      )}
    </div>
  )
})
CircularProgress.displayName = "CircularProgress"

// Multi-step Progress Component
export interface StepProgressProps {
  steps: string[]
  currentStep: number
  className?: string
}

const StepProgress = ({ steps, currentStep, className }: StepProgressProps) => {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center flex-1">
              <motion.div
                className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all duration-300",
                  index < currentStep
                    ? "bg-primary border-primary text-primary-foreground"
                    : index === currentStep
                    ? "bg-primary/20 border-primary text-primary"
                    : "bg-secondary border-border text-muted-foreground"
                )}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {index < currentStep ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                  </svg>
                ) : (
                  index + 1
                )}
              </motion.div>
              <span className="text-xs text-muted-foreground mt-2 text-center max-w-20 truncate">
                {step}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-secondary relative">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: index < currentStep ? "100%" : "0%" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export { Progress, CircularProgress, StepProgress }
