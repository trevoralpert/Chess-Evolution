// Menu System Module
// Functions for main menu, game over screen, and general menu management

import { getElement, showElement, hideElement, setElementText, setElementHTML } from './uiReferences.js';
import { UI_ELEMENTS } from './gameConfig.js';

/**
 * Initialize the main menu system
 * @param {object} dependencies - Required dependencies (socket, etc.)
 */
export function initMenuSystem(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🎮 Initializing menu system...');
  
  // Get menu elements
  const quickPlayBtn = getElement('quick-play-btn');
  const playerNameInput = getElement('player-name-input');
  
  // Quick Play button
  if (quickPlayBtn) {
    quickPlayBtn.addEventListener('click', () => {
      const playerName = playerNameInput?.value.trim() || 'Anonymous';
      console.log('🚀 Starting quick play as:', playerName);
      
      if (socket) {
        socket.emit('join-game', { 
          playerName, 
          gameMode: 'quickplay' 
        });
      }
      
      hideElement(UI_ELEMENTS.menuScreen);
      showElement(UI_ELEMENTS.gameUI);
    });
  }
  
  // VS AI button
  const vsAIBtn = getElement('vs-ai-btn');
  if (vsAIBtn) {
    vsAIBtn.addEventListener('click', () => {
      alert('VS AI mode coming soon!\n\nAI functionality is implemented on the server but needs UI integration.');
    });
  }
  
  // Tournament button
  const tournamentBtn = getElement('tournament-btn');
  if (tournamentBtn) {
    tournamentBtn.addEventListener('click', () => {
      alert('Tournament mode coming soon!\n\nTournament functionality is implemented on the server but needs UI integration.');
    });
  }
  
  // Spectator button
  const spectatorBtn = getElement('spectator-btn');
  if (spectatorBtn) {
    spectatorBtn.addEventListener('click', () => {
      alert('Spectator mode coming soon!\n\nSpectator functionality is implemented on the server but needs UI integration.');
    });
  }
  
  console.log('✅ Menu system initialized');
}

/**
 * Return to main menu
 * @param {object} dependencies - Required dependencies
 */
export function returnToMenu(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🏠 Returning to menu...');
  
  // Hide game UI elements
  hideElement(UI_ELEMENTS.gameUI);
  hideElement(UI_ELEMENTS.gameOverScreen);
  hideElement(UI_ELEMENTS.timingUI);
  
  // Show menu screen
  showElement(UI_ELEMENTS.menuScreen);
  
  // Disconnect from current game if connected
  if (socket) {
    socket.emit('leave-game');
  }
  
  console.log('✅ Returned to menu');
}

/**
 * Show game over screen with results
 * @param {string} winner - Winner information
 * @param {object} stats - Game statistics
 */
export function showGameOver(winner, stats = {}) {
  console.log('🏁 Showing game over screen:', { winner, stats });
  
  // Hide game UI
  hideElement(UI_ELEMENTS.gameUI);
  hideElement(UI_ELEMENTS.timingUI);
  
  // Show game over screen
  const gameOverScreen = getElement(UI_ELEMENTS.gameOverScreen);
  if (gameOverScreen) {
    showElement(gameOverScreen);
    
    // Update winner display
    const winnerElement = getElement('game-over-winner');
    if (winnerElement) {
      setElementText(winnerElement, winner || 'Game Over');
    }
    
    // Update statistics display
    const statsElement = getElement('game-over-stats');
    if (statsElement && stats) {
      const statsHTML = formatGameStats(stats);
      setElementHTML(statsElement, statsHTML);
    }
    
    // Set up return to menu button
    const returnBtn = getElement('return-to-menu-btn');
    if (returnBtn) {
      returnBtn.onclick = () => returnToMenu();
    }
  }
  
  console.log('✅ Game over screen displayed');
}

/**
 * Format game statistics for display
 * @param {object} stats - Game statistics
 * @returns {string} HTML formatted statistics
 */
