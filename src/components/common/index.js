// src/components/common/index.js
// Central export file for all common components

// Header components
export { default as Header } from "./Header";

// SearchBar components
export { default as SearchBar } from "./SearchBar";

// LoadingSpinner components
export {
  default as LoadingSpinner,
  LoadingSpinnerSmall,
  LoadingSpinnerLarge,
  LoadingSpinnerOverlay,
  LoadingPulse,
  LoadingCard,
  LoadingList,
} from "./LoadingSpinner";

// PriceIndicator components
export {
  default as PriceIndicator,
  PriceChangeBadge,
  PriceDisplay,
  TrendArrow,
  PriceComparison,
} from "./PriceIndicator";

// ErrorBoundary components
export {
  default as ErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
  SimpleErrorFallback,
  MinimalErrorFallback,
  DetailedErrorFallback,
} from "./ErrorBoundary";

/**
 * Usage examples:
 *
 * // Import individual components
 * import { Header, SearchBar } from 'components/common';
 *
 * // Import specific variants
 * import { LoadingSpinnerLarge, PriceChangeBadge } from 'components/common';
 *
 * // Import with aliases
 * import { Header as AppHeader } from 'components/common';
 *
 * // Error boundary usage
 * import { ErrorBoundary, withErrorBoundary } from 'components/common';
 *
 * // Wrap components with error boundary
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   fallback: SimpleErrorFallback,
 *   onError: (error, errorInfo) => console.log(error)
 * });
 */
