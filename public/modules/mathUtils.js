// Math Utilities Module
// Pure functions with no external dependencies - safe to extract

/**
 * Convert grid coordinates to spherical coordinates
 * @param {number} rows - Total number of rows
 * @param {number} cols - Total number of columns  
 * @param {number} row - Current row
 * @param {number} col - Current column
 * @returns {object} Spherical coordinates {phi, theta} in degrees
 */
export function gridToSpherical(rows, cols, row, col) {
  // phi: 0° = north pole, 180° = south pole
  const phi = (row / (rows - 1)) * 180;
  // theta: 0° = 0°, 360° = 360° (longitude)
  const theta = (col / cols) * 360;
  return { phi, theta };
}

/**
 * Convert spherical coordinates to Cartesian coordinates
 * @param {number} r - Radius
 * @param {number} phi - Polar angle in degrees
 * @param {number} theta - Azimuthal angle in degrees
 * @returns {object} Cartesian coordinates {x, y, z}
 */
export function sphericalToCartesian(r, phi, theta) {
  // Convert degrees to radians for calculation
  const phiRad = (phi * Math.PI) / 180;
  const thetaRad = (theta * Math.PI) / 180;
  
  return {
    x: r * Math.sin(phiRad) * Math.cos(thetaRad),
    y: r * Math.cos(phiRad),
    z: r * Math.sin(phiRad) * Math.sin(thetaRad),
  };
}

/**
 * Get world position for a grid cell
 * @param {number} row - Grid row
 * @param {number} col - Grid column
 * @param {number} radius - Globe radius (default: 5)
 * @returns {object} World position {x, y, z}
 */
export function getWorldPosition(row, col, radius = 5) {
  const gridConfig = { rows: 20, cols: 8 }; // Default grid config
  const spherical = gridToSpherical(gridConfig.rows, gridConfig.cols, row, col);
  return sphericalToCartesian(radius, spherical.phi, spherical.theta);
}

/**
 * Ease out cubic function for animations
 * @param {number} t - Time parameter (0 to 1)
 * @returns {number} Eased value
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Time parameter (0 to 1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}