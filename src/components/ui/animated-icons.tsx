'use client';

import * as React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconHover, iconTap, iconSpinVariants, iconBounceVariants, useReducedMotion, createSafeVariants } from "./animations";

interface AnimatedIconProps {
  icon: LucideIcon;
  className?: string;
  variant?: "hover" | "spin" | "bounce" | "pulse";
  size?: number;
  onClick?: () => void;
}

export const AnimatedIcon = React.forwardRef<HTMLDivElement, AnimatedIconProps>(
  ({ icon: Icon, className, variant = "hover", size = 24, onClick }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    const getMotionProps = () => {
      if (prefersReducedMotion) {
        return {
          initial: { scale: 1 },
          animate: { scale: 1 },
        };
      }

      switch (variant) {
        case "spin":
          return {
            variants: iconSpinVariants,
            initial: "initial",
            animate: "animate",
          };
        case "bounce":
          return {
            variants: iconBounceVariants,
            initial: "initial",
            animate: "animate",
          };
        case "pulse":
          return {
            initial: { scale: 1 },
            animate: {
              scale: [1, 1.1, 1],
              transition: {
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity,
              },
            },
          };
        default:
          return {
            initial: { scale: 1, rotate: 0 },
            whileHover: iconHover,
            whileTap: iconTap,
          };
      }
    };

    return (
      <motion.div
        ref={ref}
        className={cn("inline-flex items-center justify-center", className)}
        {...getMotionProps()}
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : "default" }}
      >
        <Icon size={size} />
      </motion.div>
    );
  }
);

AnimatedIcon.displayName = "AnimatedIcon";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  color?: string;
}

export const LoadingSpinner = ({ size = 24, className, color = "currentColor" }: LoadingSpinnerProps) => {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return (
      <div 
        className={cn("inline-block rounded-full border-2 border-current border-t-transparent", className)}
        style={{ width: size, height: size, color }}
      />
    );
  }

  return (
    <motion.div
      className={cn("inline-block rounded-full border-2 border-current border-t-transparent", className)}
      style={{ width: size, height: size, color }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        ease: "linear",
        repeat: Infinity,
      }}
    />
  );
};

interface PulsingDotProps {
  size?: number;
  className?: string;
  color?: string;
}

export const PulsingDot = ({ size = 8, className, color = "currentColor" }: PulsingDotProps) => {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return (
      <div 
        className={cn("inline-block rounded-full bg-current", className)}
        style={{ width: size, height: size, color }}
      />
    );
  }

  return (
    <motion.div
      className={cn("inline-block rounded-full bg-current", className)}
      style={{ width: size, height: size, color }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.7, 1],
      }}
      transition={{
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    />
  );
};
