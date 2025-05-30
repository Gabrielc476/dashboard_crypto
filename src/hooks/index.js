// src/hooks/index.js
// Central export file for all custom hooks

export { useLocalStorage } from "./useLocalStorage";
export { useFavorites } from "./useFavorites";
export { useCryptoData } from "./useCryptoData";
export { useTheme } from "./useTheme";
export { useCryptoSearch } from "./useCryptoSearch";

// Default exports for convenience
export { default as useLocalStorageDefault } from "./useLocalStorage";
export { default as useFavoritesDefault } from "./useFavorites";
export { default as useCryptoDataDefault } from "./useCryptoData";
export { default as useThemeDefault } from "./useTheme";
export { default as useCryptoSearchDefault } from "./useCryptoSearch";

/**
 * Hook usage guide and examples:
 *
 * // Basic crypto data management
 * const { coins, isLoading, refetch } = useCryptoData();
 *
 * // Favorites management
 * const { favorites, addFavorite, isFavorite } = useFavorites();
 *
 * // Search functionality
 * const { query, suggestions, updateQuery } = useCryptoSearch();
 *
 * // Theme management
 * const { theme, toggleTheme, isDarkMode } = useTheme();
 *
 * // localStorage utility
 * const [settings, setSettings] = useLocalStorage('app-settings', {});
 */
