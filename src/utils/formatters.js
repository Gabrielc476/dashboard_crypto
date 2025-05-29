// src/utils/formatters.js
// Data formatting utilities for the crypto dashboard

import { SUPPORTED_CURRENCIES } from "./constants";

// Number formatting options
const numberFormatOptions = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 8,
};

// Get currency symbol
export function getCurrencySymbol(currency = "usd") {
  const currencyData = SUPPORTED_CURRENCIES.find(
    (c) => c.code === currency.toLowerCase()
  );
  return currencyData ? currencyData.symbol : "$";
}

// Format price with currency
export function formatPrice(price, currency = "usd", options = {}) {
  if (price === null || price === undefined || isNaN(price)) {
    return `${getCurrencySymbol(currency)}0.00`;
  }

  const numPrice = Number(price);

  // Determine appropriate decimal places based on price magnitude
  let maximumFractionDigits;
  if (numPrice >= 1000) {
    maximumFractionDigits = 0;
  } else if (numPrice >= 1) {
    maximumFractionDigits = 2;
  } else if (numPrice >= 0.01) {
    maximumFractionDigits = 4;
  } else {
    maximumFractionDigits = 8;
  }

  const formatOptions = {
    minimumFractionDigits: numPrice >= 1 ? 2 : 0,
    maximumFractionDigits,
    ...options,
  };

  try {
    const formatted = numPrice.toLocaleString("en-US", formatOptions);
    return `${getCurrencySymbol(currency)}${formatted}`;
  } catch (error) {
    console.error("Error formatting price:", error);
    return `${getCurrencySymbol(currency)}${numPrice.toFixed(2)}`;
  }
}

// Format large numbers with abbreviations (K, M, B, T)
export function formatNumber(num, options = {}) {
  if (num === null || num === undefined || isNaN(num)) {
    return "0";
  }

  const numValue = Number(num);
  const absValue = Math.abs(numValue);

  const defaultOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  };

  if (absValue >= 1e12) {
    return (numValue / 1e12).toLocaleString("en-US", defaultOptions) + "T";
  } else if (absValue >= 1e9) {
    return (numValue / 1e9).toLocaleString("en-US", defaultOptions) + "B";
  } else if (absValue >= 1e6) {
    return (numValue / 1e6).toLocaleString("en-US", defaultOptions) + "M";
  } else if (absValue >= 1e3) {
    return (numValue / 1e3).toLocaleString("en-US", defaultOptions) + "K";
  } else {
    return numValue.toLocaleString("en-US", defaultOptions);
  }
}

// Format market cap
export function formatMarketCap(marketCap, currency = "usd") {
  if (!marketCap) return "N/A";

  const symbol = getCurrencySymbol(currency);
  const formattedNumber = formatNumber(marketCap, { maximumFractionDigits: 1 });

  return `${symbol}${formattedNumber}`;
}

// Format volume
export function formatVolume(volume, currency = "usd") {
  return formatMarketCap(volume, currency); // Same formatting as market cap
}

// Format percentage change
export function formatPercentage(percentage, options = {}) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return "0.00%";
  }

  const numPercentage = Number(percentage);
  const defaultOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  try {
    const formatted = numPercentage.toLocaleString("en-US", defaultOptions);
    return `${formatted}%`;
  } catch (error) {
    console.error("Error formatting percentage:", error);
    return `${numPercentage.toFixed(2)}%`;
  }
}

// Format percentage with sign and color class
export function formatPercentageWithSign(percentage) {
  if (percentage === null || percentage === undefined || isNaN(percentage)) {
    return {
      formatted: "0.00%",
      className: "neutral",
      isPositive: null,
    };
  }

  const numPercentage = Number(percentage);
  const isPositive = numPercentage > 0;
  const sign = isPositive ? "+" : "";
  const className = isPositive
    ? "positive"
    : numPercentage < 0
    ? "negative"
    : "neutral";

  return {
    formatted: `${sign}${formatPercentage(numPercentage)}`,
    className,
    isPositive: numPercentage > 0 ? true : numPercentage < 0 ? false : null,
    value: numPercentage,
  };
}

// Format date and time
export function formatDate(date, options = {}) {
  if (!date) return "N/A";

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  try {
    return dateObj.toLocaleDateString("en-US", defaultOptions);
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateObj.toDateString();
  }
}

// Format time ago (relative time)
export function formatTimeAgo(date) {
  if (!date) return "N/A";

  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }
}

// Format supply (circulating, total, max)
export function formatSupply(supply) {
  if (!supply || supply === 0) return "N/A";

  return formatNumber(supply, { maximumFractionDigits: 0 });
}

// Format coin rank
export function formatRank(rank) {
  if (!rank) return "N/A";

  return `#${rank}`;
}

// Format decimal places based on value
export function formatDecimalPlaces(value, customOptions = {}) {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }

  const numValue = Number(value);
  const absValue = Math.abs(numValue);

  let decimals;
  if (absValue >= 1000000) {
    decimals = 0;
  } else if (absValue >= 1000) {
    decimals = 0;
  } else if (absValue >= 100) {
    decimals = 1;
  } else if (absValue >= 1) {
    decimals = 2;
  } else if (absValue >= 0.01) {
    decimals = 4;
  } else if (absValue >= 0.0001) {
    decimals = 6;
  } else {
    decimals = 8;
  }

  const options = {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    ...customOptions,
  };

  return numValue.toLocaleString("en-US", options);
}

// Format search result highlight
export function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm || !text) return text;

  const regex = new RegExp(`(${searchTerm})`, "gi");
  return text.replace(regex, "<mark>$1</mark>");
}

// Truncate text with ellipsis
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;

  return text.slice(0, maxLength).trim() + "...";
}

// Format ATH/ATL dates
export function formatATHDate(date) {
  if (!date) return "N/A";

  const dateObj = new Date(date);
  const now = new Date();
  const diffInDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) {
    return "Today";
  } else if (diffInDays === 1) {
    return "Yesterday";
  } else if (diffInDays < 30) {
    return `${diffInDays} days ago`;
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `${months} month${months === 1 ? "" : "s"} ago`;
  } else {
    const years = Math.floor(diffInDays / 365);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }
}

// Format URL for display
export function formatURL(url) {
  if (!url) return "";

  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

// Format coin name for display
export function formatCoinName(name, symbol) {
  if (!name) return symbol || "Unknown";
  if (!symbol) return name;

  return `${name} (${symbol.toUpperCase()})`;
}

// Utility function to safely format any numeric value
export function safeFormat(value, formatter, fallback = "N/A") {
  try {
    if (value === null || value === undefined) return fallback;
    return formatter(value);
  } catch (error) {
    console.error("Error in safeFormat:", error);
    return fallback;
  }
}

// Export commonly used formatters as default
export default {
  formatPrice,
  formatNumber,
  formatMarketCap,
  formatVolume,
  formatPercentage,
  formatPercentageWithSign,
  formatDate,
  formatTimeAgo,
  formatSupply,
  formatRank,
  formatDecimalPlaces,
  formatATHDate,
  formatCoinName,
  safeFormat,
  getCurrencySymbol,
};
