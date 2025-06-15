"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown, Plus, Minus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const accordionVariants = cva(
  "space-y-1",
  {
    variants: {
      variant: {
        default: "",
        bordered: "border border-border rounded-lg overflow-hidden",
        separated: "space-y-4",
        ghost: "",
      },
      size: {
        sm: "[&_[data-accordion-trigger]]:py-3 [&_[data-accordion-content]]:pb-3",
        md: "[&_[data-accordion-trigger]]:py-4 [&_[data-accordion-content]]:pb-4", 
        lg: "[&_[data-accordion-trigger]]:py-6 [&_[data-accordion-content]]:pb-6",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

const accordionItemVariants = cva(
  "transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "border-b border-border/50 last:border-b-0",
        bordered: "border-none",
        separated: "border border-border rounded-lg bg-card shadow-sm hover:shadow-md",
        ghost: "border-none hover:bg-accent/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const accordionTriggerVariants = cva(
  "flex flex-1 items-center justify-between font-semibold text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "hover:text-primary [&[data-state=open]]:text-primary",
        bordered: "hover:text-primary [&[data-state=open]]:text-primary px-4",
        separated: "hover:text-primary [&[data-state=open]]:text-primary px-4",
        ghost: "hover:text-primary [&[data-state=open]]:text-primary hover:bg-accent/50 rounded-md px-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const accordionContentVariants = cva(
  "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
  {
    variants: {
      variant: {
        default: "",
        bordered: "px-4",
        separated: "px-4",
        ghost: "px-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface AccordionProps
  extends VariantProps<typeof accordionVariants> {
  className?: string
  children?: React.ReactNode
}

export interface AccordionSingleProps extends AccordionProps {
  type: "single"
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  collapsible?: boolean
}

export interface AccordionMultipleProps extends AccordionProps {
  type: "multiple"
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

export interface AccordionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
    VariantProps<typeof accordionItemVariants> {}

export interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>,
    VariantProps<typeof accordionTriggerVariants> {
  icon?: "chevron" | "plus" | "none"
  hideIcon?: boolean
}

export interface AccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>,
    VariantProps<typeof accordionContentVariants> {}

const Accordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  AccordionSingleProps | AccordionMultipleProps
>(({ className, variant, size, ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    className={cn(accordionVariants({ variant, size }), className)}
    {...(props as any)}
  />
))
Accordion.displayName = AccordionPrimitive.Root.displayName

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, variant, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(accordionItemVariants({ variant }), className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, variant, children, icon = "chevron", hideIcon = false, ...props }, ref) => {
  const IconComponent = icon === "plus" ? Plus : icon === "chevron" ? ChevronDown : null

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(accordionTriggerVariants({ variant }), className)}
        data-accordion-trigger
        {...props}
        asChild
      >
        <motion.button
          whileHover={{ x: variant === "ghost" ? 0 : 2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <span className="text-left">{children}</span>
          {!hideIcon && IconComponent && (
            <IconComponent 
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-300 ease-out",
                icon === "plus" ? 
                  "[&[data-state=open]]:rotate-45" : 
                  "[&[data-state=open]]:rotate-180"
              )} 
              aria-hidden="true" 
            />
          )}
        </motion.button>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
})
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, variant, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(accordionContentVariants({ variant }), className)}
    data-accordion-content
    {...props}
  >
    <motion.div 
      className="pt-0 text-muted-foreground leading-relaxed"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, delay: 0.1 }}
    >
      {children}
    </motion.div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

// Animated Accordion with enhanced transitions
const AnimatedAccordion = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Root>,
  (AccordionSingleProps | AccordionMultipleProps) & { 
    staggerChildren?: boolean
  }
>(({ className, variant, size, staggerChildren = false, children, ...props }, ref) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: staggerChildren ? {
        staggerChildren: 0.1,
        delayChildren: 0.1
      } : {}
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <AccordionPrimitive.Root
        ref={ref}
        className={cn(accordionVariants({ variant, size }), className)}
        {...(props as any)}
      >
        {staggerChildren ? (
          React.Children.map(children, (child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        ) : children}
      </AccordionPrimitive.Root>
    </motion.div>
  )
})
AnimatedAccordion.displayName = "AnimatedAccordion"

export { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent,
  AnimatedAccordion
}
