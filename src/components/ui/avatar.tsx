"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full transition-all duration-200",
  {
    variants: {
      size: {
        sm: "h-8 w-8",
        md: "h-10 w-10",
        lg: "h-12 w-12",
        xl: "h-16 w-16",
        "2xl": "h-20 w-20",
      },
      variant: {
        default: "ring-2 ring-border shadow-sm hover:ring-primary/50 hover:shadow-md",
        soft: "ring-1 ring-border/50 shadow-sm hover:ring-border hover:shadow-md",
        none: "",
        highlighted: "ring-2 ring-primary shadow-md",
      },
      status: {
        none: "",
        online: "after:absolute after:bottom-0 after:right-0 after:h-1/4 after:w-1/4 after:rounded-full after:bg-emerald-500 after:ring-2 after:ring-background after:content-['']",
        offline: "after:absolute after:bottom-0 after:right-0 after:h-1/4 after:w-1/4 after:rounded-full after:bg-gray-400 after:ring-2 after:ring-background after:content-['']",
        away: "after:absolute after:bottom-0 after:right-0 after:h-1/4 after:w-1/4 after:rounded-full after:bg-yellow-500 after:ring-2 after:ring-background after:content-['']",
        busy: "after:absolute after:bottom-0 after:right-0 after:h-1/4 after:w-1/4 after:rounded-full after:bg-red-500 after:ring-2 after:ring-background after:content-['']",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
      status: "none",
    },
  }
)

const fallbackVariants = cva(
  "flex h-full w-full items-center justify-center rounded-full font-semibold transition-colors duration-200",
  {
    variants: {
      color: {
        primary: "bg-gradient-to-br from-primary/20 to-primary/10 text-primary",
        secondary: "bg-gradient-to-br from-secondary/20 to-secondary/10 text-secondary-foreground",
        accent: "bg-gradient-to-br from-accent/20 to-accent/10 text-accent-foreground",
        purple: "bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-700",
        blue: "bg-gradient-to-br from-blue-500/20 to-blue-600/10 text-blue-700",
        green: "bg-gradient-to-br from-green-500/20 to-green-600/10 text-green-700",
        orange: "bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-700",
        pink: "bg-gradient-to-br from-pink-500/20 to-pink-600/10 text-pink-700",
        teal: "bg-gradient-to-br from-teal-500/20 to-teal-600/10 text-teal-700",
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
        lg: "text-base",
        xl: "text-lg",
        "2xl": "text-xl",
      },
    },
    defaultVariants: {
      color: "primary",
      size: "md",
    },
  }
)

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  interactive?: boolean
}

export interface AvatarFallbackProps
  extends Omit<React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>, 'color'> {
  color?: 'primary' | 'secondary' | 'accent' | 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'teal'
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  name?: string
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, variant, status, interactive, ...props }, ref) => {
  const avatarElement = (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn(avatarVariants({ size, variant, status }), className)}
      {...props}
    />
  )

  if (interactive) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {avatarElement}
      </motion.div>
    )
  }

  return avatarElement
})
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover transition-opacity duration-200", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, color, size, name, children, ...props }, ref) => {
  // Generate initials from name if provided and no children
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const fallbackContent = children || (name ? getInitials(name) : '?')

  return (    <AvatarPrimitive.Fallback
      ref={ref}
      className={cn(fallbackVariants({ color, size }), className)}
      {...props}
    >
      {fallbackContent}
    </AvatarPrimitive.Fallback>
  )
})
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// Avatar Group Component for displaying multiple avatars
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  limit?: number
  total?: number
  size?: VariantProps<typeof avatarVariants>['size']
  showTotal?: boolean
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, limit = 3, total, size = "md", showTotal = true, ...props }, ref) => {
    const childrenArray = React.Children.toArray(children)
    const visibleChildren = limit ? childrenArray.slice(0, limit) : childrenArray
    const remainingCount = total ? total - limit : childrenArray.length - limit

    return (
      <div
        ref={ref}
        className={cn("flex -space-x-2", className)}
        {...props}
      >
        {visibleChildren.map((child, index) => (
          <div key={index} className="relative">
            {React.cloneElement(child as React.ReactElement, {
              size,
              className: cn(
                "border-2 border-background",
                (child as React.ReactElement).props?.className
              ),
            })}
          </div>
        ))}        {showTotal && remainingCount > 0 && (
          <Avatar size={size} variant="soft" className="border-2 border-background">
            <AvatarFallback color="secondary" size={size || 'md'}>
              +{remainingCount}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    )
  }
)
AvatarGroup.displayName = "AvatarGroup"

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup }
