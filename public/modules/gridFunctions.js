// Grid Functions Module
// Pure functions for grid positioning, calculations, and utilities

import { gridToSpherical, sphericalToCartesian } from './mathUtils.js';
import { WORLD_CONFIG } from './gameConfig.js';

/**
 * Calculate world position for a grid coordinate
 * @param {number} row - Grid row
 * @param {number} col - Grid column  
 * @param {number} rows - Total grid rows
 * @param {number} cols - Total grid columns
 * @returns {object} 3D world position {x, y, z}
 */
export function getWorldPosition(row, col, rows = 20, cols = 8) {
  console.log('🌍 getWorldPosition called with:', {
    row, col, gridRows: rows, gridCols: cols
  });
  
  // Keep original piece positioning - pieces are at grid intersections/vertices
  const { phi, theta } = gridToSpherical(rows, cols, row, col);
  
  const position = sphericalToCartesian(
    WORLD_CONFIG.globeRadius + WORLD_CONFIG.pieceHeightOffset, 
    phi, 
    theta
  );
  
  console.log('🌍 Calculated position:', { phi, theta, position });
  return position;
}

/**
 * Get grid position from world coordinates
 * @param {object} worldPos - World position {x, y, z}
 * @param {number} rows - Total grid rows
 * @param {number} cols - Total grid columns
 * @returns {object|null} Grid position {row, col} or null if invalid
 */
export function getGridPositionFromWorld(worldPos, rows = 20, cols = 8) {
  // Convert world position back to spherical coordinates
  const distance = Math.sqrt(worldPos.x * worldPos.x + worldPos.y * worldPos.y + worldPos.z * worldPos.z);
  const phi = Math.acos(worldPos.y / distance);
  const theta = Math.atan2(worldPos.z, worldPos.x);
  
  // Convert spherical back to grid coordinates
  // This is the inverse of gridToSpherical
  const row = Math.round((phi / Math.PI) * (rows - 1));
  const col = Math.round(((theta + Math.PI) / (2 * Math.PI)) * cols) % cols;
  
  // Validate the position
  if (row >= 0 && row < rows && col >= 0 && col < cols) {
    return { row, col };
  }
  
  return null;
}

/**
 * Check if a grid position is valid
 * @param {number} row - Grid row
 * @param {number} col - Grid column
 * @param {number} rows - Total grid rows
 * @param {number} cols - Total grid columns
 * @returns {boolean} True if position is valid
 */
export function isValidGridPosition(row, col, rows = 20, cols = 8) {
  return row >= 0 && row < rows && col >= 0 && col < cols;
}

/**
 * Get neighboring grid positions
 * @param {number} row - Grid row
 * @param {number} col - Grid column
 * @param {number} rows - Total grid rows
 * @param {number} cols - Total grid columns
 * @param {boolean} includeDiagonal - Include diagonal neighbors
 * @returns {Array} Array of valid neighboring positions
 */
export function getNeighbors(row, col, rows = 20, cols = 8, includeDiagonal = true) {
  const neighbors = [];
  
  const directions = includeDiagonal 
    ? [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]]
    : [[-1,0], [0,-1], [0,1], [1,0]];
  
  directions.forEach(([dRow, dCol]) => {
    let newRow = row + dRow;
    let newCol = (col + dCol + cols) % cols; // Handle wrap-around for columns
    
    if (isValidGridPosition(newRow, newCol, rows, cols)) {
      neighbors.push({ row: newRow, col: newCol });
    }
  });
  
  return neighbors;
}

/**
 * Calculate distance between two grid positions
 * @param {number} row1 - First position row
 * @param {number} col1 - First position column
 * @param {number} row2 - Second position row
 * @param {number} col2 - Second position column
 * @param {number} cols - Total grid columns for wrap-around calculation
 * @returns {number} Distance between positions
 */
export function getGridDistance(row1, col1, row2, col2, cols = 8) {
  const rowDiff = Math.abs(row2 - row1);
  
  // Handle column wrap-around
  const colDiff1 = Math.abs(col2 - col1);
  const colDiff2 = cols - colDiff1;
  const colDiff = Math.min(colDiff1, colDiff2);
  
  return Math.sqrt(rowDiff * rowDiff + colDiff * colDiff);
}

/**
 * Get all positions in a line between two grid positions
 * @param {number} fromRow - Starting row
 * @param {number} fromCol - Starting column
 * @param {number} toRow - Ending row
 * @param {number} toCol - Ending column
 * @param {number} rows - Total grid rows
 * @param {number} cols - Total grid columns
 * @returns {Array} Array of positions in the line (excluding start and end)
 */
