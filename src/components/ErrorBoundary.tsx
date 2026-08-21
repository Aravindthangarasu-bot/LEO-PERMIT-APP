import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center', padding: 20 }}>
          <AlertTriangle size={64} style={{ color: '#ef4444', marginBottom: 20 }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>Something went wrong.</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            We've encountered an unexpected error. Our engineering team has been notified.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.href = '/'}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <RefreshCcw size={16} /> Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
