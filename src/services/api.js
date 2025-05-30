// src/services/api.js
// CoinGecko API Service - Real Data Only

// API Configuration for Production Use
const API_CONFIG = {
  BASE_URL: "https://api.coingecko.com/api/v3",
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  TIMEOUT: 15000, // 15 seconds for better reliability
  MAX_RETRIES: 3,
  RATE_LIMIT_PER_MINUTE: 50, // CoinGecko free plan limit
  REQUEST_DELAY: 1200, // Slightly more conservative delay
};

// Error Messages
const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  API_ERROR: "Unable to fetch cryptocurrency data. Please try again later.",
  RATE_LIMIT: "Too many requests. Please wait a moment and try again.",
  SEARCH_ERROR: "Search failed. Please try again.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
  INVALID_COIN_ID: "Invalid cryptocurrency ID provided.",
  NO_DATA_AVAILABLE: "No data available for the requested cryptocurrency.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
};

// Cache implementation for better performance
class APICache {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
  }

  set(key, data, customDuration = API_CONFIG.CACHE_DURATION) {
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now() + customDuration);
  }

  get(key) {
    const data = this.cache.get(key);
    const expiry = this.cacheTimestamps.get(key);

    if (!data || !expiry) return null;

    if (Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }

    return data;
  }

  clear() {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  has(key) {
    return this.get(key) !== null;
  }

  size() {
    return this.cache.size;
  }
}

// Global cache instance
const cache = new APICache();

// Rate limiting to respect API limits
class RateLimiter {
  constructor(requestsPerMinute = 50) {
    this.requests = [];
    this.maxRequests = requestsPerMinute;
  }

  async waitIfNeeded() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old requests
    this.requests = this.requests.filter((time) => time > oneMinuteAgo);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = oldestRequest + 60000 - now;

      if (waitTime > 0) {
        console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter();

// Custom API Error class
class APIError extends Error {
  constructor(message, status, endpoint, originalError = null) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.endpoint = endpoint;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      endpoint: this.endpoint,
      timestamp: this.timestamp,
    };
  }
}

