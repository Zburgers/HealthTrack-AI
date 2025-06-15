
'use client';

import MainLayout from '@/components/layout/MainLayout';
import NewCaseForm from '@/components/new-case/NewCaseForm';
import { AnimatedPage } from '@/components/ui/page-transition';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/components/ui/animations';
// ResultsDisplay is no longer shown directly on this page. 
// Navigation will go to /analysis after form submission.

export default function NewCasePage() {
  // This page now only renders the NewCaseForm.
  // The form submission logic will handle navigation to the /analysis page.
  return (
    <MainLayout>
      <AnimatedPage className="max-w-3xl mx-auto">
        <motion.h1 
          className="font-headline text-3xl font-bold text-primary mb-8 text-center"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          Create New Patient Case
        </motion.h1>
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          <NewCaseForm />
        </motion.div>
      </AnimatedPage>
    </MainLayout>
  );
}
