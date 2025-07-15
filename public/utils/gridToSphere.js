import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';

/**
 * Convert grid coordinates to spherical coordinates
 * @param {number} rows - Total number of rows in the grid
 * @param {number} cols - Total number of columns in the grid
 * @param {number} row - Current row (0-based)
 * @param {number} col - Current column (0-based)
 * @returns {object} Object with phi and theta in degrees
 */
export function gridToSpherical(rows, cols, row, col) {
  // Map row to phi (latitude): 0° to 180°
  const phi = (row / (rows - 1)) * 180;
  
  // Map col to theta (longitude): 0° to 360°
  const theta = (col / cols) * 360;
  
  return { phi, theta };
}

/**
 * Convert spherical coordinates to 3D Cartesian coordinates
 * @param {number} r - Radius
 * @param {number} phi - Latitude angle in degrees (0-180)
 * @param {number} theta - Longitude angle in degrees (0-360)
 * @returns {object} Object with x, y, z coordinates
 */
export function sphericalToCartesian(r, phi, theta) {
  const phiRad = THREE.MathUtils.degToRad(phi);
  const thetaRad = THREE.MathUtils.degToRad(theta);
  
  return {
    x: r * Math.sin(phiRad) * Math.cos(thetaRad),
    y: r * Math.cos(phiRad),
    z: r * Math.sin(phiRad) * Math.sin(thetaRad),
  };
}

/**
 * Convert 3D Cartesian coordinates back to spherical coordinates
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @returns {object} Object with r, phi (degrees), theta (degrees)
 */
export function cartesianToSpherical(x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z);
  const phi = THREE.MathUtils.radToDeg(Math.acos(y / r));
  const theta = THREE.MathUtils.radToDeg(Math.atan2(z, x));
  
  return { r, phi, theta: theta < 0 ? theta + 360 : theta };
}

/**
 * Calculate distance between two spherical coordinates
 * @param {number} phi1 - First latitude in degrees
 * @param {number} theta1 - First longitude in degrees
 * @param {number} phi2 - Second latitude in degrees
 * @param {number} theta2 - Second longitude in degrees
 * @returns {number} Angular distance in degrees
 */
export function sphericalDistance(phi1, theta1, phi2, theta2) {
  const phi1Rad = THREE.MathUtils.degToRad(phi1);
  const theta1Rad = THREE.MathUtils.degToRad(theta1);
  const phi2Rad = THREE.MathUtils.degToRad(phi2);
  const theta2Rad = THREE.MathUtils.degToRad(theta2);
  
  // Haversine formula for spherical distance
  const deltaTheta = theta2Rad - theta1Rad;
  const deltaPhi = phi2Rad - phi1Rad;
  
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
           Math.cos(phi1Rad) * Math.cos(phi2Rad) *
           Math.sin(deltaTheta / 2) * Math.sin(deltaTheta / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return THREE.MathUtils.radToDeg(c);
}

/**
 * Check if two grid positions are adjacent (for movement validation)
 * @param {number} rows - Total number of rows
 * @param {number} cols - Total number of columns
 * @param {number} row1 - First row
 * @param {number} col1 - First column
 * @param {number} row2 - Second row
 * @param {number} col2 - Second column
 * @returns {boolean} True if positions are adjacent
 */
export function areAdjacent(rows, cols, row1, col1, row2, col2) {
  // Handle wraparound for longitude
  const colDiff = Math.min(
    Math.abs(col2 - col1),
    Math.abs(col2 - col1 + cols),
    Math.abs(col2 - col1 - cols)
  );
  
  const rowDiff = Math.abs(row2 - row1);
  
  // Adjacent if within 1 step in any direction
  return (rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0);
} 