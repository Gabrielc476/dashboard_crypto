// src/components/index.js
// Central export file for all components

// Common components
export * from "./common";

// Main components
export {
  default as CoinCard,
  CoinCardSkeleton,
  CoinCardCompact,
  CoinCardLarge,
} from "./CoinCard";

export { default as CoinList } from "./CoinList";

export { default as Chart, SimpleChart, VolumeChart } from "./Chart";

export {
  default as FavoritesList,
  FavoritesSummary,
  FavoritesDropdown,
} from "./FavoritesList";

export { default as Dashboard } from "./Dashboard";

/**
 * Usage examples:
 *
 * // Import main components
 * import { CoinCard, CoinList, Chart, Dashboard } from 'components';
 *
 * // Import common components
 * import { Header, SearchBar, LoadingSpinner } from 'components';
 *
 * // Import specific variants
 * import { CoinCardCompact, SimpleChart } from 'components';
 *
 * // Import with custom names
 * import { CoinList as CryptoList } from 'components';
 */
