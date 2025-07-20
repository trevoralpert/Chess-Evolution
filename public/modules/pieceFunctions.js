// Piece Functions Module
// Pure functions for piece creation, evolution points, and piece utilities

import { getPlayerColor } from './colorUtils.js';
import { PIECE_TYPES } from './gameConfig.js';

/**
 * Get evolution points for a piece based on its type
 * @param {object} piece - Piece object with type and playerId
 * @returns {number} Evolution points for the piece
 */
export function getEvolutionPointsForPiece(piece) {
  console.log('🔍 Getting evolution points for piece:', piece.id, 'type:', piece.type);
  console.log('🔍 Piece player ID:', piece.playerId);
  
  // King pieces don't have evolution points - hide their labels
  if (piece.type === 'KING') {
    console.log('🔍 King pieces do not have evolution points');
    return 0;
  }
  
  // PHASE 1C: Always display piece BASE VALUES (intrinsic to piece type)
  // These are the inherent point values of pieces, NOT the player's evolution bank
  const pieceBaseValues = {
    'PAWN': 1,        // ✅ Pawns always show 1 point (their base value)
    'ROOK': 5,
    'KNIGHT': 3,
    'BISHOP': 3,
    'QUEEN': 9,
    'JUMPER': 3,
    'SUPER_JUMPER': 5,
    'HYPER_JUMPER': 7,
    'SPLITTER': 2,    // ✅ Splitters always show 2 points (their base value)
    'HYBRID_QUEEN': 12,
    'MISTRESS_JUMPER': 8
  };
  
  const baseValue = pieceBaseValues[piece.type] || 1;
  console.log('🔍 Using piece base value for', piece.type, ':', baseValue);
  return baseValue;
}

/**
 * Create evolution points label canvas texture
 * @param {number} evolutionPoints - Points to display
 * @param {string} playerId - Player ID for color styling
 * @param {object} gameState - Game state for player lookup
 * @returns {THREE.CanvasTexture} Canvas texture for the label
 */
export function createEvolutionPointsLabel(evolutionPoints, playerId, gameState) {
  console.log('🎨 Creating evolution points label with points:', evolutionPoints, 'for player:', playerId);
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 128; // Double the width for better quality
  canvas.height = 64; // Double the height for better quality
  
  // Get player color for styling
  const player = gameState.players[playerId];
  const playerIndex = player?.index !== undefined ? player.index : 
                     Object.keys(gameState.players).indexOf(playerId);
  
  console.log('🎨 Player index:', playerIndex, 'Player object:', player);
  
  // Determine text color based on player
  let textColor = '#FFD700'; // Gold default
  if (playerIndex === 0) {
    textColor = '#FF6B6B'; // Red team
  } else if (playerIndex === 1) {
    textColor = '#6B9BFF'; // Blue team
  }
  
  console.log('🎨 Using text color:', textColor);
  
  // Clear canvas with transparent background
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set font and text properties
  context.font = 'bold 32px Arial'; // Increased font size for better visibility
  context.fillStyle = textColor;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Add text outline for better visibility
  context.strokeStyle = '#000000';
  context.lineWidth = 3;
  context.strokeText(evolutionPoints.toString(), canvas.width / 2, canvas.height / 2);
  
  // Fill the text
  context.fillText(evolutionPoints.toString(), canvas.width / 2, canvas.height / 2);
  
  // Create and return texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  return texture;
}

/**
 * Create cached text label for symbols
 * @param {string} symbol - Symbol to display
 * @param {Map} cache - Optional cache to use for storing textures
 * @returns {THREE.CanvasTexture} Canvas texture for the symbol
 */
export function createCachedTextLabel(symbol, cache = null) {
  // Check cache first if provided
  if (cache && cache.has(symbol)) {
    return cache.get(symbol);
  }
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 64;
  canvas.height = 64;
  
  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set font and style to match original implementation
  context.fillStyle = 'white';
  context.font = '32px Arial';
  context.textAlign = 'center';
  context.fillText(symbol, 32, 40);
  
  // Create texture
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  // Store in cache if provided
  if (cache) {
    cache.set(symbol, texture);
  }
  
  return texture;
}

/**
 * Create geometric piece mesh for a piece type
 * @param {string} pieceType - Type of piece to create
 * @returns {THREE.Mesh} Geometric mesh for the piece
 */
