// src/components/common/Header/Header.js
import React, { useState, useEffect } from "react";
import { useFavorites } from "../../../hooks/useFavorites";
import { useTheme } from "../../../hooks/useTheme";
import { formatNumber } from "../../../utils/formatters";
import "./Header.scss";

const Header = ({
  totalCoins = 0,
  onFavoritesToggle = () => {},
  showMobileMenu = false,
  onMobileMenuToggle = () => {},
}) => {
  const { favoritesCount } = useFavorites();
  const { theme, toggleTheme, getThemeIcon } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`header ${isScrolled ? "header--scrolled" : ""}`}>
      <div className="header__container">
        {/* Brand Section */}
        <div className="header__brand">
          <div className="logo">₿</div>
          <div className="brand-text">
            <h1 className="title">CryptoDash</h1>
            <p className="subtitle">Real-time crypto tracker</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="header__nav">
          {/* Stats Section */}
          <div className="header__stats">
            <div className="stat-item stat-item--total">
              <span className="stat-value">{formatNumber(totalCoins)}</span>
              <span className="stat-label">Coins</span>
            </div>
            <div className="stat-item stat-item--favorites">
              <span className="stat-value">{favoritesCount}</span>
              <span className="stat-label">Favorites</span>
            </div>
          </div>

          {/* Market Status */}
          <div className="market-status">
            <div className="status-dot"></div>
            <span className="status-text">Live</span>
          </div>

          {/* Action Buttons */}
          <div className="header__actions">
            {/* Theme Toggle */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle theme"
            >
              {getThemeIcon()}
            </button>

            {/* Favorites Toggle */}
            <button
              className="favorites-toggle"
              onClick={onFavoritesToggle}
              title="View favorites"
              aria-label={`View ${favoritesCount} favorites`}
            >
              ♥ Favorites
              {favoritesCount > 0 && (
                <span className="badge">{favoritesCount}</span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              className="header__menu-toggle"
              onClick={onMobileMenuToggle}
              aria-label="Toggle mobile menu"
            >
              {showMobileMenu ? "✕" : "☰"}
            </button>
          </div>
        </nav>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="header__mobile-menu header__mobile-menu--open">
            <nav className="mobile-nav">
              <div className="nav-item">
                <button onClick={onFavoritesToggle}>
                  ♥ Favorites ({favoritesCount})
                </button>
              </div>
              <div className="nav-item">
                <button onClick={toggleTheme}>
                  {getThemeIcon()} {theme === "dark" ? "Light" : "Dark"} Mode
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
