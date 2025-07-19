console.log('🚀 Starting main-simple-modular.js - Modular Architecture 🚀');

// Import all modules
import { GameInitialization } from './modules/gameInitialization.js';
import { SocketManager } from './modules/socketManager.js';
import { SceneManager } from './modules/sceneManager.js';
import { GameStateManager } from './modules/gameStateManager.js';
import { MouseInteraction } from './modules/mouseInteraction.js';
import { PieceMeshManager } from './modules/pieceMeshManager.js';
import { VisualEffects } from './modules/visualEffects.js';

// Check if Three.js is loaded
if (typeof THREE === 'undefined') {
  console.error('Three.js not loaded!');
} else {
  console.log('Three.js loaded successfully:', THREE);
}

// Global module instances
let gameInit;
let socketManager;
let sceneManager;
let gameStateManager;
let mouseInteraction;
let pieceMeshManager;
let visualEffects;

// Initialize the game
async function initializeGame() {
  console.log('🎮 Initializing modular game architecture...');
  
  try {
    // Initialize all modules
    gameInit = new GameInitialization();
    socketManager = new SocketManager();
    sceneManager = new SceneManager();
    gameStateManager = new GameStateManager();
    mouseInteraction = new MouseInteraction();
    pieceMeshManager = new PieceMeshManager();
    visualEffects = new VisualEffects();
    
    // Make modules globally accessible for cross-module communication
    window.gameInit = gameInit;
    window.socketManager = socketManager;
    window.sceneManager = sceneManager;
    window.gameStateManager = gameStateManager;
    window.mouseInteraction = mouseInteraction;
    window.pieceMeshManager = pieceMeshManager;
    window.visualEffects = visualEffects;
    
    // Initialize modules in order
    await gameInit.initializeGame();
    socketManager.initialize();
    sceneManager.initialize();
    gameStateManager.initialize();
    mouseInteraction.initialize();
    pieceMeshManager.initialize();
    visualEffects.initialize();
    
    // Set up inter-module event listeners
    setupInterModuleEvents();
    
    console.log('✅ All modules initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize game modules:', error);
  }
}

// Set up event listeners for inter-module communication
function setupInterModuleEvents() {
  console.log('🔗 Setting up inter-module event listeners...');
  
  // Game state events
  document.addEventListener('selectPiece', (event) => {
    gameStateManager.selectPiece(event.detail.pieceId);
  });
  
  document.addEventListener('deselectPiece', () => {
    gameStateManager.deselectPiece();
  });
  
  // Game over events
  document.addEventListener('gameEnded', (event) => {
    const { winner, stats } = event.detail;
    gameInit.showGameOver(winner, stats);
  });
  
  // Return to menu events
  document.addEventListener('returnToMenu', () => {
    // Clean up resources and reset state
    if (socketManager) {
      socketManager.disconnect();
    }
    
    // Reload page to fully reset (temporary solution)
    if (window.location.reload) {
      window.location.reload();
    }
  });
  
  // Notification events
  document.addEventListener('showNotification', (event) => {
    const { message, color, duration } = event.detail;
    showNotification(message, color, duration);
  });
  
  // Move choice dialog events
  document.addEventListener('showMoveChoiceDialog', (event) => {
    const { pieceId, targetRow, targetCol, moveOptions } = event.detail;
    showMoveChoiceDialog(pieceId, targetRow, targetCol, moveOptions);
  });
  
  console.log('✅ Inter-module events set up successfully');
}

// Utility functions that are still needed globally
function showNotification(message, color, duration = 3000) {
  console.log('📢 Notification:', message);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: ${color};
    padding: 10px 20px;
    border-radius: 5px;
    border: 1px solid ${color};
    z-index: 10000;
    font-size: 14px;
    font-weight: bold;
    max-width: 300px;
    word-wrap: break-word;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after duration
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, duration);
}

// Move choice dialog for splitters
function showMoveChoiceDialog(pieceId, targetRow, targetCol, moveOptions) {
  // Create dialog HTML
  const dialogHtml = `
    <div id="move-choice-dialog" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      border: 2px solid #ff6b6b;
      border-radius: 10px;
      padding: 20px;
      color: white;
      text-align: center;
      z-index: 10000;
      min-width: 300px;
      max-width: 400px;
    ">
      <h3 style="margin: 0 0 20px 0; color: #ff6b6b;">Choose Action</h3>
      <p style="margin-bottom: 20px;">Position (${targetRow}, ${targetCol}) - Multiple actions available:</p>
      
      <div style="display: flex; gap: 10px; justify-content: center;">
        <button id="move-choice-regular" style="
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          pointer-events: auto;
          position: relative;
          z-index: 10001;
        ">
          <div style="font-size: 24px;">→</div>
          <div>Move</div>
          <div style="font-size: 12px; opacity: 0.8;">Regular movement</div>
        </button>
        
        <button id="move-choice-split" style="
          background-color: #ff6b6b;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          pointer-events: auto;
          position: relative;
          z-index: 10001;
        ">
          <div style="font-size: 24px;">⧨</div>
          <div>Split</div>
          <div style="font-size: 12px; opacity: 0.8;">Create two pieces</div>
        </button>
      </div>
      
      <button id="move-choice-cancel" style="
        background-color: #666;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        margin-top: 15px;
        pointer-events: auto;
        position: relative;
        z-index: 10001;
      ">Cancel</button>
    </div>
  `;
  
  // Add to document
  document.body.insertAdjacentHTML('beforeend', dialogHtml);
  
  // Add event listeners
  document.getElementById('move-choice-regular').addEventListener('click', function() {
    mouseInteraction.executeMove(pieceId, targetRow, targetCol, 'move');
    closeMoveChoiceDialog();
  });
  
  document.getElementById('move-choice-split').addEventListener('click', function() {
    mouseInteraction.executeMove(pieceId, targetRow, targetCol, 'split');
    closeMoveChoiceDialog();
  });
  
  document.getElementById('move-choice-cancel').addEventListener('click', function() {
    closeMoveChoiceDialog();
  });
}

function closeMoveChoiceDialog() {
  const dialog = document.getElementById('move-choice-dialog');
  if (dialog) {
    dialog.remove();
  }
}

// Legacy support functions for existing HTML onclick handlers
window.chooseEvolution = function(pieceId, evolutionPath) {
  if (window.globalSocket) {
    window.globalSocket.emit('evolution-choice-response', {
      pieceId: pieceId,
      choice: { evolutionPath: evolutionPath }
    });
  }
  closeEvolutionDialog();
};

window.bankEvolutionPoints = function(pieceId) {
  if (window.globalSocket) {
    window.globalSocket.emit('evolution-choice-response', {
      pieceId: pieceId,
      choice: 'bank'
    });
  }
  closeEvolutionDialog();
};

function closeEvolutionDialog() {
  const dialog = document.getElementById('evolution-choice-dialog');
  if (dialog) {
    dialog.remove();
  }
  
  // Clear countdown timer
  if (window.evolutionCountdown) {
    clearInterval(window.evolutionCountdown);
    window.evolutionCountdown = null;
  }
}

// Start the game initialization
initializeGame();