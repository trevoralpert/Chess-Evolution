// Game State Management Module
// Functions for managing game state, player states, turns, and core game mechanics

import { createDefaultGameState, GAME_MODES, PLAYER_STATES } from './gameConfig.js';
import { getElement, setElementText, setElementHTML } from './uiReferences.js';

// Current game state
let currentGameState = createDefaultGameState();
let currentGameMode = null;
let currentPlayerId = null;
let isGameActive = false;

/**
 * Initialize game state
 * @param {object} initialState - Initial game state data
 */
export function initializeGameState(initialState = null) {
  console.log('🎮 Initializing game state...', initialState);
  
  if (initialState) {
    currentGameState = { ...initialState };
  } else {
    currentGameState = createDefaultGameState();
  }
  
  isGameActive = true;
  
  console.log('✅ Game state initialized:', currentGameState);
}

/**
 * Get current game state
 * @returns {object} Current game state
 */
export function getGameState() {
  return { ...currentGameState };
}

/**
 * Update game state
 * @param {object} newState - New game state data
 */
export function updateGameState(newState) {
  console.log('🔄 Updating game state:', newState);
  
  // Merge new state with current state
  currentGameState = {
    ...currentGameState,
    ...newState,
    players: { ...currentGameState.players, ...newState.players },
    pieces: { ...currentGameState.pieces, ...newState.pieces }
  };
  
  console.log('✅ Game state updated:', currentGameState);
}

/**
 * Set current player ID
 * @param {string} playerId - Player ID
 */
export function setCurrentPlayerId(playerId) {
  currentPlayerId = playerId;
  console.log('👤 Current player ID set to:', playerId);
}

/**
 * Get current player ID
 * @returns {string} Current player ID
 */
export function getCurrentPlayerId() {
  return currentPlayerId;
}

/**
 * Set game mode
 * @param {string} gameMode - Game mode
 */
export function setGameMode(gameMode) {
  currentGameMode = gameMode;
  console.log('🎮 Game mode set to:', gameMode);
}

/**
 * Get current game mode
 * @returns {string} Current game mode
 */
export function getGameMode() {
  return currentGameMode;
}

/**
 * Check if game is active
 * @returns {boolean} True if game is active
 */
export function getIsGameActive() {
  return isGameActive;
}

/**
 * Set game active state
 * @param {boolean} active - Game active state
 */
export function setGameActive(active) {
  isGameActive = active;
  console.log('🎮 Game active state:', active);
}

/**
 * Add or update player in game state
 * @param {object} player - Player data
 */
export function addOrUpdatePlayer(player) {
  if (!player || !player.id) {
    console.warn('⚠️ Invalid player data:', player);
    return;
  }
  
  currentGameState.players[player.id] = {
    ...currentGameState.players[player.id],
    ...player
  };
  
  console.log('👤 Player added/updated:', player.id, currentGameState.players[player.id]);
}

/**
 * Remove player from game state
 * @param {string} playerId - Player ID to remove
 */
export function removePlayer(playerId) {
  if (currentGameState.players[playerId]) {
    delete currentGameState.players[playerId];
    console.log('👤 Player removed:', playerId);
  }
}

/**
 * Get player by ID
 * @param {string} playerId - Player ID
 * @returns {object|null} Player data or null
 */
export function getPlayer(playerId) {
  return currentGameState.players[playerId] || null;
}

/**
 * Get all players
 * @returns {object} All players
 */
export function getAllPlayers() {
  return { ...currentGameState.players };
}

/**
 * Get player count
 * @returns {number} Number of players
 */
export function getPlayerCount() {
  return Object.keys(currentGameState.players).length;
}

/**
 * Add or update piece in game state
 * @param {object} piece - Piece data
 */
export function addOrUpdatePiece(piece) {
  if (!piece || !piece.id) {
    console.warn('⚠️ Invalid piece data:', piece);
    return;
  }
  
  currentGameState.pieces[piece.id] = {
    ...currentGameState.pieces[piece.id],
    ...piece
  };
  
  console.log('♟️ Piece added/updated:', piece.id, currentGameState.pieces[piece.id]);
}

/**
 * Remove piece from game state
 * @param {string} pieceId - Piece ID to remove
 */
