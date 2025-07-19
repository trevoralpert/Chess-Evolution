// Game Logic system for EvoChess
// Handles core game mechanics, state management, piece logic, and move validation

// Game state
let gameState = {
  players: {},
  pieces: {},
  gridConfig: { rows: 20, cols: 8 }
};

// Game variables
let selectedPieceId = null;
let validMoves = [];
let selectedMovementMode = null;

// Piece symbols for different piece types
const pieceSymbols = {
  'PAWN': '♟',
  'ROOK': '♜',
  'KNIGHT': '♞',
  'BISHOP': '♝',
  'QUEEN': '♛',
  'KING': '♚',
  'JUMPER': '⚡',
  'SUPER_JUMPER': '⚡⚡',
  'HYPER_JUMPER': '⚡⚡⚡',
  'SPLITTER': '⧨',
  'HYBRID_QUEEN': '♛⚡',
  'MISTRESS_JUMPER': '⚡♛'
};

/**
 * Initialize game components
 */
function initializeGameComponents() {
  console.log('🎮 Initializing game components...');
  
  // Initialize game state
  gameState = {
    players: {},
    pieces: {},
    gridConfig: { rows: 20, cols: 8 }
  };
  
  // Reset game variables
  selectedPieceId = null;
  validMoves = [];
  selectedMovementMode = null;
  
  console.log('🎮 Game components initialized');
}

/**
 * Start game initialization sequence
 */
function startGameInitialization() {
  console.log('🚀 Starting game initialization...');
  
  // Initialize game components
  initializeGameComponents();
  
  console.log('🚀 Game initialization completed');
}

/**
 * Get current game state
 * @returns {Object} Current game state
 */
function getGameState() {
  return gameState;
}

/**
 * Set game state
 * @param {Object} newGameState - New game state
 */
function setGameState(newGameState) {
  gameState = newGameState;
}

/**
 * Get piece symbols mapping
 * @returns {Object} Piece symbols
 */
function getPieceSymbols() {
  return pieceSymbols;
}

/**
 * Get currently selected piece ID
 * @returns {string|null} Selected piece ID
 */
function getCurrentlySelectedPieceId() {
  return selectedPieceId;
}

/**
 * Set selected piece ID
 * @param {string|null} pieceId - Piece ID to select
 */
function setSelectedPieceId(pieceId) {
  selectedPieceId = pieceId;
}

/**
 * Get valid moves for current selection
 * @returns {Array} Valid moves array
 */
function getValidMoves() {
  return validMoves;
}

/**
 * Set valid moves
 * @param {Array} moves - Array of valid moves
 */
function setValidMoves(moves) {
  validMoves = moves;
}

/**
 * Clear valid moves
 */
function clearValidMoves() {
  validMoves = [];
}

/**
 * Get selected movement mode
 * @returns {string|null} Selected movement mode
 */
function getSelectedMovementMode() {
  return selectedMovementMode;
}

/**
 * Set selected movement mode
 * @param {string|null} mode - Movement mode
 */
function setSelectedMovementMode(mode) {
  selectedMovementMode = mode;
}

/**
 * Get player name from game state
 * @returns {string} Player name
 */
function getPlayerName() {
  // Try to get player name from game state or use default
  const socket = typeof getSocket === 'function' ? getSocket() : (typeof window !== 'undefined' ? window.socket : null);
  if (!socket) return 'Player';
  
  const playerKeys = Object.keys(gameState?.players || {});
  const currentPlayer = playerKeys.find(key => key === socket.id);
  return currentPlayer ? gameState.players[currentPlayer].name : 'Player';
}

/**
 * Enhanced piece color function that prioritizes player identification
 * @param {Object} piece - Piece data
 * @param {Object} player - Player data
 * @param {number} playerIndex - Player index
 * @returns {number} Color hex value
 */
