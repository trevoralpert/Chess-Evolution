// Evolution UI Module
// Functions for evolution interface, choice dialogs, and evolution management

import { getElement, showElement, hideElement, setElementText, setElementHTML } from './uiReferences.js';
import { UI_ELEMENTS, EVOLUTION_CONFIG } from './gameConfig.js';
import { getPieceDisplayName, getPossibleEvolutions } from './pieceFunctions.js';
import { formatCountdown } from './timerFunctions.js';

/**
 * Show evolution UI
 */
export function showEvolutionUI() {
  console.log('🧬 Showing evolution UI...');
  const evolutionUI = getElement('evolution-ui');
  if (evolutionUI) {
    showElement(evolutionUI);
    refreshEvolutionBank();
  }
}

/**
 * Hide evolution UI
 */
export function hideEvolutionUI() {
  console.log('🧬 Hiding evolution UI...');
  const evolutionUI = getElement('evolution-ui');
  if (evolutionUI) {
    hideElement(evolutionUI);
  }
}

/**
 * Refresh evolution bank display
 * @param {object} dependencies - Required dependencies (socket)
 */
export function refreshEvolutionBank(dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🔄 Refreshing evolution bank...');
  
  if (socket) {
    socket.emit('get-evolution-bank');
  }
}

/**
 * Update evolution bank display
 * @param {object} bankInfo - Evolution bank information
 */
export function updateEvolutionBank(bankInfo) {
  console.log('💰 Updating evolution bank:', bankInfo);
  
  const bankDisplay = getElement('evolution-bank');
  if (bankDisplay && bankInfo) {
    const bankHTML = `
      <div class="evolution-bank-info">
        <div class="bank-stat">
          <span class="bank-label">Current Points:</span>
          <span class="bank-value">${bankInfo.points || 0}</span>
        </div>
        <div class="bank-stat">
          <span class="bank-label">Total Earned:</span>
          <span class="bank-value">${bankInfo.totalEarned || 0}</span>
        </div>
        <div class="bank-stat">
          <span class="bank-label">Pieces Evolved:</span>
          <span class="bank-value">${bankInfo.piecesEvolved || 0}</span>
        </div>
      </div>
    `;
    
    setElementHTML(bankDisplay, bankHTML);
  }
}

/**
 * Show evolution choice dialog
 * @param {object} data - Evolution choice data
 */
export function showEvolutionChoice(data) {
  console.log('🎯 Showing evolution choice:', data);
  
  const choiceDialog = getElement('evolution-choice');
  if (!choiceDialog) {
    console.warn('⚠️ Evolution choice dialog not found');
    return;
  }
  
  showElement(choiceDialog);
  
  // Update piece information
  const pieceInfo = getElement('evolution-piece-info');
  if (pieceInfo && data.piece) {
    const pieceHTML = `
      <div class="piece-display">
        <h3>${getPieceDisplayName(data.piece.type)}</h3>
        <p class="piece-position">Position: (${data.piece.row}, ${data.piece.col})</p>
        <p class="evolution-reason">${data.reason || 'Ready for evolution'}</p>
      </div>
    `;
    setElementHTML(pieceInfo, pieceHTML);
  }
  
  // Update available evolution paths
  const pathsContainer = getElement('evolution-paths');
  if (pathsContainer && data.availablePaths) {
    const pathsHTML = data.availablePaths.map(path => {
      const cost = path.cost || 0;
      const canAfford = (data.bankInfo?.points || 0) >= cost;
      
      return `
        <div class="evolution-path ${canAfford ? 'affordable' : 'expensive'}">
          <div class="path-info">
            <h4>${getPieceDisplayName(path.type)}</h4>
            <p class="path-description">${path.description || 'No description available'}</p>
            <div class="path-stats">
              <span class="path-cost">Cost: ${cost} points</span>
              <span class="path-abilities">${path.abilities ? path.abilities.join(', ') : 'Standard abilities'}</span>
            </div>
          </div>
          <button class="evolution-btn ${canAfford ? 'available' : 'disabled'}" 
                  data-piece-id="${data.pieceId}" 
                  data-evolution-type="${path.type}"
                  ${canAfford ? '' : 'disabled'}>
            ${canAfford ? 'Evolve' : 'Not enough points'}
          </button>
        </div>
      `;
    }).join('');
    
    setElementHTML(pathsContainer, pathsHTML);
    
    // Add event listeners to evolution buttons
    const evolutionBtns = pathsContainer.querySelectorAll('.evolution-btn:not(.disabled)');
    evolutionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const pieceId = btn.dataset.pieceId;
        const evolutionType = btn.dataset.evolutionType;
        chooseEvolution(pieceId, evolutionType);
      });
    });
  }
  
  // Update bank option
  const bankOption = getElement('evolution-bank-option');
  if (bankOption && data.piece) {
    const bankHTML = `
      <div class="bank-option">
        <h4>Bank Evolution Points</h4>
        <p>Save points for later evolution opportunities</p>
        <button class="bank-evolution-btn" data-piece-id="${data.pieceId}">
          Bank Points
        </button>
      </div>
    `;
    setElementHTML(bankOption, bankHTML);
    
    // Add event listener to bank button
    const bankBtn = bankOption.querySelector('.bank-evolution-btn');
    if (bankBtn) {
      bankBtn.addEventListener('click', () => {
        bankEvolutionPoints(data.pieceId);
      });
    }
  }
  
  // Set up timer if provided
  if (data.timeLimit) {
    startEvolutionTimer(data.timeLimit);
  }
}

