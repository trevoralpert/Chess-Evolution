// Color Utilities Module
// Pure color utility functions - safe to extract

// ✅ PHASE 4: Color mapping synchronized with server auto-assignment system
export const COLOR_MAP = {
  'red': 0xFF0000,      // Player 1
  'blue': 0x0080FF,     // Player 2
  'green': 0x00FF00,    // Player 3
  'orange': 0xFF8000,   // Player 4
  'purple': 0x8000FF,   // Player 5
  'yellow': 0xFFD700,   // Player 6
  'cyan': 0x00FFFF,     // Player 7
  'pink': 0xFF69B4      // Player 8
};

/**
 * Convert color string to hex value
 * @param {string} colorString - Color name
 * @returns {number} Hex color value
 */
export function getColorFromString(colorString) {
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
 * Get player color using server-assigned color with fallback
 * @param {string} playerId - Player ID
 * @param {number} playerIndex - Player index (0-based)
 * @param {object} gameState - Current game state (optional)
 * @returns {number} Hex color value
 */
export function getPlayerColor(playerId, playerIndex, gameState) {
  // Check if player has server-assigned color
  if (gameState && gameState.players) {
    const player = gameState.players[playerId];
    if (player && player.selectedColor && COLOR_MAP[player.selectedColor]) {
      return COLOR_MAP[player.selectedColor];
    }
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
 * Get piece color for a specific player
 * @param {object} piece - Piece object
 * @param {object} player - Player object
 * @param {number} playerIndex - Player index
 * @returns {number} THREE.js color value
 */
export function getPieceColorForPlayer(piece, player, playerIndex) {
  if (!piece || !player) return 0xFFFFFF;
  
  // Get the player's assigned color
  const colorName = getPlayerColor(player.id, playerIndex);
  return getColorFromString(colorName);
}

/**
 * Convert RGB values to hex color
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {number} Hex color value
 */
export function rgbToHex(r, g, b) {
  return (r << 16) | (g << 8) | b;
}

/**
 * Convert hex color to RGB components
 * @param {number} hex - Hex color value
 * @returns {object} RGB components {r, g, b}
 */
export function hexToRgb(hex) {
  return {
    r: (hex >> 16) & 255,
    g: (hex >> 8) & 255,
    b: hex & 255
  };
}

/**
 * Lighten a color by a percentage
 * @param {number} color - Original color
 * @param {number} amount - Amount to lighten (0-1)
 * @returns {number} Lightened color
 */
export function lightenColor(color, amount) {
  const rgb = hexToRgb(color);
  return rgbToHex(
    Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount)),
    Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount)),
    Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount))
  );
}

/**
 * Darken a color by a percentage
 * @param {number} color - Original color
 * @param {number} amount - Amount to darken (0-1)
 * @returns {number} Darkened color
 */
export function darkenColor(color, amount) {
  const rgb = hexToRgb(color);
  return rgbToHex(
    Math.floor(rgb.r * (1 - amount)),
    Math.floor(rgb.g * (1 - amount)),
    Math.floor(rgb.b * (1 - amount))
  );
}