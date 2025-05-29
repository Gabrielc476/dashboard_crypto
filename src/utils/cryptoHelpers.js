// src/utils/cryptoHelpers.js
// Cryptocurrency specific utility functions

import { CHART_CONFIG, POPULAR_COINS } from "./constants";
import { formatPercentageWithSign, formatPrice } from "./formatters";

// Generate mock price history for charts
export function generateMockPriceHistory(
  currentPrice,
  hours = 24,
  volatility = 0.05
) {
  const data = [];
  let price = currentPrice * (1 - volatility / 2);
  const timeStep = (24 / hours) * 60 * 60 * 1000; // milliseconds per data point
  const now = Date.now();

  for (let i = 0; i < hours; i++) {
    // Create more realistic price movement
    const trend = Math.sin((i / hours) * Math.PI * 2) * 0.3; // Gradual trend
    const randomWalk = (Math.random() - 0.5) * volatility * currentPrice;
    const meanReversion = (currentPrice - price) * 0.1; // Pull towards current price

    price += trend + randomWalk + meanReversion;

    // Ensure price doesn't go negative or too far from current price
    price = Math.max(price, currentPrice * 0.3);
    price = Math.min(price, currentPrice * 1.7);

    data.push({
      timestamp: now - (hours - i) * timeStep,
      price: Number(price.toFixed(8)),
      volume: Math.random() * 1000000 + 500000, // Random volume
    });
  }

  // Ensure the last price is close to the current price
  data[data.length - 1].price = currentPrice;

  return data;
}

// Calculate price change between two values
export function calculatePriceChange(currentPrice, previousPrice) {
  if (!currentPrice || !previousPrice || previousPrice === 0) {
    return { absolute: 0, percentage: 0 };
  }

  const absolute = currentPrice - previousPrice;
  const percentage = (absolute / previousPrice) * 100;

  return {
    absolute: Number(absolute.toFixed(8)),
    percentage: Number(percentage.toFixed(2)),
  };
}

// Determine trend direction
export function getTrendDirection(percentage) {
  if (percentage > 0) return "up";
  if (percentage < 0) return "down";
  return "neutral";
}

// Get trend color based on percentage
export function getTrendColor(percentage) {
  if (percentage > 0) return CHART_CONFIG.COLORS.POSITIVE;
  if (percentage < 0) return CHART_CONFIG.COLORS.NEGATIVE;
  return CHART_CONFIG.COLORS.NEUTRAL;
}

// Get trend icon based on percentage
export function getTrendIcon(percentage) {
  if (percentage > 0) return "▲";
  if (percentage < 0) return "▼";
  return "●";
}

// Calculate market dominance
export function calculateMarketDominance(coinMarketCap, totalMarketCap) {
  if (!coinMarketCap || !totalMarketCap || totalMarketCap === 0) {
    return 0;
  }

  return Number(((coinMarketCap / totalMarketCap) * 100).toFixed(2));
}

// Calculate portfolio allocation
export function calculatePortfolioAllocation(holdings) {
  if (!Array.isArray(holdings) || holdings.length === 0) {
    return [];
  }

  const totalValue = holdings.reduce((sum, holding) => {
    return sum + holding.amount * holding.price;
  }, 0);

  return holdings.map((holding) => {
    const value = holding.amount * holding.price;
    const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

    return {
      ...holding,
      value,
      percentage: Number(percentage.toFixed(2)),
    };
  });
}

// Sort coins by various criteria
export function sortCoins(coins, sortBy = "market_cap_desc") {
  if (!Array.isArray(coins)) return [];

  const [field, direction] = sortBy.split("_");
  const isAscending = direction === "asc";

  return [...coins].sort((a, b) => {
    let aValue, bValue;

    switch (field) {
      case "market":
        aValue = a.market_cap || 0;
        bValue = b.market_cap || 0;
        break;
      case "price":
        aValue = a.current_price || 0;
        bValue = b.current_price || 0;
        break;
      case "volume":
        aValue = a.total_volume || 0;
        bValue = b.total_volume || 0;
        break;
      case "change":
        aValue = a.price_change_percentage_24h || 0;
        bValue = b.price_change_percentage_24h || 0;
        break;
      case "name":
        aValue = a.name || "";
        bValue = b.name || "";
        return isAscending
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      default:
        aValue = a.market_cap_rank || Infinity;
        bValue = b.market_cap_rank || Infinity;
    }

    if (isAscending) {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });
}

// Filter coins based on search query
export function filterCoins(coins, searchQuery) {
  if (!searchQuery || !Array.isArray(coins)) {
    return coins;
  }

  const query = searchQuery.toLowerCase().trim();

  return coins.filter((coin) => {
    const name = coin.name?.toLowerCase() || "";
    const symbol = coin.symbol?.toLowerCase() || "";
    const id = coin.id?.toLowerCase() || "";

    return name.includes(query) || symbol.includes(query) || id.includes(query);
  });
}

// Check if coin is popular/trending
export function isPopularCoin(coinId) {
  return POPULAR_COINS.includes(coinId);
}

// Calculate support and resistance levels
export function calculateSupportResistance(priceHistory) {
  if (!Array.isArray(priceHistory) || priceHistory.length < 10) {
    return { support: null, resistance: null };
  }

  const prices = priceHistory.map((point) => point.price);
  const sortedPrices = [...prices].sort((a, b) => a - b);

  // Simple calculation - take 20th and 80th percentiles
  const support = sortedPrices[Math.floor(sortedPrices.length * 0.2)];
  const resistance = sortedPrices[Math.floor(sortedPrices.length * 0.8)];

  return {
    support: Number(support.toFixed(8)),
    resistance: Number(resistance.toFixed(8)),
  };
}

// Calculate moving averages
export function calculateMovingAverage(priceHistory, period = 7) {
  if (!Array.isArray(priceHistory) || priceHistory.length < period) {
    return [];
  }

  const movingAverages = [];

  for (let i = period - 1; i < priceHistory.length; i++) {
    const slice = priceHistory.slice(i - period + 1, i + 1);
    const average = slice.reduce((sum, point) => sum + point.price, 0) / period;

    movingAverages.push({
      timestamp: priceHistory[i].timestamp,
      value: Number(average.toFixed(8)),
    });
  }

  return movingAverages;
}

// Calculate volatility
export function calculateVolatility(priceHistory) {
  if (!Array.isArray(priceHistory) || priceHistory.length < 2) {
    return 0;
  }

  const returns = [];

  for (let i = 1; i < priceHistory.length; i++) {
    const currentPrice = priceHistory[i].price;
    const previousPrice = priceHistory[i - 1].price;

    if (previousPrice > 0) {
      const returnRate = (currentPrice - previousPrice) / previousPrice;
      returns.push(returnRate);
    }
  }

  if (returns.length === 0) return 0;

  // Calculate standard deviation
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * 100; // Convert to percentage

  return Number(volatility.toFixed(2));
}

// Generate chart data for different timeframes
export function generateChartData(priceHistory, timeframe = "24h") {
  if (!Array.isArray(priceHistory)) return [];

  let dataPoints;
  switch (timeframe) {
    case "1h":
      dataPoints = priceHistory.slice(-12); // Last 12 points for 1 hour
      break;
    case "24h":
      dataPoints = priceHistory; // All points for 24 hours
      break;
    case "7d":
      // Sample every 7th point for weekly view
      dataPoints = priceHistory.filter((_, index) => index % 7 === 0);
      break;
    default:
      dataPoints = priceHistory;
  }

  return dataPoints.map((point) => ({
    x: new Date(point.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    y: point.price,
  }));
}

// Calculate fear and greed index (simplified)
export function calculateFearGreedIndex(coins) {
  if (!Array.isArray(coins) || coins.length === 0) {
    return { value: 50, label: "Neutral" };
  }

  // Simple calculation based on average 24h change
  const totalChange = coins.reduce((sum, coin) => {
    return sum + (coin.price_change_percentage_24h || 0);
  }, 0);

  const avgChange = totalChange / coins.length;

  // Convert to 0-100 scale
  let value = 50 + avgChange * 2; // Multiply by 2 to amplify the effect
  value = Math.max(0, Math.min(100, value)); // Clamp between 0-100

  let label;
  if (value <= 20) label = "Extreme Fear";
  else if (value <= 40) label = "Fear";
  else if (value <= 60) label = "Neutral";
  else if (value <= 80) label = "Greed";
  else label = "Extreme Greed";

  return {
    value: Number(value.toFixed(0)),
    label,
  };
}

// Format coin data for display
export function formatCoinData(coin) {
  if (!coin) return null;

  const priceChange = formatPercentageWithSign(
    coin.price_change_percentage_24h
  );

  return {
    ...coin,
    formattedPrice: formatPrice(coin.current_price),
    formattedMarketCap: formatPrice(coin.market_cap),
    formattedVolume: formatPrice(coin.total_volume),
    priceChange,
    trendDirection: getTrendDirection(coin.price_change_percentage_24h),
    trendColor: getTrendColor(coin.price_change_percentage_24h),
    trendIcon: getTrendIcon(coin.price_change_percentage_24h),
    isPopular: isPopularCoin(coin.id),
  };
}

// Validate coin data
export function validateCoinData(coin) {
  const errors = [];

  if (!coin.id) errors.push("Missing coin ID");
  if (!coin.name) errors.push("Missing coin name");
  if (!coin.symbol) errors.push("Missing coin symbol");
  if (typeof coin.current_price !== "number")
    errors.push("Invalid current price");
  if (typeof coin.market_cap !== "number") errors.push("Invalid market cap");

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Create coin comparison
export function compareCoins(coin1, coin2) {
  if (!coin1 || !coin2) return null;

  return {
    price: {
      coin1: coin1.current_price,
      coin2: coin2.current_price,
      ratio: coin1.current_price / coin2.current_price,
      higher:
        coin1.current_price > coin2.current_price ? coin1.symbol : coin2.symbol,
    },
    marketCap: {
      coin1: coin1.market_cap,
      coin2: coin2.market_cap,
      ratio: coin1.market_cap / coin2.market_cap,
      higher: coin1.market_cap > coin2.market_cap ? coin1.symbol : coin2.symbol,
    },
    change24h: {
      coin1: coin1.price_change_percentage_24h,
      coin2: coin2.price_change_percentage_24h,
      difference:
        coin1.price_change_percentage_24h - coin2.price_change_percentage_24h,
      better:
        coin1.price_change_percentage_24h > coin2.price_change_percentage_24h
          ? coin1.symbol
          : coin2.symbol,
    },
  };
}

// Export commonly used functions as default
export default {
  generateMockPriceHistory,
  calculatePriceChange,
  getTrendDirection,
  getTrendColor,
  getTrendIcon,
  sortCoins,
  filterCoins,
  formatCoinData,
  calculateFearGreedIndex,
  generateChartData,
  isPopularCoin,
};