function getPieceColorForPlayer(piece, player, playerIndex) {
  // Check if this is a split piece that should inherit parent color
  if (piece.id && piece.id.includes('-split-')) {
    // For split pieces, find any existing piece with the same player that has a color we can inherit
    let parentColor = null;
    
    const pieceMeshes = typeof getPieceMeshes === 'function' ? getPieceMeshes() : {};
    
    // Search through all existing pieces for the same player to find a color to inherit
    for (const existingPieceId in pieceMeshes) {
      const existingMesh = pieceMeshes[existingPieceId];
      if (existingMesh && existingMesh.userData && existingMesh.userData.piece) {
        const existingPiece = existingMesh.userData.piece;
        
        // If this is the same player and has the same type (SPLITTER), inherit its color
        if (existingPiece.playerId === piece.playerId && 
            existingPiece.type === piece.type &&
            existingPieceId !== piece.id) { // Don't inherit from self
          
          // Try to extract color from this mesh
          if (existingMesh.material) {
            if (Array.isArray(existingMesh.material)) {
              parentColor = existingMesh.material[0].color.clone();
            } else {
              parentColor = existingMesh.material.color.clone();
            }
          }
          
          // If no material on main mesh, check children
          if (!parentColor && existingMesh.children && existingMesh.children.length > 0) {
            for (const child of existingMesh.children) {
              if (child.material && child.material.color) {
                if (Array.isArray(child.material)) {
                  parentColor = child.material[0].color.clone();
                } else {
                  parentColor = child.material.color.clone();
                }
                break;
              }
            }
          }
          
          if (parentColor) {
            console.log(`🎨 SPLIT INHERITANCE: Split piece ${piece.id} inheriting color ${parentColor.getHexString()} from existing ${existingPiece.type} ${existingPieceId}`);
            return parseInt(parentColor.getHexString(), 16);
          }
        }
      }
    }
  }
  
  // Use color manager for standard piece coloring
  const getPlayerColor = typeof window !== 'undefined' && window.getPlayerColor ? window.getPlayerColor : 
                        () => 0xff0000;
  const basePlayerColor = getPlayerColor(piece.playerId, playerIndex);
  
  console.log(`getPieceColorForPlayer: piece=${piece.type}, playerId=${piece.playerId}, baseColor=${basePlayerColor.toString(16)}`);
  return basePlayerColor;
}

/**
 * Highlight selected piece
 * @param {string} pieceId - ID of piece to highlight
 */
function highlightSelectedPiece(pieceId) {
  // Clear previous selection highlights
  clearSelectionHighlights();
  
  const pieceMeshes = typeof getPieceMeshes === 'function' ? getPieceMeshes() : {};
  const piece = pieceMeshes[pieceId];
  if (!piece) return;
  
  // Create selection highlight
  const highlightGeometry = new THREE.RingGeometry(0.4, 0.5, 16);
  const highlightMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  
  const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
  highlight.position.copy(piece.position);
  highlight.position.y += 0.01; // Slightly above the board
  highlight.rotation.x = -Math.PI / 2; // Lay flat
  highlight.userData = { isSelectionHighlight: true };
  
  const scene = typeof getScene === 'function' ? getScene() : 
               (typeof window !== 'undefined' ? window.scene : null);
  if (scene) {
    scene.add(highlight);
  }
}

/**
 * Clear selection highlights
 */
function clearSelectionHighlights() {
  const scene = typeof getScene === 'function' ? getScene() : 
               (typeof window !== 'undefined' ? window.scene : null);
  if (!scene) return;
  
  const toRemove = [];
  scene.traverse((child) => {
    if (child.userData && child.userData.isSelectionHighlight) {
      toRemove.push(child);
    }
  });
  
  toRemove.forEach(highlight => {
    scene.remove(highlight);
    if (highlight.geometry) highlight.geometry.dispose();
    if (highlight.material) highlight.material.dispose();
  });
}

/**
 * Highlight valid moves for the selected piece
 */
