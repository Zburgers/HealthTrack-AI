'use client';

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { pageTransition, pageSlideTransition, fadeIn, useReducedMotion, createSafeVariants } from "./animations";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  type?: "slide" | "fade" | "slideUp";
}

export const PageTransition = ({ children, className, type = "slide" }: PageTransitionProps) => {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  const getVariants = () => {
    switch (type) {
      case "fade":
        return prefersReducedMotion ? createSafeVariants(fadeIn) : fadeIn;
      case "slideUp":
        return prefersReducedMotion ? createSafeVariants(pageSlideTransition) : pageSlideTransition;
      default:
        return prefersReducedMotion ? createSafeVariants(pageTransition) : pageTransition;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={getVariants()}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const AnimatedPage = ({ children, className, delay = 0 }: AnimatedPageProps) => {
  const prefersReducedMotion = useReducedMotion();
  
  const variants = prefersReducedMotion ? createSafeVariants(fadeIn) : {
    initial: fadeIn.initial,
    animate: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
        delay,
      },
    },
    exit: fadeIn.exit,
  };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};
