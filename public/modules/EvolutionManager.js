// Evolution system for EvoChess
// Handles piece evolution logic, UI, points management, and evolution choices

// Evolution state variables
let currentEvolutionChoice = null;
let playerEvolutionBank = { points: 0, totalEarned: 0 };

/**
 * Get evolution points for a piece - displays piece BASE VALUES, not player evolution bank
 * @param {Object} piece - The piece object
 * @returns {number} Evolution points for the piece
 */
function getEvolutionPointsForPiece(piece) {
  // Debug logging to see what data we have
  console.log('🔍 Getting evolution points for piece:', piece.id, 'type:', piece.type);
  console.log('🔍 Piece player ID:', piece.playerId);
  
  // King pieces don't have evolution points - hide their labels
  if (piece.type === 'KING') {
    console.log('🔍 King pieces do not have evolution points');
    return 0;
  }
  
  // Always display piece BASE VALUES (intrinsic to piece type)
  // These are the inherent point values of pieces, NOT the player's evolution bank
  const pieceBaseValues = {
    'PAWN': 1,        // Pawns always show 1 point (their base value)
    'ROOK': 5,
    'KNIGHT': 3,
    'BISHOP': 3,
    'QUEEN': 9,
    'JUMPER': 3,
    'SUPER_JUMPER': 5,
    'HYPER_JUMPER': 7,
    'SPLITTER': 2,    // Splitters always show 2 points (their base value)
    'HYBRID_QUEEN': 12,
    'MISTRESS_JUMPER': 8
  };
  
  const baseValue = pieceBaseValues[piece.type] || 1;
  console.log('🔍 Using piece base value for', piece.type, ':', baseValue);
  return baseValue;
}

/**
 * Create evolution points label with team color styling
 * @param {number} evolutionPoints - Number of evolution points to display
 * @param {string} playerId - ID of the player who owns the piece
 * @returns {THREE.CanvasTexture} Canvas texture for the label
 */
function createEvolutionPointsLabel(evolutionPoints, playerId) {
  console.log('🎨 Creating evolution points label with points:', evolutionPoints, 'for player:', playerId);
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 128; // Double the width for better quality
  canvas.height = 64; // Double the height for better quality
  
  // Get player color for styling
  const gameState = typeof getGameState === 'function' ? getGameState() : (typeof window !== 'undefined' ? window.gameState : null);
  if (!gameState) {
    console.warn('Game state not available for evolution label styling');
    return createDefaultEvolutionLabel(evolutionPoints);
  }
  
  const player = gameState.players[playerId];
  const playerIndex = player?.index !== undefined ? player.index : 
                     Object.keys(gameState.players).indexOf(playerId);
  
  console.log('🎨 Player index:', playerIndex, 'Player object:', player);
  
  // Determine text color based on player
  let textColor = '#FFD700'; // Gold default
  if (playerIndex === 0) {
    textColor = '#FF6B6B'; // Red team
  } else if (playerIndex === 1) {
    textColor = '#4ECDC4'; // Blue team
  }
  
  console.log('🎨 Using text color:', textColor);
  
  // Create background with subtle glow
  context.fillStyle = 'rgba(0, 0, 0, 0.6)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add text
  context.fillStyle = textColor;
  context.font = 'bold 20px Arial';
  context.textAlign = 'center';
  context.fillText(`${evolutionPoints}`, 32, 22);
  
  // Add small "pts" text
  context.fillStyle = 'rgba(255, 255, 255, 0.7)';
  context.font = '12px Arial';
  context.fillText('pts', 32, 30);
  
  console.log('🎨 Canvas texture created successfully');
  
  if (typeof THREE !== 'undefined') {
    return new THREE.CanvasTexture(canvas);
  } else {
    console.warn('THREE.js not available for texture creation');
    return null;
  }
}

/**
 * Create default evolution label when game state is not available
 * @param {number} evolutionPoints - Number of evolution points
 * @returns {THREE.CanvasTexture|null} Canvas texture or null if THREE.js not available
 */
function createDefaultEvolutionLabel(evolutionPoints) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 128;
  canvas.height = 64;
  
  context.fillStyle = 'rgba(0, 0, 0, 0.6)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  context.fillStyle = '#FFD700';
  context.font = 'bold 20px Arial';
  context.textAlign = 'center';
  context.fillText(`${evolutionPoints}`, 32, 22);
  
  context.fillStyle = 'rgba(255, 255, 255, 0.7)';
  context.font = '12px Arial';
  context.fillText('pts', 32, 30);
  
  return typeof THREE !== 'undefined' ? new THREE.CanvasTexture(canvas) : null;
}

