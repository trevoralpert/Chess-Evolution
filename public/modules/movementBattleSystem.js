// Movement & Battle System Module
// Functions for piece movement, battle mechanics, and game actions

import { MOVEMENT_MODES, BATTLE_CONFIG } from './gameConfig.js';
import { getPieceMovementCapabilities, isValidPieceType } from './pieceFunctions.js';
import { isValidGridPosition } from './gridFunctions.js';
import { getElement, setElementText, setElementHTML, showElement, hideElement } from './uiReferences.js';

// Current movement state
let validMoves = [];
let selectedPieceId = null;
let currentMovementMode = MOVEMENT_MODES.NORMAL;

/**
 * Set valid moves for current selection
 * @param {Array} moves - Array of valid move objects
 */
export function setValidMoves(moves) {
  validMoves = moves || [];
  console.log('🎯 Valid moves set:', validMoves);
}

/**
 * Get current valid moves
 * @returns {Array} Array of valid moves
 */
export function getValidMoves() {
  return [...validMoves];
}

/**
 * Clear valid moves
 */
export function clearValidMoves() {
  validMoves = [];
  console.log('🎯 Valid moves cleared');
}

/**
 * Set selected piece ID
 * @param {string} pieceId - Piece ID to select
 */
export function setSelectedPieceId(pieceId) {
  selectedPieceId = pieceId;
  console.log('👆 Selected piece ID set to:', pieceId);
}

/**
 * Get currently selected piece ID
 * @returns {string|null} Selected piece ID or null
 */
export function getSelectedPieceId() {
  return selectedPieceId;
}

/**
 * Clear selected piece
 */
export function clearSelectedPiece() {
  selectedPieceId = null;
  validMoves = [];
  console.log('👆 Selected piece cleared');
}

/**
 * Set movement mode
 * @param {string} mode - Movement mode
 */
export function setMovementMode(mode) {
  if (Object.values(MOVEMENT_MODES).includes(mode)) {
    currentMovementMode = mode;
    console.log('🏃 Movement mode set to:', mode);
  } else {
    console.warn('⚠️ Invalid movement mode:', mode);
  }
}

/**
 * Get current movement mode
 * @returns {string} Current movement mode
 */
export function getMovementMode() {
  return currentMovementMode;
}

/**
 * Check if move is valid
 * @param {number} row - Target row
 * @param {number} col - Target column
 * @param {string} moveType - Type of move (optional)
 * @returns {object|null} Valid move object or null
 */
export function isValidMove(row, col, moveType = null) {
  return validMoves.find(move => {
    const positionMatch = move.row === row && move.col === col;
    const typeMatch = !moveType || move.type === moveType;
    return positionMatch && typeMatch;
  }) || null;
}

/**
 * Get valid moves for a piece
 * @param {object} piece - Piece object
 * @param {object} gameState - Current game state
 * @returns {Array} Array of valid moves
 */
export function calculateValidMoves(piece, gameState) {
  if (!piece || !isValidPieceType(piece.type)) {
    return [];
  }
  
  const moves = [];
  const capabilities = getPieceMovementCapabilities(piece.type);
  const { rows, cols } = gameState.gridConfig;
  
  // Basic movement calculation based on piece capabilities
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (row === piece.row && col === piece.col) continue;
      
      if (isValidGridPosition(row, col, rows, cols)) {
        const moveType = determineMoveType(piece, row, col, gameState);
        if (moveType) {
          moves.push({
            row,
            col,
            type: moveType,
            piece: piece,
            distance: calculateDistance(piece.row, piece.col, row, col)
          });
        }
      }
    }
  }
  
  return moves;
}

/**
 * Determine move type for a position
 * @param {object} piece - Moving piece
 * @param {number} targetRow - Target row
 * @param {number} targetCol - Target column
 * @param {object} gameState - Current game state
 * @returns {string|null} Move type or null if invalid
 */