export function getPositionsInLine(fromRow, fromCol, toRow, toCol, rows = 20, cols = 8) {
  const positions = [];
  
  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  
  // Handle column wrap-around - choose shorter path
  let actualColDiff = colDiff;
  if (Math.abs(colDiff) > cols / 2) {
    actualColDiff = colDiff > 0 ? colDiff - cols : colDiff + cols;
  }
  
  const steps = Math.max(Math.abs(rowDiff), Math.abs(actualColDiff));
  
  for (let i = 1; i < steps; i++) {
    const row = Math.round(fromRow + (rowDiff * i) / steps);
    let col = Math.round(fromCol + (actualColDiff * i) / steps);
    
    // Handle wrap-around
    col = ((col % cols) + cols) % cols;
    
    if (isValidGridPosition(row, col, rows, cols)) {
      positions.push({ row, col });
    }
  }
  
  return positions;
}

/**
 * Check if a position is on the edge of the grid
 * @param {number} row - Grid row
 * @param {number} col - Grid column
 * @param {number} rows - Total grid rows
 * @param {number} cols - Total grid columns
 * @returns {boolean} True if position is on edge
 */
export function isEdgePosition(row, col, rows = 20, cols = 8) {
  return row === 0 || row === rows - 1;
}

/**
 * Check if a position is a corner position
 * @param {number} row - Grid row
 * @param {number} col - Grid column
 * @param {number} rows - Total grid rows
 * @param {number} cols - Total grid columns
 * @returns {boolean} True if position is a corner
 */
export function isCornerPosition(row, col, rows = 20, cols = 8) {
  return (row === 0 || row === rows - 1) && (col === 0 || col === cols - 1);
}

/**
 * Get all positions in a radius around a center position
 * @param {number} centerRow - Center row
 * @param {number} centerCol - Center column
 * @param {number} radius - Radius in grid units
 * @param {number} rows - Total grid rows
 * @param {number} cols - Total grid columns
 * @returns {Array} Array of positions within radius
 */
export function getPositionsInRadius(centerRow, centerCol, radius, rows = 20, cols = 8) {
  const positions = [];
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (row === centerRow && col === centerCol) continue;
      
      const distance = getGridDistance(centerRow, centerCol, row, col, cols);
      if (distance <= radius) {
        positions.push({ row, col, distance });
      }
    }
  }
  
  return positions.sort((a, b) => a.distance - b.distance);
}

/**
 * Convert grid position to a unique string key
 * @param {number} row - Grid row
 * @param {number} col - Grid column
 * @returns {string} Unique position key
 */
export function positionToKey(row, col) {
  return `${row},${col}`;
}

/**
 * Convert position key back to grid coordinates
 * @param {string} key - Position key
 * @returns {object} Grid position {row, col}
 */
export function keyToPosition(key) {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
}

/**
 * Get the hemisphere (north/south) for a grid row
 * @param {number} row - Grid row
 * @param {number} rows - Total grid rows
 * @returns {string} 'north' or 'south'
 */
export function getHemisphere(row, rows = 20) {
  return row < rows / 2 ? 'north' : 'south';
}

/**
 * Get the latitude zone for a grid row
 * @param {number} row - Grid row
 * @param {number} rows - Total grid rows
 * @returns {string} Zone identifier ('arctic', 'temperate', 'tropical', 'antarctic')
 */
export function getLatitudeZone(row, rows = 20) {
  const normalized = row / (rows - 1);
  
  if (normalized < 0.15) return 'arctic';
  if (normalized < 0.4) return 'temperate-north';
  if (normalized < 0.6) return 'tropical';
  if (normalized < 0.85) return 'temperate-south';
  return 'antarctic';
}

/**
 * Calculate the spherical angle between two grid positions
 * @param {number} row1 - First position row
 * @param {number} col1 - First position column
 * @param {number} row2 - Second position row
 * @param {number} col2 - Second position column
 * @param {number} rows - Total grid rows
 * @param {number} cols - Total grid columns
 * @returns {number} Angle in radians
 */
export function getSphericalAngle(row1, col1, row2, col2, rows = 20, cols = 8) {
  const pos1 = getWorldPosition(row1, col1, rows, cols);
  const pos2 = getWorldPosition(row2, col2, rows, cols);
  
  // Normalize positions
  const len1 = Math.sqrt(pos1.x * pos1.x + pos1.y * pos1.y + pos1.z * pos1.z);
  const len2 = Math.sqrt(pos2.x * pos2.x + pos2.y * pos2.y + pos2.z * pos2.z);
  
  const norm1 = { x: pos1.x / len1, y: pos1.y / len1, z: pos1.z / len1 };
  const norm2 = { x: pos2.x / len2, y: pos2.y / len2, z: pos2.z / len2 };
  
  // Calculate dot product
  const dotProduct = norm1.x * norm2.x + norm1.y * norm2.y + norm1.z * norm2.z;
  
  // Return angle in radians
  return Math.acos(Math.max(-1, Math.min(1, dotProduct)));
}