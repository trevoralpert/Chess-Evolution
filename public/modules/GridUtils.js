// Grid utility functions for EvoChess
// Pure mathematical functions for converting between grid coordinates and 3D world positions

/**
 * Convert grid coordinates to spherical coordinates
 * @param {number} rows - Total number of rows in the grid
 * @param {number} cols - Total number of columns in the grid
 * @param {number} row - Row coordinate (0-based)
 * @param {number} col - Column coordinate (0-based)
 * @returns {Object} Object with phi (latitude) and theta (longitude) in degrees
 */
function gridToSpherical(rows, cols, row, col) {
  // phi: 0° = north pole, 180° = south pole
  const phi = (row / (rows - 1)) * 180;
  // theta: 0° = 0°, 360° = 360° (longitude)
  const theta = (col / cols) * 360;
  return { phi, theta };
}

/**
 * Convert spherical coordinates to Cartesian coordinates
 * @param {number} r - Radius
 * @param {number} phi - Latitude in degrees (0° = north pole, 180° = south pole)
 * @param {number} theta - Longitude in degrees
 * @returns {Object} Object with x, y, z Cartesian coordinates
 */
function sphericalToCartesian(r, phi, theta) {
  const phiRad = THREE.MathUtils.degToRad(phi);
  const thetaRad = THREE.MathUtils.degToRad(theta);
  
  return {
    x: r * Math.sin(phiRad) * Math.cos(thetaRad),
    y: r * Math.cos(phiRad),
    z: r * Math.sin(phiRad) * Math.sin(thetaRad),
  };
}

/**
 * Get the world position (3D coordinates) for a given grid position
 * @param {number} row - Row coordinate
 * @param {number} col - Column coordinate
 * @returns {Object} Object with x, y, z world coordinates
 */
function getWorldPosition(row, col) {
  console.log('🌍 getWorldPosition called with:', {
    row, col,
    gridRows: gameState.gridConfig.rows,
    gridCols: gameState.gridConfig.cols
  });
  
  // Keep original piece positioning - pieces are at grid intersections/vertices
  const { phi, theta } = gridToSpherical(
    gameState.gridConfig.rows,
    gameState.gridConfig.cols,
    row,
    col
  );
  
  const position = sphericalToCartesian(globeRadius + 0.35, phi, theta); // Positioned just above grid surface
  console.log('🌍 Calculated position:', { phi, theta, position });
  
  return position;
}

export { gridToSpherical, sphericalToCartesian, getWorldPosition };