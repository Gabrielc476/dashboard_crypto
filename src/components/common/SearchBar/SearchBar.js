// src/components/common/SearchBar/SearchBar.js
import React, { useEffect } from "react";
import { useCryptoSearch } from "../../../hooks/useCryptoSearch";
import "./SearchBar.scss";

const SearchBar = ({
  onCoinSelect = () => {},
  placeholder = "Search cryptocurrencies...",
  className = "",
  autoFocus = false,
}) => {
  const {
    query,
    suggestions,
    isSearching,
    searchError,
    selectedIndex,
    showSuggestions,
    updateQuery,
    clearSearch,
    selectSuggestion,
    handleKeyDown,
    inputRef,
    hideSuggestions,
    showSuggestions: showSuggestionsHandler,
    stats,
  } = useCryptoSearch();

  // Handle coin selection
  const handleCoinSelect = (coin) => {
    const selectedCoin = selectSuggestion(coin);
    onCoinSelect(selectedCoin);
    hideSuggestions();
  };

  // Auto focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus, inputRef]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        hideSuggestions();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [hideSuggestions]);

  return (
    <div
      className={`search-bar ${className} ${
        isSearching ? "search-bar--loading" : ""
      }`}
    >
      <div className="search-bar__input-container">
        {/* Search Icon */}
        <div className="search-bar__icon">🔍</div>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          className="search-bar__input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={showSuggestionsHandler}
          aria-label="Search cryptocurrencies"
          aria-expanded={showSuggestions}
          aria-haspopup="listbox"
          aria-activedescendant={
            selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
          }
        />

        {/* Clear Button */}
        {query && (
          <button
            className={`search-bar__clear ${
              query ? "search-bar__clear--visible" : ""
            }`}
            onClick={clearSearch}
            title="Clear search"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error Message */}
      {searchError && <div className="search-bar__error">{searchError}</div>}

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          className="search-bar__suggestions"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.length === 0 &&
            !isSearching &&
            query.trim().length > 0 && (
              <div className="search-bar__no-results">
                No cryptocurrencies found for "{query}"
              </div>
            )}

          {suggestions.map((coin, index) => (
            <div
              key={coin.id}
              id={`suggestion-${index}`}
              className={`suggestion-item ${
                index === selectedIndex ? "suggestion-item--highlighted" : ""
              }`}
              onClick={() => handleCoinSelect(coin)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="coin-info">
                {coin.thumb && (
                  <img
                    src={coin.thumb}
                    alt={`${coin.name} icon`}
                    className="coin-icon"
                    loading="lazy"
                  />
                )}
                <div className="coin-details">
                  <span className="coin-name">
                    {coin.name}
                    {coin.isPopular && (
                      <span className="popular-badge">🔥</span>
                    )}
                  </span>
                  <span className="coin-symbol">{coin.symbol}</span>
                </div>
                {coin.market_cap_rank && (
                  <span className="coin-rank">#{coin.market_cap_rank}</span>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isSearching && (
            <div className="suggestion-item suggestion-item--loading">
              <div className="loading-text">Searching...</div>
            </div>
          )}

          {/* Show search history or popular coins when no query */}
          {query.trim().length === 0 && suggestions.length > 0 && (
            <div className="search-bar__section-header">
              Recent searches & Popular coins
            </div>
          )}
        </div>
      )}

      {/* Search Stats (for debugging, can be removed in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="search-bar__debug">
          Query: {stats.queryLength} chars | Suggestions:{" "}
          {stats.suggestionCount} | History: {stats.historyCount}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