// Retry utility with exponential backoff
async function withRetry(fn, maxRetries = API_CONFIG.MAX_RETRIES) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error;
      }

      if (attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s...
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(
        `Request failed (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Main HTTP request function
async function makeRequest(endpoint, options = {}) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const cacheKey = `${endpoint}_${JSON.stringify(options)}`;

  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    console.log(`Cache hit for: ${endpoint}`);
    return cachedData;
  }

  // Rate limiting
  await rateLimiter.waitIfNeeded();

  const requestOptions = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "CryptoDashboard/1.0",
      ...options.headers,
    },
    signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
    ...options,
  };

  console.log(`Making API request to: ${endpoint}`);

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    let errorMessage = ERROR_MESSAGES.API_ERROR;

    switch (response.status) {
      case 429:
        errorMessage = ERROR_MESSAGES.RATE_LIMIT;
        break;
      case 404:
        errorMessage = `Resource not found: ${endpoint}`;
        break;
      case 500:
      case 502:
      case 503:
        errorMessage = "Server error. Please try again later.";
        break;
      default:
        errorMessage = `API request failed: ${response.statusText}`;
    }

    throw new APIError(errorMessage, response.status, endpoint);
  }

  const data = await response.json();

  // Cache successful response
  cache.set(cacheKey, data);
  console.log(`Cached response for: ${endpoint}`);

  return data;
}

// API service object
export const cryptoAPI = {
  /**
   * Get top cryptocurrencies by market cap
   * @param {number} limit - Number of coins to fetch (default: 10)
   * @param {string} currency - Currency for prices (default: 'usd')
   * @param {string} order - Sort order (default: 'market_cap_desc')
   * @returns {Promise<Array>} Array of coin data
   */
  async getTopCoins(limit = 10, currency = "usd", order = "market_cap_desc") {
    const endpoint = `/coins/markets?vs_currency=${currency}&order=${order}&per_page=${limit}&page=1&sparkline=false&price_change_percentage=1h,24h,7d,30d`;

    const data = await withRetry(() => makeRequest(endpoint));

    return data.map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol?.toUpperCase() || "",
      image: coin.image,
      current_price: coin.current_price,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      fully_diluted_valuation: coin.fully_diluted_valuation,
      total_volume: coin.total_volume,
      high_24h: coin.high_24h,
      low_24h: coin.low_24h,
      price_change_24h: coin.price_change_24h,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      price_change_percentage_1h_in_currency:
        coin.price_change_percentage_1h_in_currency,
      price_change_percentage_7d_in_currency:
        coin.price_change_percentage_7d_in_currency,
      price_change_percentage_30d_in_currency:
        coin.price_change_percentage_30d_in_currency,
      market_cap_change_24h: coin.market_cap_change_24h,
      market_cap_change_percentage_24h: coin.market_cap_change_percentage_24h,
      circulating_supply: coin.circulating_supply,
      total_supply: coin.total_supply,
      max_supply: coin.max_supply,
      ath: coin.ath,
      ath_change_percentage: coin.ath_change_percentage,
      ath_date: coin.ath_date,
      atl: coin.atl,
      atl_change_percentage: coin.atl_change_percentage,
      atl_date: coin.atl_date,
      roi: coin.roi,
      last_updated: coin.last_updated,
    }));
  },

  /**
   * Search for cryptocurrencies
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of search results
   */
  async searchCoins(query) {
    if (!query || query.length < 2) {
      throw new APIError(
        "Search query must be at least 2 characters long",
        400,
        "/search"
      );
    }

    const endpoint = `/search?query=${encodeURIComponent(query.trim())}`;
    const data = await withRetry(() => makeRequest(endpoint));

    return (
      data.coins?.slice(0, 10).map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol?.toUpperCase() || "",
        thumb: coin.thumb,
        large: coin.large,
        market_cap_rank: coin.market_cap_rank,
      })) || []
    );
  },

  /**
   * Get detailed information for a specific coin
   * @param {string} coinId - Coin ID
   * @param {boolean} includeMarketData - Include market data (default: true)
   * @returns {Promise<Object>} Detailed coin information
   */
  async getCoinDetails(coinId, includeMarketData = true) {
    if (!coinId) {
      throw new APIError("Coin ID is required", 400, "/coins/[id]");
    }

    const marketDataParam = includeMarketData ? "true" : "false";
    const endpoint = `/coins/${coinId}?localization=false&tickers=false&market_data=${marketDataParam}&community_data=false&developer_data=false&sparkline=false`;

    const data = await withRetry(() => makeRequest(endpoint));

    const result = {
      id: data.id,
      symbol: data.symbol?.toUpperCase() || "",
      name: data.name,
      asset_platform_id: data.asset_platform_id,
      platforms: data.platforms,
      description: {
        en: data.description?.en || "",
      },
      links: {
        homepage: data.links?.homepage?.filter((link) => link) || [],
        blockchain_site:
          data.links?.blockchain_site?.filter((link) => link) || [],
        official_forum_url:
          data.links?.official_forum_url?.filter((link) => link) || [],
        chat_url: data.links?.chat_url?.filter((link) => link) || [],
        announcement_url:
          data.links?.announcement_url?.filter((link) => link) || [],
        twitter_screen_name: data.links?.twitter_screen_name || "",
        facebook_username: data.links?.facebook_username || "",
        telegram_channel_identifier:
          data.links?.telegram_channel_identifier || "",
        subreddit_url: data.links?.subreddit_url || "",
        repos_url: {
          github: data.links?.repos_url?.github?.filter((link) => link) || [],
          bitbucket:
            data.links?.repos_url?.bitbucket?.filter((link) => link) || [],
        },
      },
      image: {
        thumb: data.image?.thumb || "",
        small: data.image?.small || "",
        large: data.image?.large || "",
      },
      country_origin: data.country_origin || "",
      genesis_date: data.genesis_date,
      sentiment_votes_up_percentage: data.sentiment_votes_up_percentage,
      sentiment_votes_down_percentage: data.sentiment_votes_down_percentage,
      market_cap_rank: data.market_cap_rank,
      coingecko_rank: data.coingecko_rank,
      coingecko_score: data.coingecko_score,
      developer_score: data.developer_score,
      community_score: data.community_score,
      liquidity_score: data.liquidity_score,
      public_interest_score: data.public_interest_score,
      last_updated: data.last_updated,
      categories: data.categories || [],
    };

    if (includeMarketData && data.market_data) {
      result.market_data = {
        current_price: data.market_data.current_price || {},
        roi: data.market_data.roi,
        ath: data.market_data.ath || {},
        ath_change_percentage: data.market_data.ath_change_percentage || {},
        ath_date: data.market_data.ath_date || {},
        atl: data.market_data.atl || {},
        atl_change_percentage: data.market_data.atl_change_percentage || {},
        atl_date: data.market_data.atl_date || {},
        market_cap: data.market_data.market_cap || {},
        market_cap_rank: data.market_data.market_cap_rank,
        fully_diluted_valuation: data.market_data.fully_diluted_valuation || {},
        total_volume: data.market_data.total_volume || {},
        high_24h: data.market_data.high_24h || {},
        low_24h: data.market_data.low_24h || {},
        price_change_24h: data.market_data.price_change_24h,
        price_change_percentage_24h:
          data.market_data.price_change_percentage_24h,
        price_change_percentage_7d: data.market_data.price_change_percentage_7d,
        price_change_percentage_14d:
          data.market_data.price_change_percentage_14d,
        price_change_percentage_30d:
          data.market_data.price_change_percentage_30d,
        price_change_percentage_60d:
          data.market_data.price_change_percentage_60d,
        price_change_percentage_200d:
          data.market_data.price_change_percentage_200d,
        price_change_percentage_1y: data.market_data.price_change_percentage_1y,
        market_cap_change_24h: data.market_data.market_cap_change_24h,
        market_cap_change_percentage_24h:
          data.market_data.market_cap_change_percentage_24h,
        price_change_24h_in_currency:
          data.market_data.price_change_24h_in_currency || {},
        price_change_percentage_1h_in_currency:
          data.market_data.price_change_percentage_1h_in_currency || {},
        price_change_percentage_24h_in_currency:
          data.market_data.price_change_percentage_24h_in_currency || {},
        price_change_percentage_7d_in_currency:
          data.market_data.price_change_percentage_7d_in_currency || {},
        price_change_percentage_14d_in_currency:
          data.market_data.price_change_percentage_14d_in_currency || {},
        price_change_percentage_30d_in_currency:
          data.market_data.price_change_percentage_30d_in_currency || {},
        price_change_percentage_60d_in_currency:
          data.market_data.price_change_percentage_60d_in_currency || {},
        price_change_percentage_200d_in_currency:
          data.market_data.price_change_percentage_200d_in_currency || {},
        price_change_percentage_1y_in_currency:
          data.market_data.price_change_percentage_1y_in_currency || {},
        market_cap_change_24h_in_currency:
          data.market_data.market_cap_change_24h_in_currency || {},
        market_cap_change_percentage_24h_in_currency:
          data.market_data.market_cap_change_percentage_24h_in_currency || {},
        total_supply: data.market_data.total_supply,
        max_supply: data.market_data.max_supply,
        circulating_supply: data.market_data.circulating_supply,
        last_updated: data.market_data.last_updated,
      };
    }

    return result;
  },

  /**
   * Get multiple coins by their IDs
   * @param {Array<string>} coinIds - Array of coin IDs
   * @param {string} currency - Currency for prices (default: 'usd')
   * @returns {Promise<Array>} Array of coin data
   */
  async getCoinsByIds(coinIds, currency = "usd") {
    if (!Array.isArray(coinIds) || coinIds.length === 0) {
      throw new APIError(
        "Coin IDs array is required and cannot be empty",
        400,
        "/coins/markets"
      );
    }

    const ids = coinIds.join(",");
    const endpoint = `/coins/markets?vs_currency=${currency}&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d,30d`;

    return await withRetry(() => makeRequest(endpoint));
  },

  /**
   * Get trending cryptocurrencies
   * @returns {Promise<Array>} Array of trending coins
   */
  async getTrendingCoins() {
    const endpoint = "/search/trending";
    const data = await withRetry(() => makeRequest(endpoint));

    return (
      data.coins?.map((item) => ({
        id: item.item.id,
        name: item.item.name,
        symbol: item.item.symbol?.toUpperCase() || "",
        thumb: item.item.thumb,
        small: item.item.small,
        large: item.item.large,
        slug: item.item.slug,
        market_cap_rank: item.item.market_cap_rank,
        price_btc: item.item.price_btc,
        score: item.item.score,
      })) || []
    );
  },

  /**
   * Get global cryptocurrency market data
   * @returns {Promise<Object>} Global market data
   */
  async getGlobalData() {
    const endpoint = "/global";
    const data = await withRetry(() => makeRequest(endpoint));

    return {
      active_cryptocurrencies: data.data?.active_cryptocurrencies || 0,
      upcoming_icos: data.data?.upcoming_icos || 0,
      ongoing_icos: data.data?.ongoing_icos || 0,
      ended_icos: data.data?.ended_icos || 0,
      markets: data.data?.markets || 0,
      total_market_cap: data.data?.total_market_cap || {},
      total_volume: data.data?.total_volume || {},
      market_cap_percentage: data.data?.market_cap_percentage || {},
      market_cap_change_percentage_24h_usd:
        data.data?.market_cap_change_percentage_24h_usd || 0,
      updated_at: data.data?.updated_at || 0,
    };
  },

  /**
   * Get price history for a specific coin
   * @param {string} coinId - Coin ID
   * @param {string} currency - Currency (default: 'usd')
   * @param {number} days - Number of days (default: 1)
   * @returns {Promise<Array>} Array of price history data
   */
  async getCoinHistory(coinId, currency = "usd", days = 1) {
    if (!coinId) {
      throw new APIError(
        "Coin ID is required",
        400,
        "/coins/[id]/market_chart"
      );
    }

    const endpoint = `/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}&interval=${
      days === 1 ? "hourly" : "daily"
    }`;
    const data = await withRetry(() => makeRequest(endpoint));

    const prices = data.prices || [];
    const volumes = data.total_volumes || [];
    const marketCaps = data.market_caps || [];

    return prices.map((pricePoint, index) => ({
      timestamp: pricePoint[0],
      price: pricePoint[1],
      volume: volumes[index] ? volumes[index][1] : 0,
      market_cap: marketCaps[index] ? marketCaps[index][1] : 0,
    }));
  },

  /**
   * Get supported currencies
   * @returns {Promise<Array>} Array of supported currencies
   */
  async getSupportedCurrencies() {
    const endpoint = "/simple/supported_vs_currencies";
    return await withRetry(() => makeRequest(endpoint));
  },

  /**
   * Ping the API to check if it's alive
   * @returns {Promise<Object>} Ping response
   */
  async ping() {
    const endpoint = "/ping";
    return await withRetry(() => makeRequest(endpoint));
  },

  /**
   * Clear all cached data
   */
  clearCache() {
    cache.clear();
    console.log("API cache cleared");
  },

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: cache.size(),
      requests: rateLimiter.requests.length,
    };
  },

  /**
   * Check API health status
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      await this.ping();
      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        responseTime,
        timestamp: new Date().toISOString(),
        cache: this.getCacheStats(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
        cache: this.getCacheStats(),
      };
    }
  },
};

// Export the API service as default
export default cryptoAPI;

// Export error class for external error handling
export { APIError };

// Utility function to check if error is retryable
export function isRetryableError(error) {
  if (!(error instanceof APIError)) return false;

  // Retry on server errors or rate limiting
  return error.status >= 500 || error.status === 429;
}

// Helper function to create a timeout promise
export function createTimeout(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), ms);
  });
}