export function createGeometricPiece(pieceType) {
  let geometry, material;
  
  // Define colors for different piece types
  const pieceColors = {
    'KING': 0xFFD700,     // Gold
    'QUEEN': 0xFF69B4,    // Hot pink
    'ROOK': 0x32CD32,     // Lime green
    'BISHOP': 0x9370DB,   // Medium purple
    'KNIGHT': 0xFF6347,   // Tomato
    'PAWN': 0x87CEEB,     // Sky blue
    'JUMPER': 0xFF8C00,   // Dark orange
    'SUPER_JUMPER': 0xFF4500, // Orange red
    'HYPER_JUMPER': 0xDC143C, // Crimson
    'SPLITTER': 0x20B2AA, // Light sea green
    'HYBRID_QUEEN': 0xDA70D6, // Orchid
    'MISTRESS_JUMPER': 0x8B0000 // Dark red
  };
  
  const color = pieceColors[pieceType] || 0xFFFFFF;
  
  // Create different geometries for different piece types
  switch (pieceType) {
    case 'KING':
      geometry = new THREE.ConeGeometry(0.15, 0.4, 8);
      break;
    case 'QUEEN':
      geometry = new THREE.CylinderGeometry(0.1, 0.15, 0.35, 8);
      break;
    case 'ROOK':
      geometry = new THREE.BoxGeometry(0.25, 0.3, 0.25);
      break;
    case 'BISHOP':
      geometry = new THREE.SphereGeometry(0.12, 8, 8);
      break;
    case 'KNIGHT':
      geometry = new THREE.TetrahedronGeometry(0.15);
      break;
    case 'PAWN':
      geometry = new THREE.SphereGeometry(0.08, 8, 8);
      break;
    case 'JUMPER':
      geometry = new THREE.OctahedronGeometry(0.12);
      break;
    case 'SUPER_JUMPER':
      geometry = new THREE.OctahedronGeometry(0.14);
      break;
    case 'HYPER_JUMPER':
      geometry = new THREE.OctahedronGeometry(0.16);
      break;
    case 'SPLITTER':
      geometry = new THREE.IcosahedronGeometry(0.1);
      break;
    case 'HYBRID_QUEEN':
      geometry = new THREE.DodecahedronGeometry(0.12);
      break;
    case 'MISTRESS_JUMPER':
      geometry = new THREE.TorusGeometry(0.1, 0.05, 8, 16);
      break;
    default:
      geometry = new THREE.SphereGeometry(0.1, 8, 8);
  }
  
  // Create material
  material = new THREE.MeshLambertMaterial({
    color: color,
    transparent: true,
    opacity: 0.9
  });
  
  // Create and return mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  
  return mesh;
}

/**
 * Get piece color for a player
 * @param {object} piece - Piece object
 * @param {object} player - Player object
 * @param {number} playerIndex - Player index
 * @returns {number} Color hex value
 */
export function getPieceColorForPlayer(piece, player, playerIndex) {
  console.log('🎨 Getting piece color for piece:', piece.id, 'player:', player?.id, 'index:', playerIndex);
  
  // Use the getPlayerColor function from colorUtils
  const colorString = getPlayerColor(player?.id || piece.playerId);
  
  // Convert color string to hex number
  if (colorString.startsWith('#')) {
    return parseInt(colorString.substring(1), 16);
  }
  
  // Fallback colors based on player index
  const fallbackColors = [
    0xFF6B6B, // Red for player 0
    0x6B9BFF, // Blue for player 1
    0x6BFF6B, // Green for player 2
    0xFFFF6B, // Yellow for player 3
    0xFF6BFF, // Magenta for player 4
    0x6BFFFF, // Cyan for player 5
    0xFFB366, // Orange for player 6
    0xB366FF  // Purple for player 7
  ];
  
  return fallbackColors[playerIndex] || 0xFFFFFF;
}

/**
 * Validate piece type
 * @param {string} pieceType - Type to validate
 * @returns {boolean} True if valid piece type
 */
export function isValidPieceType(pieceType) {
  return Object.values(PIECE_TYPES).includes(pieceType);
}

/**
 * Get piece movement capabilities
 * @param {string} pieceType - Type of piece
 * @returns {object} Movement capabilities
 */
