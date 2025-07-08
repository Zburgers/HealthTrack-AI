"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

// Hook for viewport-aware sheet positioning
const useViewportAwareSheet = () => {
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

  const getResponsiveSheetWidth = React.useCallback((side: string) => {
    const { width } = dimensions;
    if (side === 'left' || side === 'right') {
      if (width < 640) return 'w-[95vw]'; // Mobile: almost full width
      if (width < 768) return 'w-3/4'; // Tablet: 75% width
      return 'w-3/4 sm:max-w-sm'; // Desktop: 75% with max width
    }
    return 'inset-x-0'; // Top/bottom sheets use full width
  }, [dimensions]);

  return { dimensions, getResponsiveSheetWidth };
};

const Sheet = SheetPrimitive.Root

const SheetTrigger = SheetPrimitive.Trigger

const SheetClose = SheetPrimitive.Close

const SheetPortal = SheetPrimitive.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", // Enhanced overlay
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-6 bg-background p-8 shadow-2xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-300 overflow-y-auto",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b rounded-b-xl data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top max-h-[85vh]",
        bottom: "inset-x-0 bottom-0 border-t rounded-t-xl data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom max-h-[85vh]",
        left: "inset-y-0 left-0 h-full border-r rounded-r-xl data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
        right: "inset-y-0 right-0 h-full border-l rounded-l-xl data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => {
  const { getResponsiveSheetWidth } = useViewportAwareSheet();
  const responsiveWidth = getResponsiveSheetWidth(side || "right");
    return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(
          sheetVariants({ side: side || "right" }),
          // Apply responsive width for left/right sheets
          (side || "right") === 'left' || (side || "right") === 'right' ? responsiveWidth : '',
          // Ensure sheets don't exceed viewport
          "focus:outline-none",
          className
        )}
        style={{
          // Ensure content is always within viewport bounds
          maxWidth: (side || "right") === 'left' || (side || "right") === 'right' ? '100vw' : undefined,
          maxHeight: '100vh',
        }}
        {...props}
        asChild
      >
        <motion.div
          initial={{ 
            opacity: 0, 
            x: (side || "right") === "right" ? 100 : (side || "right") === "left" ? -100 : 0,
            y: (side || "right") === "top" ? -100 : (side || "right") === "bottom" ? 100 : 0 
          }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ 
            opacity: 0,
            x: (side || "right") === "right" ? 100 : (side || "right") === "left" ? -100 : 0,
            y: (side || "right") === "top" ? -100 : (side || "right") === "bottom" ? 100 : 0 
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="overflow-y-auto h-full w-full">
            {children}
          </div>
          <SheetPrimitive.Close className="absolute right-6 top-6 rounded-lg opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none p-1.5 z-10">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        </motion.div>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-3 text-center sm:text-left", // Increased spacing
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", // Enhanced with gap
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-xl font-bold leading-tight text-foreground", className)} // Enhanced typography
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)} // Enhanced line height
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
