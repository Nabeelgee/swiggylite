import React from "react";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

/**
 * Catches render-time runtime errors and prevents a blank screen.
 * Also logs the component stack to help us pinpoint the offending component.
 */
export default class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("App render error:", error);
    // eslint-disable-next-line no-console
    console.error("Component stack:", info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A client-side error prevented this page from loading.
          </p>
          {this.state.error?.message && (
            <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-foreground">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Go to home
            </a>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
