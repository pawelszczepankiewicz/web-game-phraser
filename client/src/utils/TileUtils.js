/**
 * TileUtils - Utility functions for working with Phaser tilemap tiles
 */

/**
 * Get tileset properties for a tile
 * Tries getTileProperties() first, falls back to direct tileData access
 *
 * @param {Phaser.Tilemaps.Tile} tile - The tile object
 * @returns {Object|null} - The tile properties object or null if not found
 */
export function getTilesetProperties(tile) {
  if (!tile || !tile.tileset) {
    return null;
  }

  const localTileId = tile.index - tile.tileset.firstgid;

  // Try getTileProperties first (official Phaser API)
  let tilesetTile = tile.tileset.getTileProperties(localTileId);

  // Fall back to direct tileData access if getTileProperties returns null
  if (!tilesetTile && tile.tileset.tileData) {
    tilesetTile = tile.tileset.tileData[localTileId];
  }

  return tilesetTile || null;
}

/**
 * Get custom collision box dimensions from tile properties
 * Falls back to full tile dimensions if custom properties not set
 *
 * @param {Phaser.Tilemaps.Tile} tile - The tile object
 * @returns {Object} - Object with width and height properties
 */
export function getCollisionBoxDimensions(tile) {
  // Check tile-level properties first (map-level, highest priority)
  if (tile.properties) {
    const width = tile.properties.collisionBoxWidth ?? tile.width;
    const height = tile.properties.collisionBoxHeight ?? tile.height;

    if (tile.properties.collisionBoxWidth !== undefined || tile.properties.collisionBoxHeight !== undefined) {
      return { width, height };
    }
  }

  // Fall back to tileset-level properties
  const tilesetTile = getTilesetProperties(tile);

  return {
    width: tilesetTile?.collisionBoxWidth || tile.width,
    height: tilesetTile?.collisionBoxHeight || tile.height
  };
}

/**
 * Check if tile has collision property set
 * Checks both tile-level properties (map override) and tileset-level properties
 *
 * @param {Phaser.Tilemaps.Tile} tile - The tile object
 * @returns {boolean} - True if tile has collision enabled
 */
export function tileHasCollision(tile) {
  if (!tile || tile.index <= 0) {
    return false;
  }

  // Check tile-level properties first (map-level override)
  if (
    tile.properties &&
    Object.prototype.hasOwnProperty.call(tile.properties, "collision")
  ) {
    // Map explicitly sets collision - use this value (overrides tileset)
    return tile.properties.collision === true;
  }

  // No map override - check tileset-level properties
  const tilesetTile = getTilesetProperties(tile);
  return tilesetTile?.collision === true;
}

/**
 * Calculate collision box position for a tile
 * Handles layer-specific positioning (props, trees, etc.)
 *
 * @param {Phaser.Tilemaps.Tile} tile - The tile object
 * @param {Object} worldPos - World position from tilemap.tileToWorldXY()
 * @param {string} layerName - Name of the layer ("props", "trees", etc.)
 * @param {number} tileOffsetY - Y offset for staggered isometric maps (default 0)
 * @returns {Object} - Object with x, y, width, height properties
 */
export function getCollisionBox(tile, worldPos, layerName, tileOffsetY = 0) {
  const { width, height } = getCollisionBoxDimensions(tile);

  // Calculate Y position based on layer type
  let y = worldPos.y + tileOffsetY;

  if (layerName === "props") {
    // Props collision is offset down by one tile height
    const tilemap = tile.tilemapLayer.tilemap;
    y += tilemap.tileHeight;
  } else if (layerName === "trees") {
    // For large tiles (trees), collision is at the bottom of the tile
    y += tile.height - height;
  }

  // Center collision box horizontally if narrower than tile
  const x = worldPos.x + (tile.width - width) / 2;

  return { x, y, width, height };
}
