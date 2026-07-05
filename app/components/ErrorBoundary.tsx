"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime exception caught by boundary:", error, errorInfo);
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
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-panel border border-custom p-8 rounded-2xl max-w-md bg-gradient-to-br from-red-500/5 to-transparent backdrop-blur-xl">
            <span className="text-4xl">⚠️</span>
            <h2 className="text-xl font-bold text-white mt-4 mb-2">Code Workspace Crash</h2>
            <p className="text-gray-400 text-xs leading-relaxed mb-6">
              An unexpected runtime error occurred inside the compiler window or API fetch. Let&apos;s try reloading the workspace.
            </p>
            {this.state.error && (
              <div className="bg-black/40 border border-white/5 p-3 rounded-lg text-left text-[10px] font-mono text-red-400 max-h-36 overflow-y-auto mb-6 scrollbar">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full bg-brand-primary hover:opacity-90 text-white font-bold py-2.5 rounded-lg text-xs transition cursor-pointer shadow-md shadow-brand-primary/20"
            >
              Reset & Reload Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
