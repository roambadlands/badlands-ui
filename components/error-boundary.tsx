"use client";

import * as Sentry from "@sentry/nextjs";
import React, { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable error boundary component with Sentry integration.
 * Catches JavaScript errors in child components and displays a fallback UI.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
        componentName: this.props.componentName,
      },
      tags: {
        errorBoundary: this.props.componentName || "unknown",
      },
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 text-center bg-destructive/5 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-8 w-8 text-destructive mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            {this.props.fallbackMessage || "Something went wrong"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={this.handleReset}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Error boundary specifically for content blocks (messages, code, etc.)
 * Shows a minimal fallback that doesn't disrupt the conversation flow.
 */
export function ContentBlockErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ErrorBoundary
      componentName="ContentBlockRenderer"
      fallbackMessage="Failed to render this content"
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for the message list.
 * Shows a more prominent error with a clear retry action.
 */
export function MessageListErrorBoundary({
  children,
  onReset,
}: {
  children: ReactNode;
  onReset?: () => void;
}) {
  return (
    <ErrorBoundary
      componentName="MessageList"
      fallbackMessage="Failed to load messages"
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Error boundary for the main chat area.
 * Shows a full-page error with navigation options.
 */
export function ChatAreaErrorBoundary({
  children,
  onReset,
}: {
  children: ReactNode;
  onReset?: () => void;
}) {
  return (
    <ErrorBoundary
      componentName="ChatArea"
      fallback={
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Chat Error</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Something went wrong with the chat interface. You can try again or
            start a new conversation.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onReset}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Button variant="default" onClick={() => (window.location.href = "/chat")}>
              Start new chat
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
