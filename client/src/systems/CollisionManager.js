import { tileHasCollision, getCollisionBox } from "../utils/TileUtils.js";

/**
 * CollisionManager - Handles collision detection for boundaries
 */
export class CollisionManager {
  constructor(scene) {
    this.scene = scene;
    this.collisionBodies = [];
    this.tileCollisions = new Set();
  }

  /**
   * Initialize collisions from map
   */
  initializeFromMap(mapManager) {
    this.clear();

    // Get tilemap properties for offset calculation
    const tilemap = mapManager.getTilemap();

    // Calculate Y offset for staggered isometric maps
    // In staggered isometric, Phaser renders the first row with a half-tile offset
    let offsetY = 0;
    if (tilemap && (tilemap.orientation === 2 || tilemap.orientation === "staggered")) {
      offsetY = tilemap.tileHeight / 2;
    }

    // Add polygon collisions
    const polygons = mapManager.getCollisionObjects();
    polygons.forEach((poly) => {
      this.addPolygonCollision(poly, offsetY);
    });

    // Add tile collisions
    const tileCollisions = mapManager.getTileCollisions();
    tileCollisions.forEach((tile) => {
      if (tile.collision) {
        this.tileCollisions.add(tile.tileId);
      }
    });
  }

  /**
   * Add polygon collision
   */
  addPolygonCollision(polyData, offsetY = 0) {
    // Convert polygon points to world coordinates
    // Apply staggered isometric Y offset if needed
    const points = polyData.polygon.map((point) => ({
      x: polyData.x + point.x,
      y: polyData.y + point.y + offsetY,
    }));

    // Create collision body
    const body = {
      type: "polygon",
      points: points,
      bounds: this.calculateBounds(points),
    };

    this.collisionBodies.push(body);
  }

  /**
   * Calculate bounding box for polygon
   */
  calculateBounds(points) {
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    points.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    return { minX, minY, maxX, maxY };
  }

  /**
   * Check if point is inside polygon (ray casting algorithm)
   */
  pointInPolygon(x, y, points) {
    let inside = false;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;

      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Check collision with player
   */
  checkCollision(player, newX, newY) {
    // Check map boundaries
    const tilemap = this.scene.mapManager.getTilemap();
    if (tilemap) {
      let mapWidth = tilemap.widthInPixels;
      let mapHeight = tilemap.heightInPixels;

      // For staggered isometric, height calculation is different
      // orientation is an enum: 0=orthogonal, 1=isometric, 2=staggered, 3=hexagonal
      if (tilemap.orientation === 2 || tilemap.orientation === "staggered") {
        mapHeight = (tilemap.tileHeight / 2) * (tilemap.height + 1);
      }

      // Check if player is outside map bounds
      if (newX < 0 || newX > mapWidth || newY < 0 || newY > mapHeight) {
        return true; // Outside map bounds
      }
    }

    // Check polygon collisions
    for (const body of this.collisionBodies) {
      // Quick bounds check first
      if (
        newX < body.bounds.minX ||
        newX > body.bounds.maxX ||
        newY < body.bounds.minY ||
        newY > body.bounds.maxY
      ) {
        continue;
      }

      // Detailed polygon check
      if (this.pointInPolygon(newX, newY, body.points)) {
        return true; // Collision detected
      }
    }

    // Check tile collisions (reuse tilemap from above)
    // Use the SAME method as debug visualization - iterate all tiles and check if player is inside
    if (tilemap) {
      const layers = this.scene.mapManager.getLayers();

      for (const layerName in layers) {
        const layer = layers[layerName];

        // Iterate through all tiles in the layer
        for (let y = 0; y < tilemap.height; y++) {
          for (let x = 0; x < tilemap.width; x++) {
            const tile = layer.getTileAt(x, y);

            if (tile && tileHasCollision(tile)) {
              // Get the tile's world position
              const worldPos = tilemap.tileToWorldXY(x, y);
              if (worldPos) {
                // Get collision box using utility function
                const collisionBox = getCollisionBox(tile, worldPos, layerName);

                // Check if player position is inside this tile's collision rectangle
                if (
                  newX >= collisionBox.x &&
                  newX < collisionBox.x + collisionBox.width &&
                  newY >= collisionBox.y &&
                  newY < collisionBox.y + collisionBox.height
                ) {
                  return true;
                }
              }
            }
          }
        }
      }
    }

    return false; // No collision
  }

  /**
   * Clear all collisions
   */
  clear() {
    this.collisionBodies = [];
    this.tileCollisions.clear();
  }

  /**
   * Debug draw collisions
   */
  // debugDraw(graphics) {
  //   if (!graphics) return;

  //   graphics.clear();

  //   // Draw polygon collisions (red)
  //   graphics.lineStyle(2, 0xff0000, 1);
  //   this.collisionBodies.forEach((body) => {
  //     if (body.points.length > 0) {
  //       graphics.beginPath();
  //       graphics.moveTo(body.points[0].x, body.points[0].y);

  //       for (let i = 1; i < body.points.length; i++) {
  //         graphics.lineTo(body.points[i].x, body.points[i].y);
  //       }

  //       graphics.closePath();
  //       graphics.strokePath();
  //     }
  //   });

  //   // Draw tile collision boxes (yellow)
  //   graphics.lineStyle(2, 0xffff00, 0.8);

  //   const tilemap = this.mapManager.getTilemap();
  //   if (!tilemap) return;

  //   const layers = this.mapManager.getLayers();
  //   Object.keys(layers).forEach((layerName) => {
  //     const layer = layers[layerName];
  //     if (!layer) return;

  //     for (let y = 0; y < tilemap.height; y++) {
  //       for (let x = 0; x < tilemap.width; x++) {
  //         const tile = layer.getTileAt(x, y);

  //         if (tile && tileHasCollision(tile)) {
  //           const worldPos = tilemap.tileToWorldXY(x, y);
  //           if (worldPos) {
  //             // Get collision box using utility function
  //             const collisionBox = getCollisionBox(tile, worldPos, layerName);

  //             // Draw the actual collision box
  //             graphics.strokeRect(collisionBox.x, collisionBox.y, collisionBox.width, collisionBox.height);
  //           }
  //         }
  //       }
  //     }
  //   });
  // }
}
