// UI References Module
// Handles DOM element caching and UI state management

import { UI_ELEMENTS } from './gameConfig.js';

// Cached DOM elements
let cachedElements = {};

/**
 * Get a DOM element by ID with caching
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} DOM element or null if not found
 */
export function getElement(id) {
  if (cachedElements[id]) {
    return cachedElements[id];
  }
  
  const element = document.getElementById(id);
  if (element) {
    cachedElements[id] = element;
  } else {
    console.warn(`Element with ID '${id}' not found`);
  }
  
  return element;
}

/**
 * Get multiple elements at once
 * @param {Array<string>} ids - Array of element IDs
 * @returns {object} Object with element IDs as keys and elements as values
 */
export function getElements(ids) {
  const elements = {};
  ids.forEach(id => {
    elements[id] = getElement(id);
  });
  return elements;
}

/**
 * Initialize and cache all UI elements
 * @returns {object} Object containing all cached UI elements
 */
export function initializeUIElements() {
  console.log('🎨 Initializing UI elements...');
  
  // Cache all predefined UI elements
  const elements = getElements(Object.values(UI_ELEMENTS));
  
  // Additional elements that might be needed
  const additionalElements = [
    'quick-play-btn',
    'player-name-input',
    'lobby-ui',
    'statistics-ui',
    'evolution-ui',
    'tournament-ui',
    'chat-container',
    'chat-messages',
    'chat-input',
    'dual-movement-ui',
    'mode-normal',
    'mode-jump',
    'mode-split',
    'lobby-creation',
    'lobby-room',
    'lobby-list',
    'stats-personal',
    'stats-leaderboard',
    'stats-achievements',
    'stats-global',
    'evolution-bank',
    'evolution-choice',
    'tournament-creation',
    'tournament-list'
  ];
  
  additionalElements.forEach(id => {
    elements[id] = getElement(id);
  });
  
  console.log(`✅ Cached ${Object.keys(elements).length} UI elements`);
  
  return elements;
}

/**
 * Show an element
 * @param {string|HTMLElement} elementOrId - Element or element ID
 */
export function showElement(elementOrId) {
  const element = typeof elementOrId === 'string' ? getElement(elementOrId) : elementOrId;
  if (element) {
    element.style.display = 'block';
  }
}

/**
 * Hide an element
 * @param {string|HTMLElement} elementOrId - Element or element ID
 */
export function hideElement(elementOrId) {
  const element = typeof elementOrId === 'string' ? getElement(elementOrId) : elementOrId;
  if (element) {
    element.style.display = 'none';
  }
}

/**
 * Toggle element visibility
 * @param {string|HTMLElement} elementOrId - Element or element ID
 */
export function toggleElement(elementOrId) {
  const element = typeof elementOrId === 'string' ? getElement(elementOrId) : elementOrId;
  if (element) {
    element.style.display = element.style.display === 'none' ? 'block' : 'none';
  }
}

/**
 * Set element text content safely
 * @param {string|HTMLElement} elementOrId - Element or element ID
 * @param {string} text - Text to set
 */
export function setElementText(elementOrId, text) {
  const element = typeof elementOrId === 'string' ? getElement(elementOrId) : elementOrId;
  if (element) {
    element.textContent = text;
  }
}

/**
 * Set element HTML content safely
 * @param {string|HTMLElement} elementOrId - Element or element ID
 * @param {string} html - HTML to set
 */
export function setElementHTML(elementOrId, html) {
  const element = typeof elementOrId === 'string' ? getElement(elementOrId) : elementOrId;
  if (element) {
    element.innerHTML = html;
  }
}

/**
 * Add CSS class to element
 * @param {string|HTMLElement} elementOrId - Element or element ID
 * @param {string} className - CSS class to add
 */
export function addElementClass(elementOrId, className) {
  const element = typeof elementOrId === 'string' ? getElement(elementOrId) : elementOrId;
  if (element) {
    element.classList.add(className);
  }
}

/**
 * Remove CSS class from element
 * @param {string|HTMLElement} elementOrId - Element or element ID
 * @param {string} className - CSS class to remove
 */
export function removeElementClass(elementOrId, className) {
  const element = typeof elementOrId === 'string' ? getElement(elementOrId) : elementOrId;
  if (element) {
    element.classList.remove(className);
  }
}

/**
 * Toggle CSS class on element
 * @param {string|HTMLElement} elementOrId - Element or element ID
 * @param {string} className - CSS class to toggle
 */
export function toggleElementClass(elementOrId, className) {
  const element = typeof elementOrId === 'string' ? getElement(elementOrId) : elementOrId;
  if (element) {
    element.classList.toggle(className);
  }
}

/**
 * Set element style property
 * @param {string|HTMLElement} elementOrId - Element or element ID
 * @param {string} property - CSS property name
 * @param {string} value - CSS property value
 */
export function setElementStyle(elementOrId, property, value) {
  const element = typeof elementOrId === 'string' ? getElement(elementOrId) : elementOrId;
  if (element) {
    element.style[property] = value;
  }
}

/**
 * Set temporary element color that reverts after a delay
 * @param {string|HTMLElement} elementOrId - Element or element ID
 * @param {string} color - Color to set
 * @param {number} duration - Duration in ms before reverting
 * @param {string} originalColor - Color to revert to (default: '#ffffff')
 */
export function setTemporaryElementColor(elementOrId, color, duration = 3000, originalColor = '#ffffff') {
  const element = typeof elementOrId === 'string' ? getElement(elementOrId) : elementOrId;
  if (element) {
    element.style.color = color;
    setTimeout(() => {
      element.style.color = originalColor;
    }, duration);
  }
}

/**
 * Create and show a temporary notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
 * @param {number} duration - Duration in ms (default: 3000)
 */
export function showNotification(message, type = 'info', duration = 3000) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style the notification
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '10000';
  notification.style.color = 'white';
  notification.style.fontFamily = 'Arial, sans-serif';
  notification.style.fontSize = '14px';
  notification.style.maxWidth = '300px';
  notification.style.wordWrap = 'break-word';
  
  // Set background color based on type
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196F3'
  };
  notification.style.backgroundColor = colors[type] || colors.info;
  
  // Add to page
  document.body.appendChild(notification);
  
  // Remove after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, duration);
}

/**
 * Clear the cache (useful for testing or when elements are dynamically added/removed)
 */
export function clearElementCache() {
  cachedElements = {};
  console.log('🗑️ UI element cache cleared');
}

/**
 * Check if element exists in DOM
 * @param {string} id - Element ID
 * @returns {boolean} True if element exists
 */
export function elementExists(id) {
  return document.getElementById(id) !== null;
}

/**
 * Wait for element to exist in DOM
 * @param {string} id - Element ID
 * @param {number} timeout - Timeout in ms (default: 5000)
 * @returns {Promise<HTMLElement>} Promise that resolves with the element
 */
export function waitForElement(id, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = getElement(id);
    if (element) {
      resolve(element);
      return;
    }
    
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const element = document.getElementById(id);
      if (element) {
        clearInterval(checkInterval);
        cachedElements[id] = element; // Cache it
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error(`Element with ID '${id}' not found within ${timeout}ms`));
      }
    }, 100);
  });
}

// Export the cached elements for direct access if needed
export { cachedElements };