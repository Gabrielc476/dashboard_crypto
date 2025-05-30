// src/components/Dashboard/Dashboard.js
import React, { useState, useCallback, useEffect } from "react";
import {
  Header,
  SearchBar,
  ErrorBoundary,
  LoadingSpinnerOverlay,
} from "../common";
import CoinList from "../CoinList";
import FavoritesList from "../FavoritesList";
import Chart from "../Chart";
import { useCryptoData } from "../../hooks/useCryptoData";
import { useTheme } from "../../hooks/useTheme";
import { useFavorites } from "../../hooks/useFavorites";
import { APP_CONFIG } from "../../utils/constants";
import "./Dashboard.scss";

const Dashboard = () => {
  // State management
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewLayout, setViewLayout] = useState("grid");
  const [chartTimeframe, setChartTimeframe] = useState("24h");

  // Custom hooks
  const { theme } = useTheme();
  const { favoritesCount } = useFavorites();

  const {
    coins,
    isLoading,
    isError,
    error,
    isRefreshing,
    searchResults,
    updateSearchQuery,
    clearSearch,
    sortBy,
    updateSortBy,
    refetch,
    retry,
    statistics,
    lastUpdate,
  } = useCryptoData({
    limit: APP_CONFIG.DEFAULT_COIN_LIMIT,
    currency: APP_CONFIG.DEFAULT_CURRENCY,
    autoRefresh: true,
    enableSearch: true,
    enableSort: true,
  });

  // Handle coin selection
  const handleCoinClick = useCallback((coin) => {
    setSelectedCoin(coin);
    console.log("Selected coin:", coin);

    // Show coin details or navigate to coin page
    // This could open a modal, navigate to a detail page, etc.
  }, []);

  // Handle search
  const handleCoinSearch = useCallback((selectedCoin) => {
    if (selectedCoin) {
      setSelectedCoin(selectedCoin);
      setSearchQuery(selectedCoin.name);
    }
  }, []);

  // Handle favorites toggle
  const handleFavoritesToggle = useCallback(() => {
    setShowFavorites((prev) => !prev);
    setShowMobileMenu(false);
  }, []);

  // Handle mobile menu toggle
  const handleMobileMenuToggle = useCallback(() => {
    setShowMobileMenu((prev) => !prev);
  }, []);

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout) => {
    setViewLayout(newLayout);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback(
    (newSort) => {
      updateSortBy(newSort);
    },
    [updateSortBy]
  );

  // Handle chart timeframe change
  const handleChartTimeframeChange = useCallback((newTimeframe) => {
    setChartTimeframe(newTimeframe);
  }, []);

  // Close favorites on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFavorites && window.innerWidth <= 768) {
        const favoritesElement = document.querySelector(".favorites-list");
        if (favoritesElement && !favoritesElement.contains(event.target)) {
          setShowFavorites(false);
        }
      }
    };

    if (showFavorites) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showFavorites]);

  // Close mobile menu when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowMobileMenu(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        const searchInput = document.querySelector(".search-bar__input");
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Escape to clear search or close modals
      if (event.key === "Escape") {
        if (searchQuery) {
          clearSearch();
          setSearchQuery("");
        } else if (showFavorites) {
          setShowFavorites(false);
        } else if (selectedCoin) {
          setSelectedCoin(null);
        }
      }

      // F to toggle favorites
      if (event.key === "f" && !event.ctrlKey && !event.metaKey) {
        const activeElement = document.activeElement;
        if (
          activeElement.tagName !== "INPUT" &&
          activeElement.tagName !== "TEXTAREA"
        ) {
          handleFavoritesToggle();
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [
    searchQuery,
    showFavorites,
    selectedCoin,
    clearSearch,
    handleFavoritesToggle,
  ]);

  const dashboardClasses = [
    "dashboard",
    `dashboard--${theme}`,
    isLoading ? "dashboard--loading" : "",
    showFavorites ? "dashboard--favorites-open" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <ErrorBoundary>
      <div className={dashboardClasses}>
        {/* Header */}
        <Header
          totalCoins={statistics.totalCoins}
          onFavoritesToggle={handleFavoritesToggle}
          showMobileMenu={showMobileMenu}
          onMobileMenuToggle={handleMobileMenuToggle}
        />

        {/* Main Content */}
        <main className="dashboard__main">
          <div className="dashboard__container">
            {/* Hero Section */}
            <section className="dashboard__hero">
              <div className="hero-content">
                <h1 className="hero-title">
                  Real-time Cryptocurrency Dashboard
                </h1>
                <p className="hero-subtitle">
                  Track prices, manage favorites, and stay updated with the
                  latest crypto market data
                </p>

                {/* Search Bar */}
                <div className="hero-search">
                  <SearchBar
                    onCoinSelect={handleCoinSearch}
                    placeholder="Search cryptocurrencies... (Ctrl+K)"
                    autoFocus={false}
                  />
                </div>

                {/* Market Stats */}
                {statistics && (
                  <div className="market-stats">
                    <div className="stat-item">
                      <span className="stat-value">
                        {statistics.totalCoins}
                      </span>
                      <span className="stat-label">Cryptocurrencies</span>
                    </div>
                    <div className="stat-item stat-item--positive">
                      <span className="stat-value">
                        {statistics.positiveCoins}
                      </span>
                      <span className="stat-label">Gaining</span>
                    </div>
                    <div className="stat-item stat-item--negative">
                      <span className="stat-value">
                        {statistics.negativeCoins}
                      </span>
                      <span className="stat-label">Losing</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{favoritesCount}</span>
                      <span className="stat-label">Favorites</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Selected Coin Chart */}
            {selectedCoin && (
              <section className="dashboard__selected-coin">
                <div className="selected-coin-header">
                  <div className="coin-info">
                    <img
                      src={selectedCoin.image}
                      alt={`${selectedCoin.name} icon`}
                      className="coin-icon"
                    />
                    <div>
                      <h2 className="coin-name">{selectedCoin.name}</h2>
                      <span className="coin-symbol">{selectedCoin.symbol}</span>
                    </div>
                  </div>
                  <button
                    className="close-btn"
                    onClick={() => setSelectedCoin(null)}
                    title="Close chart"
                  >
                    ✕
                  </button>
                </div>

                <Chart
                  coinId={selectedCoin.id}
                  timeframe={chartTimeframe}
                  onTimeframeChange={handleChartTimeframeChange}
                  showTimeframes={true}
                  showTooltip={true}
                  animated={true}
                  height={400}
                />
              </section>
            )}

            {/* Main Coin List */}
            <section className="dashboard__coin-list">
              <div className="section-header">
                <h2>Cryptocurrency Prices</h2>
                {lastUpdate && (
                  <span className="last-update">
                    Last updated: {lastUpdate.toLocaleTimeString()}
                    {isRefreshing && (
                      <span className="refreshing"> • Refreshing...</span>
                    )}
                  </span>
                )}
              </div>

              <CoinList
                coins={coins}
                loading={isLoading}
                error={isError ? error : null}
                onCoinClick={handleCoinClick}
                layout={viewLayout}
                onLayoutChange={handleLayoutChange}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                showChart={true}
                showFavoriteButton={true}
                showDetails={true}
                emptyMessage={
                  searchResults.isEmpty
                    ? `No results found for "${searchResults.query}"`
                    : "No cryptocurrencies available"
                }
                className="dashboard__coin-list-content"
              />

              {/* Retry button for errors */}
              {isError && (
                <div className="dashboard__error-actions">
                  <button className="retry-button" onClick={retry}>
                    Try Again
                  </button>
                  <button className="refresh-button" onClick={refetch}>
                    Refresh Data
                  </button>
                </div>
              )}
            </section>
          </div>
        </main>

        {/* Favorites Sidebar */}
        <FavoritesList
          isOpen={showFavorites}
          onClose={() => setShowFavorites(false)}
          layout="sidebar"
          onCoinClick={handleCoinClick}
          showAsCards={false}
        />

        {/* Loading Overlay */}
        {isLoading && !coins.length && (
          <LoadingSpinnerOverlay text="Loading cryptocurrency data..." />
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="keyboard-shortcuts" title="Keyboard Shortcuts">
          <div className="shortcut-list">
            <div className="shortcut-item">
              <kbd>Ctrl</kbd> + <kbd>K</kbd> Search
            </div>
            <div className="shortcut-item">
              <kbd>F</kbd> Favorites
            </div>
            <div className="shortcut-item">
              <kbd>Esc</kbd> Close/Clear
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
