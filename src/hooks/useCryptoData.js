// src/hooks/useCryptoData.js
// Custom hook for managing cryptocurrency data

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { cryptoAPI, APIError } from "../services/api";
import { formatCoinData, filterCoins, sortCoins } from "../utils/cryptoHelpers";
import { debounce } from "../utils/helpers";
import {
  APP_CONFIG,
  STATUS,
  ERROR_MESSAGES,
  LOADING_STATES,
  SORT_OPTIONS,
} from "../utils/constants";

/**
 * Custom hook for managing cryptocurrency data with auto-refresh and filtering
 * @param {Object} options - Configuration options
 * @returns {Object} Crypto data state and management functions
 */
export function useCryptoData(options = {}) {
  const {
    limit = APP_CONFIG.DEFAULT_COIN_LIMIT,
    currency = APP_CONFIG.DEFAULT_CURRENCY,
    autoRefresh = true,
    refreshInterval = APP_CONFIG.AUTO_REFRESH_INTERVAL,
    enableSearch = true,
    enableSort = true,
    enableTrending = false,
  } = options;

  // State management
  const [coins, setCoins] = useState([]);
  const [filteredCoins, setFilteredCoins] = useState([]);
  const [trendingCoins, setTrendingCoins] = useState([]);
  const [globalData, setGlobalData] = useState(null);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("market_cap_desc");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refs for cleanup and optimization
  const refreshTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);

  // Loading states
  const isLoading = status === STATUS.LOADING;
  const isError = status === STATUS.ERROR;
  const isSuccess = status === STATUS.SUCCESS;
  const isIdle = status === STATUS.IDLE;

  // Error handling helper
  const handleError = useCallback((error, context = "unknown") => {
    console.error(`Error in useCryptoData (${context}):`, error);

    let errorMessage = ERROR_MESSAGES.GENERIC_ERROR;

    if (error instanceof APIError) {
      switch (error.status) {
        case 429:
          errorMessage = ERROR_MESSAGES.RATE_LIMIT;
          break;
        case 404:
          errorMessage = "Cryptocurrency data not found";
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = "Server temporarily unavailable";
          break;
        default:
          errorMessage = error.message || ERROR_MESSAGES.API_ERROR;
      }
    } else if (error.name === "AbortError") {
      errorMessage = "Request was cancelled";
    } else if (error.message?.includes("fetch")) {
      errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
    }

    if (mountedRef.current) {
      setError(errorMessage);
      setStatus(STATUS.ERROR);
    }
  }, []);

  // Fetch top cryptocurrencies
  const fetchCoins = useCallback(
    async (isRefresh = false) => {
      try {
        // Cancel previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        if (!isRefresh) {
          setStatus(STATUS.LOADING);
          setError(null);
        } else {
          setIsRefreshing(true);
        }

        const data = await cryptoAPI.getTopCoins(limit, currency);

        if (!mountedRef.current) return;

        // Format coin data with additional metadata
        const formattedCoins = data.map(formatCoinData);

        setCoins(formattedCoins);
        setStatus(STATUS.SUCCESS);
        setError(null);
        setLastUpdate(new Date());

        console.log(`Fetched ${formattedCoins.length} coins successfully`);
      } catch (error) {
        if (!mountedRef.current) return;

        if (error.name !== "AbortError") {
          handleError(error, "fetchCoins");
        }
      } finally {
        if (mountedRef.current) {
          setIsRefreshing(false);
        }
      }
    },
    [limit, currency, handleError]
  );

  // Fetch trending cryptocurrencies
  const fetchTrendingCoins = useCallback(async () => {
    if (!enableTrending) return;

    try {
      const data = await cryptoAPI.getTrendingCoins();

      if (mountedRef.current) {
        setTrendingCoins(data);
        console.log(`Fetched ${data.length} trending coins`);
      }
    } catch (error) {
      if (mountedRef.current) {
        console.warn("Failed to fetch trending coins:", error);
        // Don't set main error state for trending coins failure
      }
    }
  }, [enableTrending]);

  // Fetch global market data
  const fetchGlobalData = useCallback(async () => {
    try {
      const data = await cryptoAPI.getGlobalData();

      if (mountedRef.current) {
        setGlobalData(data);
        console.log("Fetched global market data");
      }
    } catch (error) {
      if (mountedRef.current) {
        console.warn("Failed to fetch global data:", error);
        // Don't set main error state for global data failure
      }
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((query) => {
        if (!enableSearch) return;

        const filtered = filterCoins(coins, query);
        const sorted = enableSort ? sortCoins(filtered, sortBy) : filtered;
        setFilteredCoins(sorted);
      }, APP_CONFIG.SEARCH_DEBOUNCE_DELAY),
    [coins, sortBy, enableSearch, enableSort]
  );

  // Update search query and trigger filtering
  const updateSearchQuery = useCallback(
    (query) => {
      setSearchQuery(query);
      debouncedSearch(query);
    },
    [debouncedSearch]
  );

  // Update sort option and reapply sorting
  const updateSortBy = useCallback(
    (newSortBy) => {
      if (!enableSort) return;

      setSortBy(newSortBy);
      const filtered = enableSearch ? filterCoins(coins, searchQuery) : coins;
      const sorted = sortCoins(filtered, newSortBy);
      setFilteredCoins(sorted);
    },
    [coins, searchQuery, enableSearch, enableSort]
  );

  // Manual refresh function
  const refetch = useCallback(() => {
    return fetchCoins(true);
  }, [fetchCoins]);

  // Retry function for error recovery
  const retry = useCallback(() => {
    setError(null);
    return fetchCoins(false);
  }, [fetchCoins]);

  // Clear search and reset filters
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    const sorted = enableSort ? sortCoins(coins, sortBy) : coins;
    setFilteredCoins(sorted);
  }, [coins, sortBy, enableSort]);

  // Get coin by ID
  const getCoinById = useCallback(
    (coinId) => {
      return coins.find((coin) => coin.id === coinId) || null;
    },
    [coins]
  );

  // Check API health
  const checkAPIHealth = useCallback(async () => {
    try {
      const health = await cryptoAPI.healthCheck();
      console.log("API Health:", health);
      return health;
    } catch (error) {
      console.error("API Health check failed:", error);
      return { status: "unhealthy", error: error.message };
    }
  }, []);

  // Setup auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const setupRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current && status === STATUS.SUCCESS) {
          fetchCoins(true);
        }
        setupRefresh();
      }, refreshInterval);
    };

    setupRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, status, fetchCoins]);

  // Initial data fetch
  useEffect(() => {
    fetchCoins(false);

    if (enableTrending) {
      fetchTrendingCoins();
    }

    fetchGlobalData();
  }, [fetchCoins, fetchTrendingCoins, fetchGlobalData, enableTrending]);

  // Update filtered coins when coins or sort changes
  useEffect(() => {
    const filtered = enableSearch ? filterCoins(coins, searchQuery) : coins;
    const sorted = enableSort ? sortCoins(filtered, sortBy) : filtered;
    setFilteredCoins(sorted);
  }, [coins, searchQuery, sortBy, enableSearch, enableSort]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Computed values
  const statistics = useMemo(() => {
    const totalCoins = coins.length;
    const positiveCoins = coins.filter(
      (coin) => (coin.price_change_percentage_24h || 0) > 0
    ).length;
    const negativeCoins = coins.filter(
      (coin) => (coin.price_change_percentage_24h || 0) < 0
    ).length;

    const totalMarketCap = coins.reduce(
      (sum, coin) => sum + (coin.market_cap || 0),
      0
    );

    const totalVolume = coins.reduce(
      (sum, coin) => sum + (coin.total_volume || 0),
      0
    );

    const averageChange =
      totalCoins > 0
        ? coins.reduce(
            (sum, coin) => sum + (coin.price_change_percentage_24h || 0),
            0
          ) / totalCoins
        : 0;

    return {
      totalCoins,
      positiveCoins,
      negativeCoins,
      neutralCoins: totalCoins - positiveCoins - negativeCoins,
      totalMarketCap,
      totalVolume,
      averageChange,
      positivePercentage:
        totalCoins > 0 ? (positiveCoins / totalCoins) * 100 : 0,
      negativePercentage:
        totalCoins > 0 ? (negativeCoins / totalCoins) * 100 : 0,
    };
  }, [coins]);

  const searchResults = useMemo(() => {
    return {
      query: searchQuery,
      resultCount: filteredCoins.length,
      totalCount: coins.length,
      hasResults: filteredCoins.length > 0,
      isEmpty: searchQuery.length > 0 && filteredCoins.length === 0,
    };
  }, [searchQuery, filteredCoins.length, coins.length]);

  return {
    // Data
    coins: filteredCoins,
    allCoins: coins,
    trendingCoins,
    globalData,

    // State
    status,
    isLoading,
    isError,
    isSuccess,
    isIdle,
    isRefreshing,
    error,
    lastUpdate,

    // Search & Filter
    searchQuery,
    updateSearchQuery,
    clearSearch,
    searchResults,

    // Sorting
    sortBy,
    updateSortBy,
    sortOptions: SORT_OPTIONS,

    // Actions
    refetch,
    retry,
    getCoinById,
    checkAPIHealth,

    // Statistics
    statistics,

    // Configuration
    limit,
    currency,
    autoRefresh,
    refreshInterval,

    // Loading messages
    loadingMessage: isLoading
      ? LOADING_STATES.INITIAL
      : isRefreshing
      ? LOADING_STATES.REFRESHING
      : null,
  };
}

export default useCryptoData;
