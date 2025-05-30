// src/hooks/useLocalStorage.js
// Custom hook for localStorage management with error handling

import { useState, useEffect, useCallback } from "react";
import { storage } from "../utils/helpers";

/**
 * Custom hook to manage localStorage state
 * @param {string} key - The localStorage key
 * @param {*} initialValue - Initial value if no stored value exists
 * @returns {[value, setValue, removeValue]} - Current value, setter function, and remove function
 */
export function useLocalStorage(key, initialValue) {
  // Initialize state with value from localStorage or initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = storage.get(key);
      return item !== null ? item : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback(
    (value) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (valueToStore === undefined) {
          storage.remove(key);
        } else {
          storage.set(key, valueToStore);
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      storage.remove(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in localStorage from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.error(
            `Error parsing localStorage value for key "${key}":`,
            error
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
