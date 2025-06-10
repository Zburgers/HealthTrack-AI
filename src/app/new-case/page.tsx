
'use client';

import MainLayout from '@/components/layout/MainLayout';
import NewCaseForm from '@/components/new-case/NewCaseForm';
// ResultsDisplay is no longer shown directly on this page. 
// Navigation will go to /analysis after form submission.

export default function NewCasePage() {
  // This page now only renders the NewCaseForm.
  // The form submission logic will handle navigation to the /analysis page.
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="font-headline text-3xl font-bold text-primary mb-8 text-center">Create New Patient Case</h1>
        <NewCaseForm />
      </div>
    </MainLayout>
  );
}
