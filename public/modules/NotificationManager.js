// Notification system for EvoChess
// Handles toast notifications, alerts, and user messaging

/**
 * Show a notification message to the user
 * @param {string} message - The message to display
 * @param {string} color - The color for the notification (hex color or CSS color name)
 * @param {number} duration - Duration in milliseconds to show the notification
 */
function showNotification(message, color, duration = 3000) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: ${color};
    padding: 20px;
    border-radius: 10px;
    text-align: center;
    z-index: 1000;
    font-size: 24px;
    font-weight: bold;
    border: 3px solid ${color};
    animation: pulse 1s infinite;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Remove notification after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, duration);
}

/**
 * Show a notification with predefined styling based on type
 * @param {string} title - The notification title
 * @param {string} message - The message to display
 * @param {string} type - Type of notification: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in milliseconds (optional)
 */
function showTypedNotification(title, message, type = 'info', duration) {
  const colors = {
    success: '#00ff00',
    error: '#ff0000',
    warning: '#ff8800',
    info: '#0088ff'
  };
  
  const color = colors[type] || colors.info;
  const defaultDurations = {
    success: 2000,
    error: 4000,
    warning: 3000,
    info: 2500
  };
  
  const finalDuration = duration || defaultDurations[type] || 3000;
  const fullMessage = title ? `${title}: ${message}` : message;
  
  showNotification(fullMessage, color, finalDuration);
}

/**
 * Show a small corner notification (for AI players, etc.)
 * @param {string} message - The message to display
 * @param {string} backgroundColor - Background color
 * @param {number} duration - Duration in milliseconds
 * @param {string} position - Position: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
 */
function showCornerNotification(message, backgroundColor = '#00cc66', duration = 3000, position = 'top-right') {
  const notification = document.createElement('div');
  
  // Position styles
  const positions = {
    'top-right': 'top: 50px; right: 20px;',
    'top-left': 'top: 50px; left: 20px;',
    'bottom-right': 'bottom: 50px; right: 20px;',
    'bottom-left': 'bottom: 50px; left: 20px;'
  };
  
  notification.style.cssText = `
    position: fixed;
    ${positions[position] || positions['top-right']}
    background: ${backgroundColor};
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 1000;
    font-size: 14px;
    max-width: 300px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, duration);
}

/**
 * Show an AI move notification with special styling
 * @param {string} aiName - Name of the AI player
 * @param {string} moveResult - Description of the AI's move
 * @param {number} duration - Duration in milliseconds
 */
function showAINotification(aiName, moveResult, duration = 2000) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: rgba(0, 204, 102, 0.9);
    color: white;
    padding: 8px;
    border-radius: 3px;
    z-index: 1000;
    font-size: 12px;
    max-width: 300px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;
  
  notification.textContent = `🤖 ${aiName}: ${moveResult}`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, duration);
}

/**
 * Show an AI player added notification
 * @param {string} aiName - Name of the AI player
 * @param {string} difficulty - Difficulty level
 * @param {number} duration - Duration in milliseconds
 */
function showAIPlayerAddedNotification(aiName, difficulty, duration = 3000) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50px;
    right: 20px;
    background: #00cc66;
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 1000;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;
  
  notification.textContent = `🤖 AI Player Added: ${aiName} (${difficulty})`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, duration);
}

/**
 * Show a battle/evolution notification with special effects
 * @param {string} message - The message to display
 * @param {string} color - Color for the notification
 * @param {number} duration - Duration in milliseconds
 */
function showBattleNotification(message, color = '#ff6b6b', duration = 3000) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.95);
    color: ${color};
    padding: 25px;
    border-radius: 15px;
    text-align: center;
    z-index: 1001;
    font-size: 28px;
    font-weight: bold;
    border: 4px solid ${color};
    box-shadow: 0 0 20px ${color};
    animation: battlePulse 0.5s ease-in-out;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, duration);
}

/**
 * Show a turn notification
 * @param {string} playerName - Name of the player whose turn it is
 * @param {boolean} isYourTurn - Whether it's the current player's turn
 */
function showTurnNotification(playerName, isYourTurn = false) {
  const message = isYourTurn ? 'Your Turn!' : `${playerName}'s Turn`;
  const color = isYourTurn ? '#00ff00' : '#ffaa00';
  const duration = isYourTurn ? 2000 : 1500;
  
  showCornerNotification(message, color, duration, 'top-left');
}

/**
 * Show an evolution notification with special styling
 * @param {string} playerName - Name of the player
 * @param {string} oldType - Original piece type
 * @param {string} newType - New piece type after evolution
 */
function showEvolutionNotification(playerName, oldType, newType) {
  const message = `${playerName}'s ${oldType} evolved to ${newType}!`;
  showBattleNotification(message, '#00ff88', 4000);
}

/**
 * Show an elimination notification
 * @param {string} playerName - Name of the eliminated player
 * @param {string} reason - Reason for elimination
 * @param {boolean} isYou - Whether the current player was eliminated
 */
function showEliminationNotification(playerName, reason, isYou = false) {
  const message = isYou 
    ? `You have been eliminated! ${reason}`
    : `${playerName} has been eliminated! ${reason}`;
  const color = isYou ? '#ff0000' : '#ff8800';
  const duration = isYou ? 5000 : 3000;
  
  showBattleNotification(message, color, duration);
}

/**
 * Show a victory notification
 * @param {string} message - Victory message
 */
function showVictoryNotification(message) {
  showBattleNotification(message, '#ffd700', 6000);
}

/**
 * Show a game event notification (game start, player join, etc.)
 * @param {string} title - Event title
 * @param {string} message - Event message
 * @param {string} type - Type of event: 'start', 'join', 'ready', etc.
 */
function showGameEventNotification(title, message, type = 'info') {
  showTypedNotification(title, message, type);
}

/**
 * Clear all notifications from the screen
 */
function clearAllNotifications() {
  // Find all notification elements and remove them
  const notifications = document.querySelectorAll('[style*="position: fixed"][style*="z-index: 100"]');
  notifications.forEach(notification => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });
}

/**
 * Add CSS animations for notifications
 */
function addNotificationStyles() {
  // Check if styles already exist
  if (document.getElementById('notification-styles')) {
    return;
  }
  
  const style = document.createElement('style');
  style.id = 'notification-styles';
  style.textContent = `
    @keyframes pulse {
      0% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(1.05); }
      100% { transform: translate(-50%, -50%) scale(1); }
    }
    
    @keyframes slideIn {
      0% { 
        opacity: 0;
        transform: translateX(100%);
      }
      100% { 
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes battlePulse {
      0% { 
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 0;
      }
      50% { 
        transform: translate(-50%, -50%) scale(1.1);
        opacity: 1;
      }
      100% { 
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
    }
  `;
  
  document.head.appendChild(style);
}

// Initialize notification styles when module loads
addNotificationStyles();

export {
  showNotification,
  showTypedNotification,
  showCornerNotification,
  showAINotification,
  showAIPlayerAddedNotification,
  showBattleNotification,
  showTurnNotification,
  showEvolutionNotification,
  showEliminationNotification,
  showVictoryNotification,
  showGameEventNotification,
  clearAllNotifications,
  addNotificationStyles
};