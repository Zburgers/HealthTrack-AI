/**
 * Error Reporting Provider
 * 
 * This component initializes and provides the error reporting service
 * to the entire application. It should be placed high in the component tree.
 */

'use client';

import React, { useEffect } from 'react';
import { initializeErrorReporting } from '@/lib/error-reporting';
import { ErrorBoundaryWithReporting } from '@/hooks/use-error-reporting';

interface ErrorReportingProviderProps {
  children: React.ReactNode;
}

export default function ErrorReportingProvider({ children }: ErrorReportingProviderProps) {
  useEffect(() => {
    // Initialize error reporting service with minimal config
    const errorReporting = initializeErrorReporting({
      // Enable in development only if explicitly set
      enabledInDev: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING_DEV === 'true',
    });

    // Log successful initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 Error Reporting Service initialized');
    }

    // Cleanup on unmount
    return () => {
      if (errorReporting && typeof errorReporting.destroy === 'function') {
        errorReporting.destroy();
      }
    };
  }, []);

  return (
    <ErrorBoundaryWithReporting>
      {children}
    </ErrorBoundaryWithReporting>
  );
}
