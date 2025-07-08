"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

// Hook for viewport-aware positioning
const useViewportAwareDialog = () => {
  const [dimensions, setDimensions] = React.useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getResponsiveMaxWidth = React.useCallback(() => {
    const { width } = dimensions;
    if (width < 640) return 'calc(100vw - 2rem)'; // Mobile: full width with margin
    if (width < 768) return 'calc(90vw)'; // Tablet: 90% width
    if (width < 1024) return 'calc(80vw)'; // Small desktop: 80% width
    return '32rem'; // Large desktop: fixed max-width
  }, [dimensions]);

  const getResponsiveMaxHeight = React.useCallback(() => {
    const { height } = dimensions;
    return `calc(${height}px - 4rem)`; // Always leave 2rem margin on top and bottom
  }, [dimensions]);

  return {
    dimensions,
    getResponsiveMaxWidth,
    getResponsiveMaxHeight,
  };
};

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", // Enhanced overlay with backdrop blur
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    scrollable?: boolean;
  }
>(({ className, children, size = 'md', scrollable = true, ...props }, ref) => {
  const { getResponsiveMaxWidth, getResponsiveMaxHeight } = useViewportAwareDialog();
  
  const getSizeClasses = () => {
    const maxWidth = getResponsiveMaxWidth();
    const maxHeight = getResponsiveMaxHeight();
    
    const sizeMap = {
      sm: `w-full max-w-sm`,
      md: `w-full`,
      lg: `w-full max-w-2xl`,
      xl: `w-full max-w-4xl`,
      full: `w-[95vw] max-w-[95vw]`
    };
    
    return {
      width: size === 'full' ? sizeMap[size] : `${sizeMap[size]} max-w-[${maxWidth}]`,
      maxHeight: `max-h-[${maxHeight}]`
    };
  };
  
  const { width, maxHeight } = getSizeClasses();
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Base positioning - always centered and responsive
          "fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]",
          // Responsive width based on size prop and viewport
          width,
          // Responsive height with scrolling capability
          maxHeight,
          scrollable && "overflow-y-auto",
          // Visual styling
          "grid gap-6 border bg-background p-8 shadow-2xl duration-300",
          "rounded-xl",
          // Animations
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-96 data-[state=open]:zoom-in-104",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
          // Ensure content is always visible
          "focus:outline-none",
          className
        )}
        {...props}
        asChild
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{
            // Ensure dialog content is always within viewport bounds
            maxWidth: '100vw',
            maxHeight: '100vh',
          }}
        >
          <div className={cn(
            scrollable && "overflow-y-auto",
            "w-full h-full"
          )}>
            {children}
          </div>
          <DialogPrimitive.Close className="absolute right-6 top-6 rounded-lg opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none p-1.5 z-10">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", // Enhanced with gap instead of space-x
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-xl font-bold leading-tight tracking-tight", // Enhanced typography
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)} // Enhanced line height
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