export function getPieceMovementCapabilities(pieceType) {
  const capabilities = {
    canMove: true,
    canCapture: true,
    canJump: false,
    canSplit: false,
    range: 1,
    directions: 'all' // 'all', 'orthogonal', 'diagonal', 'l-shape'
  };
  
  switch (pieceType) {
    case 'KING':
      capabilities.range = 1;
      capabilities.directions = 'all';
      break;
    case 'QUEEN':
      capabilities.range = Infinity;
      capabilities.directions = 'all';
      break;
    case 'ROOK':
      capabilities.range = Infinity;
      capabilities.directions = 'orthogonal';
      break;
    case 'BISHOP':
      capabilities.range = Infinity;
      capabilities.directions = 'diagonal';
      break;
    case 'KNIGHT':
      capabilities.range = 1;
      capabilities.directions = 'l-shape';
      break;
    case 'PAWN':
      capabilities.range = 1;
      capabilities.directions = 'forward';
      capabilities.canCapture = 'diagonal-forward';
      break;
    case 'JUMPER':
    case 'SUPER_JUMPER':
    case 'HYPER_JUMPER':
    case 'MISTRESS_JUMPER':
      capabilities.canJump = true;
      capabilities.range = pieceType === 'JUMPER' ? 2 : 
                          pieceType === 'SUPER_JUMPER' ? 3 :
                          pieceType === 'HYPER_JUMPER' ? 4 : 5;
      break;
    case 'SPLITTER':
      capabilities.canSplit = true;
      capabilities.range = 2;
      break;
    case 'HYBRID_QUEEN':
      capabilities.range = Infinity;
      capabilities.directions = 'all';
      capabilities.canJump = true;
      break;
  }
  
  return capabilities;
}

/**
 * Get piece symbol for display
 * @param {string} pieceType - Type of piece
 * @returns {string} Unicode symbol for the piece
 */
export function getPieceSymbol(pieceType) {
  const symbols = {
    'KING': '♔',
    'QUEEN': '♕',
    'ROOK': '♖',
    'BISHOP': '♗',
    'KNIGHT': '♘',
    'PAWN': '♙',
    'JUMPER': '⬆',
    'SUPER_JUMPER': '⤴',
    'HYPER_JUMPER': '↗',
    'SPLITTER': '✂',
    'HYBRID_QUEEN': '♛',
    'MISTRESS_JUMPER': '⟐'
  };
  
  return symbols[pieceType] || '?';
}

/**
 * Get piece display name
 * @param {string} pieceType - Type of piece
 * @returns {string} Human-readable name
 */
export function getPieceDisplayName(pieceType) {
  const names = {
    'KING': 'King',
    'QUEEN': 'Queen',
    'ROOK': 'Rook',
    'BISHOP': 'Bishop',
    'KNIGHT': 'Knight',
    'PAWN': 'Pawn',
    'JUMPER': 'Jumper',
    'SUPER_JUMPER': 'Super Jumper',
    'HYPER_JUMPER': 'Hyper Jumper',
    'SPLITTER': 'Splitter',
    'HYBRID_QUEEN': 'Hybrid Queen',
    'MISTRESS_JUMPER': 'Mistress Jumper'
  };
  
  return names[pieceType] || 'Unknown';
}

/**
 * Check if piece can evolve
 * @param {string} pieceType - Type of piece
 * @returns {boolean} True if piece can evolve
 */
export function canPieceEvolve(pieceType) {
  // Kings cannot evolve
  return pieceType !== 'KING';
}

/**
 * Get possible evolution targets for a piece
 * @param {string} pieceType - Current piece type
 * @returns {Array} Array of possible evolution targets
 */
export function getPossibleEvolutions(pieceType) {
  const evolutions = {
    'PAWN': ['QUEEN', 'ROOK', 'BISHOP', 'KNIGHT', 'JUMPER', 'SPLITTER'],
    'ROOK': ['QUEEN', 'HYBRID_QUEEN'],
    'BISHOP': ['QUEEN', 'HYBRID_QUEEN'],
    'KNIGHT': ['QUEEN', 'JUMPER'],
    'QUEEN': ['HYBRID_QUEEN'],
    'JUMPER': ['SUPER_JUMPER'],
    'SUPER_JUMPER': ['HYPER_JUMPER'],
    'HYPER_JUMPER': ['MISTRESS_JUMPER'],
    'SPLITTER': ['QUEEN', 'JUMPER'],
    'HYBRID_QUEEN': [], // Already at top evolution
    'MISTRESS_JUMPER': [], // Already at top evolution
    'KING': [] // Kings cannot evolve
  };
  
  return evolutions[pieceType] || [];
}

/**
 * Calculate piece value for scoring
 * @param {string} pieceType - Type of piece
 * @returns {number} Point value of the piece
 */
export function getPieceValue(pieceType) {
  const values = {
    'KING': 1000, // King is invaluable
    'QUEEN': 9,
    'ROOK': 5,
    'BISHOP': 3,
    'KNIGHT': 3,
    'PAWN': 1,
    'JUMPER': 3,
    'SUPER_JUMPER': 5,
    'HYPER_JUMPER': 7,
    'SPLITTER': 2,
    'HYBRID_QUEEN': 12,
    'MISTRESS_JUMPER': 8
  };
  
  return values[pieceType] || 1;
}