/**
 * Update all evolution point labels (call this when player evolution points change)
 */
function updateAllEvolutionPointLabels() {
  const pieceMeshes = typeof getPieceMeshes === 'function' ? getPieceMeshes() : 
                     (typeof window !== 'undefined' ? window.pieceMeshes : null);
  
  if (!pieceMeshes) {
    console.warn('Piece meshes not available for evolution label update');
    return;
  }
  
  Object.values(pieceMeshes).forEach(mesh => {
    if (mesh.userData && mesh.userData.piece && mesh.userData.piece.type !== 'KING') {
      updateEvolutionPointsLabel(mesh, mesh.userData.piece);
    }
  });
}

/**
 * Update evolution points label for a specific piece
 * @param {THREE.Mesh} mesh - The piece mesh
 * @param {Object} piece - The piece data
 */
function updateEvolutionPointsLabel(mesh, piece) {
  if (!mesh || !piece) return;
  
  // Find existing evolution label
  const existingLabel = mesh.children.find(child => child.userData && child.userData.isEvolutionLabel);
  
  if (existingLabel) {
    // Update existing label
    const evolutionPoints = getEvolutionPointsForPiece(piece);
    const newTexture = createEvolutionPointsLabel(evolutionPoints, piece.playerId);
    if (newTexture) {
      // Dispose old texture
      if (existingLabel.material.map) {
        existingLabel.material.map.dispose();
      }
      existingLabel.material.map = newTexture;
      existingLabel.material.needsUpdate = true;
    }
  }
}

/**
 * Show the evolution UI panel
 */
function showEvolutionUI() {
  const evolutionUI = document.getElementById('evolution-ui');
  if (evolutionUI) {
    evolutionUI.style.display = 'block';
    refreshEvolutionBank();
  }
}

/**
 * Hide the evolution UI panel
 */
function hideEvolutionUI() {
  const evolutionUI = document.getElementById('evolution-ui');
  if (evolutionUI) {
    evolutionUI.style.display = 'none';
  }
}

/**
 * Refresh evolution bank data from server
 */
function refreshEvolutionBank() {
  if (typeof socket !== 'undefined' && socket) {
    socket.emit('get-evolution-bank');
  }
}

/**
 * Update evolution bank display
 * @param {Object} bankInfo - Bank information from server
 */
function updateEvolutionBank(bankInfo) {
  playerEvolutionBank = bankInfo;
  
  const pointsEl = document.getElementById('evolution-points');
  const totalEarnedEl = document.getElementById('evolution-total-earned');
  
  if (pointsEl) pointsEl.textContent = bankInfo.points;
  if (totalEarnedEl) totalEarnedEl.textContent = bankInfo.totalEarned;
}

/**
 * Show evolution choice panel
 * @param {Object} data - Evolution choice data from server
 */
