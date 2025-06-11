'use client';

import { motion, Variants } from 'framer-motion';
import React from 'react';

// Animation variants for fading and sliding in
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

// Component for scroll-triggered animations
interface AnimatedDivProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  stagger?: boolean;
}

export const AnimatedDiv = ({ children, className, variants = fadeInUp, stagger = false }: AnimatedDivProps) => {
  const containerVariants = stagger ? staggerContainer : {};
  
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <motion.div variants={variants}>
        {children}
      </motion.div>
    </motion.div>
  );
};
