// src/hooks/useCryptoSearch.js
// Custom hook for cryptocurrency search with real-time suggestions

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { cryptoAPI, APIError } from "../services/api";
import { debounce } from "../utils/helpers";
import {
  APP_CONFIG,
  STATUS,
  ERROR_MESSAGES,
  LIMITS,
  POPULAR_COINS,
} from "../utils/constants";

/**
 * Custom hook for cryptocurrency search with suggestions and history
 * @param {Object} options - Configuration options
 * @returns {Object} Search state and management functions
 */
export function useCryptoSearch(options = {}) {
  const {
    debounceDelay = APP_CONFIG.SEARCH_DEBOUNCE_DELAY,
    maxSuggestions = 10,
    enableHistory = true,
    enablePopularSuggestions = true,
    minQueryLength = LIMITS.SEARCH_MIN_LENGTH,
  } = options;

  // State management
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Refs for cleanup and optimization
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);
  const inputRef = useRef(null);

  // Get search history from localStorage
  const getSearchHistory = useCallback(() => {
    if (!enableHistory) return [];

    try {
      const stored = localStorage.getItem("crypto-search-history");
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn("Error loading search history:", error);
      return [];
    }
  }, [enableHistory]);

  // Save search history to localStorage
  const saveSearchHistory = useCallback(
    (history) => {
      if (!enableHistory) return;

      try {
        localStorage.setItem("crypto-search-history", JSON.stringify(history));
      } catch (error) {
        console.warn("Error saving search history:", error);
      }
    },
    [enableHistory]
  );

  // Initialize search history
  useEffect(() => {
    if (enableHistory) {
      setSearchHistory(getSearchHistory());
    }
  }, [enableHistory, getSearchHistory]);

  // Search function
  const performSearch = useCallback(
    async (searchQuery) => {
      if (!searchQuery || searchQuery.length < minQueryLength) {
        setSuggestions([]);
        setSearchError(null);
        return;
      }

      try {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setIsSearching(true);
        setSearchError(null);

        const results = await cryptoAPI.searchCoins(searchQuery);

        if (!mountedRef.current) return;

        // Limit results and add metadata
        const processedResults = results
          .slice(0, maxSuggestions)
          .map((coin) => ({
            ...coin,
            isPopular: POPULAR_COINS.includes(coin.id),
            searchQuery,
          }));

        setSuggestions(processedResults);
        setSelectedIndex(-1);
      } catch (error) {
        if (!mountedRef.current) return;

        if (error.name !== "AbortError") {
          console.error("Search error:", error);

          let errorMessage = ERROR_MESSAGES.SEARCH_ERROR;
          if (error instanceof APIError && error.status === 429) {
            errorMessage = ERROR_MESSAGES.RATE_LIMIT;
          }

          setSearchError(errorMessage);
          setSuggestions([]);
        }
      } finally {
        if (mountedRef.current) {
          setIsSearching(false);
        }
      }
    },
    [minQueryLength, maxSuggestions]
  );

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce(performSearch, debounceDelay),
    [performSearch, debounceDelay]
  );

  // Update query and trigger search
  const updateQuery = useCallback(
    (newQuery) => {
      setQuery(newQuery);

      if (newQuery.trim() === "") {
        setSuggestions([]);
        setSearchError(null);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      } else {
        setShowSuggestions(true);
        debouncedSearch(newQuery.trim());
      }
    },
    [debouncedSearch]
  );

  // Add to search history
  const addToHistory = useCallback(
    (coin) => {
      if (!enableHistory || !coin) return;

      setSearchHistory((prev) => {
        const filtered = prev.filter((item) => item.id !== coin.id);
        const newHistory = [
          {
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            thumb: coin.thumb,
            searchedAt: new Date().toISOString(),
          },
          ...filtered,
        ].slice(0, 20); // Keep only last 20 searches

        saveSearchHistory(newHistory);
        return newHistory;
      });
    },
    [enableHistory, saveSearchHistory]
  );

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    saveSearchHistory([]);
  }, [saveSearchHistory]);

  // Remove item from history
  const removeFromHistory = useCallback(
    (coinId) => {
      setSearchHistory((prev) => {
        const newHistory = prev.filter((item) => item.id !== coinId);
        saveSearchHistory(newHistory);
        return newHistory;
      });
    },
    [saveSearchHistory]
  );

  // Handle suggestion selection
  const selectSuggestion = useCallback(
    (coin, addToHistoryFlag = true) => {
      if (!coin) return;

      setQuery(coin.name);
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);

      if (addToHistoryFlag) {
        addToHistory(coin);
      }

      return coin;
    },
    [addToHistory]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event) => {
      if (!showSuggestions) return;

      const suggestionCount = suggestions.length;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestionCount - 1 ? prev + 1 : prev
          );
          break;

        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;

        case "Enter":
          event.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            selectSuggestion(suggestions[selectedIndex]);
          }
          break;

        case "Escape":
          setShowSuggestions(false);
          setSelectedIndex(-1);
          if (inputRef.current) {
            inputRef.current.blur();
          }
          break;

        default:
          break;
      }
    },
    [showSuggestions, suggestions, selectedIndex, selectSuggestion]
  );

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery("");
    setSuggestions([]);
    setSearchError(null);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, []);

  // Focus input
  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Hide suggestions
  const hideSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, []);

  // Show suggestions
  const showSuggestionsIfQuery = useCallback(() => {
    if (query.trim().length >= minQueryLength) {
      setShowSuggestions(true);
    }
  }, [query, minQueryLength]);

  // Get popular suggestions for empty query
  const popularSuggestions = useMemo(() => {
    if (!enablePopularSuggestions || query.trim().length > 0) return [];

    return POPULAR_COINS.slice(0, 5).map((coinId) => ({
      id: coinId,
      name: coinId.charAt(0).toUpperCase() + coinId.slice(1).replace(/-/g, " "),
      symbol: coinId.substring(0, 3).toUpperCase(),
      thumb: null,
      isPopular: true,
      isPlaceholder: true,
    }));
  }, [enablePopularSuggestions, query]);

  // Combined suggestions (search results + popular + history)
  const displaySuggestions = useMemo(() => {
    if (query.trim().length === 0) {
      const recentHistory = searchHistory.slice(0, 5);
      return [...recentHistory, ...popularSuggestions];
    }
    return suggestions;
  }, [query, suggestions, searchHistory, popularSuggestions]);

  // Search statistics
  const searchStats = useMemo(
    () => ({
      hasQuery: query.trim().length > 0,
      queryLength: query.trim().length,
      isValidQuery: query.trim().length >= minQueryLength,
      suggestionCount: suggestions.length,
      historyCount: searchHistory.length,
      isSearching,
      hasError: !!searchError,
      hasSuggestions: displaySuggestions.length > 0,
    }),
    [
      query,
      minQueryLength,
      suggestions.length,
      searchHistory.length,
      isSearching,
      searchError,
      displaySuggestions.length,
    ]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Search state
    query,
    suggestions: displaySuggestions,
    searchHistory,
    isSearching,
    searchError,
    selectedIndex,
    showSuggestions,

    // Search actions
    updateQuery,
    clearSearch,
    selectSuggestion,
    handleKeyDown,

    // History management
    addToHistory,
    clearHistory,
    removeFromHistory,

    // UI controls
    focusInput,
    hideSuggestions,
    showSuggestions: showSuggestionsIfQuery,

    // Input ref for external control
    inputRef,

    // Statistics and flags
    stats: searchStats,

    // Configuration
    minQueryLength,
    maxSuggestions,
    enableHistory,
    enablePopularSuggestions,
  };
}

export default useCryptoSearch;
