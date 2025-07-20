// Model Utilities Module
// Model scaling and configuration utilities - safe to extract

// Model paths configuration - using finalized GLB files from Final pieces folder
export const MODEL_PATHS = {
  'KING': './chess piece models/Final pieces/KING.glb',
  'QUEEN': './chess piece models/Final pieces/QUEEN.glb',
  'ROOK': './chess piece models/Final pieces/ROOK.glb',
  'KNIGHT': './chess piece models/Final pieces/KNIGHT.glb',
  'BISHOP': './chess piece models/Final pieces/BISHOP.glb',
  'PAWN': './chess piece models/Final pieces/PAWN.glb',
  'SPLITTER': './chess piece models/Final pieces/SPLITTER.glb',
  'JUMPER': './chess piece models/Final pieces/JUMPER.glb',
  'SUPER_JUMPER': './chess piece models/Final pieces/SUPER_JUMPER.glb',
  'HYPER_JUMPER': './chess piece models/Final pieces/HYPER_JUMPER.glb',
  'MISTRESS_JUMPER': './chess piece models/Final pieces/MISTRESS_JUMPER.glb',
  'HYBRID_QUEEN': './chess piece models/Final pieces/HYBRID_QUEEN.glb'
};

/**
 * Get model scale for GLB models
 * @param {string} pieceType - Type of piece
 * @returns {number} Scale factor
 */
export function getModelScale(pieceType) {
  const scaleMap = {
    'KING': 0.5,
    'QUEEN': 0.45,
    'ROOK': 0.4,
    'KNIGHT': 0.4,
    'BISHOP': 0.4,
    'PAWN': 0.3,
    'SPLITTER': 0.35,
    'JUMPER': 0.4,
    'SUPER_JUMPER': 0.45,
    'HYPER_JUMPER': 0.5,
    'MISTRESS_JUMPER': 0.55,
    'HYBRID_QUEEN': 0.6
  };
  return scaleMap[pieceType] || 0.4;
}

/**
 * Get geometric scale for fallback shapes
 * @param {string} pieceType - Type of piece
 * @returns {number} Scale factor
 */
export function getGeometricScale(pieceType) {
  const scaleMap = {
    'KING': 1.2,
    'QUEEN': 1.1,
    'ROOK': 1.0,
    'KNIGHT': 1.0,
    'BISHOP': 1.0,
    'PAWN': 1.0,
    'SPLITTER': 1.0,
    'JUMPER': 1.0,
    'SUPER_JUMPER': 1.1,
    'HYPER_JUMPER': 1.15,
    'MISTRESS_JUMPER': 1.2,
    'HYBRID_QUEEN': 1.3
  };
  return scaleMap[pieceType] || 1.0;
}

/**
 * Get model height adjustment for positioning
 * @param {string} pieceType - Type of piece
 * @returns {number} Height adjustment
 */
export function getModelHeightAdjustment(pieceType) {
  const adjustmentMap = {
    'KING': 0.08,        // King appears sunken, lift it up
    'QUEEN': 0.04,       // Queen might need slight adjustment
    'ROOK': 0.02,        // Rook might need slight adjustment
    'KNIGHT': 0.02,      // Knight might need slight adjustment
    'BISHOP': 0.03,      // Bishop might need slight adjustment
    'PAWN': 0.0,         // Pawn is the reference - no adjustment needed
    'SPLITTER': 0.02,    // Evolved pieces might need adjustments
    'JUMPER': 0.03,
    'SUPER_JUMPER': 0.03,
    'HYPER_JUMPER': 0.04,
    'MISTRESS_JUMPER': 0.05,
    'HYBRID_QUEEN': 0.06
  };
  return adjustmentMap[pieceType] || 0.0;
}

/**
 * Check if a piece type has evolved
 * @param {string} pieceType - Type of piece
 * @returns {boolean} True if evolved
 */
export function isEvolvedPiece(pieceType) {
  return pieceType.includes('-evolved-') || 
         pieceType.includes('super-') ||
         pieceType.includes('ultimate-') ||
         pieceType.includes('legendary-') ||
         pieceType.includes('mythical-') ||
         pieceType.includes('divine-');
}

/**
 * Get evolution level of a piece
 * @param {string} pieceType - Type of piece
 * @returns {number} Evolution level (0 = base, 1+ = evolved)
 */
export function getEvolutionLevel(pieceType) {
  if (pieceType.includes('divine-')) return 6;
  if (pieceType.includes('mythical-')) return 5;
  if (pieceType.includes('legendary-')) return 4;
  if (pieceType.includes('ultimate-')) return 3;
  if (pieceType.includes('super-')) return 2;
  if (pieceType.includes('-evolved-')) return 1;
  return 0;
}

/**
 * Get base piece type from evolved type
 * @param {string} pieceType - Type of piece
 * @returns {string} Base piece type
 */
export function getBasePieceType(pieceType) {
  return pieceType.split('-')[0];
}

/**
 * Get evolution tier name
 * @param {number} level - Evolution level
 * @returns {string} Tier name
 */
export function getEvolutionTierName(level) {
  switch (level) {
    case 0: return 'Base';
    case 1: return 'Evolved';
    case 2: return 'Super';
    case 3: return 'Ultimate';
    case 4: return 'Legendary';
    case 5: return 'Mythical';
    case 6: return 'Divine';
    default: return 'Unknown';
  }
}