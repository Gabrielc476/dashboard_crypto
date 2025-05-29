// src/utils/helpers.js
// General utility helper functions

import { ANIMATIONS, STORAGE_KEYS, LIMITS } from "./constants";

// Debounce function for search and other inputs
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Throttle function for scroll and resize events
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Deep clone function
export function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map((item) => deepClone(item));

  const clonedObj = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
}

// Generate unique ID
export function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Check if value is empty
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

// Validate email format
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get random item from array
export function getRandomItem(array) {
  if (!Array.isArray(array) || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

// Shuffle array
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Sort array by multiple keys
export function sortByKeys(array, keys) {
  return array.sort((a, b) => {
    for (let key of keys) {
      const direction = key.startsWith("-") ? -1 : 1;
      const prop = key.replace(/^-/, "");

      const aVal = getNestedProperty(a, prop);
      const bVal = getNestedProperty(b, prop);

      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;
    }
    return 0;
  });
}

// Get nested property from object
export function getNestedProperty(obj, path) {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}

// Set nested property in object
export function setNestedProperty(obj, path, value) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!(key in current)) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

// Local storage helpers with error handling
export const storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage:`, error);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to localStorage:`, error);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage:`, error);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error(`Error clearing localStorage:`, error);
      return false;
    }
  },
};

// URL parameter helpers
export const urlParams = {
  get(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  set(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.replaceState({}, "", url);
  },

  remove(param) {
    const url = new URL(window.location);
    url.searchParams.delete(param);
    window.history.replaceState({}, "", url);
  },

  getAll() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    for (const [key, value] of urlParams) {
      params[key] = value;
    }
    return params;
  },
};

// Color utilities
export function hexToRgba(hex, alpha = 1) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Animation utilities
export function animate(element, keyframes, options = {}) {
  const defaultOptions = {
    duration: ANIMATIONS.NORMAL,
    fill: "forwards",
    ...options,
  };

  return element.animate(keyframes, defaultOptions);
}

// Smooth scroll to element
export function scrollToElement(element, options = {}) {
  const defaultOptions = {
    behavior: "smooth",
    block: "start",
    ...options,
  };

  element.scrollIntoView(defaultOptions);
}

// Copy text to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch (fallbackError) {
      console.error("Could not copy text: ", fallbackError);
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// Device detection
export const device = {
  isMobile() {
    return window.innerWidth <= 768;
  },

  isTablet() {
    return window.innerWidth > 768 && window.innerWidth <= 1024;
  },

  isDesktop() {
    return window.innerWidth > 1024;
  },

  isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  },
};

// Network status
export function getNetworkStatus() {
  return {
    online: navigator.onLine,
    connection:
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection,
    effectiveType: navigator.connection?.effectiveType || "unknown",
  };
}

// Performance utilities
export function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
}

// Retry function with exponential backoff
export async function retry(fn, maxAttempts = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;

      const backoffDelay = delay * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }
  }
}

// Format file size
export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Check if element is in viewport
export function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Create intersection observer
export function createIntersectionObserver(callback, options = {}) {
  const defaultOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}

// Validation utilities
export const validate = {
  required(value) {
    return !isEmpty(value);
  },

  minLength(value, min) {
    return typeof value === "string" && value.length >= min;
  },

  maxLength(value, max) {
    return typeof value === "string" && value.length <= max;
  },

  isNumber(value) {
    return !isNaN(value) && isFinite(value);
  },

  isPositive(value) {
    return this.isNumber(value) && Number(value) > 0;
  },

  isEmail(value) {
    return isValidEmail(value);
  },

  isUrl(value) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
};

// Array utilities
export const arrayUtils = {
  chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  unique(array, key = null) {
    if (key) {
      const seen = new Set();
      return array.filter((item) => {
        const value = getNestedProperty(item, key);
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    return [...new Set(array)];
  },

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = getNestedProperty(item, key);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  findDuplicates(array, key = null) {
    const seen = new Map();
    const duplicates = [];

    array.forEach((item) => {
      const value = key ? getNestedProperty(item, key) : item;
      if (seen.has(value)) {
        duplicates.push(item);
      } else {
        seen.set(value, true);
      }
    });

    return duplicates;
  },
};

// Error boundary helper
export function createErrorHandler(componentName) {
  return (error, errorInfo) => {
    console.error(`Error in ${componentName}:`, error, errorInfo);

    // You can add error reporting service here
    // reportError(error, { component: componentName, ...errorInfo });
  };
}

// Feature flag checker
export function hasFeature(featureName) {
  // This could be expanded to check against a features configuration
  // or make an API call to check feature flags
  return true; // Default to true for now
}

// Export commonly used utilities as default
export default {
  debounce,
  throttle,
  deepClone,
  generateId,
  isEmpty,
  storage,
  urlParams,
  device,
  arrayUtils,
  validate,
  copyToClipboard,
  retry,
};
