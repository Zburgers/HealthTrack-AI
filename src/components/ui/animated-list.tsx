'use client';

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, useReducedMotion, createSafeVariants } from "./animations";
import { cn } from "@/lib/utils";

interface AnimatedListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
  itemClassName?: string;
  as?: keyof React.ReactHTML;
}

export const AnimatedList = React.forwardRef<HTMLElement, AnimatedListProps>(
  ({ children, className, staggerDelay = 0.1, itemClassName, as: Component = "div" }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const containerVariants = prefersReducedMotion ? createSafeVariants(staggerContainer) : {
      ...staggerContainer,
      animate: {
        ...staggerContainer.animate,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.2,
        },
      },
    };
    const itemVariants = prefersReducedMotion ? createSafeVariants(staggerItem) : staggerItem;

    return (
      <motion.div
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn("space-y-2", className)}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <AnimatePresence>
          {React.Children.map(children, (child, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              layout
              className={itemClassName}
            >
              {child}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }
);

AnimatedList.displayName = "AnimatedList";

interface AnimatedGridProps {
  children: React.ReactNode[];
  className?: string;
  columns?: number;
  staggerDelay?: number;
  itemClassName?: string;
}

export const AnimatedGrid = React.forwardRef<HTMLDivElement, AnimatedGridProps>(
  ({ children, className, columns = 3, staggerDelay = 0.05, itemClassName }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const containerVariants = prefersReducedMotion ? createSafeVariants(staggerContainer) : {
      ...staggerContainer,
      animate: {
        ...staggerContainer.animate,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.1,
        },
      },
    };
    const itemVariants = prefersReducedMotion ? createSafeVariants(staggerItem) : staggerItem;

    return (
      <motion.div
        ref={ref}
        className={cn(
          `grid gap-4`,
          columns === 1 && "grid-cols-1",
          columns === 2 && "grid-cols-1 md:grid-cols-2",
          columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
          className
        )}
        variants={containerVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <AnimatePresence>
          {React.Children.map(children, (child, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              layout
              className={itemClassName}
            >
              {child}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  }
);

AnimatedGrid.displayName = "AnimatedGrid";
