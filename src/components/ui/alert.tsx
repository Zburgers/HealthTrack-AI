import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-2xl border p-6 shadow-sm backdrop-blur-sm [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-5 [&>svg]:top-5 [&>svg]:text-foreground transition-all duration-200", // Enhanced modern styling
  {
    variants: {
      variant: {
        default: "bg-background/95 text-foreground border-border/50",
        destructive:
          "border-destructive/50 bg-destructive/5 text-destructive backdrop-blur-sm [&>svg]:text-destructive",
        success:
          "border-green-500/50 bg-green-50/80 text-green-800 backdrop-blur-sm [&>svg]:text-green-600",
        warning:
          "border-yellow-500/50 bg-yellow-50/80 text-yellow-800 backdrop-blur-sm [&>svg]:text-yellow-600",
        info:
          "border-blue-500/50 bg-blue-50/80 text-blue-800 backdrop-blur-sm [&>svg]:text-blue-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, children, ...props }, ref) => (
  <motion.div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    initial={{ opacity: 0, y: 8, scale: 0.98 }}
    animate={{ 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.3, 
        ease: [0.16, 1, 0.3, 1] 
      }
    }}
    whileHover={{
      scale: 1.01,
      transition: { duration: 0.15 }
    }}
    layout
    {...(props as any)}
  >
    {children}
  </motion.div>
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <motion.h5
    ref={ref}
    className={cn("mb-2 font-bold leading-none tracking-tight text-lg", className)} // Enhanced modern styling
    initial={{ opacity: 0, x: -4 }}
    animate={{ 
      opacity: 1, 
      x: 0,
      transition: { delay: 0.1, duration: 0.2 }
    }}
    {...(props as any)}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <motion.div
    ref={ref}
    className={cn("text-sm leading-relaxed opacity-90", className)} // Enhanced modern styling
    initial={{ opacity: 0, x: -4 }}
    animate={{ 
      opacity: 0.9, 
      x: 0,
      transition: { delay: 0.15, duration: 0.2 }
    }}
    {...(props as any)}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
