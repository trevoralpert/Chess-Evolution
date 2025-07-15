// Game Configuration
const GAME_CONFIG = {
  // Grid system
  GRID_ROWS: 20,
  GRID_COLS: 8, // 8 latitude lines for perfect pawn circle around king
  
  // Game mechanics
  MOVE_INTERVAL: 7000, // 7 seconds in milliseconds
  MAX_PLAYERS: 8,
  
  // Starting positions (relative to player's spawn area)
  STARTING_FORMATION: {
    // King at spawn point (pole), 8 pawns in circular ring at next latitude
    KING: { row: 0, col: 0 }, // At the spawn point (pole)
    PAWNS: [
      { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
      { row: 1, col: 4 }, { row: 1, col: 5 }, { row: 1, col: 6 }, { row: 1, col: 7 }
    ]
  },
  
  // Player spawn areas (optimized for 2 players at opposite poles)
  // Kings spawn at exact vertices (poles)
  SPAWN_AREAS: [
    { baseRow: 0, baseCol: 0 },   // Player 1 - North Pole
    { baseRow: 19, baseCol: 4 },  // Player 2 - South Pole (centered in 8-column grid)
    { baseRow: 5, baseCol: 2 },   // Player 3 - Distributed (if needed)
    { baseRow: 14, baseCol: 6 },  // Player 4 - Distributed (if needed)
    { baseRow: 3, baseCol: 4 },   // Player 5 - Distributed (if needed)
    { baseRow: 16, baseCol: 0 },  // Player 6 - Distributed (if needed)
    { baseRow: 7, baseCol: 6 },   // Player 7 - Distributed (if needed)
    { baseRow: 12, baseCol: 2 }   // Player 8 - Distributed (if needed)
  ],
  
  // Piece types and values
  PIECE_TYPES: {
    KING: { value: 99, symbol: 'K' },
    PAWN: { value: 1, symbol: 'P' },
    BISHOP: { value: 3, symbol: 'B' },
    KNIGHT: { value: 3, symbol: 'N' },
    ROOK: { value: 5, symbol: 'R' },
    QUEEN: { value: 9, symbol: 'Q' },
    
    // Custom pieces
    SPLITTER: { value: 2, symbol: 'S' },
    JUMPER: { value: 4, symbol: 'J' },
    SUPER_JUMPER: { value: 7, symbol: 'SJ' },
    HYPER_JUMPER: { value: 9, symbol: 'HJ' },
    MISTRESS_JUMPER: { value: 10, symbol: 'MJ' },
    HYBRID_QUEEN: { value: 12, symbol: 'HQ' }
  }
};

// Grid utility functions
const GridUtils = {
  /**
   * Check if a grid position is valid
   */
  isValidPosition(row, col) {
    return row >= 0 && row < GAME_CONFIG.GRID_ROWS && 
           col >= 0 && col < GAME_CONFIG.GRID_COLS;
  },
  
  /**
   * Normalize column for wraparound (longitude wraps around)
   */
  normalizeCol(col) {
    while (col < 0) col += GAME_CONFIG.GRID_COLS;
    while (col >= GAME_CONFIG.GRID_COLS) col -= GAME_CONFIG.GRID_COLS;
    return col;
  },
  
  /**
   * Get grid position key for storage
   */
  getPositionKey(row, col) {
    return `${row},${col}`;
  },
  
  /**
   * Parse position key back to row/col
   */
  parsePositionKey(key) {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  },
  
  /**
   * Calculate distance between two grid positions
   */
  getDistance(row1, col1, row2, col2) {
    const rowDiff = Math.abs(row2 - row1);
    
    // Handle longitude wraparound
    const colDiff = Math.min(
      Math.abs(col2 - col1),
      Math.abs(col2 - col1 + GAME_CONFIG.GRID_COLS),
      Math.abs(col2 - col1 - GAME_CONFIG.GRID_COLS)
    );
    
    return Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);
  },
  
  /**
   * Get all adjacent positions to a given position
   */
  getAdjacentPositions(row, col) {
    const adjacent = [];
    
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue; // Skip center position
        
        const newRow = row + dr;
        const newCol = this.normalizeCol(col + dc);
        
        if (this.isValidPosition(newRow, newCol)) {
          adjacent.push({ row: newRow, col: newCol });
        }
      }
    }
    
    return adjacent;
  }
};

module.exports = { GAME_CONFIG, GridUtils }; 