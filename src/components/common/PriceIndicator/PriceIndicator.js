// src/components/common/PriceIndicator/PriceIndicator.js
import React from "react";
import {
  formatPrice,
  formatPercentageWithSign,
} from "../../../utils/formatters";
import { getTrendIcon, getTrendDirection } from "../../../utils/cryptoHelpers";
import "./PriceIndicator.scss";

const PriceIndicator = ({
  price,
  change24h,
  currency = "usd",
  size = "medium",
  showIcon = true,
  showSign = true,
  className = "",
  onClick = null,
  animated = true,
}) => {
  const formattedPrice = formatPrice(price, currency);
  const changeData = formatPercentageWithSign(change24h);
  const trendDirection = getTrendDirection(change24h);
  const trendIcon = getTrendIcon(change24h);

  const containerClasses = [
    "price-indicator",
    `price-indicator--${size}`,
    `price-indicator--${trendDirection}`,
    animated ? "price-indicator--animated" : "",
    onClick ? "price-indicator--clickable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = () => {
    if (onClick && typeof onClick === "function") {
      onClick({ price, change24h, trendDirection });
    }
  };

  return (
    <div
      className={containerClasses}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="price-indicator__price">{formattedPrice}</div>

      {change24h !== null && change24h !== undefined && (
        <div
          className={`price-indicator__change price-indicator__change--${changeData.className}`}
        >
          {showIcon && (
            <span className="price-indicator__icon" aria-hidden="true">
              {trendIcon}
            </span>
          )}
          <span className="price-indicator__percentage">
            {showSign
              ? changeData.formatted
              : Math.abs(change24h).toFixed(2) + "%"}
          </span>
        </div>
      )}
    </div>
  );
};

// Price change badge component
export const PriceChangeBadge = ({
  change,
  size = "small",
  showIcon = true,
  className = "",
}) => {
  if (change === null || change === undefined) {
    return null;
  }

  const changeData = formatPercentageWithSign(change);
  const trendDirection = getTrendDirection(change);
  const trendIcon = getTrendIcon(change);

  const badgeClasses = [
    "price-change-badge",
    `price-change-badge--${size}`,
    `price-change-badge--${trendDirection}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={badgeClasses}>
      {showIcon && (
        <span className="price-change-badge__icon" aria-hidden="true">
          {trendIcon}
        </span>
      )}
      <span className="price-change-badge__text">{changeData.formatted}</span>
    </span>
  );
};

// Simple price display component
export const PriceDisplay = ({
  price,
  currency = "usd",
  size = "medium",
  className = "",
}) => {
  const formattedPrice = formatPrice(price, currency);

  const priceClasses = ["price-display", `price-display--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={priceClasses}>{formattedPrice}</span>;
};

// Trend arrow component
export const TrendArrow = ({ change, size = "medium", className = "" }) => {
  if (change === null || change === undefined || change === 0) {
    return null;
  }

  const trendDirection = getTrendDirection(change);
  const trendIcon = getTrendIcon(change);

  const arrowClasses = [
    "trend-arrow",
    `trend-arrow--${size}`,
    `trend-arrow--${trendDirection}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={arrowClasses}
      title={`${change > 0 ? "Increase" : "Decrease"}: ${Math.abs(
        change
      ).toFixed(2)}%`}
      aria-label={`Price ${
        change > 0 ? "increased" : "decreased"
      } by ${Math.abs(change).toFixed(2)} percent`}
    >
      {trendIcon}
    </span>
  );
};

// Price comparison component
export const PriceComparison = ({
  currentPrice,
  previousPrice,
  currency = "usd",
  showDifference = true,
  className = "",
}) => {
  if (!currentPrice || !previousPrice) {
    return <PriceDisplay price={currentPrice} currency={currency} />;
  }

  const difference = currentPrice - previousPrice;
  const percentageChange = (difference / previousPrice) * 100;

  return (
    <div className={`price-comparison ${className}`}>
      <PriceDisplay price={currentPrice} currency={currency} />
      {showDifference && (
        <div className="price-comparison__change">
          <PriceChangeBadge change={percentageChange} />
          <span className="price-comparison__difference">
            ({difference > 0 ? "+" : ""}
            {formatPrice(Math.abs(difference), currency)})
          </span>
        </div>
      )}
    </div>
  );
};

export default PriceIndicator;