export function determineMoveType(piece, targetRow, targetCol, gameState) {
  const targetPiece = getPieceAtPosition(targetRow, targetCol, gameState);
  
  if (!targetPiece) {
    return 'move'; // Empty space
  }
  
  if (targetPiece.playerId === piece.playerId) {
    return null; // Can't move to own piece
  }
  
  // Enemy piece - can capture
  return 'attack';
}

/**
 * Get piece at position from game state
 * @param {number} row - Grid row
 * @param {number} col - Grid column
 * @param {object} gameState - Game state
 * @returns {object|null} Piece at position or null
 */
export function getPieceAtPosition(row, col, gameState) {
  return Object.values(gameState.pieces).find(piece => 
    piece.row === row && piece.col === col && !piece.captured
  ) || null;
}

/**
 * Calculate distance between two positions
 * @param {number} row1 - First row
 * @param {number} col1 - First column
 * @param {number} row2 - Second row
 * @param {number} col2 - Second column
 * @returns {number} Distance
 */
export function calculateDistance(row1, col1, row2, col2) {
  const rowDiff = Math.abs(row2 - row1);
  const colDiff = Math.abs(col2 - col1);
  return Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);
}

/**
 * Execute move
 * @param {string} pieceId - Piece ID to move
 * @param {number} targetRow - Target row
 * @param {number} targetCol - Target column
 * @param {string} moveType - Type of move
 * @param {object} dependencies - Required dependencies (socket)
 */
export function executeMove(pieceId, targetRow, targetCol, moveType, dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🎯 Executing move:', { pieceId, targetRow, targetCol, moveType });
  
  if (!socket) {
    console.error('❌ No socket connection for move execution');
    return;
  }
  
  // Validate move
  const validMove = isValidMove(targetRow, targetCol, moveType);
  if (!validMove) {
    console.error('❌ Invalid move:', { targetRow, targetCol, moveType });
    return;
  }
  
  // Send move to server
  socket.emit('move-piece', {
    pieceId,
    targetRow,
    targetCol,
    moveType,
    movementMode: currentMovementMode
  });
  
  // Clear selection after move
  clearSelectedPiece();
}

/**
 * Execute split move
 * @param {string} pieceId - Piece ID to split
 * @param {number} targetRow - Target row
 * @param {number} targetCol - Target column
 * @param {object} dependencies - Required dependencies (socket)
 */
export function executeSplit(pieceId, targetRow, targetCol, dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('✂️ Executing split:', { pieceId, targetRow, targetCol });
  
  if (!socket) {
    console.error('❌ No socket connection for split execution');
    return;
  }
  
  socket.emit('split-piece', {
    pieceId,
    targetRow,
    targetCol
  });
  
  clearSelectedPiece();
}

/**
 * Show battle contest prompt
 * @param {string} battleId - Battle ID
 * @param {object} attackingPiece - Attacking piece
 * @param {object} defendingPiece - Defending piece
 * @param {number} timeLimit - Time limit for decision
 */
