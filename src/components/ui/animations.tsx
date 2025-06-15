'use client';

import { motion, Variants, Transition, HTMLMotionProps } from 'framer-motion';
import React from 'react';

// Basic animation transitions
export const transitions = {
  smooth: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  snappy: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  gentle: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  bouncy: { type: 'spring', stiffness: 400, damping: 25 },
} as const;

// Core animation variants
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitions.smooth },
  exit: { opacity: 0, transition: transitions.smooth },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: transitions.smooth },
  exit: { opacity: 0, y: 20, transition: transitions.smooth },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: transitions.smooth },
  exit: { opacity: 0, y: -20, transition: transitions.smooth },
};

export const slideUp: Variants = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: transitions.gentle },
  exit: { opacity: 0, y: 30, transition: transitions.smooth },
};

export const slideDown: Variants = {
  initial: { opacity: 0, y: -30 },
  animate: { opacity: 1, y: 0, transition: transitions.gentle },
  exit: { opacity: 0, y: -30, transition: transitions.smooth },
};

export const slideLeft: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: transitions.gentle },
  exit: { opacity: 0, x: -30, transition: transitions.smooth },
};

export const slideRight: Variants = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: transitions.gentle },
  exit: { opacity: 0, x: 30, transition: transitions.smooth },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: transitions.spring },
  exit: { opacity: 0, scale: 0.9, transition: transitions.smooth },
};

export const scaleInCenter: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: transitions.spring },
  exit: { opacity: 0, scale: 0.8, transition: transitions.smooth },
};

// Modal-specific animations
export const modalAnimation: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { ...transitions.spring, delay: 0.1 }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 10, 
    transition: transitions.snappy 
  },
};

export const modalBackdropAnimation: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitions.smooth },
  exit: { opacity: 0, transition: transitions.smooth },
};

export const sheetAnimation: Variants = {
  initial: { opacity: 0, y: '100%' },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { ...transitions.spring, duration: 0.4 }
  },
  exit: { 
    opacity: 0, 
    y: '100%', 
    transition: transitions.smooth 
  },
};

// Page transition animations
export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: transitions.gentle },
  exit: { opacity: 0, x: 20, transition: transitions.smooth },
};

export const pageSlideTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: transitions.gentle },
  exit: { opacity: 0, y: -20, transition: transitions.smooth },
};

// List and stagger animations
export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: transitions.smooth,
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: transitions.snappy,
  },
};

export const listItemAnimation: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...transitions.smooth,
      delay: index * 0.05,
    },
  }),
};

// Micro-interaction variants
export const buttonHover = {
  scale: 1.02,
  transition: transitions.snappy,
};

export const buttonTap = {
  scale: 0.98,
  transition: transitions.snappy,
};

export const iconHover = {
  scale: 1.1,
  rotate: 5,
  transition: transitions.snappy,
};

export const iconTap = {
  scale: 0.9,
  transition: transitions.snappy,
};

export const cardHover = {
  y: -4,
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  transition: transitions.smooth,
};

// Accessibility: Support for prefers-reduced-motion
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
      mediaQuery.addEventListener('change', handleChange);
      
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);
  
  return prefersReducedMotion;
};

// Safe animation variants that respect prefers-reduced-motion
export const createSafeVariants = (variants: Variants): Variants => {
  const reducedMotionVariants: Variants = {};
  
  for (const [key, value] of Object.entries(variants)) {
    if (typeof value === 'object' && value !== null) {
      reducedMotionVariants[key] = {
        ...value,
        transition: { duration: 0, delay: 0 },
      };
    } else {
      reducedMotionVariants[key] = value;
    }
  }
  
  return reducedMotionVariants;
};

// Enhanced micro-interactions
export const buttonPressVariants: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: transitions.snappy,
  },
  tap: { 
    scale: 0.98,
    transition: transitions.snappy,
  },
};

export const iconSpinVariants: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

export const iconBounceVariants: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-2, -4, -2, 0],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatDelay: 2,
    },
  },
};

// Toast notification animations
export const toastSlideIn: Variants = {
  initial: { opacity: 0, x: 300, scale: 0.9 },
  animate: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: transitions.spring,
  },
  exit: { 
    opacity: 0, 
    x: 300, 
    scale: 0.9,
    transition: transitions.smooth,
  },
};

// Progress bar animation
export const progressBarVariants: Variants = {
  initial: { scaleX: 0, transformOrigin: 'left' },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transition: { duration: 0.5, ease: 'easeOut' },
  }),
};

// Skeleton loading animation with better performance
export const skeletonPulse: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// Higher-order components for common animation patterns
interface AnimatedComponentProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
}

export const FadeInDiv = ({ 
  children, 
  className, 
  variants = fadeIn, 
  delay = 0,
  ...props 
}: AnimatedComponentProps) => (
  <motion.div
    className={className}
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ animationDelay: `${delay}s` }}
    {...props}
  >
    {children}
  </motion.div>
);

export const SlideUpDiv = ({ 
  children, 
  className, 
  variants = slideUp, 
  delay = 0,
  ...props 
}: AnimatedComponentProps) => (
  <motion.div
    className={className}
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ animationDelay: `${delay}s` }}
    {...props}
  >
    {children}
  </motion.div>
);

export const ScaleInDiv = ({ 
  children, 
  className, 
  variants = scaleIn, 
  delay = 0,
  ...props 
}: AnimatedComponentProps) => (
  <motion.div
    className={className}
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{ animationDelay: `${delay}s` }}
    {...props}
  >
    {children}
  </motion.div>
);

// Component for scroll-triggered animations
interface AnimatedDivProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  stagger?: boolean;
  once?: boolean;
  threshold?: number;
}

export const AnimatedDiv = ({ 
  children, 
  className, 
  variants = fadeInUp, 
  stagger = false,
  once = true,
  threshold = 0.1,
}: AnimatedDivProps) => {
  const containerVariants = stagger ? staggerContainer : variants;
  
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      whileInView="animate"
      exit="exit"
      viewport={{ once, amount: threshold }}
    >
      {stagger ? (
        React.Children.map(children, (child, index) => (
          <motion.div key={index} variants={staggerItem}>
            {child}
          </motion.div>
        ))
      ) : (
        children
      )}
    </motion.div>
  );
};

// Utility hook for common animation states
export const useAnimationControls = () => {
  return {
    fadeIn,
    fadeInUp,
    slideUp,
    scaleIn,
    modalAnimation,
    pageTransition,
    staggerContainer,
    staggerItem,
  };
};
