// Timer Functions Module
// Pure functions for timer utilities, display formatting, and time calculations

import { TIMER_CONFIG } from './gameConfig.js';

/**
 * Format time in milliseconds to display string
 * @param {number} timeMs - Time in milliseconds
 * @param {boolean} showMilliseconds - Whether to show milliseconds
 * @returns {string} Formatted time string
 */
export function formatTime(timeMs, showMilliseconds = false) {
  if (timeMs <= 0) return showMilliseconds ? '0:00.0' : '0:00';
  
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((timeMs % 1000) / 100);
  
  const formattedSeconds = seconds.toString().padStart(2, '0');
  
  if (showMilliseconds) {
    return `${minutes}:${formattedSeconds}.${milliseconds}`;
  }
  
  return `${minutes}:${formattedSeconds}`;
}

/**
 * Format time remaining with color coding
 * @param {number} timeRemaining - Time remaining in milliseconds
 * @param {number} totalTime - Total time in milliseconds
 * @returns {object} Object with formatted time and color
 */
export function formatTimeWithColor(timeRemaining, totalTime) {
  const formatted = formatTime(timeRemaining, true);
  const percentage = timeRemaining / totalTime;
  
  let color = '#00ff00'; // Green
  if (percentage < 0.5) color = '#ffff00'; // Yellow
  if (percentage < 0.25) color = '#ff8800'; // Orange
  if (percentage < 0.1) color = '#ff0000'; // Red
  
  return { time: formatted, color };
}

/**
 * Calculate time elapsed since start
 * @param {number} startTime - Start timestamp
 * @param {number} currentTime - Current timestamp (optional, defaults to now)
 * @returns {number} Elapsed time in milliseconds
 */
export function calculateElapsedTime(startTime, currentTime = Date.now()) {
  return Math.max(0, currentTime - startTime);
}

/**
 * Calculate time remaining
 * @param {number} startTime - Start timestamp
 * @param {number} duration - Duration in milliseconds
 * @param {number} currentTime - Current timestamp (optional, defaults to now)
 * @returns {number} Time remaining in milliseconds
 */
export function calculateTimeRemaining(startTime, duration, currentTime = Date.now()) {
  const elapsed = calculateElapsedTime(startTime, currentTime);
  return Math.max(0, duration - elapsed);
}

/**
 * Check if timer has expired
 * @param {number} startTime - Start timestamp
 * @param {number} duration - Duration in milliseconds
 * @param {number} currentTime - Current timestamp (optional, defaults to now)
 * @returns {boolean} True if timer has expired
 */
export function isTimerExpired(startTime, duration, currentTime = Date.now()) {
  return calculateTimeRemaining(startTime, duration, currentTime) <= 0;
}

/**
 * Get timer progress as percentage
 * @param {number} startTime - Start timestamp
 * @param {number} duration - Duration in milliseconds
 * @param {number} currentTime - Current timestamp (optional, defaults to now)
 * @returns {number} Progress from 0 to 1
 */
export function getTimerProgress(startTime, duration, currentTime = Date.now()) {
  const elapsed = calculateElapsedTime(startTime, currentTime);
  return Math.min(1, Math.max(0, elapsed / duration));
}

/**
 * Create timer display object with all necessary information
 * @param {number} startTime - Start timestamp
 * @param {number} duration - Duration in milliseconds
 * @param {boolean} isPaused - Whether timer is paused
 * @param {number} pausedAt - Timestamp when paused (if paused)
 * @returns {object} Timer display object
 */
export function createTimerDisplay(startTime, duration, isPaused = false, pausedAt = null) {
  const currentTime = Date.now();
  const effectiveCurrentTime = isPaused && pausedAt ? pausedAt : currentTime;
  
  const elapsed = calculateElapsedTime(startTime, effectiveCurrentTime);
  const remaining = calculateTimeRemaining(startTime, duration, effectiveCurrentTime);
  const progress = getTimerProgress(startTime, duration, effectiveCurrentTime);
  const expired = isTimerExpired(startTime, duration, effectiveCurrentTime);
  
  const { time: formattedTime, color } = formatTimeWithColor(remaining, duration);
  
  return {
    elapsed,
    remaining,
    progress,
    expired,
    isPaused,
    formattedTime,
    color,
    percentage: Math.round(progress * 100)
  };
}

/**
 * Parse time string to milliseconds
 * @param {string} timeString - Time string like "1:30" or "0:45.5"
 * @returns {number} Time in milliseconds
 */
