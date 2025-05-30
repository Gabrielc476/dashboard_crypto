// src/hooks/useTheme.js
// Custom hook for managing application theme (dark/light mode)

import { useEffect, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { THEMES, APP_CONFIG } from "../utils/constants";

/**
 * Custom hook for theme management with system preference detection
 * @returns {Object} Theme state and management functions
 */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage(
    APP_CONFIG.THEME_STORAGE_KEY,
    THEMES.AUTO
  );

  // Detect system theme preference
  const getSystemTheme = useCallback(() => {
    if (typeof window === "undefined") return THEMES.DARK;

    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? THEMES.DARK
        : THEMES.LIGHT;
    } catch (error) {
      console.warn("Error detecting system theme:", error);
      return THEMES.DARK;
    }
  }, []);

  // Get the actual theme to apply (resolve 'auto' to system preference)
  const getResolvedTheme = useCallback(() => {
    if (theme === THEMES.AUTO) {
      return getSystemTheme();
    }
    return theme;
  }, [theme, getSystemTheme]);

  // Apply theme to DOM
  const applyTheme = useCallback((themeToApply) => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const body = document.body;

    // Remove all theme classes
    root.classList.remove("theme-dark", "theme-light");
    body.classList.remove("theme-dark", "theme-light");

    // Add current theme class
    const themeClass = `theme-${themeToApply}`;
    root.classList.add(themeClass);
    body.classList.add(themeClass);

    // Set data attribute for CSS
    root.setAttribute("data-theme", themeToApply);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const colors = {
        [THEMES.DARK]: "#0f0f23",
        [THEMES.LIGHT]: "#ffffff",
      };
      metaThemeColor.setAttribute(
        "content",
        colors[themeToApply] || colors[THEMES.DARK]
      );
    }

    console.log(`Applied theme: ${themeToApply}`);
  }, []);

  // Set theme with validation
  const setThemeWithValidation = useCallback(
    (newTheme) => {
      const validThemes = Object.values(THEMES);

      if (!validThemes.includes(newTheme)) {
        console.warn(`Invalid theme: ${newTheme}. Using default theme.`);
        newTheme = THEMES.AUTO;
      }

      setTheme(newTheme);
      console.log(`Theme preference set to: ${newTheme}`);
    },
    [setTheme]
  );

  // Toggle between light and dark (skips auto)
  const toggleTheme = useCallback(() => {
    const currentResolvedTheme = getResolvedTheme();
    const newTheme =
      currentResolvedTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
    setThemeWithValidation(newTheme);
  }, [getResolvedTheme, setThemeWithValidation]);

  // Cycle through all theme options
  const cycleTheme = useCallback(() => {
    const themes = [THEMES.LIGHT, THEMES.DARK, THEMES.AUTO];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setThemeWithValidation(themes[nextIndex]);
  }, [theme, setThemeWithValidation]);

  // Reset to system preference
  const resetToSystem = useCallback(() => {
    setThemeWithValidation(THEMES.AUTO);
  }, [setThemeWithValidation]);

  // Get theme icon for UI display
  const getThemeIcon = useCallback(
    (themeValue = theme) => {
      const icons = {
        [THEMES.LIGHT]: "☀️",
        [THEMES.DARK]: "🌙",
        [THEMES.AUTO]: "🔄",
      };
      return icons[themeValue] || icons[THEMES.AUTO];
    },
    [theme]
  );

  // Get theme label for UI display
  const getThemeLabel = useCallback(
    (themeValue = theme) => {
      const labels = {
        [THEMES.LIGHT]: "Light",
        [THEMES.DARK]: "Dark",
        [THEMES.AUTO]: "Auto",
      };
      return labels[themeValue] || labels[THEMES.AUTO];
    },
    [theme]
  );

  // Check if theme is system-managed
  const isSystemManaged = theme === THEMES.AUTO;
  const resolvedTheme = getResolvedTheme();
  const isDarkMode = resolvedTheme === THEMES.DARK;
  const isLightMode = resolvedTheme === THEMES.LIGHT;

  // Listen for system theme changes when using auto mode
  useEffect(() => {
    if (theme !== THEMES.AUTO) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e) => {
      const newSystemTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
      applyTheme(newSystemTheme);
      console.log(`System theme changed to: ${newSystemTheme}`);
    };

    // Apply initial theme
    applyTheme(getSystemTheme());

    // Listen for changes
    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, [theme, applyTheme, getSystemTheme]);

  // Apply theme when theme preference changes
  useEffect(() => {
    const themeToApply = getResolvedTheme();
    applyTheme(themeToApply);
  }, [theme, applyTheme, getResolvedTheme]);

  // Initialize theme on mount
  useEffect(() => {
    // Ensure theme is applied on initial load
    const themeToApply = getResolvedTheme();
    applyTheme(themeToApply);

    // Add theme transition class after initial load for smooth animations
    const timer = setTimeout(() => {
      if (document.documentElement) {
        document.documentElement.classList.add("theme-transition");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Export theme information and controls
  return {
    // Current theme state
    theme,
    resolvedTheme,
    isDarkMode,
    isLightMode,
    isSystemManaged,

    // Theme controls
    setTheme: setThemeWithValidation,
    toggleTheme,
    cycleTheme,
    resetToSystem,

    // Utility functions
    getThemeIcon,
    getThemeLabel,
    getSystemTheme,

    // Available theme options
    availableThemes: Object.values(THEMES),
    themeOptions: [
      { value: THEMES.LIGHT, label: "Light", icon: "☀️" },
      { value: THEMES.DARK, label: "Dark", icon: "🌙" },
      { value: THEMES.AUTO, label: "Auto", icon: "🔄" },
    ],
  };
}

export default useTheme;