export function removePiece(pieceId) {
  if (currentGameState.pieces[pieceId]) {
    delete currentGameState.pieces[pieceId];
    console.log('♟️ Piece removed:', pieceId);
  }
}

/**
 * Get piece by ID
 * @param {string} pieceId - Piece ID
 * @returns {object|null} Piece data or null
 */
export function getPiece(pieceId) {
  return currentGameState.pieces[pieceId] || null;
}

/**
 * Get all pieces
 * @returns {object} All pieces
 */
export function getAllPieces() {
  return { ...currentGameState.pieces };
}

/**
 * Get pieces by player ID
 * @param {string} playerId - Player ID
 * @returns {Array} Array of pieces belonging to the player
 */
export function getPlayerPieces(playerId) {
  return Object.values(currentGameState.pieces).filter(piece => piece.playerId === playerId);
}

/**
 * Get piece at position
 * @param {number} row - Grid row
 * @param {number} col - Grid column
 * @returns {object|null} Piece at position or null
 */
export function getPieceAtPosition(row, col) {
  return Object.values(currentGameState.pieces).find(piece => 
    piece.row === row && piece.col === col
  ) || null;
}

/**
 * Check if position is occupied
 * @param {number} row - Grid row
 * @param {number} col - Grid column
 * @returns {boolean} True if position is occupied
 */
export function isPositionOccupied(row, col) {
  return getPieceAtPosition(row, col) !== null;
}

/**
 * Get active player
 * @returns {object|null} Active player or null
 */
export function getActivePlayer() {
  return Object.values(currentGameState.players).find(player => player.isActive) || null;
}

/**
 * Set active player
 * @param {string} playerId - Player ID to set as active
 */
export function setActivePlayer(playerId) {
  // Clear all active states
  Object.values(currentGameState.players).forEach(player => {
    player.isActive = false;
  });
  
  // Set new active player
  if (currentGameState.players[playerId]) {
    currentGameState.players[playerId].isActive = true;
    console.log('👤 Active player set to:', playerId);
  }
}

/**
 * Get game winner
 * @returns {object|null} Winner player or null
 */
export function getGameWinner() {
  return Object.values(currentGameState.players).find(player => player.hasWon) || null;
}

/**
 * Set game winner
 * @param {string} playerId - Winner player ID
 */
export function setGameWinner(playerId) {
  if (currentGameState.players[playerId]) {
    currentGameState.players[playerId].hasWon = true;
    isGameActive = false;
    console.log('🏆 Game winner set to:', playerId);
  }
}

/**
 * Check if game is over
 * @returns {boolean} True if game is over
 */
export function isGameOver() {
  return !isGameActive || getGameWinner() !== null;
}

/**
 * Reset game state
 */
export function resetGameState() {
  console.log('🔄 Resetting game state...');
  
  currentGameState = createDefaultGameState();
  currentGameMode = null;
  currentPlayerId = null;
  isGameActive = false;
  
  console.log('✅ Game state reset');
}

/**
 * Get game statistics
 * @returns {object} Game statistics
 */
export function getGameStatistics() {
  const players = Object.values(currentGameState.players);
  const pieces = Object.values(currentGameState.pieces);
  
  return {
    playerCount: players.length,
    totalPieces: pieces.length,
    activePieces: pieces.filter(piece => !piece.captured).length,
    capturedPieces: pieces.filter(piece => piece.captured).length,
    gameMode: currentGameMode,
    isActive: isGameActive,
    winner: getGameWinner()?.id || null
  };
}

/**
 * Validate game state
 * @returns {object} Validation result
 */
