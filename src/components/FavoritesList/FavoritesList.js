// src/components/FavoritesList/FavoritesList.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useFavorites } from "../../hooks/useFavorites";
import { cryptoAPI } from "../../services/api";
import CoinCard, { CoinCardCompact } from "../CoinCard/CoinCard";
import {
  LoadingSpinner,
  LoadingList,
  ErrorBoundary,
  SimpleErrorFallback,
} from "../common";
import { formatCoinData } from "../../utils/cryptoHelpers";
import "./FavoritesList.scss";

const FavoritesList = ({
  isOpen = false,
  onClose = null,
  layout = "sidebar", // 'sidebar', 'modal', 'inline'
  showAsCards = true,
  onCoinClick = null,
  className = "",
  maxHeight = "80vh",
}) => {
  const {
    favorites,
    favoritesCount,
    removeFavorite,
    clearFavorites,
    reorderFavorites,
    isEmpty,
    isFull,
    maxFavorites,
  } = useFavorites();

  const [favoritesData, setFavoritesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Fetch data for favorite coins
  const fetchFavoritesData = useCallback(async () => {
    if (favorites.length === 0) {
      setFavoritesData([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await cryptoAPI.getCoinsByIds(favorites);
      const formattedData = data.map(formatCoinData);

      // Maintain the order from favorites array
      const orderedData = favorites
        .map((favoriteId) =>
          formattedData.find((coin) => coin.id === favoriteId)
        )
        .filter(Boolean);

      setFavoritesData(orderedData);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Error fetching favorites data:", err);
      setError(err.message || "Failed to load favorites data");
    } finally {
      setLoading(false);
    }
  }, [favorites]);

  // Fetch data when favorites change
  useEffect(() => {
    if (isOpen && favorites.length > 0) {
      fetchFavoritesData();
    } else if (favorites.length === 0) {
      setFavoritesData([]);
    }
  }, [isOpen, favorites.length, fetchFavoritesData]);

  // Auto-refresh favorites data every 30 seconds when open
  useEffect(() => {
    if (!isOpen || favorites.length === 0) return;

    const interval = setInterval(() => {
      fetchFavoritesData();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen, favorites.length, fetchFavoritesData]);

  // Handle coin click
  const handleCoinClick = useCallback(
    (coin) => {
      if (onCoinClick && typeof onCoinClick === "function") {
        onCoinClick(coin);
      }

      // Close sidebar/modal on mobile after selection
      if (window.innerWidth <= 768 && onClose) {
        onClose();
      }
    },
    [onCoinClick, onClose]
  );

  // Handle remove favorite
  const handleRemoveFavorite = useCallback(
    (coinId, event) => {
      event?.stopPropagation();
      removeFavorite(coinId);
    },
    [removeFavorite]
  );

  // Handle clear all favorites
  const handleClearAll = useCallback(() => {
    if (window.confirm(`Remove all ${favoritesCount} favorites?`)) {
      clearFavorites();
    }
  }, [clearFavorites, favoritesCount]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    fetchFavoritesData();
  }, [fetchFavoritesData]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e, dropIndex) => {
      e.preventDefault();

      if (draggedItem !== null && draggedItem !== dropIndex) {
        reorderFavorites(draggedItem, dropIndex);
      }

      setDraggedItem(null);
      setDragOverIndex(null);
    },
    [draggedItem, reorderFavorites]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  // Component class names
  const containerClasses = [
    "favorites-list",
    `favorites-list--${layout}`,
    isOpen ? "favorites-list--open" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Render content
  const renderContent = () => {
    if (loading && favoritesData.length === 0) {
      return (
        <div className="favorites-list__loading">
          <LoadingSpinner size="medium" text="Loading favorites..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="favorites-list__error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <p className="error-message">{error}</p>
            <button className="retry-button" onClick={handleRefresh}>
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (isEmpty) {
      return (
        <div className="favorites-list__empty">
          <div className="empty-content">
            <span className="empty-icon">⭐</span>
            <h3>No Favorites Yet</h3>
            <p>
              Add cryptocurrencies to your favorites by clicking the heart icon
              on any coin card.
            </p>
            <div className="empty-tips">
              <h4>Quick Tips:</h4>
              <ul>
                <li>📌 Pin your most watched coins</li>
                <li>🔄 Favorites sync across devices</li>
                <li>📊 Get quick access to price updates</li>
                <li>🎯 Maximum {maxFavorites} favorites allowed</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="favorites-list__content">
        {showAsCards ? (
          <div className="favorites-grid">
            {favoritesData.map((coin, index) => (
              <ErrorBoundary key={coin.id} fallback={SimpleErrorFallback}>
                <div
                  className={`favorite-item ${
                    dragOverIndex === index ? "favorite-item--drag-over" : ""
                  }`}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <CoinCardCompact
                    coin={coin}
                    onClick={handleCoinClick}
                    showChart={false}
                    showFavoriteButton={true}
                  />
                  <div className="drag-handle" title="Drag to reorder">
                    ⋮⋮
                  </div>
                </div>
              </ErrorBoundary>
            ))}
          </div>
        ) : (
          <div className="favorites-table">
            {favoritesData.map((coin, index) => (
              <ErrorBoundary key={coin.id} fallback={SimpleErrorFallback}>
                <div
                  className={`favorite-row ${
                    dragOverIndex === index ? "favorite-row--drag-over" : ""
                  }`}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleCoinClick(coin)}
                >
                  <div className="coin-info">
                    <img
                      src={coin.image}
                      alt={`${coin.name} icon`}
                      className="coin-icon"
                      loading="lazy"
                    />
                    <div className="coin-details">
                      <span className="coin-name">{coin.name}</span>
                      <span className="coin-symbol">{coin.symbol}</span>
                    </div>
                  </div>

                  <div className="coin-price">
                    <span className="price">
                      ${coin.current_price?.toLocaleString()}
                    </span>
                    <span
                      className={`change ${
                        coin.price_change_percentage_24h > 0
                          ? "change--positive"
                          : coin.price_change_percentage_24h < 0
                          ? "change--negative"
                          : ""
                      }`}
                    >
                      {coin.price_change_percentage_24h > 0 ? "+" : ""}
                      {coin.price_change_percentage_24h?.toFixed(2)}%
                    </span>
                  </div>

                  <div className="coin-actions">
                    <button
                      className="remove-btn"
                      onClick={(e) => handleRemoveFavorite(coin.id, e)}
                      title="Remove from favorites"
                      aria-label={`Remove ${coin.name} from favorites`}
                    >
                      ✕
                    </button>
                    <div className="drag-handle" title="Drag to reorder">
                      ⋮⋮
                    </div>
                  </div>
                </div>
              </ErrorBoundary>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (layout === "inline") {
    return <div className={containerClasses}>{renderContent()}</div>;
  }

  // Render overlay for modal/sidebar
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {layout === "modal" && (
        <div className="favorites-list__backdrop" onClick={onClose} />
      )}

      {/* Main Container */}
      <div className={containerClasses} style={{ maxHeight }}>
        {/* Header */}
        <div className="favorites-list__header">
          <div className="header-info">
            <h2 className="title">
              ⭐ Favorites
              <span className="count">({favoritesCount})</span>
            </h2>
            {lastUpdate && (
              <span className="last-update">
                Updated {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>

          <div className="header-actions">
            {favoritesCount > 0 && (
              <>
                <button
                  className="refresh-btn"
                  onClick={handleRefresh}
                  disabled={loading}
                  title="Refresh data"
                >
                  {loading ? "⟳" : "↻"}
                </button>

                <button
                  className="clear-btn"
                  onClick={handleClearAll}
                  title="Clear all favorites"
                >
                  🗑️
                </button>
              </>
            )}

            {onClose && (
              <button
                className="close-btn"
                onClick={onClose}
                title="Close favorites"
                aria-label="Close favorites"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="favorites-list__body">{renderContent()}</div>

        {/* Footer */}
        {!isEmpty && (
          <div className="favorites-list__footer">
            <div className="footer-info">
              <span className="capacity">
                {favoritesCount} / {maxFavorites} favorites
              </span>
              {isFull && (
                <span className="capacity-warning">
                  Maximum favorites reached
                </span>
              )}
            </div>

            <div className="footer-tip">
              💡 Drag items to reorder your favorites
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// Favorites summary component for compact display
export const FavoritesSummary = ({ onToggle, className = "" }) => {
  const { favoritesCount, favorites } = useFavorites();

  if (favoritesCount === 0) return null;

  return (
    <button
      className={`favorites-summary ${className}`}
      onClick={onToggle}
      title={`View ${favoritesCount} favorites`}
    >
      <span className="icon">⭐</span>
      <span className="count">{favoritesCount}</span>
      <span className="label">Favorites</span>
    </button>
  );
};

// Favorites dropdown for quick access
export const FavoritesDropdown = ({
  onCoinClick,
  maxItems = 5,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`favorites-dropdown ${className}`}>
      <FavoritesSummary onToggle={() => setIsOpen(!isOpen)} />

      {isOpen && (
        <FavoritesList
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          layout="modal"
          onCoinClick={(coin) => {
            onCoinClick?.(coin);
            setIsOpen(false);
          }}
          showAsCards={false}
          maxHeight="400px"
        />
      )}
    </div>
  );
};

export default FavoritesList;
