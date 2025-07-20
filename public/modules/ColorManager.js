// Color management system for EvoChess
// Handles player colors, color selection, and color-related UI

// Color mapping from server color IDs to hex values
const COLOR_MAP = {
  'red': 0xFF0000,
  'blue': 0x0080FF,
  'light_blue': 0x40C0FF,
  'green': 0x00FF00,
  'yellow': 0xFFD700,
  'purple': 0x8000FF,
  'magenta': 0xFF00FF,
  'cyan': 0x00FFFF,
  'orange': 0xFF8000,
  'pink': 0xFF69B4,
  'lime': 0x00FF80,
  'teal': 0x008080
};

// Color selection state
let availableColors = [];
let selectedColor = null; // Current selected color ID from color picker

/**
 * Helper function to convert color string to hex
 * @param {string} colorString - Color name string
 * @returns {number} Hex color value
 */
function getColorFromString(colorString) {
  const colorMap = {
    'red': 0xff0000,
    'blue': 0x0000ff,
    'green': 0x00ff00,
    'yellow': 0xffff00,
    'purple': 0xff00ff,
    'cyan': 0x00ffff,
    'orange': 0xff8800,
    'pink': 0xff69b4
  };
  return colorMap[colorString] || 0xffffff;
}

/**
 * Get distinct player color using server-assigned color
 * @param {string} playerId - Player ID
 * @param {number} playerIndex - Player index
 * @returns {number} Hex color value
 */
function getPlayerColor(playerId, playerIndex) {
  const player = gameState.players[playerId];
  
  if (player && player.selectedColor && COLOR_MAP[player.selectedColor]) {
    return COLOR_MAP[player.selectedColor];
  }
  
  // Fallback to index-based colors (more reliable than string-based)
  const fallbackColors = [
    0xFF6B6B, // Red-ish
    0x4ECDC4, // Cyan/Teal
    0x45B7D1, // Blue
    0x96CEB4, // Green
    0xFECE85, // Orange
    0xF8B500, // Yellow
    0xC44569, // Pink
    0x6C5CE7  // Purple
  ];
  
  // Handle missing or invalid playerIndex
  let colorIndex = 0;
  if (typeof playerIndex === 'number' && !isNaN(playerIndex)) {
    colorIndex = playerIndex % fallbackColors.length;
  } else {
    // If no valid playerIndex, try to derive from playerId
    if (gameState && gameState.players) {
      const playerIds = Object.keys(gameState.players);
      const foundIndex = playerIds.indexOf(playerId);
      colorIndex = foundIndex >= 0 ? foundIndex % fallbackColors.length : 0;
    }
  }
  
  const fallbackColor = fallbackColors[colorIndex];
  
  console.log(`🎨 Using fallback color for player ${playerIndex || 'undefined'}: ${fallbackColor.toString(16)}`);
  return fallbackColor;
}

/**
 * Enhanced piece color function that prioritizes player identification
 * @param {Object} piece - Piece object
 * @param {Object} player - Player object
 * @param {number} playerIndex - Player index
 * @returns {THREE.Color|null} Color object or null
 */
function getPieceColorForPlayer(piece, player, playerIndex) {
  // ✅ PHASE 4: Check if piece has inherited color from server (for split pieces)
  if (piece.inheritedColor && COLOR_MAP[piece.inheritedColor]) {
    const inheritedHexColor = COLOR_MAP[piece.inheritedColor];
    console.log(`🎨 PHASE 4 - SPLIT INHERITANCE SUCCESS: Split piece ${piece.id} using server-inherited color ${piece.inheritedColor} → 0x${inheritedHexColor.toString(16).toUpperCase()}`);
    return inheritedHexColor;
  }
  
  // Debug: Log if inheritedColor exists but not found in COLOR_MAP
  if (piece.inheritedColor && !COLOR_MAP[piece.inheritedColor]) {
    console.warn(`🚨 PHASE 4 - COLOR_MAP MISMATCH: Split piece ${piece.id} has inheritedColor '${piece.inheritedColor}' but it's not in COLOR_MAP:`, Object.keys(COLOR_MAP));
  }

  // Check if this is a split piece that should inherit parent color (legacy fallback)
  if (piece.id && piece.id.includes('-split-')) {
    // For split pieces, find any existing piece with the same player that has a color we can inherit
    // Look for other pieces from the same player that might have evolved colors
    let parentColor = null;
    
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
          
          if (parentColor) {
            console.log(`🎨 Split piece ${piece.id} inheriting color from parent ${existingPieceId}`);
            return parentColor;
          }
        }
      }
    }
  }
  
  // Use the base player color
  const basePlayerColor = getPlayerColor(piece.playerId, playerIndex);
  return new THREE.Color(basePlayerColor);
}

/**
 * Apply color to a mesh and all its children
 * @param {THREE.Mesh} mesh - The mesh to color
 * @param {THREE.Color} color - The color to apply
 */
function applyColorToMesh(mesh, color) {
  if (mesh.material) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(mat => {
        if (mat.color) mat.color.copy(color);
      });
    } else {
      if (mesh.material.color) mesh.material.color.copy(color);
    }
  }
  // Apply to children too
  if (mesh.children) {
    mesh.children.forEach(child => applyColorToMesh(child, color));
  }
}

