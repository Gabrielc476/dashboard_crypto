// src/services/api.js
// CoinGecko API Service for Crypto Dashboard

const BASE_URL = "https://api.coingecko.com/api/v3";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const REQUEST_DELAY = 1000; // 1 second between requests to respect rate limits

// Cache implementation
class APICache {
  constructor() {
    this.cache = new Map();
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new APICache();

// Rate limiting
let lastRequestTime = 0;

async function throttledRequest(url) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < REQUEST_DELAY) {
    await new Promise((resolve) =>
      setTimeout(resolve, REQUEST_DELAY - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  return fetch(url);
}

// API Error handling
class APIError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

async function apiRequest(endpoint, options = {}) {
  const cacheKey = `${endpoint}${JSON.stringify(options)}`;

  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await throttledRequest(url);

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limit hit - return mock data
        console.warn("Rate limit hit, returning mock data");
        return getMockData(endpoint);
      }

      throw new APIError(
        `API request failed: ${response.statusText}`,
        response.status,
        endpoint
      );
    }

    const data = await response.json();

    // Cache successful response
    cache.set(cacheKey, data);

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network error - return mock data
    console.warn("Network error, returning mock data:", error.message);
    return getMockData(endpoint);
  }
}

// Main API functions
export const cryptoAPI = {
  // Get top cryptocurrencies
  async getTopCoins(limit = 10, currency = "usd") {
    try {
      const endpoint = `/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h,7d`;

      const data = await apiRequest(endpoint);

      return data.map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        image: coin.image,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        price_change_percentage_1h_in_currency:
          coin.price_change_percentage_1h_in_currency,
        price_change_percentage_7d_in_currency:
          coin.price_change_percentage_7d_in_currency,
        total_volume: coin.total_volume,
        last_updated: coin.last_updated,
      }));
    } catch (error) {
      console.error("Error fetching top coins:", error);
      throw error;
    }
  },

  // Search coins
  async searchCoins(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const endpoint = `/search?query=${encodeURIComponent(query)}`;
      const data = await apiRequest(endpoint);

      return data.coins.slice(0, 10).map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        thumb: coin.thumb,
        market_cap_rank: coin.market_cap_rank,
      }));
    } catch (error) {
      console.error("Error searching coins:", error);
      return getMockSearchResults(query);
    }
  },

  // Get coin details
  async getCoinDetails(coinId) {
    try {
      const endpoint = `/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;

      const data = await apiRequest(endpoint);

      return {
        id: data.id,
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        image: data.image.large,
        description: data.description.en,
        market_cap_rank: data.market_cap_rank,
        current_price: data.market_data.current_price.usd,
        market_cap: data.market_data.market_cap.usd,
        total_volume: data.market_data.total_volume.usd,
        price_change_24h: data.market_data.price_change_24h,
        price_change_percentage_24h:
          data.market_data.price_change_percentage_24h,
        price_change_percentage_7d: data.market_data.price_change_percentage_7d,
        price_change_percentage_30d:
          data.market_data.price_change_percentage_30d,
        circulating_supply: data.market_data.circulating_supply,
        total_supply: data.market_data.total_supply,
        max_supply: data.market_data.max_supply,
        ath: data.market_data.ath.usd,
        ath_date: data.market_data.ath_date.usd,
        atl: data.market_data.atl.usd,
        atl_date: data.market_data.atl_date.usd,
        last_updated: data.last_updated,
      };
    } catch (error) {
      console.error("Error fetching coin details:", error);
      throw error;
    }
  },

  // Get multiple coins by IDs
  async getCoinsByIds(coinIds, currency = "usd") {
    if (!coinIds || coinIds.length === 0) {
      return [];
    }

    try {
      const ids = coinIds.join(",");
      const endpoint = `/coins/markets?vs_currency=${currency}&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d`;

      return await apiRequest(endpoint);
    } catch (error) {
      console.error("Error fetching coins by IDs:", error);
      return getMockCoinsByIds(coinIds);
    }
  },

  // Get trending coins
  async getTrendingCoins() {
    try {
      const endpoint = "/search/trending";
      const data = await apiRequest(endpoint);

      return data.coins.map((item) => ({
        id: item.item.id,
        name: item.item.name,
        symbol: item.item.symbol.toUpperCase(),
        thumb: item.item.thumb,
        market_cap_rank: item.item.market_cap_rank,
        price_btc: item.item.price_btc,
      }));
    } catch (error) {
      console.error("Error fetching trending coins:", error);
      return getMockTrendingCoins();
    }
  },

  // Clear cache
  clearCache() {
    cache.clear();
  },
};

// Mock data functions for development and fallback
function getMockData(endpoint) {
  if (endpoint.includes("/coins/markets")) {
    return getMockTopCoins();
  } else if (endpoint.includes("/search")) {
    return { coins: getMockSearchResults() };
  } else if (endpoint.includes("/search/trending")) {
    return { coins: getMockTrendingCoins().map((coin) => ({ item: coin })) };
  }

  return [];
}

function getMockTopCoins() {
  return [
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "btc",
      image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
      current_price: 43250.0,
      market_cap: 845123456789,
      market_cap_rank: 1,
      price_change_percentage_24h: 2.45,
      price_change_percentage_1h_in_currency: 0.23,
      price_change_percentage_7d_in_currency: -1.34,
      total_volume: 23456789123,
      last_updated: new Date().toISOString(),
    },
    {
      id: "ethereum",
      name: "Ethereum",
      symbol: "eth",
      image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
      current_price: 2650.0,
      market_cap: 318456789123,
      market_cap_rank: 2,
      price_change_percentage_24h: -1.23,
      price_change_percentage_1h_in_currency: -0.45,
      price_change_percentage_7d_in_currency: 3.21,
      total_volume: 15678912345,
      last_updated: new Date().toISOString(),
    },
    {
      id: "binancecoin",
      name: "BNB",
      symbol: "bnb",
      image:
        "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
      current_price: 315.5,
      market_cap: 48567123456,
      market_cap_rank: 3,
      price_change_percentage_24h: 0.87,
      price_change_percentage_1h_in_currency: 0.12,
      price_change_percentage_7d_in_currency: -2.45,
      total_volume: 987654321,
      last_updated: new Date().toISOString(),
    },
    {
      id: "solana",
      name: "Solana",
      symbol: "sol",
      image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
      current_price: 98.75,
      market_cap: 42345678912,
      market_cap_rank: 4,
      price_change_percentage_24h: 4.32,
      price_change_percentage_1h_in_currency: 1.23,
      price_change_percentage_7d_in_currency: 8.76,
      total_volume: 2345678912,
      last_updated: new Date().toISOString(),
    },
    {
      id: "ripple",
      name: "XRP",
      symbol: "xrp",
      image:
        "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
      current_price: 0.62,
      market_cap: 33456789123,
      market_cap_rank: 5,
      price_change_percentage_24h: -2.14,
      price_change_percentage_1h_in_currency: -0.34,
      price_change_percentage_7d_in_currency: 1.87,
      total_volume: 1234567891,
      last_updated: new Date().toISOString(),
    },
    {
      id: "cardano",
      name: "Cardano",
      symbol: "ada",
      image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
      current_price: 0.45,
      market_cap: 15678912345,
      market_cap_rank: 6,
      price_change_percentage_24h: 1.65,
      price_change_percentage_1h_in_currency: 0.78,
      price_change_percentage_7d_in_currency: -0.92,
      total_volume: 567891234,
      last_updated: new Date().toISOString(),
    },
    {
      id: "dogecoin",
      name: "Dogecoin",
      symbol: "doge",
      image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
      current_price: 0.089,
      market_cap: 12345678912,
      market_cap_rank: 7,
      price_change_percentage_24h: 5.43,
      price_change_percentage_1h_in_currency: 2.34,
      price_change_percentage_7d_in_currency: 12.67,
      total_volume: 891234567,
      last_updated: new Date().toISOString(),
    },
    {
      id: "avalanche-2",
      name: "Avalanche",
      symbol: "avax",
      image:
        "https://assets.coingecko.com/coins/images/12559/large/avalanche-symbol-128.png",
      current_price: 36.78,
      market_cap: 13567891234,
      market_cap_rank: 8,
      price_change_percentage_24h: -0.56,
      price_change_percentage_1h_in_currency: -0.23,
      price_change_percentage_7d_in_currency: 2.34,
      total_volume: 456789123,
      last_updated: new Date().toISOString(),
    },
    {
      id: "polkadot",
      name: "Polkadot",
      symbol: "dot",
      image:
        "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
      current_price: 7.23,
      market_cap: 9876543210,
      market_cap_rank: 9,
      price_change_percentage_24h: 3.21,
      price_change_percentage_1h_in_currency: 1.45,
      price_change_percentage_7d_in_currency: -1.23,
      total_volume: 234567891,
      last_updated: new Date().toISOString(),
    },
    {
      id: "chainlink",
      name: "Chainlink",
      symbol: "link",
      image:
        "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
      current_price: 14.56,
      market_cap: 8567891234,
      market_cap_rank: 10,
      price_change_percentage_24h: -1.87,
      price_change_percentage_1h_in_currency: -0.67,
      price_change_percentage_7d_in_currency: 4.32,
      total_volume: 345678912,
      last_updated: new Date().toISOString(),
    },
  ];
}

function getMockSearchResults(query = "") {
  const allCoins = [
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      thumb: "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
      market_cap_rank: 1,
    },
    {
      id: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      thumb: "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png",
      market_cap_rank: 2,
    },
    {
      id: "binancecoin",
      name: "BNB",
      symbol: "BNB",
      thumb:
        "https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png",
      market_cap_rank: 3,
    },
    {
      id: "solana",
      name: "Solana",
      symbol: "SOL",
      thumb: "https://assets.coingecko.com/coins/images/4128/thumb/solana.png",
      market_cap_rank: 4,
    },
    {
      id: "ripple",
      name: "XRP",
      symbol: "XRP",
      thumb:
        "https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png",
      market_cap_rank: 5,
    },
  ];

  if (!query) return allCoins;

  return allCoins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(query.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(query.toLowerCase())
  );
}

function getMockTrendingCoins() {
  return [
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      thumb: "https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png",
      market_cap_rank: 1,
      price_btc: 1,
    },
    {
      id: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      thumb: "https://assets.coingecko.com/coins/images/279/thumb/ethereum.png",
      market_cap_rank: 2,
      price_btc: 0.0613,
    },
    {
      id: "solana",
      name: "Solana",
      symbol: "SOL",
      thumb: "https://assets.coingecko.com/coins/images/4128/thumb/solana.png",
      market_cap_rank: 4,
      price_btc: 0.00228,
    },
  ];
}

function getMockCoinsByIds(coinIds) {
  const mockCoins = getMockTopCoins();
  return mockCoins.filter((coin) => coinIds.includes(coin.id));
}

// Utility function to generate mock price history
export function generateMockPriceHistory(
  currentPrice,
  hours = 24,
  volatility = 0.05
) {
  const data = [];
  let price = currentPrice * (1 - volatility);

  for (let i = 0; i < hours; i++) {
    // Add some realistic price movement
    const change = (Math.random() - 0.5) * 2 * volatility * price;
    price += change;

    // Ensure price doesn't go negative
    price = Math.max(price, currentPrice * 0.5);

    data.push({
      timestamp: Date.now() - (hours - i) * 60 * 60 * 1000,
      price: Number(price.toFixed(6)),
    });
  }

  // Ensure last price is close to current price
  data[data.length - 1].price = currentPrice;

  return data;
}

// Export default
export default cryptoAPI;
