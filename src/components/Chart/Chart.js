// src/components/Chart/Chart.js
import React, { useEffect, useRef, useState, useMemo } from "react";
import { generateMockPriceHistory } from "../../utils/cryptoHelpers";
import { formatPrice, formatTimeAgo } from "../../utils/formatters";
import { CHART_CONFIG } from "../../utils/constants";
import { LoadingSpinner } from "../common";
import "./Chart.scss";

const Chart = ({
  coinId,
  data = null,
  timeframe = "24h",
  onTimeframeChange = null,
  showTimeframes = true,
  showTooltip = true,
  showGrid = true,
  showArea = true,
  showVolume = false,
  height = 300,
  className = "",
  loading = false,
  error = null,
  animated = true,
  theme = "auto", // 'auto', 'light', 'dark'
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Generate mock data if none provided
  const chartData = useMemo(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      return data;
    }

    // Generate mock data for demonstration
    if (coinId) {
      const mockPrice = Math.random() * 50000 + 1000; // Random price between 1000-51000
      return generateMockPriceHistory(mockPrice, 24, 0.05);
    }

    return [];
  }, [data, coinId]);

  // Calculate price range and trend
  const chartStats = useMemo(() => {
    if (!chartData.length) return null;

    const prices = chartData.map((d) => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const change = lastPrice - firstPrice;
    const changePercentage = (change / firstPrice) * 100;
    const trend = change >= 0 ? "up" : "down";

    return {
      minPrice,
      maxPrice,
      firstPrice,
      lastPrice,
      change,
      changePercentage,
      trend,
      priceRange: maxPrice - minPrice,
    };
  }, [chartData]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height: containerHeight } =
          containerRef.current.getBoundingClientRect();
        setChartDimensions({ width, height: containerHeight });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Draw chart
  useEffect(() => {
    if (!chartData.length || !canvasRef.current || !chartStats) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { width, height } = chartDimensions;

    if (width === 0 || height === 0) return;

    // Set canvas size
    canvas.width = width * 2; // Retina support
    canvas.height = height * 2;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(2, 2);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Chart margins
    const margin = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Color scheme based on trend
    const colors = {
      line:
        chartStats.trend === "up"
          ? CHART_CONFIG.COLORS.POSITIVE
          : CHART_CONFIG.COLORS.NEGATIVE,
      area:
        chartStats.trend === "up"
          ? `${CHART_CONFIG.COLORS.POSITIVE}20`
          : `${CHART_CONFIG.COLORS.NEGATIVE}20`,
      grid: theme === "dark" ? "#2a2d47" : "#e5e7eb",
      text: theme === "dark" ? "#a0a3bd" : "#6b7280",
    };

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;

      // Horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = margin.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 6; i++) {
        const x = margin.left + (chartWidth / 6) * i;
        ctx.beginPath();
        ctx.moveTo(x, margin.top);
        ctx.lineTo(x, height - margin.bottom);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    // Calculate points
    const points = chartData.map((point, index) => {
      const x = margin.left + (index / (chartData.length - 1)) * chartWidth;
      const y =
        margin.top +
        (1 - (point.price - chartStats.minPrice) / chartStats.priceRange) *
          chartHeight;
      return { x, y, data: point };
    });

    // Draw area fill
    if (showArea) {
      ctx.fillStyle = colors.area;
      ctx.beginPath();
      ctx.moveTo(points[0].x, height - margin.bottom);

      points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });

      ctx.lineTo(points[points.length - 1].x, height - margin.bottom);
      ctx.closePath();
      ctx.fill();
    }

    // Draw price line
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });

    ctx.stroke();

    // Draw hover point
    if (hoveredPoint && showTooltip) {
      const point = points[hoveredPoint.index];
      if (point) {
        ctx.fillStyle = colors.line;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Outer ring
        ctx.strokeStyle = colors.line;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    // Draw Y-axis labels
    ctx.fillStyle = colors.text;
    ctx.font =
      '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= 4; i++) {
      const price = chartStats.minPrice + (chartStats.priceRange / 4) * (4 - i);
      const y = margin.top + (chartHeight / 4) * i;
      ctx.fillText(formatPrice(price).replace("$", ""), margin.left - 10, y);
    }
  }, [
    chartData,
    chartStats,
    chartDimensions,
    hoveredPoint,
    showGrid,
    showArea,
    showTooltip,
    theme,
  ]);

  // Handle mouse move for tooltip
  const handleMouseMove = (event) => {
    if (!chartData.length || !containerRef.current || !showTooltip) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const margin = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartWidth = chartDimensions.width - margin.left - margin.right;

    if (x >= margin.left && x <= chartDimensions.width - margin.right) {
      const relativeX = x - margin.left;
      const dataIndex = Math.round(
        (relativeX / chartWidth) * (chartData.length - 1)
      );

      if (dataIndex >= 0 && dataIndex < chartData.length) {
        setHoveredPoint({
          index: dataIndex,
          data: chartData[dataIndex],
        });
        setTooltipPosition({ x: event.clientX, y: event.clientY });
      }
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Handle timeframe change
  const handleTimeframeClick = (newTimeframe) => {
    if (onTimeframeChange && typeof onTimeframeChange === "function") {
      onTimeframeChange(newTimeframe);
    }
  };

  if (loading) {
    return (
      <div className={`chart chart--loading ${className}`}>
        <div className="chart__loading">
          <LoadingSpinner size="large" text="Loading chart data..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`chart chart--error ${className}`}>
        <div className="chart__error">
          <div className="error-icon">📊</div>
          <h3>Chart Error</h3>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!chartData.length) {
    return (
      <div className={`chart chart--empty ${className}`}>
        <div className="chart__empty">
          <div className="empty-icon">📈</div>
          <h3>No Chart Data</h3>
          <p>No price data available for this timeframe.</p>
        </div>
      </div>
    );
  }

  const containerClasses = [
    "chart",
    `chart--${theme}`,
    animated ? "chart--animated" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      {/* Chart Header */}
      <div className="chart__header">
        <div className="chart__info">
          {chartStats && (
            <>
              <div className="chart__price">
                <span className="current-price">
                  {formatPrice(chartStats.lastPrice)}
                </span>
                <span
                  className={`price-change price-change--${chartStats.trend}`}
                >
                  {chartStats.changePercentage > 0 ? "+" : ""}
                  {chartStats.changePercentage.toFixed(2)}%
                </span>
              </div>
              <div className="chart__stats">
                <span className="stat-item">
                  <span className="label">High:</span>
                  <span className="value">
                    {formatPrice(chartStats.maxPrice)}
                  </span>
                </span>
                <span className="stat-item">
                  <span className="label">Low:</span>
                  <span className="value">
                    {formatPrice(chartStats.minPrice)}
                  </span>
                </span>
              </div>
            </>
          )}
        </div>

        {/* Timeframe Selector */}
        {showTimeframes && (
          <div className="chart__timeframes">
            {CHART_CONFIG.TIMEFRAMES.map((tf) => (
              <button
                key={tf.key}
                className={`timeframe-btn ${
                  timeframe === tf.key ? "timeframe-btn--active" : ""
                }`}
                onClick={() => handleTimeframeClick(tf.key)}
              >
                {tf.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div
        className="chart__container"
        ref={containerRef}
        style={{ height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas ref={canvasRef} className="chart__canvas" />

        {/* Tooltip */}
        {hoveredPoint && showTooltip && (
          <ChartTooltip
            data={hoveredPoint.data}
            position={tooltipPosition}
            trend={chartStats?.trend}
          />
        )}
      </div>
    </div>
  );
};

// Tooltip component
const ChartTooltip = ({ data, position, trend }) => {
  const tooltipStyle = {
    position: "fixed",
    left: position.x + 10,
    top: position.y - 60,
    zIndex: 1000,
    pointerEvents: "none",
  };

  return (
    <div
      className={`chart-tooltip chart-tooltip--${trend}`}
      style={tooltipStyle}
    >
      <div className="tooltip-price">{formatPrice(data.price)}</div>
      <div className="tooltip-time">
        {new Date(data.timestamp).toLocaleTimeString()}
      </div>
      {data.volume && (
        <div className="tooltip-volume">Volume: {formatPrice(data.volume)}</div>
      )}
    </div>
  );
};

// Simple line chart variant
export const SimpleChart = (props) => (
  <Chart
    {...props}
    showTimeframes={false}
    showTooltip={false}
    showGrid={false}
    height={120}
    className={`simple-chart ${props.className || ""}`}
  />
);

// Volume chart variant
export const VolumeChart = (props) => (
  <Chart
    {...props}
    showVolume={true}
    showArea={false}
    className={`volume-chart ${props.className || ""}`}
  />
);

export default Chart;