export function showBattleContestPrompt(battleId, attackingPiece, defendingPiece, timeLimit) {
  console.log('⚔️ Showing battle contest prompt:', { battleId, attackingPiece, defendingPiece, timeLimit });
  
  const promptContainer = document.createElement('div');
  promptContainer.className = 'battle-contest-prompt';
  promptContainer.id = 'battle-contest-prompt';
  
  const promptHTML = `
    <div class="battle-prompt-overlay">
      <div class="battle-prompt-content">
        <h3>Battle Contest!</h3>
        <div class="battle-participants">
          <div class="attacker">
            <h4>Attacker</h4>
            <div class="piece-info">
              <span class="piece-type">${attackingPiece.type}</span>
              <span class="piece-position">(${attackingPiece.row}, ${attackingPiece.col})</span>
            </div>
          </div>
          <div class="vs">VS</div>
          <div class="defender">
            <h4>Defender</h4>
            <div class="piece-info">
              <span class="piece-type">${defendingPiece.type}</span>
              <span class="piece-position">(${defendingPiece.row}, ${defendingPiece.col})</span>
            </div>
          </div>
        </div>
        <div class="battle-question">
          <p>Do you want to contest this battle?</p>
          <p class="battle-warning">Contesting uses evolution points but gives you a chance to win!</p>
        </div>
        <div class="battle-actions">
          <button class="contest-btn yes-btn" data-battle-id="${battleId}" data-contest="true">
            Contest Battle
          </button>
          <button class="contest-btn no-btn" data-battle-id="${battleId}" data-contest="false">
            Accept Defeat
          </button>
        </div>
        <div class="battle-timer">
          <span id="battle-timer-display">${Math.ceil(timeLimit / 1000)}</span> seconds remaining
        </div>
      </div>
    </div>
  `;
  
  promptContainer.innerHTML = promptHTML;
  
  // Style the prompt
  promptContainer.style.position = 'fixed';
  promptContainer.style.top = '0';
  promptContainer.style.left = '0';
  promptContainer.style.width = '100%';
  promptContainer.style.height = '100%';
  promptContainer.style.zIndex = '10000';
  promptContainer.style.display = 'flex';
  promptContainer.style.alignItems = 'center';
  promptContainer.style.justifyContent = 'center';
  promptContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  
  // Add event listeners
  const contestBtns = promptContainer.querySelectorAll('.contest-btn');
  contestBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const battleId = btn.dataset.battleId;
      const wantsToContest = btn.dataset.contest === 'true';
      handleBattleContestResponse(battleId, wantsToContest);
      hideBattleContestPrompt();
    });
  });
  
  document.body.appendChild(promptContainer);
  
  // Start countdown timer
  startBattleTimer(timeLimit, battleId);
}

/**
 * Hide battle contest prompt
 */
export function hideBattleContestPrompt() {
  const prompt = document.getElementById('battle-contest-prompt');
  if (prompt && prompt.parentNode) {
    prompt.parentNode.removeChild(prompt);
  }
  
  clearBattleTimer();
}

/**
 * Handle battle contest response
 * @param {string} battleId - Battle ID
 * @param {boolean} wantsToContest - Whether player wants to contest
 * @param {object} dependencies - Required dependencies (socket)
 */
export function handleBattleContestResponse(battleId, wantsToContest, dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('⚔️ Battle contest response:', { battleId, wantsToContest });
  
  if (socket) {
    socket.emit('contest-response', {
      battleId,
      wantsToContest
    });
  }
}

/**
 * Show dice battle animation
 * @param {Array} battleLog - Battle log entries
 * @param {object} winner - Winner piece
 * @param {object} loser - Loser piece
 * @param {number} duration - Animation duration
 */