/**
 * Hide evolution choice dialog
 */
export function hideEvolutionChoice() {
  console.log('🎯 Hiding evolution choice...');
  
  const choiceDialog = getElement('evolution-choice');
  if (choiceDialog) {
    hideElement(choiceDialog);
  }
  
  // Clear any running timer
  clearEvolutionTimer();
}

/**
 * Handle evolution completed
 * @param {object} data - Evolution completion data
 */
export function handleEvolutionCompleted(data) {
  console.log('✅ Evolution completed:', data);
  
  // Hide choice dialog
  hideEvolutionChoice();
  
  // Show completion message
  if (data.newPiece) {
    showEvolutionCompletionMessage(data.originalPiece, data.newPiece);
  }
  
  // Update evolution bank
  if (data.bankInfo) {
    updateEvolutionBank(data.bankInfo);
  }
}

/**
 * Show evolution completion message
 * @param {object} originalPiece - Original piece data
 * @param {object} newPiece - New piece data
 */
export function showEvolutionCompletionMessage(originalPiece, newPiece) {
  const message = `${getPieceDisplayName(originalPiece.type)} evolved into ${getPieceDisplayName(newPiece.type)}!`;
  
  // Create temporary notification
  const notification = document.createElement('div');
  notification.className = 'evolution-notification';
  notification.innerHTML = `
    <div class="evolution-success">
      <h3>Evolution Complete!</h3>
      <p>${message}</p>
      <div class="piece-transition">
        <span class="old-piece">${getPieceDisplayName(originalPiece.type)}</span>
        <span class="arrow">→</span>
        <span class="new-piece">${getPieceDisplayName(newPiece.type)}</span>
      </div>
    </div>
  `;
  
  // Style and position
  notification.style.position = 'fixed';
  notification.style.top = '50%';
  notification.style.left = '50%';
  notification.style.transform = 'translate(-50%, -50%)';
  notification.style.zIndex = '10000';
  notification.style.backgroundColor = 'rgba(0, 100, 0, 0.9)';
  notification.style.color = 'white';
  notification.style.padding = '20px';
  notification.style.borderRadius = '10px';
  notification.style.textAlign = 'center';
  notification.style.minWidth = '300px';
  
  document.body.appendChild(notification);
  
  // Auto-remove after delay
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

/**
 * Choose evolution path
 * @param {string} pieceId - Piece ID to evolve
 * @param {string} evolutionPath - Evolution path to choose
 * @param {object} dependencies - Required dependencies (socket)
 */
export function chooseEvolution(pieceId, evolutionPath, dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('🎯 Choosing evolution:', { pieceId, evolutionPath });
  
  if (socket) {
    socket.emit('evolution-choice', {
      pieceId,
      evolutionPath
    });
  }
  
  // Hide choice dialog
  hideEvolutionChoice();
}

/**
 * Bank evolution points
 * @param {string} pieceId - Piece ID to bank points for
 * @param {object} dependencies - Required dependencies (socket)
 */
export function bankEvolutionPoints(pieceId, dependencies = {}) {
  const { socket } = dependencies;
  
  console.log('💰 Banking evolution points for piece:', pieceId);
  
  if (socket) {
    socket.emit('bank-evolution-points', { pieceId });
  }
  
  // Hide choice dialog
  hideEvolutionChoice();
}

/**
 * Close evolution dialog
 */
export function closeEvolutionDialog() {
  console.log('❌ Closing evolution dialog...');
  hideEvolutionChoice();
}

/**
 * Show evolution context menu
 * @param {object} data - Context menu data
 * @param {MouseEvent} mouseEvent - Mouse event for positioning
 */
export function showEvolutionContextMenu(data, mouseEvent) {
  console.log('📋 Showing evolution context menu:', data);
  
  // Remove existing context menu
  hideEvolutionContextMenu();
  
  const contextMenu = document.createElement('div');
  contextMenu.className = 'evolution-context-menu';
  contextMenu.id = 'evolution-context-menu';
  
  const menuHTML = `
    <div class="context-menu-header">
      <h4>${getPieceDisplayName(data.piece.type)} Options</h4>
    </div>
    <div class="context-menu-options">
      ${data.canEvolve ? `
        <button class="context-option evolution-option" data-action="evolve">
          🧬 Evolve Piece
        </button>
      ` : ''}
      ${data.canBank ? `
        <button class="context-option bank-option" data-action="bank">
          💰 Bank Points
        </button>
      ` : ''}
      <button class="context-option info-option" data-action="info">
        ℹ️ Piece Info
      </button>
      <button class="context-option cancel-option" data-action="cancel">
        ❌ Cancel
      </button>
    </div>
    ${data.timeLimit ? `
      <div class="context-timer">
        <span id="context-timer-display">${formatCountdown(Math.ceil(data.timeLimit / 1000))}</span>
      </div>
    ` : ''}
  `;
  
  contextMenu.innerHTML = menuHTML;
  
  // Position menu at mouse location
  contextMenu.style.position = 'fixed';
  contextMenu.style.left = `${mouseEvent.clientX}px`;
  contextMenu.style.top = `${mouseEvent.clientY}px`;
  contextMenu.style.zIndex = '10001';
  contextMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  contextMenu.style.color = 'white';
  contextMenu.style.padding = '10px';
  contextMenu.style.borderRadius = '5px';
  contextMenu.style.minWidth = '200px';
  contextMenu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
  
  // Add event listeners
  const options = contextMenu.querySelectorAll('.context-option');
  options.forEach(option => {
    option.addEventListener('click', () => {
      const action = option.dataset.action;
      handleContextMenuAction(action, data);
      hideEvolutionContextMenu();
    });
  });
  
  document.body.appendChild(contextMenu);
  
  // Auto-hide after timeout
  if (data.timeLimit) {
    setTimeout(() => {
      hideEvolutionContextMenu();
    }, data.timeLimit);
    
    // Start countdown timer
    startContextMenuTimer(data.timeLimit);
  }
}

/**
 * Hide evolution context menu
 */
export function hideEvolutionContextMenu() {
  const contextMenu = getElement('evolution-context-menu');
  if (contextMenu && contextMenu.parentNode) {
    contextMenu.parentNode.removeChild(contextMenu);
  }
  
  clearContextMenuTimer();
}

/**
 * Handle context menu action
 * @param {string} action - Action to perform
 * @param {object} data - Context data
 */
export function handleContextMenuAction(action, data) {
  console.log('🎯 Handling context menu action:', action, data);
  
  switch (action) {
    case 'evolve':
      // Show evolution choice dialog
      showEvolutionChoice({
        pieceId: data.piece.id,
        piece: data.piece,
        availablePaths: getPossibleEvolutions(data.piece.type),
        bankInfo: data.bankInfo,
        reason: 'Manual evolution request'
      });
      break;
      
    case 'bank':
      bankEvolutionPoints(data.piece.id);
      break;
      
    case 'info':
      showPieceInfo(data.piece);
      break;
      
    case 'cancel':
      // Just close the menu (already handled)
      break;
  }
}

/**
 * Show piece information dialog
 * @param {object} piece - Piece data
 */
export function showPieceInfo(piece) {
  const infoDialog = document.createElement('div');
  infoDialog.className = 'piece-info-dialog';
  
  const infoHTML = `
    <div class="dialog-overlay">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>${getPieceDisplayName(piece.type)} Information</h3>
          <button class="dialog-close" onclick="this.closest('.piece-info-dialog').remove()">×</button>
        </div>
        <div class="dialog-body">
          <div class="piece-details">
            <p><strong>Type:</strong> ${piece.type}</p>
            <p><strong>Position:</strong> (${piece.row}, ${piece.col})</p>
            <p><strong>Player:</strong> ${piece.playerId}</p>
            <p><strong>Evolution Points:</strong> ${piece.evolutionPoints || 0}</p>
          </div>
          <div class="piece-abilities">
            <h4>Abilities:</h4>
            <ul>
              ${getPieceAbilities(piece.type).map(ability => `<li>${ability}</li>`).join('')}
            </ul>
          </div>
          <div class="evolution-info">
            <h4>Evolution Paths:</h4>
            <ul>
              ${getPossibleEvolutions(piece.type).map(evo => `<li>${getPieceDisplayName(evo)}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
  
  infoDialog.innerHTML = infoHTML;
  
  // Style the dialog
  infoDialog.style.position = 'fixed';
  infoDialog.style.top = '0';
  infoDialog.style.left = '0';
  infoDialog.style.width = '100%';
  infoDialog.style.height = '100%';
  infoDialog.style.zIndex = '10002';
  infoDialog.style.display = 'flex';
  infoDialog.style.alignItems = 'center';
  infoDialog.style.justifyContent = 'center';
  
  document.body.appendChild(infoDialog);
}

/**
 * Get piece abilities for display
 * @param {string} pieceType - Type of piece
 * @returns {Array} Array of ability descriptions
 */
export function getPieceAbilities(pieceType) {
  const abilities = {
    'KING': ['Moves one square in any direction', 'Cannot be captured directly'],
    'QUEEN': ['Moves any distance in straight lines', 'Most powerful piece'],
    'ROOK': ['Moves any distance horizontally or vertically'],
    'BISHOP': ['Moves any distance diagonally'],
    'KNIGHT': ['Moves in L-shape pattern', 'Can jump over pieces'],
    'PAWN': ['Moves forward one square', 'Captures diagonally'],
    'JUMPER': ['Can jump over pieces', 'Enhanced movement range'],
    'SUPER_JUMPER': ['Extended jumping ability', 'Greater movement range'],
    'HYPER_JUMPER': ['Maximum jumping ability', 'Extreme movement range'],
    'SPLITTER': ['Can split into multiple pieces', 'Special tactical ability'],
    'HYBRID_QUEEN': ['Combines queen and jumper abilities', 'Ultimate piece'],
    'MISTRESS_JUMPER': ['Master of jumping', 'Supreme tactical piece']
  };
  
  return abilities[pieceType] || ['Standard piece abilities'];
}

// Timer management
let evolutionTimer = null;
let contextMenuTimer = null;

/**
 * Start evolution choice timer
 * @param {number} timeLimit - Time limit in milliseconds
 */
export function startEvolutionTimer(timeLimit) {
  clearEvolutionTimer();
  
  const timerDisplay = getElement('evolution-timer-display');
  if (!timerDisplay) return;
  
  let remaining = timeLimit;
  
  evolutionTimer = setInterval(() => {
    remaining -= 1000;
    
    if (remaining <= 0) {
      clearEvolutionTimer();
      hideEvolutionChoice();
      return;
    }
    
    setElementText(timerDisplay, formatCountdown(Math.ceil(remaining / 1000)));
  }, 1000);
}

/**
 * Clear evolution timer
 */
export function clearEvolutionTimer() {
  if (evolutionTimer) {
    clearInterval(evolutionTimer);
    evolutionTimer = null;
  }
}

/**
 * Start context menu timer
 * @param {number} timeLimit - Time limit in milliseconds
 */
export function startContextMenuTimer(timeLimit) {
  clearContextMenuTimer();
  
  const timerDisplay = getElement('context-timer-display');
  if (!timerDisplay) return;
  
  let remaining = timeLimit;
  
  contextMenuTimer = setInterval(() => {
    remaining -= 1000;
    
    if (remaining <= 0) {
      clearContextMenuTimer();
      hideEvolutionContextMenu();
      return;
    }
    
    setElementText(timerDisplay, formatCountdown(Math.ceil(remaining / 1000)));
  }, 1000);
}

/**
 * Clear context menu timer
 */
export function clearContextMenuTimer() {
  if (contextMenuTimer) {
    clearInterval(contextMenuTimer);
    contextMenuTimer = null;
  }
}

/**
 * Initialize evolution UI system
 * @param {object} dependencies - Required dependencies (socket)
 */
export function initializeEvolutionUI(dependencies = {}) {
  console.log('🧬 Initializing evolution UI...');
  
  // Set up close buttons
  const closeBtn = getElement('evolution-choice-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeEvolutionDialog);
  }
  
  // Set up refresh button
  const refreshBtn = getElement('refresh-evolution-bank-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => refreshEvolutionBank(dependencies));
  }
  
  console.log('✅ Evolution UI initialized');
}

/**
 * Handle evolution socket events
 * @param {object} socket - Socket connection
 */
export function setupEvolutionSocketHandlers(socket) {
  if (!socket) return;
  
  console.log('🔌 Setting up evolution socket handlers...');
  
  // Evolution bank updated
  socket.on('evolution-bank-update', (bankInfo) => {
    updateEvolutionBank(bankInfo);
  });
  
  // Evolution choice available
  socket.on('evolution-choice-available', (data) => {
    showEvolutionChoice(data);
  });
  
  // Evolution completed
  socket.on('evolution-completed', (data) => {
    handleEvolutionCompleted(data);
  });
  
  // Evolution context menu
  socket.on('evolution-context-menu', (data) => {
    // This would typically be triggered by right-click on piece
    console.log('Evolution context menu data received:', data);
  });
  
  console.log('✅ Evolution socket handlers set up');
}