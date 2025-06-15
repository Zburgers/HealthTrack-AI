"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default gap-3 select-none items-center rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all duration-200 focus:bg-accent/80 hover:bg-accent/60 data-[state=open]:bg-accent/80 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", // Enhanced modern styling
      inset && "pl-11",
      className
    )}
    {...props}
    asChild
  >
    <motion.div
      whileHover={{ 
        scale: 1.01,
        x: 2,
        transition: { duration: 0.15 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
      <motion.div
        animate={{ x: 0 }}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.15 }}
      >
        <ChevronRight className="ml-auto" />
      </motion.div>
    </motion.div>
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[12rem] overflow-hidden rounded-2xl border border-border/50 bg-popover/90 p-3 text-popover-foreground shadow-2xl backdrop-blur-lg ring-1 ring-black/5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-105 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", // Enhanced modern styling with consistent blur
      className
    )}
    {...props}
    asChild
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: -8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -8 }}
      transition={{ 
        duration: 0.15, 
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      {props.children}
    </motion.div>
  </DropdownMenuPrimitive.SubContent>
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <AnimatePresence>      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-2xl border border-border/50 bg-popover/90 p-3 text-popover-foreground shadow-2xl backdrop-blur-lg ring-1 ring-black/5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-105 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", // Enhanced modern styling with stronger blur
          className
        )}
        asChild
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{ 
            duration: 0.15, 
            ease: [0.16, 1, 0.3, 1] // Modern easing curve
          }}
        >
          {props.children}
        </motion.div>
      </DropdownMenuPrimitive.Content>
    </AnimatePresence>
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all duration-200 focus:bg-accent/80 hover:bg-accent/60 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", // Enhanced modern styling
      inset && "pl-11",
      className
    )}
    {...props}
    asChild
  >
    <motion.div
      whileHover={{ 
        scale: 1.01,
        backgroundColor: "rgba(var(--accent), 0.8)",
        transition: { duration: 0.15 }
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  </DropdownMenuPrimitive.Item>
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-xl py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all duration-200 focus:bg-accent/80 hover:bg-accent/60 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", // Enhanced modern styling
      className
    )}
    checked={checked}
    {...props}
    asChild
  >
    <motion.div
      whileHover={{ 
        scale: 1.01,
        x: 2,
        transition: { duration: 0.15 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="absolute left-4 flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Check className="h-4 w-4" />
          </motion.div>
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </motion.div>
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-xl py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all duration-200 focus:bg-accent/80 hover:bg-accent/60 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", // Enhanced modern styling
      className
    )}
    {...props}
    asChild
  >
    <motion.div
      whileHover={{ 
        scale: 1.01,
        x: 2,
        transition: { duration: 0.15 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="absolute left-4 flex h-4 w-4 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            <Circle className="h-2.5 w-2.5 fill-current" />
          </motion.div>
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </motion.div>
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-4 py-2 text-xs font-bold tracking-wider text-muted-foreground uppercase", // Enhanced modern styling
      inset && "pl-11",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-3 h-px bg-gradient-to-r from-transparent via-border to-transparent", className)} // Enhanced modern styling with gradient
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-wider opacity-70 font-mono bg-muted/30 px-2 py-0.5 rounded-md", className)} // Enhanced modern styling
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
