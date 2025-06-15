'use client';

import * as React from "react";
import { motion } from "framer-motion";
import { Button, ButtonProps } from "./button";
import { buttonPressVariants, useReducedMotion, createSafeVariants } from "./animations";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends ButtonProps {
  pulse?: boolean;
  bounce?: boolean;
  glow?: boolean;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ className, pulse = false, bounce = false, glow = false, children, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const variants = prefersReducedMotion ? createSafeVariants(buttonPressVariants) : buttonPressVariants;

    const pulseVariants = {
      initial: { scale: 1 },
      animate: pulse ? {
        scale: [1, 1.02, 1],
        transition: {
          duration: 2,
          ease: "easeInOut",
          repeat: Infinity,
        },
      } : { scale: 1 },
    };

    const bounceVariants = {
      initial: { y: 0 },
      animate: bounce ? {
        y: [0, -2, 0],
        transition: {
          duration: 0.6,
          ease: "easeInOut",
          repeat: Infinity,
          repeatDelay: 2,
        },
      } : { y: 0 },
    };

    return (
      <motion.div
        variants={pulse || bounce ? (pulse ? pulseVariants : bounceVariants) : variants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        className={glow ? "relative" : ""}
      >
        <Button
          ref={ref}
          className={cn(
            glow && "relative overflow-hidden",
            glow && "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
            className
          )}
          {...props}
        >
          {children}
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";
