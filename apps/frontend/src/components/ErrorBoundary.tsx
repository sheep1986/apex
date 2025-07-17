import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

const serializeError = (error: any) => {
  if (error instanceof Error) {
    return error.message + '\n' + error.stack;
  }
  return JSON.stringify(error, null, 2);
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
  errorInfo: any;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Log error details
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('🚨 Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 p-6">
          <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-gray-900 p-8 text-center shadow-2xl">
            {/* Error Icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="mb-2 text-2xl font-bold text-white">Oops! Something went wrong</h1>
            <p className="mb-6 text-gray-400">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {/* Action Buttons */}
            <div className="mb-6 space-y-3">
              <Button
                onClick={this.handleReload}
                className="w-full bg-gradient-to-r from-brand-pink to-brand-magenta hover:from-brand-pink/80 hover:to-brand-magenta/80"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload Page
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </div>

            {/* Error Details (Collapsible) */}
            <details className="text-left">
              <summary className="mb-2 cursor-pointer text-sm text-gray-500 hover:text-gray-400">
                View Technical Details
              </summary>
              <div className="mt-2 rounded-lg bg-gray-800 p-4">
                <pre className="max-h-32 overflow-auto text-xs text-red-400">
                  {serializeError(this.state.error)}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 max-h-32 overflow-auto text-xs text-gray-500">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </details>

            {/* Footer */}
            <div className="mt-6 border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