function highlightValidMoves() {
  // Clear previous highlights
  clearValidMoveHighlights();
  
  // Update mode indicator to show move selection
  const modeIndicator = document.getElementById('mode-indicator');
  if (modeIndicator && validMoves.length > 0) {
    modeIndicator.textContent = 'Select a move (click green highlights)';
    modeIndicator.style.borderColor = '#00ff00';
    modeIndicator.style.background = 'rgba(0, 50, 0, 0.8)';
  }
  
  // Check for positions with multiple move types
  const positionMoveTypes = {};
  validMoves.forEach(move => {
    const key = `${move.row},${move.col}`;
    if (!positionMoveTypes[key]) {
      positionMoveTypes[key] = [];
    }
    positionMoveTypes[key].push(move);
  });
  
  const getWorldPosition = typeof window !== 'undefined' && window.getWorldPosition ? window.getWorldPosition : 
                          (row, col) => ({ x: col, y: 0, z: row });
  const scene = typeof getScene === 'function' ? getScene() : 
               (typeof window !== 'undefined' ? window.scene : null);
  
  if (!scene) return;
  
  // Add new highlights - create separate highlight for each move type
  validMoves.forEach(move => {
    const position = getWorldPosition(move.row, move.col);
    
    // Different colors and shapes for different move types
    let highlightColor, highlightGeometry;
    
    if (move.type === 'attack') {
      highlightColor = 0xff4444; // Red for attack
      highlightGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    } else if (move.type === 'split') {
      highlightColor = 0xffff00; // BRIGHT YELLOW for split moves
      highlightGeometry = new THREE.TorusGeometry(0.4, 0.05, 8, 32);
    } else if (move.type === 'jump-capture') {
      highlightColor = 0xff8800; // Orange for jump capture
      highlightGeometry = new THREE.TetrahedronGeometry(0.12);
    } else if (move.type === 'multi-jump-capture') {
      highlightColor = 0xaa00ff; // Purple for multi-jump capture
      highlightGeometry = new THREE.OctahedronGeometry(0.15);
    } else if (move.type === 'dual-move-queen') {
      highlightColor = 0xffd700; // Gold for dual queen movement
      highlightGeometry = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    } else if (move.type === 'dual-move-jumper') {
      highlightColor = 0x00aaff; // Light blue for dual jumper movement
      highlightGeometry = new THREE.ConeGeometry(0.12, 0.25, 8);
    } else {
      highlightColor = 0x00ff00; // Green for regular moves
      highlightGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
    }
    
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: highlightColor,
      transparent: true,
      opacity: 0.7
    });
    
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.position.set(position.x, position.y + 0.1, position.z);
    
    // Store move data for click handling
    highlight.userData = { isValidMoveHighlight: true, move: move };
    
    scene.add(highlight);
  });
}

/**
 * Clear valid move highlights
 */
function clearValidMoveHighlights() {
  const scene = typeof getScene === 'function' ? getScene() : 
               (typeof window !== 'undefined' ? window.scene : null);
  if (!scene) return;
  
  const toRemove = [];
  scene.traverse((child) => {
    if (child.userData && child.userData.isValidMoveHighlight) {
      toRemove.push(child);
    }
  });
  
  toRemove.forEach(highlight => {
    scene.remove(highlight);
    if (highlight.geometry) highlight.geometry.dispose();
    if (highlight.material) highlight.material.dispose();
  });
}

/**
 * Show dual movement UI for pieces with multiple movement modes
 */
function showDualMovementUI() {
  const dualModeUI = document.getElementById('dual-movement-ui');
  if (dualModeUI) {
    dualModeUI.style.display = 'block';
  }
  
  // Show mode selection buttons
  const queenModeBtn = document.getElementById('queen-mode-btn');
  const jumperModeBtn = document.getElementById('jumper-mode-btn');
  
  if (queenModeBtn) queenModeBtn.style.display = 'inline-block';
  if (jumperModeBtn) jumperModeBtn.style.display = 'inline-block';
}

/**
 * Hide dual movement UI
 */