function showEvolutionChoice(data) {
  currentEvolutionChoice = data;
  
  // Show evolution choice panel
  const choicePanel = document.getElementById('evolution-choice-panel');
  if (!choicePanel) return;
  
  choicePanel.style.display = 'block';
  
  // Update piece info
  const pieceNameEl = document.getElementById('evolution-piece-name');
  const pieceAgeEl = document.getElementById('evolution-piece-age');
  
  if (pieceNameEl) {
    pieceNameEl.textContent = `${data.piece.type} (${data.piece.symbol})`;
  }
  if (pieceAgeEl) {
    pieceAgeEl.textContent = `Age: ${Math.floor(data.availablePaths[0]?.currentAliveTime || 0)}s`;
  }
  
  // Display available paths
  const pathsContainer = document.getElementById('evolution-paths');
  if (!pathsContainer) return;
  
  pathsContainer.innerHTML = '';
  
  data.availablePaths.forEach(path => {
    const pathDiv = document.createElement('div');
    pathDiv.style.cssText = `
      margin-bottom: 5px; 
      padding: 8px; 
      background: rgba(0, 0, 0, 0.2); 
      border-radius: 3px; 
      border: 1px solid ${path.canAfford && path.meetsRequirements ? '#00aa00' : '#666'};
      cursor: ${path.canAfford && path.meetsRequirements ? 'pointer' : 'default'};
    `;
    
    const rarityColors = {
      'common': '#ffffff',
      'uncommon': '#1eff00',
      'rare': '#0070dd',
      'epic': '#a335ee',
      'legendary': '#ff8000'
    };
    
    pathDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center;">
          <span style="font-size: 16px; margin-right: 8px;">${path.icon}</span>
          <div>
            <div style="color: ${rarityColors[path.rarity]}; font-weight: bold; font-size: 12px;">${path.name}</div>
            <div style="color: #ccc; font-size: 10px;">${path.description}</div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="color: #ffd700; font-size: 12px; font-weight: bold;">Cost: ${path.cost}</div>
          <div style="color: #888; font-size: 10px;">
            ${path.timeRequirement > 0 ? `Time: ${Math.floor(path.timeRequirement)}s` : 'No time req'}
          </div>
          ${!path.canAfford ? '<div style="color: #ff0000; font-size: 10px;">Not enough points</div>' : ''}
          ${!path.meetsRequirements ? '<div style="color: #ff0000; font-size: 10px;">Requirements not met</div>' : ''}
        </div>
      </div>
    `;
    
    if (path.canAfford && path.meetsRequirements) {
      pathDiv.addEventListener('click', () => {
        if (typeof socket !== 'undefined' && socket) {
          socket.emit('make-evolution-choice', { 
            pieceId: data.pieceId, 
            pathId: path.id 
          });
        }
      });
    }
    
    pathsContainer.appendChild(pathDiv);
  });
  
  // Start timer using TimerManager
  const timeLeft = data.timeLeft || 30;
  if (typeof startEvolutionTimer === 'function') {
    startEvolutionTimer(timeLeft);
  }
}

/**
 * Hide evolution choice panel
 */
function hideEvolutionChoice() {
  const choicePanel = document.getElementById('evolution-choice-panel');
  if (choicePanel) {
    choicePanel.style.display = 'none';
  }
  
  if (typeof clearEvolutionTimer === 'function') {
    clearEvolutionTimer();
  }
  
  currentEvolutionChoice = null;
}

/**
 * Handle evolution completed event
 * @param {Object} data - Evolution completion data
 */
function handleEvolutionCompleted(data) {
  // Hide choice panel
  hideEvolutionChoice();
  
  // Show evolution notification
  if (typeof showNotification === 'function') {
    showNotification('Evolution Complete!', 
      `${data.oldType} evolved to ${data.newType} for ${data.cost} points!`, 
      'success');
  }
}

/**
 * Show evolution choice dialog with full UI
 * @param {string} pieceId - ID of the piece that can evolve
 * @param {Object} piece - Piece data
 * @param {string} reason - Reason for evolution availability
 * @param {Array} availablePaths - Available evolution paths
 * @param {Object} bankInfo - Player's evolution bank info
 * @param {number} timeLimit - Time limit for choice in seconds
 */
function showEvolutionChoiceDialog(pieceId, piece, reason, availablePaths, bankInfo, timeLimit) {
  console.log('🎯 showEvolutionChoiceDialog called with:', { pieceId, piece, reason, availablePaths, bankInfo, timeLimit });
  
  // Create dialog HTML with inline styles
  const dialogHtml = `
    <div id="evolution-choice-dialog" class="modal-overlay" style="
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
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      ">
        <h2 style="margin-top: 0; color: #4CAF50;">Evolution Choice</h2>
        <p>Your ${piece.type} can evolve! Choose your path:</p>
        
        <div class="evolution-info" style="
          background-color: #3a3a3a;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        ">
          <p><strong>Reason:</strong> ${reason.replace('_', ' ')}</p>
          <p><strong>Current Points:</strong> ${bankInfo.points}</p>
          <p><strong>Time Limit:</strong> <span id="evolution-timer">${timeLimit}</span> seconds</p>
        </div>
        
        <div class="evolution-options" style="display: flex; gap: 20px; flex-wrap: wrap;">
          <div class="evolution-paths" style="flex: 2; min-width: 300px;">
            ${availablePaths.map(path => `
              <div class="evolution-path ${bankInfo.points >= path.cost ? 'affordable' : 'expensive'}" style="
                background-color: ${bankInfo.points >= path.cost ? '#4a4a4a' : '#3a3a3a'};
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 10px;
                border: 2px solid ${bankInfo.points >= path.cost ? '#4CAF50' : '#ff4444'};
              ">
                <h3 style="margin-top: 0; color: ${bankInfo.points >= path.cost ? '#4CAF50' : '#ff4444'};">
                  ${path.targetType}
                </h3>
                <p>${path.description}</p>
                <p><strong>Cost:</strong> ${path.cost} points</p>
                <button class="evolution-btn" 
                        data-piece-id="${pieceId}"
                        data-path='${JSON.stringify(path)}'
                        ${bankInfo.points >= path.cost ? '' : 'disabled'}
                        style="
                          background-color: ${bankInfo.points >= path.cost ? '#4CAF50' : '#666'};
                          color: white;
                          border: none;
                          padding: 10px 20px;
                          border-radius: 5px;
                          cursor: ${bankInfo.points >= path.cost ? 'pointer' : 'not-allowed'};
                          font-size: 14px;
                          pointer-events: ${bankInfo.points >= path.cost ? 'auto' : 'none'};
                          position: relative;
                          z-index: 1001;
                        ">
                  Evolve (${path.cost} points)
                </button>
              </div>
            `).join('')}
          </div>
          
          <div class="bank-option" style="
            flex: 1;
            min-width: 200px;
            background-color: #4a4a4a;
            padding: 15px;
            border-radius: 5px;
            border: 2px solid #FFA500;
          ">
            <h3 style="margin-top: 0; color: #FFA500;">Bank Points</h3>
            <p>Save your evolution points for later use</p>
            <button class="bank-btn" data-piece-id="${pieceId}" style="
              background-color: #FFA500;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              pointer-events: auto;
              position: relative;
              z-index: 1001;
            ">
              Bank Points
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.insertAdjacentHTML('beforeend', dialogHtml);
  
  // Add event listeners to buttons
  const evolutionBtns = document.querySelectorAll('.evolution-btn');
  const bankBtns = document.querySelectorAll('.bank-btn');
  
  console.log('🎯 Found evolution buttons:', evolutionBtns.length);
  console.log('🎯 Found bank buttons:', bankBtns.length);
  
  evolutionBtns.forEach((button, index) => {
    console.log(`🎯 Adding click listener to evolution button ${index}`);
    button.addEventListener('click', function(e) {
      console.log('🎯 Evolution button clicked!', e);
      e.preventDefault();
      e.stopPropagation();
      const pieceId = this.getAttribute('data-piece-id');
      const path = JSON.parse(this.getAttribute('data-path'));
      chooseEvolution(pieceId, path);
    });
  });
  
  bankBtns.forEach((button, index) => {
    console.log(`🎯 Adding click listener to bank button ${index}`);
    button.addEventListener('click', function(e) {
      console.log('🎯 Bank button clicked!', e);
      e.preventDefault();
      e.stopPropagation();
      const pieceId = this.getAttribute('data-piece-id');
      bankEvolutionPoints(pieceId);
    });
  });
  
  // Start countdown timer
  let timeRemaining = timeLimit;
  const timerEl = document.getElementById('evolution-timer');
  
  const timerInterval = setInterval(() => {
    timeRemaining--;
    if (timerEl) timerEl.textContent = timeRemaining;
    
    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      closeEvolutionChoiceDialog();
    }
  }, 1000);
  
  // Store timer reference for cleanup
  const dialog = document.getElementById('evolution-choice-dialog');
  if (dialog) {
    dialog._timerInterval = timerInterval;
  }
}

/**
 * Choose evolution path
 * @param {string} pieceId - ID of the piece to evolve
 * @param {Object} path - Evolution path data
 */
function chooseEvolution(pieceId, path) {
  console.log('🎯 Choosing evolution:', pieceId, path);
  
  if (typeof socket !== 'undefined' && socket) {
    socket.emit('evolution-choice', {
      pieceId: pieceId,
      targetType: path.targetType,
      cost: path.cost
    });
  }
  
  closeEvolutionChoiceDialog();
}

/**
 * Bank evolution points
 * @param {string} pieceId - ID of the piece
 */
function bankEvolutionPoints(pieceId) {
  console.log('🎯 Banking evolution points for piece:', pieceId);
  
  if (typeof socket !== 'undefined' && socket) {
    socket.emit('bank-evolution-points', {
      pieceId: pieceId
    });
  }
  
  closeEvolutionChoiceDialog();
}

/**
 * Close evolution choice dialog
 */
function closeEvolutionChoiceDialog() {
  const dialog = document.getElementById('evolution-choice-dialog');
  if (dialog) {
    // Clear timer if it exists
    if (dialog._timerInterval) {
      clearInterval(dialog._timerInterval);
    }
    
    dialog.remove();
  }
}

/**
 * Setup evolution socket event handlers
 * @param {Object} socket - Socket.io instance
 */
function setupEvolutionSocketHandlers(socket) {
  if (!socket) return;
  
  // Evolution choice handlers
  socket.on('evolution-choice-available', (data) => {
    console.log('🎯 Evolution choice available:', data);
    showEvolutionChoice(data);
    showEvolutionUI(); // Auto-show evolution UI when choice is available
  });
  
  socket.on('evolution-choice-success', (data) => {
    console.log('🎯 Evolution choice success:', data);
    handleEvolutionCompleted(data);
  });
  
  socket.on('evolution-choice-failed', (data) => {
    console.log('🎯 Evolution choice failed:', data);
    hideEvolutionChoice();
    if (typeof showNotification === 'function') {
      showNotification('Evolution Failed', data.error, 'error');
    }
  });
  
  socket.on('evolution-choice-cancelled', (data) => {
    console.log('🎯 Evolution choice cancelled:', data);
    hideEvolutionChoice();
    if (typeof showNotification === 'function') {
      showNotification('Evolution Cancelled', 'Evolution choice was cancelled', 'info');
    }
  });
  
  socket.on('evolution-choice-dialog', (data) => {
    console.log('🎯 Evolution choice dialog event received:', data);
    const { pieceId, piece, reason, availablePaths, bankInfo, timeLimit } = data;
    showEvolutionChoiceDialog(pieceId, piece, reason, availablePaths, bankInfo, timeLimit);
  });
  
  socket.on('evolution-completed', (data) => {
    // Handle evolution completed by other players
    const playerName = data.playerName || 'Unknown Player';
    if (typeof showNotification === 'function') {
      showNotification('Player Evolution',
        `${playerName}'s ${data.oldType} evolved to ${data.newType}!`,
        'success');
    }
  });
  
  socket.on('evolution-point-gained', (data) => {
    console.log(`🎯 Evolution point gained event:`, data);
    
    // Update all floating evolution point labels
    updateAllEvolutionPointLabels();
    
    if (typeof showNotification === 'function') {
      showNotification('Evolution Points',
        `+${data.points} evolution points! (${data.reason.replace('_', ' ')})`,
        'success');
    }
    
    // Update evolution bank display if UI is open
    const evolutionUI = document.getElementById('evolution-ui');
    if (evolutionUI && evolutionUI.style.display === 'block') {
      refreshEvolutionBank();
    }
  });
  
  socket.on('evolution-points-banked', (data) => {
    const { points, totalPoints } = data;
    
    if (typeof showNotification === 'function') {
      showNotification('Evolution Points',
        `Banked ${points} evolution points! Total: ${totalPoints}`,
        'success');
    }
  });
  
  socket.on('evolution-bank-updated', (data) => {
    updateEvolutionBank(data);
  });
}

/**
 * Get current evolution choice
 * @returns {Object|null} Current evolution choice data
 */
function getCurrentEvolutionChoice() {
  return currentEvolutionChoice;
}

/**
 * Get player evolution bank
 * @returns {Object} Player evolution bank data
 */
function getPlayerEvolutionBank() {
  return playerEvolutionBank;
}

/**
 * Set player evolution bank
 * @param {Object} bankData - Evolution bank data
 */
function setPlayerEvolutionBank(bankData) {
  playerEvolutionBank = bankData;
}

export {
  getEvolutionPointsForPiece,
  createEvolutionPointsLabel,
  updateAllEvolutionPointLabels,
  updateEvolutionPointsLabel,
  showEvolutionUI,
  hideEvolutionUI,
  refreshEvolutionBank,
  updateEvolutionBank,
  showEvolutionChoice,
  hideEvolutionChoice,
  handleEvolutionCompleted,
  showEvolutionChoiceDialog,
  chooseEvolution,
  bankEvolutionPoints,
  closeEvolutionChoiceDialog,
  setupEvolutionSocketHandlers,
  getCurrentEvolutionChoice,
  getPlayerEvolutionBank,
  setPlayerEvolutionBank
};