export function parseTimeString(timeString) {
  const parts = timeString.split(':');
  if (parts.length !== 2) return 0;
  
  const minutes = parseInt(parts[0], 10) || 0;
  const secondsParts = parts[1].split('.');
  const seconds = parseInt(secondsParts[0], 10) || 0;
  const milliseconds = secondsParts.length > 1 ? parseInt(secondsParts[1], 10) * 100 : 0;
  
  return (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
}

/**
 * Create countdown display
 * @param {number} countdown - Countdown value
 * @returns {string} Formatted countdown string
 */
export function formatCountdown(countdown) {
  if (countdown <= 0) return 'GO!';
  return countdown.toString();
}

/**
 * Calculate frames per second
 * @param {Array<number>} frameTimes - Array of recent frame timestamps
 * @returns {number} Current FPS
 */
export function calculateFPS(frameTimes) {
  if (frameTimes.length < 2) return 0;
  
  const recentFrames = frameTimes.slice(-60); // Last 60 frames
  const timeSpan = recentFrames[recentFrames.length - 1] - recentFrames[0];
  
  if (timeSpan === 0) return 0;
  
  return Math.round((recentFrames.length - 1) * 1000 / timeSpan);
}

/**
 * Throttle function calls based on time
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export function createThrottledFunction(func, delay = TIMER_CONFIG.throttleDelay) {
  let lastCallTime = 0;
  
  return function(...args) {
    const now = Date.now();
    if (now - lastCallTime >= delay) {
      lastCallTime = now;
      return func.apply(this, args);
    }
  };
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function createDebouncedFunction(func, delay = TIMER_CONFIG.throttleDelay) {
  let timeoutId = null;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Create interval timer with cleanup
 * @param {Function} callback - Function to call on interval
 * @param {number} interval - Interval in milliseconds
 * @returns {object} Timer object with stop method
 */
export function createIntervalTimer(callback, interval = TIMER_CONFIG.realTimeUpdate) {
  const intervalId = setInterval(callback, interval);
  
  return {
    stop: () => clearInterval(intervalId),
    intervalId
  };
}

/**
 * Create timeout with cleanup
 * @param {Function} callback - Function to call on timeout
 * @param {number} delay - Delay in milliseconds
 * @returns {object} Timer object with cancel method
 */
export function createTimeout(callback, delay) {
  const timeoutId = setTimeout(callback, delay);
  
  return {
    cancel: () => clearTimeout(timeoutId),
    timeoutId
  };
}

/**
 * Create animation frame loop
 * @param {Function} callback - Function to call each frame
 * @returns {object} Animation object with stop method
 */
export function createAnimationLoop(callback) {
  let animationId = null;
  let isRunning = false;
  
  function loop() {
    if (!isRunning) return;
    
    callback();
    animationId = requestAnimationFrame(loop);
  }
  
  return {
    start: () => {
      if (!isRunning) {
        isRunning = true;
        loop();
      }
    },
    stop: () => {
      isRunning = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    isRunning: () => isRunning
  };
}

/**
 * Get time zone offset in milliseconds
 * @returns {number} Timezone offset in milliseconds
 */
export function getTimezoneOffset() {
  return new Date().getTimezoneOffset() * 60 * 1000;
}

/**
 * Convert server time to local time
 * @param {number} serverTime - Server timestamp
 * @returns {number} Local timestamp
 */
export function serverToLocalTime(serverTime) {
  // Assuming server time is UTC, adjust for local timezone
  return serverTime - getTimezoneOffset();
}

/**
 * Convert local time to server time
 * @param {number} localTime - Local timestamp
 * @returns {number} Server timestamp
 */
export function localToServerTime(localTime) {
  // Assuming server expects UTC, adjust from local timezone
  return localTime + getTimezoneOffset();
}

/**
 * Create human-readable time difference
 * @param {number} timestamp - Timestamp to compare
 * @param {number} now - Current timestamp (optional)
 * @returns {string} Human-readable time difference
 */
export function getTimeAgo(timestamp, now = Date.now()) {
  const diff = now - timestamp;
  
  if (diff < 1000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return `${Math.floor(diff / 86400000)}d ago`;
}

/**
 * Validate timer configuration
 * @param {object} config - Timer configuration object
 * @returns {boolean} True if configuration is valid
 */
export function validateTimerConfig(config) {
  if (!config || typeof config !== 'object') return false;
  
  const { duration, startTime } = config;
  
  return (
    typeof duration === 'number' && duration > 0 &&
    typeof startTime === 'number' && startTime > 0
  );
}