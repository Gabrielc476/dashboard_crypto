// src/components/common/LoadingSpinner/LoadingSpinner.js
import React from "react";
import "./LoadingSpinner.scss";

const LoadingSpinner = ({
  size = "medium",
  color = "primary",
  text = "",
  overlay = false,
  className = "",
}) => {
  const spinnerClasses = [
    "loading-spinner",
    `loading-spinner--${size}`,
    `loading-spinner--${color}`,
    overlay ? "loading-spinner--overlay" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const SpinnerElement = () => (
    <div className={spinnerClasses}>
      <div className="loading-spinner__circle">
        <div className="loading-spinner__circle-inner"></div>
      </div>
      {text && <div className="loading-spinner__text">{text}</div>}
    </div>
  );

  // If overlay is true, wrap in overlay container
  if (overlay) {
    return (
      <div className="loading-spinner__overlay-container">
        <SpinnerElement />
      </div>
    );
  }

  return <SpinnerElement />;
};

// Predefined spinner variations for common use cases
export const LoadingSpinnerSmall = (props) => (
  <LoadingSpinner size="small" {...props} />
);

export const LoadingSpinnerLarge = (props) => (
  <LoadingSpinner size="large" {...props} />
);

export const LoadingSpinnerOverlay = (props) => (
  <LoadingSpinner overlay={true} {...props} />
);

// Pulse loading animation for content placeholders
export const LoadingPulse = ({
  width = "100%",
  height = "20px",
  borderRadius = "4px",
  className = "",
}) => (
  <div
    className={`loading-pulse ${className}`}
    style={{ width, height, borderRadius }}
  />
);

// Card loading skeleton
export const LoadingCard = ({ className = "" }) => (
  <div className={`loading-card ${className}`}>
    <div className="loading-card__header">
      <LoadingPulse width="40px" height="40px" borderRadius="50%" />
      <div className="loading-card__info">
        <LoadingPulse width="120px" height="16px" />
        <LoadingPulse width="60px" height="14px" />
      </div>
    </div>
    <div className="loading-card__content">
      <LoadingPulse width="100px" height="24px" />
      <LoadingPulse width="80px" height="16px" />
    </div>
    <div className="loading-card__chart">
      <LoadingPulse width="100%" height="60px" />
    </div>
  </div>
);

// List loading skeleton
export const LoadingList = ({ items = 5, className = "" }) => (
  <div className={`loading-list ${className}`}>
    {Array.from({ length: items }, (_, index) => (
      <div key={index} className="loading-list__item">
        <LoadingPulse width="32px" height="32px" borderRadius="50%" />
        <div className="loading-list__content">
          <LoadingPulse width="150px" height="16px" />
          <LoadingPulse width="100px" height="14px" />
        </div>
        <div className="loading-list__price">
          <LoadingPulse width="80px" height="16px" />
        </div>
      </div>
    ))}
  </div>
);

export default LoadingSpinner;
