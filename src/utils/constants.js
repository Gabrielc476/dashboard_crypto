// src/utils/constants.js
// Application constants and configuration

// API Configuration
export const API_CONFIG = {
  BASE_URL: "https://api.coingecko.com/api/v3",
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  REQUEST_DELAY: 1000, // 1 second
  MAX_RETRIES: 3,
  TIMEOUT: 10000, // 10 seconds
};

// Default application settings
export const APP_CONFIG = {
  DEFAULT_CURRENCY: "usd",
  DEFAULT_COIN_LIMIT: 10,
  SEARCH_DEBOUNCE_DELAY: 300,
  AUTO_REFRESH_INTERVAL: 30000, // 30 seconds
  FAVORITES_STORAGE_KEY: "crypto-favorites",
  THEME_STORAGE_KEY: "crypto-theme",
  SETTINGS_STORAGE_KEY: "crypto-settings",
};

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { code: "usd", symbol: "$", name: "US Dollar" },
  { code: "eur", symbol: "€", name: "Euro" },
  { code: "btc", symbol: "₿", name: "Bitcoin" },
  { code: "eth", symbol: "Ξ", name: "Ethereum" },
  { code: "brl", symbol: "R$", name: "Brazilian Real" },
  { code: "gbp", symbol: "£", name: "British Pound" },
  { code: "jpy", symbol: "¥", name: "Japanese Yen" },
  { code: "cad", symbol: "C$", name: "Canadian Dollar" },
  { code: "aud", symbol: "A$", name: "Australian Dollar" },
  { code: "krw", symbol: "₩", name: "South Korean Won" },
];

// Chart configuration
export const CHART_CONFIG = {
  DEFAULT_TYPE: "line",
  DEFAULT_TIMEFRAME: "24h",
  COLORS: {
    POSITIVE: "#00d4aa",
    NEGATIVE: "#ff6b6b",
    NEUTRAL: "#a0a3bd",
    GRADIENT_START: "#00d4aa",
    GRADIENT_END: "#4c6ef5",
  },
  TIMEFRAMES: [
    { key: "1h", label: "1H", hours: 1 },
    { key: "24h", label: "24H", hours: 24 },
    { key: "7d", label: "7D", hours: 168 },
    { key: "30d", label: "30D", hours: 720 },
    { key: "90d", label: "90D", hours: 2160 },
    { key: "1y", label: "1Y", hours: 8760 },
  ],
};

// Breakpoints (must match SCSS variables)
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1440,
};

// Popular cryptocurrencies for quick access
export const POPULAR_COINS = [
  "bitcoin",
  "ethereum",
  "binancecoin",
  "solana",
  "ripple",
  "cardano",
  "dogecoin",
  "avalanche-2",
  "polkadot",
  "chainlink",
  "polygon",
  "litecoin",
  "bitcoin-cash",
  "uniswap",
  "cosmos",
];

// Market categories
export const MARKET_CATEGORIES = [
  { id: "all", name: "All", description: "All cryptocurrencies" },
  { id: "defi", name: "DeFi", description: "Decentralized Finance" },
  { id: "nft", name: "NFT", description: "Non-Fungible Tokens" },
  { id: "metaverse", name: "Metaverse", description: "Metaverse projects" },
  { id: "gaming", name: "Gaming", description: "Gaming tokens" },
  { id: "layer-1", name: "Layer 1", description: "Layer 1 blockchains" },
  { id: "layer-2", name: "Layer 2", description: "Layer 2 solutions" },
  { id: "meme", name: "Meme", description: "Meme coins" },
];

// Sort options
export const SORT_OPTIONS = [
  { key: "market_cap_desc", label: "Market Cap ↓", field: "market_cap" },
  { key: "market_cap_asc", label: "Market Cap ↑", field: "market_cap" },
  { key: "price_desc", label: "Price ↓", field: "current_price" },
  { key: "price_asc", label: "Price ↑", field: "current_price" },
  { key: "volume_desc", label: "Volume ↓", field: "total_volume" },
  {
    key: "change_desc",
    label: "24h Change ↓",
    field: "price_change_percentage_24h",
  },
  {
    key: "change_asc",
    label: "24h Change ↑",
    field: "price_change_percentage_24h",
  },
  { key: "name_asc", label: "Name A-Z", field: "name" },
  { key: "name_desc", label: "Name Z-A", field: "name" },
];

// Status indicators
export const STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
  REFRESHING: "refreshing",
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  API_ERROR: "Unable to fetch data. Please try again later.",
  RATE_LIMIT: "Too many requests. Please wait a moment.",
  SEARCH_ERROR: "Search failed. Please try again.",
  FAVORITES_ERROR: "Unable to save favorites.",
  GENERIC_ERROR: "Something went wrong. Please try again.",
};

// Success messages
export const SUCCESS_MESSAGES = {
  FAVORITE_ADDED: "Added to favorites!",
  FAVORITE_REMOVED: "Removed from favorites!",
  DATA_REFRESHED: "Data updated successfully!",
  SETTINGS_SAVED: "Settings saved!",
};

// Loading states
export const LOADING_STATES = {
  INITIAL: "Loading cryptocurrencies...",
  REFRESHING: "Updating data...",
  SEARCHING: "Searching...",
  LOADING_MORE: "Loading more...",
};

// Feature flags
export const FEATURES = {
  DARK_MODE: true,
  FAVORITES: true,
  SEARCH: true,
  CHARTS: true,
  PRICE_ALERTS: false, // Future feature
  PORTFOLIO: false, // Future feature
  NEWS: false, // Future feature
  SOCIAL: false, // Future feature
};

// Animation durations (in milliseconds)
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000,
};

// Local storage keys
export const STORAGE_KEYS = {
  FAVORITES: APP_CONFIG.FAVORITES_STORAGE_KEY,
  THEME: APP_CONFIG.THEME_STORAGE_KEY,
  SETTINGS: APP_CONFIG.SETTINGS_STORAGE_KEY,
  CACHE_PREFIX: "crypto-cache-",
  LAST_VISIT: "crypto-last-visit",
};

// Regular expressions
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PRICE: /^\d+(\.\d{1,8})?$/,
  PERCENTAGE: /^-?\d+(\.\d{1,2})?$/,
};

// Validation limits
export const LIMITS = {
  SEARCH_MIN_LENGTH: 2,
  SEARCH_MAX_LENGTH: 50,
  FAVORITES_MAX: 50,
  PRICE_ALERT_MAX: 10,
};

// Theme configuration
export const THEMES = {
  DARK: "dark",
  LIGHT: "light",
  AUTO: "auto",
};

// Social links (for future use)
export const SOCIAL_LINKS = {
  TWITTER: "https://twitter.com/coingecko",
  TELEGRAM: "https://t.me/coingecko",
  DISCORD: "https://discord.gg/EhrkaCH",
  REDDIT: "https://www.reddit.com/r/CoinGecko/",
};

// Export all as default object for convenience
export default {
  API_CONFIG,
  APP_CONFIG,
  SUPPORTED_CURRENCIES,
  CHART_CONFIG,
  BREAKPOINTS,
  POPULAR_COINS,
  MARKET_CATEGORIES,
  SORT_OPTIONS,
  STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_STATES,
  FEATURES,
  ANIMATIONS,
  STORAGE_KEYS,
  REGEX,
  LIMITS,
  THEMES,
  SOCIAL_LINKS,
};
