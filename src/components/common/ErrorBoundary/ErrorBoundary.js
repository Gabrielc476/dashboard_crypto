// src/components/common/ErrorBoundary/ErrorBoundary.js
import React from "react";
import { createErrorHandler } from "../../../utils/helpers";
import "./ErrorBoundary.scss";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };

    this.handleError = createErrorHandler(
      this.props.componentName || "ErrorBoundary"
    );
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.handleError(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Report error to monitoring service if available
    if (this.props.onError && typeof this.props.onError === "function") {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });

    // Call retry callback if provided
    if (this.props.onRetry && typeof this.props.onRetry === "function") {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        if (typeof this.props.fallback === "function") {
          return this.props.fallback(this.state.error, this.handleRetry);
        }
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="error-boundary">
          <div className="error-boundary__container">
            <div className="error-boundary__icon">⚠️</div>

            <div className="error-boundary__content">
              <h2 className="error-boundary__title">Something went wrong</h2>

              <p className="error-boundary__message">
                {this.props.message ||
                  "We're sorry, but something unexpected happened. Please try refreshing the page."}
              </p>

              {this.props.showDetails && this.state.error && (
                <details className="error-boundary__details">
                  <summary>Error details</summary>
                  <div className="error-boundary__error-info">
                    <p>
                      <strong>Error:</strong> {this.state.error.toString()}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="error-boundary__stack">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                    <p>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </p>
                  </div>
                </details>
              )}
            </div>

            <div className="error-boundary__actions">
              <button
                className="error-boundary__retry-btn"
                onClick={this.handleRetry}
              >
                Try Again
              </button>

              <button
                className="error-boundary__reload-btn"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC wrapper for functional components
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
};

// Hook for error reporting
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, errorInfo = {}) => {
    console.error("Error caught by useErrorHandler:", error, errorInfo);

    // You can add error reporting service here
    // reportError(error, errorInfo);
  }, []);

  return handleError;
};

// Simple error fallback components
export const SimpleErrorFallback = ({ error, retry }) => (
  <div className="error-fallback error-fallback--simple">
    <p>Something went wrong</p>
    <button onClick={retry}>Try again</button>
  </div>
);

export const MinimalErrorFallback = ({ error, retry }) => (
  <div className="error-fallback error-fallback--minimal">
    <span>Error occurred</span>
    <button onClick={retry}>Retry</button>
  </div>
);

export const DetailedErrorFallback = ({ error, retry }) => (
  <div className="error-fallback error-fallback--detailed">
    <h3>Application Error</h3>
    <p>{error?.message || "An unexpected error occurred"}</p>
    <div className="error-fallback__actions">
      <button onClick={retry}>Try Again</button>
      <button onClick={() => window.location.reload()}>Reload Page</button>
    </div>
  </div>
);

export default ErrorBoundary;
