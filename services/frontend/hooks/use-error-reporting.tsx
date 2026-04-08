'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { ErrorReporting } from '@/lib/error-reporting';

// Error reporting hook
export function useErrorReporting() {
  const errorReporting = ErrorReporting.getInstance();

  const reportError = (error: Error, context?: any) => {
    errorReporting.reportError(error, context);
  };

  const reportEvent = (event: string, data?: any) => {
    errorReporting.reportEvent(event, data);
  };

  return {
    reportError,
    reportEvent
  };
}

// Error boundary component for MVP
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundaryWithReporting extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorReporting = ErrorReporting.getInstance();
    errorReporting.reportError(error, { errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              The application encountered an error. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
