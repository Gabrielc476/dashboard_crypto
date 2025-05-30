// src/hooks/useFavorites.js
// Custom hook for managing cryptocurrency favorites

import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { APP_CONFIG, LIMITS } from "../utils/constants";

/**
 * Custom hook for managing favorite cryptocurrencies
 * @returns {Object} Favorites management functions and state
 */
export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage(
    APP_CONFIG.FAVORITES_STORAGE_KEY,
    []
  );

  // Add a coin to favorites
  const addFavorite = useCallback(
    (coinId) => {
      if (!coinId || typeof coinId !== "string") {
        console.warn("Invalid coin ID provided to addFavorite");
        return false;
      }

      setFavorites((prev) => {
        const currentFavorites = Array.isArray(prev) ? prev : [];

        // Check if already in favorites
        if (currentFavorites.includes(coinId)) {
          console.log(`${coinId} is already in favorites`);
          return currentFavorites;
        }

        // Check favorites limit
        if (currentFavorites.length >= LIMITS.FAVORITES_MAX) {
          console.warn(
            `Cannot add more than ${LIMITS.FAVORITES_MAX} favorites`
          );
          return currentFavorites;
        }

        const newFavorites = [...currentFavorites, coinId];
        console.log(`Added ${coinId} to favorites`);
        return newFavorites;
      });

      return true;
    },
    [setFavorites]
  );

  // Remove a coin from favorites
  const removeFavorite = useCallback(
    (coinId) => {
      if (!coinId || typeof coinId !== "string") {
        console.warn("Invalid coin ID provided to removeFavorite");
        return false;
      }

      setFavorites((prev) => {
        const currentFavorites = Array.isArray(prev) ? prev : [];

        if (!currentFavorites.includes(coinId)) {
          console.log(`${coinId} is not in favorites`);
          return currentFavorites;
        }

        const newFavorites = currentFavorites.filter((id) => id !== coinId);
        console.log(`Removed ${coinId} from favorites`);
        return newFavorites;
      });

      return true;
    },
    [setFavorites]
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    (coinId) => {
      if (!coinId || typeof coinId !== "string") {
        console.warn("Invalid coin ID provided to toggleFavorite");
        return false;
      }

      const currentFavorites = Array.isArray(favorites) ? favorites : [];

      if (currentFavorites.includes(coinId)) {
        return removeFavorite(coinId);
      } else {
        return addFavorite(coinId);
      }
    },
    [favorites, addFavorite, removeFavorite]
  );

  // Check if a coin is in favorites
  const isFavorite = useCallback(
    (coinId) => {
      if (!coinId || typeof coinId !== "string") {
        return false;
      }

      const currentFavorites = Array.isArray(favorites) ? favorites : [];
      return currentFavorites.includes(coinId);
    },
    [favorites]
  );

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    setFavorites([]);
    console.log("Cleared all favorites");
  }, [setFavorites]);

  // Bulk add favorites
  const addMultipleFavorites = useCallback(
    (coinIds) => {
      if (!Array.isArray(coinIds)) {
        console.warn("Invalid coin IDs array provided to addMultipleFavorites");
        return false;
      }

      setFavorites((prev) => {
        const currentFavorites = Array.isArray(prev) ? prev : [];
        const validCoinIds = coinIds.filter(
          (id) =>
            typeof id === "string" &&
            id.trim() !== "" &&
            !currentFavorites.includes(id)
        );

        if (validCoinIds.length === 0) {
          return currentFavorites;
        }

        const newFavorites = [...currentFavorites, ...validCoinIds];

        // Respect the limit
        if (newFavorites.length > LIMITS.FAVORITES_MAX) {
          console.warn(`Trimming favorites to ${LIMITS.FAVORITES_MAX} items`);
          return newFavorites.slice(0, LIMITS.FAVORITES_MAX);
        }

        console.log(`Added ${validCoinIds.length} coins to favorites`);
        return newFavorites;
      });

      return true;
    },
    [setFavorites]
  );

  // Bulk remove favorites
  const removeMultipleFavorites = useCallback(
    (coinIds) => {
      if (!Array.isArray(coinIds)) {
        console.warn(
          "Invalid coin IDs array provided to removeMultipleFavorites"
        );
        return false;
      }

      setFavorites((prev) => {
        const currentFavorites = Array.isArray(prev) ? prev : [];
        const newFavorites = currentFavorites.filter(
          (id) => !coinIds.includes(id)
        );

        console.log(
          `Removed ${
            currentFavorites.length - newFavorites.length
          } coins from favorites`
        );
        return newFavorites;
      });

      return true;
    },
    [setFavorites]
  );

  // Reorder favorites
  const reorderFavorites = useCallback(
    (oldIndex, newIndex) => {
      if (oldIndex === newIndex) return false;

      setFavorites((prev) => {
        const currentFavorites = Array.isArray(prev) ? prev : [];

        if (
          oldIndex < 0 ||
          oldIndex >= currentFavorites.length ||
          newIndex < 0 ||
          newIndex >= currentFavorites.length
        ) {
          console.warn("Invalid indices provided to reorderFavorites");
          return currentFavorites;
        }

        const newFavorites = [...currentFavorites];
        const [movedItem] = newFavorites.splice(oldIndex, 1);
        newFavorites.splice(newIndex, 0, movedItem);

        console.log(
          `Reordered favorites: moved item from ${oldIndex} to ${newIndex}`
        );
        return newFavorites;
      });

      return true;
    },
    [setFavorites]
  );

  // Get favorites with additional metadata
  const favoritesWithMetadata = useMemo(() => {
    const currentFavorites = Array.isArray(favorites) ? favorites : [];

    return {
      list: currentFavorites,
      count: currentFavorites.length,
      maxCount: LIMITS.FAVORITES_MAX,
      canAddMore: currentFavorites.length < LIMITS.FAVORITES_MAX,
      remainingSlots: Math.max(
        0,
        LIMITS.FAVORITES_MAX - currentFavorites.length
      ),
      isEmpty: currentFavorites.length === 0,
      isFull: currentFavorites.length >= LIMITS.FAVORITES_MAX,
    };
  }, [favorites]);

  // Validate favorites (remove invalid entries)
  const validateFavorites = useCallback(() => {
    setFavorites((prev) => {
      const currentFavorites = Array.isArray(prev) ? prev : [];
      const validFavorites = currentFavorites.filter(
        (id) => typeof id === "string" && id.trim() !== ""
      );

      if (validFavorites.length !== currentFavorites.length) {
        console.log(
          `Cleaned up ${
            currentFavorites.length - validFavorites.length
          } invalid favorites`
        );
        return validFavorites;
      }

      return currentFavorites;
    });
  }, [setFavorites]);

  // Export/Import favorites (for backup/restore)
  const exportFavorites = useCallback(() => {
    const currentFavorites = Array.isArray(favorites) ? favorites : [];
    return JSON.stringify({
      favorites: currentFavorites,
      exportDate: new Date().toISOString(),
      version: "1.0",
    });
  }, [favorites]);

  const importFavorites = useCallback(
    (jsonString, merge = false) => {
      try {
        const data = JSON.parse(jsonString);

        if (!data.favorites || !Array.isArray(data.favorites)) {
          console.error("Invalid favorites data format");
          return false;
        }

        const validFavorites = data.favorites.filter(
          (id) => typeof id === "string" && id.trim() !== ""
        );

        if (merge) {
          addMultipleFavorites(validFavorites);
        } else {
          setFavorites(validFavorites.slice(0, LIMITS.FAVORITES_MAX));
        }

        console.log(`Imported ${validFavorites.length} favorites`);
        return true;
      } catch (error) {
        console.error("Error importing favorites:", error);
        return false;
      }
    },
    [setFavorites, addMultipleFavorites]
  );

  return {
    // State
    favorites: favoritesWithMetadata.list,
    favoritesCount: favoritesWithMetadata.count,
    maxFavorites: favoritesWithMetadata.maxCount,
    canAddMore: favoritesWithMetadata.canAddMore,
    remainingSlots: favoritesWithMetadata.remainingSlots,
    isEmpty: favoritesWithMetadata.isEmpty,
    isFull: favoritesWithMetadata.isFull,

    // Basic operations
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,

    // Bulk operations
    addMultipleFavorites,
    removeMultipleFavorites,
    reorderFavorites,

    // Utility functions
    validateFavorites,
    exportFavorites,
    importFavorites,

    // Metadata
    metadata: favoritesWithMetadata,
  };
}

export default useFavorites;
