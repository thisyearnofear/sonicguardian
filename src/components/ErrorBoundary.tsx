'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StatusBanner } from './StatusBanner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl p-8 max-w-md w-full text-center space-y-4">
            <div className="text-4xl" aria-hidden>
              ⚠️
            </div>
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-sm text-[color:var(--color-muted)]">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-primary px-6 py-2.5 text-sm"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
