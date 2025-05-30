// src/components/CoinList/CoinList.js
import React, { useState, useMemo, useCallback } from "react";
import CoinCard, {
  CoinCardSkeleton,
  CoinCardCompact,
} from "../CoinCard/CoinCard";
import { LoadingSpinner, ErrorBoundary, SimpleErrorFallback } from "../common";
import { sortCoins } from "../../utils/cryptoHelpers";
import { SORT_OPTIONS } from "../../utils/constants";
import "./CoinList.scss";

const CoinList = ({
  coins = [],
  loading = false,
  error = null,
  onCoinClick = null,
  layout = "grid", // 'grid', 'list', 'table'
  showSortOptions = true,
  showViewToggle = true,
  sortBy = "market_cap_desc",
  onSortChange = null,
  showChart = true,
  showFavoriteButton = true,
  showDetails = true,
  emptyMessage = "No cryptocurrencies found",
  loadingItemsCount = 8,
  className = "",
  itemsPerPage = null,
  showPagination = false,
}) => {
  const [currentLayout, setCurrentLayout] = useState(layout);
  const [currentSort, setCurrentSort] = useState(sortBy);
  const [currentPage, setCurrentPage] = useState(1);

  // Handle sort change
  const handleSortChange = useCallback(
    (newSort) => {
      setCurrentSort(newSort);
      setCurrentPage(1); // Reset to first page when sorting

      if (onSortChange && typeof onSortChange === "function") {
        onSortChange(newSort);
      }
    },
    [onSortChange]
  );

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout) => {
    setCurrentLayout(newLayout);
    setCurrentPage(1); // Reset to first page when changing layout
  }, []);

  // Sort coins
  const sortedCoins = useMemo(() => {
    if (!Array.isArray(coins)) return [];
    return sortCoins(coins, currentSort);
  }, [coins, currentSort]);

  // Paginate coins if pagination is enabled
  const paginatedCoins = useMemo(() => {
    if (!itemsPerPage || !showPagination) return sortedCoins;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedCoins.slice(startIndex, endIndex);
  }, [sortedCoins, currentPage, itemsPerPage, showPagination]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    if (!itemsPerPage || !showPagination) return null;

    const totalPages = Math.ceil(sortedCoins.length / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, sortedCoins.length);

    return {
      currentPage,
      totalPages,
      totalItems: sortedCoins.length,
      startItem,
      endItem,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [sortedCoins.length, currentPage, itemsPerPage, showPagination]);

  // Handle coin click
  const handleCoinClick = useCallback(
    (coin) => {
      if (onCoinClick && typeof onCoinClick === "function") {
        onCoinClick(coin);
      }
    },
    [onCoinClick]
  );

  // Render loading state
  if (loading) {
    return (
      <div className={`coin-list coin-list--loading ${className}`}>
        {showSortOptions && (
          <div className="coin-list__header">
            <div className="coin-list__sort">
              <div
                className="loading-pulse"
                style={{ width: "150px", height: "36px" }}
              ></div>
            </div>
            {showViewToggle && (
              <div className="coin-list__view-toggle">
                <div
                  className="loading-pulse"
                  style={{ width: "100px", height: "36px" }}
                ></div>
              </div>
            )}
          </div>
        )}

        <div
          className={`coin-list__content coin-list__content--${currentLayout}`}
        >
          {Array.from({ length: loadingItemsCount }, (_, index) => (
            <CoinCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`coin-list coin-list--error ${className}`}>
        <div className="coin-list__error">
          <div className="error-icon">⚠️</div>
          <h3>Failed to load cryptocurrencies</h3>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!sortedCoins.length) {
    return (
      <div className={`coin-list coin-list--empty ${className}`}>
        <div className="coin-list__empty">
          <div className="empty-icon">🔍</div>
          <h3>No Results Found</h3>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  const containerClasses = [
    "coin-list",
    `coin-list--${currentLayout}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      {/* Header with sort and view options */}
      {(showSortOptions || showViewToggle) && (
        <div className="coin-list__header">
          <div className="coin-list__info">
            <span className="coin-count">
              {showPagination && paginationInfo
                ? `${paginationInfo.startItem}-${paginationInfo.endItem} of ${paginationInfo.totalItems}`
                : `${sortedCoins.length} cryptocurrencies`}
            </span>
          </div>

          <div className="coin-list__controls">
            {/* Sort Options */}
            {showSortOptions && (
              <div className="coin-list__sort">
                <label htmlFor="sort-select" className="sort-label">
                  Sort by:
                </label>
                <select
                  id="sort-select"
                  value={currentSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="sort-select"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* View Toggle */}
            {showViewToggle && (
              <div className="coin-list__view-toggle">
                <button
                  className={`view-btn ${
                    currentLayout === "grid" ? "view-btn--active" : ""
                  }`}
                  onClick={() => handleLayoutChange("grid")}
                  title="Grid view"
                  aria-label="Grid view"
                >
                  ⊞
                </button>
                <button
                  className={`view-btn ${
                    currentLayout === "list" ? "view-btn--active" : ""
                  }`}
                  onClick={() => handleLayoutChange("list")}
                  title="List view"
                  aria-label="List view"
                >
                  ☰
                </button>
                <button
                  className={`view-btn ${
                    currentLayout === "table" ? "view-btn--active" : ""
                  }`}
                  onClick={() => handleLayoutChange("table")}
                  title="Table view"
                  aria-label="Table view"
                >
                  ⊟
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coins Content */}
      <div
        className={`coin-list__content coin-list__content--${currentLayout}`}
      >
        {currentLayout === "table" ? (
          <CoinTable
            coins={paginatedCoins}
            onCoinClick={handleCoinClick}
            showFavoriteButton={showFavoriteButton}
          />
        ) : (
          <ErrorBoundary fallback={SimpleErrorFallback}>
            {paginatedCoins.map((coin) => (
              <ErrorBoundary key={coin.id} fallback={SimpleErrorFallback}>
                {currentLayout === "list" ? (
                  <CoinCardCompact
                    coin={coin}
                    onClick={handleCoinClick}
                    showChart={false}
                    showDetails={false}
                    showFavoriteButton={showFavoriteButton}
                  />
                ) : (
                  <CoinCard
                    coin={coin}
                    onClick={handleCoinClick}
                    showChart={showChart}
                    showDetails={showDetails}
                    showFavoriteButton={showFavoriteButton}
                    size={currentLayout === "grid" ? "medium" : "small"}
                  />
                )}
              </ErrorBoundary>
            ))}
          </ErrorBoundary>
        )}
      </div>

      {/* Pagination */}
      {showPagination && paginationInfo && paginationInfo.totalPages > 1 && (
        <Pagination
          currentPage={paginationInfo.currentPage}
          totalPages={paginationInfo.totalPages}
          onPageChange={setCurrentPage}
          hasNextPage={paginationInfo.hasNextPage}
          hasPrevPage={paginationInfo.hasPrevPage}
        />
      )}
    </div>
  );
};

// Table component for tabular layout
const CoinTable = ({ coins, onCoinClick, showFavoriteButton }) => {
  const { addFavorite, removeFavorite, isFavorite } =
    require("../../hooks/useFavorites").useFavorites();

  const handleFavoriteToggle = (e, coinId) => {
    e.stopPropagation();

    if (isFavorite(coinId)) {
      removeFavorite(coinId);
    } else {
      addFavorite(coinId);
    }
  };

  return (
    <div className="coin-table-container">
      <table className="coin-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Price</th>
            <th>24h %</th>
            <th>Market Cap</th>
            <th>Volume (24h)</th>
            {showFavoriteButton && <th>Favorite</th>}
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => (
            <tr
              key={coin.id}
              onClick={() => onCoinClick && onCoinClick(coin)}
              className="coin-table__row"
            >
              <td className="coin-table__rank">
                {coin.market_cap_rank || "-"}
              </td>
              <td className="coin-table__name">
                <div className="coin-info">
                  <img
                    src={coin.image}
                    alt={`${coin.name} icon`}
                    className="coin-icon"
                    width={24}
                    height={24}
                  />
                  <div>
                    <div className="name">{coin.name}</div>
                    <div className="symbol">{coin.symbol}</div>
                  </div>
                </div>
              </td>
              <td className="coin-table__price">
                ${coin.current_price?.toLocaleString() || "-"}
              </td>
              <td
                className={`coin-table__change ${
                  coin.price_change_percentage_24h > 0
                    ? "coin-table__change--positive"
                    : coin.price_change_percentage_24h < 0
                    ? "coin-table__change--negative"
                    : ""
                }`}
              >
                {coin.price_change_percentage_24h
                  ? `${
                      coin.price_change_percentage_24h > 0 ? "+" : ""
                    }${coin.price_change_percentage_24h.toFixed(2)}%`
                  : "-"}
              </td>
              <td className="coin-table__market-cap">
                ${coin.market_cap?.toLocaleString() || "-"}
              </td>
              <td className="coin-table__volume">
                ${coin.total_volume?.toLocaleString() || "-"}
              </td>
              {showFavoriteButton && (
                <td className="coin-table__favorite">
                  <button
                    className={`favorite-btn ${
                      isFavorite(coin.id) ? "favorite-btn--active" : ""
                    }`}
                    onClick={(e) => handleFavoriteToggle(e, coin.id)}
                    title={
                      isFavorite(coin.id)
                        ? "Remove from favorites"
                        : "Add to favorites"
                    }
                  >
                    {isFavorite(coin.id) ? "♥" : "♡"}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Pagination component
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPrevPage,
}) => {
  const pages = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  return (
    <div className="pagination">
      <button
        className="pagination__btn pagination__btn--prev"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevPage}
      >
        ← Previous
      </button>

      <div className="pagination__pages">
        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {page === "..." ? (
              <span className="pagination__dots">...</span>
            ) : (
              <button
                className={`pagination__page ${
                  page === currentPage ? "pagination__page--active" : ""
                }`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      <button
        className="pagination__btn pagination__btn--next"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
      >
        Next →
      </button>
    </div>
  );
};

export default CoinList;
