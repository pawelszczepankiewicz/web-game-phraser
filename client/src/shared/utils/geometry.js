/**
 * Geometry utilities shared between client and server
 */

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance in pixels
 */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate squared distance (faster, use when comparing distances)
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Squared distance
 */
export function distanceSquared(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/**
 * Check if a point is within range of another point
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @param {number} range - Maximum distance
 * @returns {boolean} True if within range
 */
export function isInRange(x1, y1, x2, y2, range) {
  return distanceSquared(x1, y1, x2, y2) <= range * range;
}

/**
 * Check if a point is inside a polygon (ray casting algorithm)
 * @param {number} x - Point X coordinate
 * @param {number} y - Point Y coordinate
 * @param {Array<{x: number, y: number}>} polygon - Array of polygon vertices
 * @returns {boolean} True if point is inside polygon
 */
export function isPointInPolygon(x, y, polygon) {
  if (!polygon || polygon.length < 3) return false;

  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Get a random point inside a polygon
 * @param {Array<{x: number, y: number}>} polygon - Array of polygon vertices
 * @param {number} maxAttempts - Maximum attempts to find a valid point
 * @returns {{x: number, y: number}|null} Random point inside polygon or null if failed
 */
export function getRandomPointInPolygon(polygon, maxAttempts = 50) {
  if (!polygon || polygon.length < 3) return null;

  // Get bounding box
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  for (const point of polygon) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  // Try random points within bounding box
  for (let i = 0; i < maxAttempts; i++) {
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);

    if (isPointInPolygon(x, y, polygon)) {
      return { x, y };
    }
  }

  // Fallback to polygon centroid
  const centroid = getPolygonCentroid(polygon);
  return centroid;
}

/**
 * Get the centroid (center) of a polygon
 * @param {Array<{x: number, y: number}>} polygon - Array of polygon vertices
 * @returns {{x: number, y: number}} Centroid point
 */
export function getPolygonCentroid(polygon) {
  if (!polygon || polygon.length === 0) return { x: 0, y: 0 };

  let sumX = 0,
    sumY = 0;
  for (const point of polygon) {
    sumX += point.x;
    sumY += point.y;
  }

  return {
    x: sumX / polygon.length,
    y: sumY / polygon.length,
  };
}

/**
 * Normalize a vector to unit length
 * @param {number} x - X component
 * @param {number} y - Y component
 * @returns {{x: number, y: number}} Normalized vector
 */
export function normalize(x, y) {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

/**
 * Get direction vector from one point to another
 * @param {number} fromX - Start X
 * @param {number} fromY - Start Y
 * @param {number} toX - End X
 * @param {number} toY - End Y
 * @returns {{x: number, y: number}} Normalized direction vector
 */
export function directionTo(fromX, fromY, toX, toY) {
  return normalize(toX - fromX, toY - fromY);
}

/**
 * Check if two rectangles overlap
 * @param {Object} rect1 - First rectangle {x, y, width, height}
 * @param {Object} rect2 - Second rectangle {x, y, width, height}
 * @returns {boolean} True if rectangles overlap
 */
export function rectanglesOverlap(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}