/**
 * Update player color indicators in the UI
 */
function updatePlayerColorIndicators() {
  // Find or create player color indicator div
  let colorIndicator = document.getElementById('player-color-indicator');
  if (!colorIndicator) {
    colorIndicator = document.createElement('div');
    colorIndicator.id = 'player-color-indicator';
    colorIndicator.style.cssText = `
      margin-top: 10px;
      padding: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 5px;
      font-size: 12px;
    `;
    document.getElementById('ui').appendChild(colorIndicator);
  }
  
  // Clear existing content
  colorIndicator.innerHTML = '<div style="color: #ccc; margin-bottom: 5px;">Player Colors:</div>';
  
  // Add color indicators for each player
  const currentPlayerId = socket.id;
  const players = Object.values(gameState.players);
  
  players.forEach((player, index) => {
    const playerColor = getPlayerColor(player.id, player.index) || 0xffffff;
    const colorHex = '#' + playerColor.toString(16).padStart(6, '0');
    
    const playerDiv = document.createElement('div');
    playerDiv.style.cssText = `
      display: flex;
      align-items: center;
      margin: 2px 0;
      font-size: 11px;
    `;
    
    const colorBox = document.createElement('div');
    colorBox.style.cssText = `
      width: 12px;
      height: 12px;
      background-color: ${colorHex};
      border: 1px solid #666;
      margin-right: 6px;
      border-radius: 2px;
    `;
    
    const playerName = document.createElement('span');
    playerName.textContent = `${player.name}${player.id === currentPlayerId ? ' (You)' : ''}`;
    playerName.style.color = player.id === currentPlayerId ? '#ffff00' : '#ccc';
    
    playerDiv.appendChild(colorBox);
    playerDiv.appendChild(playerName);
    colorIndicator.appendChild(playerDiv);
  });
}

/**
 * Initialize color selection system
 */
function initializeColorSelection() {
  socket.emit('get-available-colors');
}

/**
 * Update color selector UI
 */
function updateColorSelector() {
  const colorOptionsEl = document.getElementById('color-options');
  if (!colorOptionsEl) return;
  
  colorOptionsEl.innerHTML = '';
  
  availableColors.forEach(color => {
    const option = document.createElement('div');
    option.className = 'color-option';
    option.style.backgroundColor = `#${color.hex.toString(16).padStart(6, '0')}`;
    option.title = color.name;
    option.dataset.colorId = color.id;
    
    if (selectedColor === color.id) {
      option.classList.add('selected');
      option.textContent = '✓';
    }
    
    option.addEventListener('click', () => {
      console.log('🎨 User clicked on color:', color.id, color.name);
      if (selectedColor !== color.id) {
        console.log('🎨 Sending color selection to server:', color.id);
        socket.emit('select-color', { colorId: color.id });
      } else {
        console.log('🎨 Color already selected, ignoring click');
      }
    });
    
    colorOptionsEl.appendChild(option);
  });
}

/**
 * Update selected color display
 */
function updateSelectedColorDisplay() {
  const selectedColorEl = document.getElementById('selected-color');
  if (!selectedColorEl) return;
  
  if (selectedColor) {
    const colorInfo = availableColors.find(c => c.id === selectedColor);
    if (colorInfo) {
      selectedColorEl.textContent = `Selected: ${colorInfo.name}`;
      selectedColorEl.style.color = `#${colorInfo.hex.toString(16).padStart(6, '0')}`;
    }
  } else {
    selectedColorEl.textContent = 'None selected';
    selectedColorEl.style.color = '#aaa';
  }
}

/**
 * Setup color selection socket handlers
 * @param {Socket} socket - Socket.io instance
 */
function setupColorSocketHandlers(socket) {
  // Socket handlers for color selection
  socket.on('available-colors', (data) => {
    availableColors = data.colors;
    updateColorSelector();
  });

  socket.on('color-selected', (data) => {
    console.log('🎨 Color selected:', data.colorId);
    selectedColor = data.colorId;
    updateColorSelector();
    updateSelectedColorDisplay();
    
    // Force piece color update by clearing cache and recreating pieces
    if (typeof performanceOptimizer !== 'undefined') {
      performanceOptimizer.clearPieceCache();
    }
    if (gameState && gameState.pieces && typeof updateVisuals === 'function') {
      console.log('🔄 Updating piece colors after color selection');
      updateVisuals();
    }
  });

  socket.on('color-selection-failed', (data) => {
    console.warn('Color selection failed:', data.error);
    alert('Color selection failed: ' + data.error);
  });
}

// Getters for state access
function getSelectedColor() {
  return selectedColor;
}

function setSelectedColor(colorId) {
  selectedColor = colorId;
}

function getAvailableColors() {
  return availableColors;
}

function setAvailableColors(colors) {
  availableColors = colors;
}

export { 
  COLOR_MAP,
  getColorFromString,
  getPlayerColor,
  getPieceColorForPlayer,
  applyColorToMesh,
  updatePlayerColorIndicators,
  initializeColorSelection,
  updateColorSelector,
  updateSelectedColorDisplay,
  setupColorSocketHandlers,
  getSelectedColor,
  setSelectedColor,
  getAvailableColors,
  setAvailableColors
};