export function validateGameState() {
  const errors = [];
  const warnings = [];
  
  // Check players
  const players = Object.values(currentGameState.players);
  if (players.length === 0) {
    errors.push('No players in game');
  }
  
  // Check pieces
  const pieces = Object.values(currentGameState.pieces);
  if (pieces.length === 0) {
    warnings.push('No pieces in game');
  }
  
  // Check for duplicate positions
  const positions = new Set();
  pieces.forEach(piece => {
    const posKey = `${piece.row},${piece.col}`;
    if (positions.has(posKey)) {
      errors.push(`Multiple pieces at position (${piece.row}, ${piece.col})`);
    }
    positions.add(posKey);
  });
  
  // Check active player
  const activePlayers = players.filter(player => player.isActive);
  if (activePlayers.length > 1) {
    errors.push('Multiple active players');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Export game state for saving/transmission
 * @returns {object} Exportable game state
 */
export function exportGameState() {
  return {
    gameState: { ...currentGameState },
    gameMode: currentGameMode,
    currentPlayerId: currentPlayerId,
    isGameActive: isGameActive,
    timestamp: Date.now()
  };
}

/**
 * Import game state from save/transmission
 * @param {object} exportedState - Exported game state
 */
export function importGameState(exportedState) {
  if (!exportedState || !exportedState.gameState) {
    console.warn('⚠️ Invalid exported state:', exportedState);
    return;
  }
  
  currentGameState = { ...exportedState.gameState };
  currentGameMode = exportedState.gameMode || null;
  currentPlayerId = exportedState.currentPlayerId || null;
  isGameActive = exportedState.isGameActive || false;
  
  console.log('📥 Game state imported:', exportedState);
}

/**
 * Get game state summary for UI display
 * @returns {object} Game state summary
 */
export function getGameStateSummary() {
  const players = Object.values(currentGameState.players);
  const pieces = Object.values(currentGameState.pieces);
  const activePlayer = getActivePlayer();
  
  return {
    playerCount: players.length,
    pieceCount: pieces.length,
    activePlayer: activePlayer ? {
      id: activePlayer.id,
      name: activePlayer.name || 'Unknown'
    } : null,
    gameMode: currentGameMode,
    isActive: isGameActive,
    isGameOver: isGameOver()
  };
}

/**
 * Update UI with current game state
 */
export function updateGameStateUI() {
  const summary = getGameStateSummary();
  
  // Update player count
  const playerCountEl = getElement('player-count');
  if (playerCountEl) {
    setElementText(playerCountEl, `Players: ${summary.playerCount}`);
  }
  
  // Update game info
  const gameInfoEl = getElement('game-info');
  if (gameInfoEl) {
    const infoHTML = `
      <div class="game-info-item">Mode: ${summary.gameMode || 'Unknown'}</div>
      <div class="game-info-item">Pieces: ${summary.pieceCount}</div>
      ${summary.activePlayer ? 
        `<div class="game-info-item">Turn: ${summary.activePlayer.name}</div>` : ''
      }
    `;
    setElementHTML(gameInfoEl, infoHTML);
  }
  
  // Update status
  const statusEl = getElement('status');
  if (statusEl) {
    let status = 'Ready';
    if (!summary.isActive) {
      status = 'Game Not Started';
    } else if (summary.isGameOver) {
      status = 'Game Over';
    } else if (summary.activePlayer) {
      status = `${summary.activePlayer.name}'s Turn`;
    }
    
    setElementText(statusEl, status);
  }
}

/**
 * Subscribe to game state changes
 * @param {Function} callback - Callback function to call on state changes
 * @returns {Function} Unsubscribe function
 */
const stateChangeListeners = [];

export function subscribeToStateChanges(callback) {
  stateChangeListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = stateChangeListeners.indexOf(callback);
    if (index > -1) {
      stateChangeListeners.splice(index, 1);
    }
  };
}

/**
 * Notify state change listeners
 * @param {string} changeType - Type of change
 * @param {any} data - Change data
 */
export function notifyStateChange(changeType, data) {
  stateChangeListeners.forEach(listener => {
    try {
      listener(changeType, data, getGameState());
    } catch (error) {
      console.error('Error in state change listener:', error);
    }
  });
}

// Enhanced update functions that notify listeners
const originalUpdateGameState = updateGameState;
updateGameState = (newState) => {
  originalUpdateGameState(newState);
  notifyStateChange('gameState', newState);
  updateGameStateUI();
};

const originalAddOrUpdatePlayer = addOrUpdatePlayer;
addOrUpdatePlayer = (player) => {
  originalAddOrUpdatePlayer(player);
  notifyStateChange('player', player);
  updateGameStateUI();
};

const originalAddOrUpdatePiece = addOrUpdatePiece;
addOrUpdatePiece = (piece) => {
  originalAddOrUpdatePiece(piece);
  notifyStateChange('piece', piece);
  updateGameStateUI();
};

// Export the enhanced functions
export { updateGameState, addOrUpdatePlayer, addOrUpdatePiece };