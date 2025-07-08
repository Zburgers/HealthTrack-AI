// Error reporting service for HealthTrack AI
// Minimal implementation for MVP build

interface ErrorReport {
  message: string;
  stack?: string;
  url?: string;
  timestamp: Date;
  userAgent?: string;
  userId?: string;
}

export class ErrorReporting {
  private static instance: ErrorReporting;
  private isEnabled = false;

  private constructor() {}

  static getInstance(): ErrorReporting {
    if (!ErrorReporting.instance) {
      ErrorReporting.instance = new ErrorReporting();
    }
    return ErrorReporting.instance;
  }

  initialize(config: { enabled?: boolean; enabledInDev?: boolean } = {}) {
    this.isEnabled = config.enabled ?? false;
    console.log('🔍 Error reporting initialized:', this.isEnabled ? 'enabled' : 'disabled');
  }

  reportError(error: Error, context?: any) {
    if (!this.isEnabled) return;
    
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    // For MVP, just log to console
    console.error('🚨 Error reported:', report, context);
  }

  reportEvent(event: string, data?: any) {
    if (!this.isEnabled) return;
    console.log('📊 Event reported:', event, data);
  }

  getStats() {
    return { enabled: this.isEnabled, errors: 0, events: 0 };
  }

  test() {
    console.log('🧪 Error reporting test');
  }

  destroy() {
    console.log('🗑️ Error reporting destroyed');
  }

  // Static methods for API client compatibility
  static captureAPIError(error: any, context?: any) {
    ErrorReporting.getInstance().reportError(error, context);
  }

  static captureUserActionError(error: any, context?: any) {
    ErrorReporting.getInstance().reportError(error, context);
  }
}

export function initializeErrorReporting(config?: { enabled?: boolean; enabledInDev?: boolean }) {
  const errorReporting = ErrorReporting.getInstance();
  errorReporting.initialize(config);
  return errorReporting;
}