export function showDiceBattleAnimation(battleLog, winner, loser, duration = 3000) {
  console.log('🎲 Showing dice battle animation:', { battleLog, winner, loser });
  
  const animationContainer = document.createElement('div');
  animationContainer.className = 'dice-battle-animation';
  animationContainer.id = 'dice-battle-animation';
  
  const animationHTML = `
    <div class="battle-animation-overlay">
      <div class="battle-animation-content">
        <h3>Battle Result!</h3>
        <div class="battle-log">
          ${battleLog.map(entry => `
            <div class="battle-log-entry">
              <span class="roller">${entry.roller}:</span>
              <span class="roll">Rolled ${entry.roll}</span>
            </div>
          `).join('')}
        </div>
        <div class="battle-result">
          <div class="winner">
            <h4>Winner</h4>
            <div class="piece-info">
              <span class="piece-type">${winner.type}</span>
              <span class="piece-owner">${winner.playerName || 'Unknown'}</span>
            </div>
          </div>
          <div class="loser">
            <h4>Defeated</h4>
            <div class="piece-info">
              <span class="piece-type">${loser.type}</span>
              <span class="piece-owner">${loser.playerName || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  animationContainer.innerHTML = animationHTML;
  
  // Style the animation
  animationContainer.style.position = 'fixed';
  animationContainer.style.top = '0';
  animationContainer.style.left = '0';
  animationContainer.style.width = '100%';
  animationContainer.style.height = '100%';
  animationContainer.style.zIndex = '10001';
  animationContainer.style.display = 'flex';
  animationContainer.style.alignItems = 'center';
  animationContainer.style.justifyContent = 'center';
  animationContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  animationContainer.style.color = 'white';
  
  document.body.appendChild(animationContainer);
  
  // Auto-remove after duration
  setTimeout(() => {
    if (animationContainer.parentNode) {
      animationContainer.parentNode.removeChild(animationContainer);
    }
  }, duration);
}

/**
 * Show move choice dialog
 * @param {string} pieceId - Piece ID
 * @param {number} targetRow - Target row
 * @param {number} targetCol - Target column
 * @param {Array} moveOptions - Available move options
 */
export function showMoveChoiceDialog(pieceId, targetRow, targetCol, moveOptions) {
  console.log('🎯 Showing move choice dialog:', { pieceId, targetRow, targetCol, moveOptions });
  
  const choiceDialog = document.createElement('div');
  choiceDialog.className = 'move-choice-dialog';
  choiceDialog.id = 'move-choice-dialog';
  
  const choiceHTML = `
    <div class="choice-dialog-overlay">
      <div class="choice-dialog-content">
        <h3>Choose Move Type</h3>
        <p>Multiple move types available for this position:</p>
        <div class="move-options">
          ${moveOptions.map(option => `
            <button class="move-option-btn" 
                    data-piece-id="${pieceId}"
                    data-target-row="${targetRow}"
                    data-target-col="${targetCol}"
                    data-move-type="${option.type}">
              <div class="option-title">${formatMoveType(option.type)}</div>
              <div class="option-description">${option.description || 'Standard move'}</div>
            </button>
          `).join('')}
        </div>
        <button class="cancel-move-btn">Cancel</button>
      </div>
    </div>
  `;
  
  choiceDialog.innerHTML = choiceHTML;
  
  // Style the dialog
  choiceDialog.style.position = 'fixed';
  choiceDialog.style.top = '0';
  choiceDialog.style.left = '0';
  choiceDialog.style.width = '100%';
  choiceDialog.style.height = '100%';
  choiceDialog.style.zIndex = '10002';
  choiceDialog.style.display = 'flex';
  choiceDialog.style.alignItems = 'center';
  choiceDialog.style.justifyContent = 'center';
  choiceDialog.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  
  // Add event listeners
  const optionBtns = choiceDialog.querySelectorAll('.move-option-btn');
  optionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const pieceId = btn.dataset.pieceId;
      const targetRow = parseInt(btn.dataset.targetRow);
      const targetCol = parseInt(btn.dataset.targetCol);
      const moveType = btn.dataset.moveType;
      
      executeMoveChoice(pieceId, targetRow, targetCol, moveType);
      closeMoveChoiceDialog();
    });
  });
  
  const cancelBtn = choiceDialog.querySelector('.cancel-move-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeMoveChoiceDialog);
  }
  
  document.body.appendChild(choiceDialog);
}

/**
 * Close move choice dialog
 */
export function closeMoveChoiceDialog() {
  const dialog = document.getElementById('move-choice-dialog');
  if (dialog && dialog.parentNode) {
    dialog.parentNode.removeChild(dialog);
  }
}

/**
 * Execute move choice
 * @param {string} pieceId - Piece ID
 * @param {number} targetRow - Target row
 * @param {number} targetCol - Target column
 * @param {string} moveType - Move type
 * @param {object} dependencies - Required dependencies (socket)
 */
export function executeMoveChoice(pieceId, targetRow, targetCol, moveType, dependencies = {}) {
  console.log('🎯 Executing move choice:', { pieceId, targetRow, targetCol, moveType });
  
  if (moveType === 'split') {
    executeSplit(pieceId, targetRow, targetCol, dependencies);
  } else {
    executeMove(pieceId, targetRow, targetCol, moveType, dependencies);
  }
}

/**
 * Format move type for display
 * @param {string} moveType - Move type
 * @returns {string} Formatted move type
 */
export function formatMoveType(moveType) {
  const typeMap = {
    'move': 'Move',
    'attack': 'Attack',
    'split': 'Split',
    'jump': 'Jump',
    'jump-capture': 'Jump & Capture',
    'multi-jump-capture': 'Multi-Jump Capture',
    'dual-move-queen': 'Dual Queen Move',
    'dual-move-jumper': 'Dual Jumper Move'
  };
  
  return typeMap[moveType] || moveType;
}

// Battle timer management
let battleTimer = null;

/**
 * Start battle timer
 * @param {number} timeLimit - Time limit in milliseconds
 * @param {string} battleId - Battle ID
 */
export function startBattleTimer(timeLimit, battleId) {
  clearBattleTimer();
  
  const timerDisplay = document.getElementById('battle-timer-display');
  if (!timerDisplay) return;
  
  let remaining = timeLimit;
  
  battleTimer = setInterval(() => {
    remaining -= 1000;
    
    if (remaining <= 0) {
      clearBattleTimer();
      // Auto-decline contest
      handleBattleContestResponse(battleId, false);
      hideBattleContestPrompt();
      return;
    }
    
    setElementText(timerDisplay, Math.ceil(remaining / 1000).toString());
  }, 1000);
}

/**
 * Clear battle timer
 */
export function clearBattleTimer() {
  if (battleTimer) {
    clearInterval(battleTimer);
    battleTimer = null;
  }
}

/**
 * Initialize movement and battle system
 * @param {object} dependencies - Required dependencies
 */
export function initializeMovementBattleSystem(dependencies = {}) {
  console.log('⚔️ Initializing movement and battle system...');
  
  // Set up movement mode buttons
  const normalModeBtn = getElement('mode-normal');
  if (normalModeBtn) {
    normalModeBtn.addEventListener('click', () => setMovementMode(MOVEMENT_MODES.NORMAL));
  }
  
  const jumpModeBtn = getElement('mode-jump');
  if (jumpModeBtn) {
    jumpModeBtn.addEventListener('click', () => setMovementMode(MOVEMENT_MODES.JUMP));
  }
  
  const splitModeBtn = getElement('mode-split');
  if (splitModeBtn) {
    splitModeBtn.addEventListener('click', () => setMovementMode(MOVEMENT_MODES.SPLIT));
  }
  
  console.log('✅ Movement and battle system initialized');
}

/**
 * Handle socket events for movement and battles
 * @param {object} socket - Socket connection
 */
export function setupMovementBattleSocketHandlers(socket) {
  if (!socket) return;
  
  console.log('🔌 Setting up movement and battle socket handlers...');
  
  // Valid moves received
  socket.on('valid-moves', (data) => {
    console.log('🎯 Valid moves received:', data);
    setValidMoves(data.moves);
  });
  
  // Move result
  socket.on('move-result', (data) => {
    console.log('🎯 Move result:', data);
    if (data.success) {
      clearSelectedPiece();
    }
  });
  
  // Battle contest prompt
  socket.on('battle-contest-prompt', (data) => {
    showBattleContestPrompt(data.battleId, data.attackingPiece, data.defendingPiece, data.timeLimit);
  });
  
  // Dice battle animation
  socket.on('dice-battle-animation', (data) => {
    showDiceBattleAnimation(data.battleLog, data.winner, data.loser, data.duration);
  });
  
  // Battle result
  socket.on('battle-result', (data) => {
    console.log('⚔️ Battle result:', data);
    hideBattleContestPrompt();
  });
  
  console.log('✅ Movement and battle socket handlers set up');
}