function hideDualMovementUI() {
  const dualModeUI = document.getElementById('dual-movement-ui');
  if (dualModeUI) {
    dualModeUI.style.display = 'none';
  }
  
  // Reset selected movement mode
  selectedMovementMode = null;
  
  // Reset mode indicator
  const modeIndicator = document.getElementById('mode-indicator');
  if (modeIndicator) {
    modeIndicator.textContent = 'Click a piece to select it';
    modeIndicator.style.borderColor = '#ccc';
    modeIndicator.style.background = 'rgba(0, 0, 0, 0.8)';
  }
}

/**
 * Select movement mode for dual-mode pieces
 * @param {string} mode - Movement mode ('queen' or 'jumper')
 */
function selectMovementMode(mode) {
  selectedMovementMode = mode;
  
  // Update UI to show selected mode
  const queenModeBtn = document.getElementById('queen-mode-btn');
  const jumperModeBtn = document.getElementById('jumper-mode-btn');
  
  if (queenModeBtn && jumperModeBtn) {
    if (mode === 'queen') {
      queenModeBtn.classList.add('selected');
      jumperModeBtn.classList.remove('selected');
    } else if (mode === 'jumper') {
      jumperModeBtn.classList.add('selected');
      queenModeBtn.classList.remove('selected');
    }
  }
  
  // Filter and highlight moves for the selected mode
  highlightValidMovesForMode(mode);
}

/**
 * Highlight valid moves for a specific movement mode
 * @param {string} mode - Movement mode
 */
function highlightValidMovesForMode(mode) {
  // Clear previous highlights
  clearValidMoveHighlights();
  
  // Filter moves based on selected mode
  const filteredMoves = validMoves.filter(move => 
    move.type === `dual-move-${mode}` || 
    (mode === 'queen' && ['move', 'attack'].includes(move.type)) ||
    (mode === 'jumper' && ['jump', 'jump-capture'].includes(move.type))
  );
  
  // Temporarily set valid moves to filtered moves for highlighting
  const originalMoves = validMoves;
  validMoves = filteredMoves;
  highlightValidMoves();
  validMoves = originalMoves; // Restore original moves
}

/**
 * Force reposition all pieces (used for debugging)
 */
function forceRepositionAllPieces() {
  console.log('🔧 Force repositioning all pieces...');
  
  Object.values(gameState.pieces || {}).forEach(piece => {
    const updatePieceMeshOptimized = typeof window !== 'undefined' && window.updatePieceMeshOptimized ? 
                                    window.updatePieceMeshOptimized : null;
    if (updatePieceMeshOptimized) {
      updatePieceMeshOptimized(piece);
    }
  });
  
  console.log('🔧 All pieces repositioned');
}

/**
 * Show move choice dialog for pieces with multiple move options
 * @param {string} pieceId - ID of the piece
 * @param {number} targetRow - Target row
 * @param {number} targetCol - Target column
 * @param {Array} moveOptions - Available move options
 */
