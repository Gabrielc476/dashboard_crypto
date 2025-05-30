// src/components/CoinCard/CoinCard.js
import React, { useState, useCallback } from "react";
import { useFavorites } from "../../hooks/useFavorites";
import { PriceIndicator, TrendArrow } from "../common";
import {
  formatMarketCap,
  formatVolume,
  formatRank,
} from "../../utils/formatters";
import { generateMockPriceHistory } from "../../utils/cryptoHelpers";
import "./CoinCard.scss";

const CoinCard = ({
  coin,
  onClick = null,
  showChart = true,
  showFavoriteButton = true,
  showDetails = true,
  size = "medium",
  className = "",
  animated = true,
}) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Check if coin is favorited
  const isInFavorites = isFavorite(coin?.id);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(
    (e) => {
      e.stopPropagation(); // Prevent card click

      if (!coin?.id) return;

      if (isInFavorites) {
        removeFavorite(coin.id);
      } else {
        addFavorite(coin.id);
      }
    },
    [coin?.id, isInFavorites, addFavorite, removeFavorite]
  );

  // Handle card click
  const handleCardClick = useCallback(() => {
    if (onClick && typeof onClick === "function") {
      onClick(coin);
    }
  }, [onClick, coin]);

  // Handle image error
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  // Generate mock chart data for visualization
  const chartData = coin?.current_price
    ? generateMockPriceHistory(coin.current_price, 24, 0.03)
    : [];

  if (!coin) {
    return <CoinCardSkeleton className={className} />;
  }

  const cardClasses = [
    "coin-card",
    `coin-card--${size}`,
    onClick ? "coin-card--clickable" : "",
    animated ? "coin-card--animated" : "",
    isHovered ? "coin-card--hovered" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={cardClasses}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Card Header */}
      <div className="coin-card__header">
        <div className="coin-info">
          {/* Coin Icon */}
          <div className="coin-icon-container">
            {!imageError && coin.image ? (
              <img
                src={coin.image}
                alt={`${coin.name} icon`}
                className="coin-icon"
                onError={handleImageError}
                loading="lazy"
              />
            ) : (
              <div className="coin-icon coin-icon--placeholder">
                {coin.symbol?.charAt(0) || "?"}
              </div>
            )}

            {/* Rank Badge */}
            {coin.market_cap_rank && (
              <span className="coin-rank">
                {formatRank(coin.market_cap_rank)}
              </span>
            )}
          </div>

          {/* Coin Details */}
          <div className="coin-details">
            <h3 className="coin-name" title={coin.name}>
              {coin.name}
              {coin.isPopular && <span className="popular-badge">🔥</span>}
            </h3>
            <span className="coin-symbol">{coin.symbol}</span>
          </div>
        </div>

        {/* Favorite Button */}
        {showFavoriteButton && (
          <button
            className={`favorite-btn ${
              isInFavorites ? "favorite-btn--active" : ""
            }`}
            onClick={handleFavoriteToggle}
            title={isInFavorites ? "Remove from favorites" : "Add to favorites"}
            aria-label={`${isInFavorites ? "Remove" : "Add"} ${coin.name} ${
              isInFavorites ? "from" : "to"
            } favorites`}
          >
            {isInFavorites ? "♥" : "♡"}
          </button>
        )}
      </div>

      {/* Price Section */}
      <div className="coin-card__price">
        <PriceIndicator
          price={coin.current_price}
          change24h={coin.price_change_percentage_24h}
          size={size === "large" ? "large" : "medium"}
          animated={animated}
        />
      </div>

      {/* Additional Details */}
      {showDetails && (
        <div className="coin-card__details">
          {coin.market_cap && (
            <div className="detail-item">
              <span className="detail-label">Market Cap</span>
              <span className="detail-value">
                {formatMarketCap(coin.market_cap)}
              </span>
            </div>
          )}

          {coin.total_volume && (
            <div className="detail-item">
              <span className="detail-label">Volume (24h)</span>
              <span className="detail-value">
                {formatVolume(coin.total_volume)}
              </span>
            </div>
          )}

          {coin.high_24h && coin.low_24h && (
            <div className="detail-item">
              <span className="detail-label">24h Range</span>
              <div className="price-range">
                <span className="range-low">
                  ${coin.low_24h.toLocaleString()}
                </span>
                <span className="range-separator">-</span>
                <span className="range-high">
                  ${coin.high_24h.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mini Chart */}
      {showChart && chartData.length > 0 && (
        <div className="coin-card__chart">
          <MiniChart
            data={chartData}
            trend={coin.price_change_percentage_24h > 0 ? "up" : "down"}
            animated={animated && isHovered}
          />
        </div>
      )}

      {/* Trend Arrow */}
      <div className="coin-card__trend">
        <TrendArrow change={coin.price_change_percentage_24h} size="large" />
      </div>

      {/* Loading Overlay */}
      {coin.isLoading && (
        <div className="coin-card__loading-overlay">
          <div className="loading-spinner loading-spinner--small">
            <div className="loading-spinner__circle">
              <div className="loading-spinner__circle-inner"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mini Chart Component for the card
const MiniChart = ({ data, trend, animated }) => {
  if (!data || data.length === 0) return null;

  const maxPrice = Math.max(...data.map((d) => d.price));
  const minPrice = Math.min(...data.map((d) => d.price));
  const priceRange = maxPrice - minPrice;

  const points = data
    .map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y =
        priceRange > 0 ? (1 - (point.price - minPrice) / priceRange) * 100 : 50;
      return `${x},${y}`;
    })
    .join(" ");

  const trendColor =
    trend === "up" ? "var(--primary-green)" : "var(--primary-red)";

  return (
    <div className="mini-chart">
      <svg
        width="100%"
        height="60"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className={`mini-chart__svg ${
          animated ? "mini-chart__svg--animated" : ""
        }`}
      >
        {/* Gradient Definition */}
        <defs>
          <linearGradient
            id={`gradient-${trend}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area Fill */}
        <polygon
          fill={`url(#gradient-${trend})`}
          points={`0,100 ${points} 100,100`}
          className="mini-chart__area"
        />

        {/* Price Line */}
        <polyline
          fill="none"
          stroke={trendColor}
          strokeWidth="2"
          points={points}
          className="mini-chart__line"
        />
      </svg>
    </div>
  );
};

// Loading skeleton for coin card
export const CoinCardSkeleton = ({ className = "" }) => (
  <div className={`coin-card coin-card--loading ${className}`}>
    <div className="coin-card__header">
      <div className="coin-info">
        <div className="coin-icon-container">
          <div className="coin-icon loading-pulse"></div>
        </div>
        <div className="coin-details">
          <div className="coin-name loading-pulse"></div>
          <div className="coin-symbol loading-pulse"></div>
        </div>
      </div>
      <div className="favorite-btn loading-pulse"></div>
    </div>

    <div className="coin-card__price">
      <div
        className="loading-pulse"
        style={{ width: "120px", height: "24px", marginBottom: "8px" }}
      ></div>
      <div
        className="loading-pulse"
        style={{ width: "80px", height: "16px" }}
      ></div>
    </div>

    <div className="coin-card__details">
      <div className="detail-item">
        <div
          className="loading-pulse"
          style={{ width: "60px", height: "12px" }}
        ></div>
        <div
          className="loading-pulse"
          style={{ width: "80px", height: "12px" }}
        ></div>
      </div>
      <div className="detail-item">
        <div
          className="loading-pulse"
          style={{ width: "70px", height: "12px" }}
        ></div>
        <div
          className="loading-pulse"
          style={{ width: "70px", height: "12px" }}
        ></div>
      </div>
    </div>

    <div className="coin-card__chart loading-pulse"></div>
  </div>
);

// Compact variant for list views
export const CoinCardCompact = (props) => (
  <CoinCard
    {...props}
    size="small"
    showChart={false}
    showDetails={false}
    className={`coin-card--compact ${props.className || ""}`}
  />
);

// Large variant for featured/detailed views
export const CoinCardLarge = (props) => (
  <CoinCard
    {...props}
    size="large"
    showChart={true}
    showDetails={true}
    className={`coin-card--large ${props.className || ""}`}
  />
);

export default CoinCard;