export function formatGameStats(stats) {
  if (!stats || typeof stats !== 'object') {
    return '<p>No statistics available</p>';
  }
  
  let html = '<div class="game-stats">';
  
  // Game duration
  if (stats.duration) {
    html += `<div class="stat-item">
      <span class="stat-label">Game Duration:</span>
      <span class="stat-value">${formatDuration(stats.duration)}</span>
    </div>`;
  }
  
  // Total moves
  if (stats.totalMoves) {
    html += `<div class="stat-item">
      <span class="stat-label">Total Moves:</span>
      <span class="stat-value">${stats.totalMoves}</span>
    </div>`;
  }
  
  // Player statistics
  if (stats.players && Array.isArray(stats.players)) {
    html += '<div class="player-stats">';
    stats.players.forEach((player, index) => {
      html += `<div class="player-stat">
        <h4>Player ${index + 1}: ${player.name || 'Unknown'}</h4>
        <div class="player-details">
          <span>Pieces Captured: ${player.captured || 0}</span>
          <span>Moves Made: ${player.moves || 0}</span>
          <span>Evolution Points: ${player.evolutionPoints || 0}</span>
        </div>
      </div>`;
    });
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

/**
 * Format duration in milliseconds to readable string
 * @param {number} duration - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(duration) {
  if (!duration || duration < 0) return '0:00';
  
  const totalSeconds = Math.floor(duration / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Show confirmation dialog
 * @param {string} message - Message to display
 * @param {Function} onConfirm - Callback for confirmation
 * @param {Function} onCancel - Callback for cancellation
 */
export function showConfirmationDialog(message, onConfirm, onCancel) {
  // Create dialog element
  const dialog = document.createElement('div');
  dialog.className = 'confirmation-dialog';
  dialog.innerHTML = `
    <div class="dialog-overlay">
      <div class="dialog-content">
        <p class="dialog-message">${message}</p>
        <div class="dialog-buttons">
          <button class="dialog-btn confirm-btn">Confirm</button>
          <button class="dialog-btn cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  // Style the dialog
  dialog.style.position = 'fixed';
  dialog.style.top = '0';
  dialog.style.left = '0';
  dialog.style.width = '100%';
  dialog.style.height = '100%';
  dialog.style.zIndex = '10000';
  dialog.style.display = 'flex';
  dialog.style.alignItems = 'center';
  dialog.style.justifyContent = 'center';
  
  // Add event listeners
  const confirmBtn = dialog.querySelector('.confirm-btn');
  const cancelBtn = dialog.querySelector('.cancel-btn');
  
  const cleanup = () => {
    if (dialog.parentNode) {
      dialog.parentNode.removeChild(dialog);
    }
  };
  
  confirmBtn.addEventListener('click', () => {
    cleanup();
    if (onConfirm) onConfirm();
  });
  
  cancelBtn.addEventListener('click', () => {
    cleanup();
    if (onCancel) onCancel();
  });
  
  // Add to DOM
  document.body.appendChild(dialog);
  
  return {
    close: cleanup
  };
}

/**
 * Show loading screen
 * @param {string} message - Loading message
 * @returns {object} Loading screen controller
 */
export function showLoadingScreen(message = 'Loading...') {
  const loading = document.createElement('div');
  loading.className = 'loading-screen';
  loading.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    </div>
  `;
  
  // Style the loading screen
  loading.style.position = 'fixed';
  loading.style.top = '0';
  loading.style.left = '0';
  loading.style.width = '100%';
  loading.style.height = '100%';
  loading.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  loading.style.zIndex = '9999';
  loading.style.display = 'flex';
  loading.style.alignItems = 'center';
  loading.style.justifyContent = 'center';
  loading.style.color = 'white';
  
  document.body.appendChild(loading);
  
  return {
    updateMessage: (newMessage) => {
      const messageEl = loading.querySelector('.loading-message');
      if (messageEl) {
        messageEl.textContent = newMessage;
      }
    },
    hide: () => {
      if (loading.parentNode) {
        loading.parentNode.removeChild(loading);
      }
    }
  };
}

/**
 * Show notification toast
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
 * @param {number} duration - Duration in ms
 */
export function showNotificationToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `notification-toast toast-${type}`;
  toast.textContent = message;
  
  // Style the toast
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.right = '20px';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '6px';
  toast.style.color = 'white';
  toast.style.fontWeight = 'bold';
  toast.style.zIndex = '10001';
  toast.style.maxWidth = '300px';
  toast.style.wordWrap = 'break-word';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  toast.style.transform = 'translateX(100%)';
  toast.style.transition = 'transform 0.3s ease';
  
  // Set background color based on type
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196F3'
  };
  toast.style.backgroundColor = colors[type] || colors.info;
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto-remove
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
  
  return toast;
}

/**
 * Initialize menu keyboard shortcuts
 */
export function initMenuKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Escape key returns to menu (if not in input field)
    if (event.key === 'Escape' && event.target.tagName !== 'INPUT') {
      const gameUI = getElement(UI_ELEMENTS.gameUI);
      const menuScreen = getElement(UI_ELEMENTS.menuScreen);
      
      if (gameUI && gameUI.style.display !== 'none' && 
          menuScreen && menuScreen.style.display === 'none') {
        showConfirmationDialog(
          'Are you sure you want to return to the main menu?',
          () => returnToMenu(),
          null
        );
      }
    }
  });
}

/**
 * Get current menu state
 * @returns {string} Current menu state
 */
export function getCurrentMenuState() {
  const menuScreen = getElement(UI_ELEMENTS.menuScreen);
  const gameUI = getElement(UI_ELEMENTS.gameUI);
  const gameOverScreen = getElement(UI_ELEMENTS.gameOverScreen);
  
  if (menuScreen && menuScreen.style.display !== 'none') return 'menu';
  if (gameUI && gameUI.style.display !== 'none') return 'game';
  if (gameOverScreen && gameOverScreen.style.display !== 'none') return 'gameOver';
  
  return 'unknown';
}