function showMoveChoiceDialog(pieceId, targetRow, targetCol, moveOptions) {
  console.log('🎯 showMoveChoiceDialog called with:', { pieceId, targetRow, targetCol, moveOptions });
  
  // Create dialog HTML with inline styles
  const dialogHtml = `
    <div id="move-choice-dialog" class="modal-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    ">
      <div class="modal-content" style="
        background-color: #2a2a2a;
        color: white;
        padding: 20px;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
      ">
        <h2 style="margin-top: 0; color: #4CAF50;">Choose Move Type</h2>
        <p>Multiple move options are available for this position:</p>
        
        <div class="move-options" style="display: flex; gap: 15px; justify-content: center; margin: 20px 0;">
          ${moveOptions.map(option => `
            <button class="move-choice-btn" 
                    data-piece-id="${pieceId}"
                    data-target-row="${targetRow}"
                    data-target-col="${targetCol}"
                    data-move-type="${option.type}"
                    style="
                      background-color: ${getMoveTypeColor(option.type)};
                      color: white;
                      border: none;
                      padding: 15px 20px;
                      border-radius: 8px;
                      cursor: pointer;
                      font-size: 16px;
                      font-weight: bold;
                      transition: all 0.2s ease;
                    "
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'"
            >
              <div style="font-size: 24px; margin-bottom: 5px;">${getMoveTypeIcon(option.type)}</div>
              <div>${getMoveTypeName(option.type)}</div>
              <div style="font-size: 12px; opacity: 0.8;">${option.description || ''}</div>
            </button>
          `).join('')}
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <button onclick="closeMoveChoiceDialog()" style="
            background-color: #666;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
          ">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.insertAdjacentHTML('beforeend', dialogHtml);
  
  // Add event listeners to move choice buttons
  const moveChoiceBtns = document.querySelectorAll('.move-choice-btn');
  moveChoiceBtns.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const pieceId = this.getAttribute('data-piece-id');
      const targetRow = parseInt(this.getAttribute('data-target-row'));
      const targetCol = parseInt(this.getAttribute('data-target-col'));
      const moveType = this.getAttribute('data-move-type');
      
      executeMoveChoice(pieceId, targetRow, targetCol, moveType);
    });
  });
}

/**
 * Get color for move type
 * @param {string} moveType - Type of move
 * @returns {string} Color hex string
 */
function getMoveTypeColor(moveType) {
  const colors = {
    'move': '#4CAF50',
    'attack': '#f44336',
    'split': '#FFC107',
    'jump': '#2196F3',
    'jump-capture': '#FF9800',
    'multi-jump-capture': '#9C27B0'
  };
  return colors[moveType] || '#666';
}

/**
 * Get icon for move type
 * @param {string} moveType - Type of move
 * @returns {string} Icon character
 */
function getMoveTypeIcon(moveType) {
  const icons = {
    'move': '→',
    'attack': '⚔',
    'split': '⧨',
    'jump': '⚡',
    'jump-capture': '⚡⚔',
    'multi-jump-capture': '⚡⚡⚔'
  };
  return icons[moveType] || '?';
}

/**
 * Get display name for move type
 * @param {string} moveType - Type of move
 * @returns {string} Display name
 */
function getMoveTypeName(moveType) {
  const names = {
    'move': 'Move',
    'attack': 'Attack',
    'split': 'Split',
    'jump': 'Jump',
    'jump-capture': 'Jump & Capture',
    'multi-jump-capture': 'Multi-Jump Capture'
  };
  return names[moveType] || moveType;
}

/**
 * Close move choice dialog
 */
function closeMoveChoiceDialog() {
  const dialog = document.getElementById('move-choice-dialog');
  if (dialog) {
    dialog.remove();
  }
}

/**
 * Execute chosen move
 * @param {string} pieceId - ID of the piece
 * @param {number} targetRow - Target row
 * @param {number} targetCol - Target column
 * @param {string} moveType - Type of move to execute
 */
function executeMoveChoice(pieceId, targetRow, targetCol, moveType) {
  console.log('🎯 Executing move choice:', { pieceId, targetRow, targetCol, moveType });
  
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  
  if (socket) {
    socket.emit('make-move', {
      pieceId: pieceId,
      targetRow: targetRow,
      targetCol: targetCol,
      moveType: moveType
    });
  }
  
  // Close dialog
  closeMoveChoiceDialog();
  
  // Clear selection and highlights
  selectedPieceId = null;
  validMoves = [];
  clearValidMoveHighlights();
  clearSelectionHighlights();
  hideDualMovementUI();
}

/**
 * Update queue display for pending moves
 * @param {Object|null} queuedMove - Queued move data
 */
function updateQueueDisplay(queuedMove) {
  const statusElement = document.getElementById('timer-status');
  
  if (!statusElement) return;
  
  if (queuedMove) {
    statusElement.textContent = `Move queued: ${queuedMove.pieceId} → (${queuedMove.targetRow}, ${queuedMove.targetCol})`;
    statusElement.style.color = '#ffaa00';
  } else {
    statusElement.textContent = 'No move queued';
    statusElement.style.color = '#ccc';
  }
}

/**
 * Check if game is currently active
 * @returns {boolean} True if game is active
 */
function isGameActive() {
  return gameState && Object.keys(gameState.players || {}).length > 0;
}

/**
 * Get piece by ID
 * @param {string} pieceId - ID of the piece
 * @returns {Object|null} Piece data or null if not found
 */
function getPieceById(pieceId) {
  return gameState.pieces[pieceId] || null;
}

/**
 * Get pieces by player ID
 * @param {string} playerId - ID of the player
 * @returns {Array} Array of pieces belonging to the player
 */
function getPiecesByPlayerId(playerId) {
  return Object.values(gameState.pieces || {}).filter(piece => piece.playerId === playerId);
}

/**
 * Get player by ID
 * @param {string} playerId - ID of the player
 * @returns {Object|null} Player data or null if not found
 */
function getPlayerById(playerId) {
  return gameState.players[playerId] || null;
}

/**
 * Get all players
 * @returns {Array} Array of all players
 */
function getAllPlayers() {
  return Object.values(gameState.players || {});
}

/**
 * Get current player (if socket available)
 * @returns {Object|null} Current player data or null
 */
function getCurrentPlayer() {
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  if (!socket) return null;
  
  return gameState.players[socket.id] || null;
}

/**
 * Check if piece belongs to current player
 * @param {string} pieceId - ID of the piece
 * @returns {boolean} True if piece belongs to current player
 */
function isPieceOwnedByCurrentPlayer(pieceId) {
  const socket = typeof getSocket === 'function' ? getSocket() : 
                (typeof window !== 'undefined' ? window.socket : null);
  if (!socket) return false;
  
  const piece = getPieceById(pieceId);
  return piece && piece.playerId === socket.id;
}

/**
 * Reset game state and variables
 */
function resetGameState() {
  gameState = {
    players: {},
    pieces: {},
    gridConfig: { rows: 20, cols: 8 }
  };
  
  selectedPieceId = null;
  validMoves = [];
  selectedMovementMode = null;
  
  // Clear visual highlights
  clearValidMoveHighlights();
  clearSelectionHighlights();
  hideDualMovementUI();
}

/**
 * Get game statistics
 * @returns {Object} Game statistics
 */
function getGameStatistics() {
  const players = getAllPlayers();
  const pieces = Object.values(gameState.pieces || {});
  
  return {
    playerCount: players.length,
    pieceCount: pieces.length,
    piecesByPlayer: players.reduce((acc, player) => {
      acc[player.id] = getPiecesByPlayerId(player.id).length;
      return acc;
    }, {}),
    piecesByType: pieces.reduce((acc, piece) => {
      acc[piece.type] = (acc[piece.type] || 0) + 1;
      return acc;
    }, {})
  };
}

export {
  // Game state management
  getGameState,
  setGameState,
  resetGameState,
  
  // Game initialization
  initializeGameComponents,
  startGameInitialization,
  
  // Piece and player management
  getPieceSymbols,
  getCurrentlySelectedPieceId,
  setSelectedPieceId,
  getValidMoves,
  setValidMoves,
  clearValidMoves,
  getSelectedMovementMode,
  setSelectedMovementMode,
  getPlayerName,
  getPieceColorForPlayer,
  
  // Game queries
  isGameActive,
  getPieceById,
  getPiecesByPlayerId,
  getPlayerById,
  getAllPlayers,
  getCurrentPlayer,
  isPieceOwnedByCurrentPlayer,
  getGameStatistics,
  
  // Visual highlighting
  highlightSelectedPiece,
  clearSelectionHighlights,
  highlightValidMoves,
  clearValidMoveHighlights,
  highlightValidMovesForMode,
  
  // Movement UI
  showDualMovementUI,
  hideDualMovementUI,
  selectMovementMode,
  
  // Move dialogs
  showMoveChoiceDialog,
  closeMoveChoiceDialog,
  executeMoveChoice,
  getMoveTypeColor,
  getMoveTypeIcon,
  getMoveTypeName,
  
  // Utilities
  forceRepositionAllPieces,
  updateQueueDisplay
};