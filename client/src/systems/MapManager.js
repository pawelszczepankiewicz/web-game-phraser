import {
  tileHasCollision,
  getCollisionBoxDimensions,
  getCollisionBox,
} from "../utils/TileUtils.js";

/**
 * MapManager - Handles loading and management of Tiled maps
 */
export class MapManager {
  constructor(scene) {
    this.scene = scene;
    this.currentMap = null;
    this.currentMapKey = null;
    this.tilemap = null;
    this.layers = {};
    this.dynamicPropSprites = []; // Sprites for collision props that need depth sorting
    this.animatedSprites = []; // Environmental animated sprites (campfires, portals, etc.)
  }

  /**
   * Load a map
   */
  loadMap(mapKey) {
    // Clean up previous map
    this.unloadMap();

    // Create tilemap
    this.tilemap = this.scene.make.tilemap({ key: mapKey });
    this.currentMapKey = mapKey;

    // Add tilesets
    const tilesets = [];
    this.tilemap.tilesets.forEach((tilesetData) => {
      const tileset = this.tilemap.addTilesetImage(tilesetData.name, tilesetData.name);
      if (tileset) {
        tilesets.push(tileset);
      } else {
        console.error("Failed to load tileset:", tilesetData.name);
      }
    });

    // Create layers
    this.tilemap.layers.forEach((layerData) => {
      // Check if it's a tile layer (has data array)
      if (layerData.data && layerData.data.length > 0) {
        const layer = this.tilemap.createLayer(layerData.name, tilesets, 0, 0);

        if (layer) {
          this.layers[layerData.name] = layer;

          // Set depth for proper layering
          if (layerData.name === "ground") {
            layer.setDepth(0);
          } else if (layerData.name === "props") {
            layer.setDepth(1); // Props render in front of player (player is at depth 100)
          } else if (layerData.name === "trees") {
            layer.setDepth(1); // Trees need dynamic depth sorting like props
          } else if (layerData.name === "buildings") {
            layer.setDepth(150); // Buildings render in front of player (player is at depth 100)
          }
        } else {
          console.error("Failed to create layer:", layerData.name);
        }
      }
    });

    // Create dynamic prop sprites for depth sorting
    this.createDynamicPropSprites();

    // Create animated environmental sprites
    this.createAnimatedSprites();

    return this.tilemap;
  }

  /**
   * Create individual sprites for prop tiles with collision
   * These sprites need dynamic depth sorting based on player position
   */
  createDynamicPropSprites() {
    // Clear existing dynamic prop sprites
    this.dynamicPropSprites.forEach((sprite) => sprite.destroy());
    this.dynamicPropSprites = [];

    // Process props, trees, and buildings layers for dynamic depth sorting
    const layersToProcess = ["props", "trees", "buildings"];

    layersToProcess.forEach((layerName) => {
      const layer = this.layers[layerName];
      if (!layer) {
        return;
      }

      console.log(`\n🗺️ Processing layer: ${layerName}`);

      // Iterate through all tiles in layer
      for (let y = 0; y < this.tilemap.height; y++) {
        for (let x = 0; x < this.tilemap.width; x++) {
          const tile = layer.getTileAt(x, y);

          if (tile && tileHasCollision(tile)) {
            // Skip if tile doesn't have a tileset
            if (!tile.tileset) {
              console.warn(`Tile at (${x}, ${y}) has collision but no tileset`);
              continue;
            }

            // Get tile's world position
            const worldPos = this.tilemap.tileToWorldXY(x, y);

            // Calculate local tile ID (frame index in the tileset)
            const localTileId = tile.index - tile.tileset.firstgid;

            // Get custom collision box dimensions using utility function
            const { width: collisionBoxWidth, height: collisionBoxHeight } =
              getCollisionBoxDimensions(tile);

            // Use spritesheet version of tileset (with "_sheet" suffix)
            const spritesheetKey = tile.tileset.name + "_sheet";

            // Check if the frame exists in the tileset spritesheet
            const texture = this.scene.textures.get(spritesheetKey);
            if (!texture || !texture.has(localTileId)) {
              continue;
            }

            try {
              const tileGridHeight = this.tilemap.tileHeight; // e.g., 32px

              // Determine if this is a large tile based on LAYER, not size
              // Trees layer = large tiles with custom origins
              // Props/buildings = regular tiles aligned to grid
              const isLargeTile = layerName === "trees";

              let sprite;
              let tileBottomY;

              if (isLargeTile) {
                // LARGE TILES (trees) - use custom origin offsets
                const originY = tile.properties?.collisionBoxOriginY ?? 0;

                sprite = this.scene.add.sprite(
                  worldPos.x,
                  worldPos.y + tileGridHeight,
                  spritesheetKey,
                  localTileId
                );
                sprite.setOrigin(0, 1.0);
                tileBottomY = worldPos.y + tileGridHeight - originY;

                console.log(`🌲 TREE TILE (${x},${y}): originY=${originY}`);
              } else {
                // For regular tiles (props, buildings), align sprite top with collision box top
                // Collision box starts at worldPos.y, so sprite with bottom-left origin (0,1)
                // should have its bottom at worldPos.y + tile.height (e.g., worldPos.y + 64)
                // This makes sprite top = worldPos.y + tile.height - tile.height = worldPos.y ✓
                sprite = this.scene.add.sprite(
                  worldPos.x, // Left edge matches collision box
                  worldPos.y + tile.height, // Bottom = top + full tile height
                  spritesheetKey,
                  localTileId
                );
                sprite.setOrigin(0, 1.0); // Bottom-left origin

                // Get collision box for depth sorting
                const collisionBox = getCollisionBox(tile, worldPos, layerName);

                // Use collision box bottom for depth sorting (not tile image bottom)
                // Player should be in front when below collision, behind when above collision
                tileBottomY = collisionBox.y + collisionBox.height;
              }

              // Store depth sorting position
              sprite.tileBottomY = tileBottomY;

              // Store collision box dimensions for later use
              sprite.collisionBoxWidth = collisionBoxWidth;
              sprite.collisionBoxHeight = collisionBoxHeight;

              // Initial depth (will be updated based on player position)
              sprite.setDepth(100);

              // Store in array for depth updates
              this.dynamicPropSprites.push(sprite);

              // Make tile invisible but keep it for collision
              tile.setAlpha(0);
            } catch (error) {
              console.error(`Failed to create sprite for tile at (${x}, ${y}):`, error);
            }
          }
        }
      }
    }); // Close forEach loop
  }

  /**
   * Update depth of dynamic prop sprites based on player position
   * Call this every frame from GameScene update loop
   */
  updatePropDepths(playerY) {
    this.dynamicPropSprites.forEach((sprite) => {
      // Debug logging for first sprite only (to avoid spam)
      // if (index === 0 && Math.random() < 0.01) { // Log ~1% of frames
      //     playerY: playerY,
      //     tileBottomY: sprite.tileBottomY,
      //     tileY: sprite.y,
      //     comparison: playerY > sprite.tileBottomY ? 'player below tile' : 'player above tile',
      //     newDepth: playerY > sprite.tileBottomY ? 90 : 110
      //   });
      // }

      // If player is below the tile (higher Y), player should be in front of tile
      // So tile should have lower depth than player (90 < 100)
      if (playerY > sprite.tileBottomY) {
        sprite.setDepth(90); // Below player (100)
      } else {
        // Player is above the tile (lower Y), player should be behind tile
        // So tile should have higher depth than player (110 > 100)
        sprite.setDepth(110); // Above player (100)
      }
    });
  }

  /**
   * Unload current map
   */
  unloadMap() {
    // Clean up dynamic prop sprites
    this.dynamicPropSprites.forEach((sprite) => sprite.destroy());
    this.dynamicPropSprites = [];

    // Clean up animated sprites
    this.animatedSprites.forEach((sprite) => sprite.destroy());
    this.animatedSprites = [];

    if (this.tilemap) {
      this.tilemap.destroy();
      this.tilemap = null;
      this.layers = {};
      this.currentMapKey = null;
    }
  }

  /**
   * Get collision objects from map
   */
  getCollisionObjects() {
    if (!this.tilemap) return [];

    const collisions = [];
    const objectLayers = this.tilemap.objects;

    objectLayers.forEach((objectLayer) => {
      if (objectLayer.name === "collisions") {
        objectLayer.objects.forEach((obj) => {
          if (obj.polygon) {
            collisions.push({
              type: "polygon",
              x: obj.x,
              y: obj.y,
              polygon: obj.polygon,
            });
          }
        });
      }
    });

    return collisions;
  }

  /**
   * Get portal objects from map
   */
  getPortalObjects() {
    if (!this.tilemap) return [];

    const portals = [];
    const objectLayers = this.tilemap.objects;

    objectLayers.forEach((objectLayer) => {
      if (objectLayer.name === "portal") {
        objectLayer.objects.forEach((obj) => {
          const targetMap = obj.properties?.find((p) => p.name === "targetMap")?.value;
          if (targetMap) {
            portals.push({
              x: obj.x,
              y: obj.y,
              width: obj.width,
              height: obj.height,
              targetMap: targetMap,
            });
          }
        });
      }
    });

    return portals;
  }

  /**
   * Get tiles with collision property
   */
  getTileCollisions() {
    if (!this.tilemap) return [];

    const collisions = [];

    // Check each tileset for collision properties
    this.tilemap.tilesets.forEach((tileset) => {
      // tileData is an object in Phaser 3, not an array
      if (tileset.tileData) {
        Object.keys(tileset.tileData).forEach((tileId) => {
          const data = tileset.tileData[tileId];
          if (data && data.collision) {
            collisions.push({
              tileId: parseInt(tileId) + tileset.firstgid,
              collision: data.collision,
            });
          }
        });
      }
    });

    return collisions;
  }

  /**
   * Get spawn points from map with properties (default, fromMap)
   */
  getSpawnPoints() {
    if (!this.tilemap) return [];

    const spawnPoints = [];
    const objectLayers = this.tilemap.objects;

    objectLayers.forEach((objectLayer) => {
      if (objectLayer.name === "spawns" || objectLayer.name === "spawn") {
        objectLayer.objects.forEach((obj) => {
          if (obj.name === "player" || obj.type === "player") {
            // Parse properties
            const properties = {};
            if (obj.properties) {
              obj.properties.forEach((prop) => {
                properties[prop.name] = prop.value;
              });
            }

            spawnPoints.push({
              x: obj.x,
              y: obj.y,
              type: obj.type || "player",
              default: properties.default || false,
              fromMap: properties.fromMap || null,
            });
          }
        });
      }
    });

    return spawnPoints;
  }

  /**
   * Get appropriate spawn point based on where player is coming from
   */
  getPlayerSpawnPoint(fromMap = null) {
    const spawnPoints = this.getSpawnPoints();

    if (spawnPoints.length === 0) {
      console.warn("No spawn points found, using default position");
      return { x: 500, y: 500 };
    }

    // If coming from another map, look for matching fromMap spawn point
    if (fromMap) {
      const fromMapSpawn = spawnPoints.find((spawn) => spawn.fromMap === fromMap);
      if (fromMapSpawn) {
        return fromMapSpawn;
      }
    }

    // Otherwise, use default spawn point
    const defaultSpawn = spawnPoints.find((spawn) => spawn.default === true);
    if (defaultSpawn) {
      return defaultSpawn;
    }

    // Fallback to first spawn point
    console.warn("No default spawn point found, using first spawn point");
    return spawnPoints[0];
  }

  /**
   * Get monster spawn objects from map
   */
  getSpawnObjects() {
    if (!this.tilemap) return [];

    const spawns = [];
    const objectLayers = this.tilemap.objects;

    objectLayers.forEach((objectLayer) => {
      if (objectLayer.name === "spawns") {
        objectLayer.objects.forEach((obj) => {
          // Check if object name is 'monster' (since type may be empty string in Tiled)
          if (obj.name === "monster" && obj.polygon) {
            // Parse properties
            const properties = {};
            if (obj.properties) {
              obj.properties.forEach((prop) => {
                properties[prop.name] = prop.value;
              });
            }

            spawns.push({
              x: obj.x,
              y: obj.y,
              width: obj.width,
              height: obj.height,
              polygon: obj.polygon,
              properties: properties,
            });
          }
        });
      }
    });

    return spawns;
  }

  /**
   * Get animated sprite objects from map
   */
  getAnimatedSpriteObjects() {
    if (!this.tilemap) return [];

    const animatedObjects = [];
    const objectLayers = this.tilemap.objects;

    objectLayers.forEach((objectLayer) => {
      if (objectLayer.name === "animations") {
        objectLayer.objects.forEach((obj) => {
          // Parse properties
          const properties = {};
          if (obj.properties) {
            obj.properties.forEach((prop) => {
              properties[prop.name] = prop.value;
            });
          }

          // Only process if spriteKey is defined
          if (properties.spriteKey) {
            animatedObjects.push({
              x: obj.x,
              y: obj.y,
              spriteKey: properties.spriteKey,
              depth: properties.depth || 150,
              scale: properties.scale || 1,
              startFrame: properties.startFrame || 0,
              endFrame: properties.endFrame || -1, // -1 = all frames
              frameRate: properties.frameRate || 8,
            });
          }
        });
      }
    });

    return animatedObjects;
  }

  /**
   * Create animated environmental sprites (campfires, portals, etc.)
   */
  createAnimatedSprites() {
    // Clear existing animated sprites
    this.animatedSprites.forEach((sprite) => sprite.destroy());
    this.animatedSprites = [];

    const animatedObjects = this.getAnimatedSpriteObjects();

    if (animatedObjects.length === 0) {
      return;
    }

    animatedObjects.forEach((obj, index) => {
      try {
        // Create sprite at object position
        const sprite = this.scene.add.sprite(obj.x, obj.y, obj.spriteKey);

        // Set origin to bottom center for isometric rendering
        sprite.setOrigin(0.5, 1);

        // Apply scale
        sprite.setScale(obj.scale);

        // Set depth
        sprite.setDepth(obj.depth);

        // Create unique animation key for this sprite instance
        const animKey = `${obj.spriteKey}_anim_${index}`;

        // Create animation dynamically with custom frame range
        if (!this.scene.anims.exists(animKey)) {
          const texture = this.scene.textures.get(obj.spriteKey);

          // Get the actual number of frames in the texture
          // Note: Phaser's frameTotal might include the __BASE frame, so we need to count actual frames
          const frames = texture.getFrameNames();
          const numericFrames = frames
            .filter((name) => !isNaN(parseInt(name)))
            .map((name) => parseInt(name))
            .sort((a, b) => a - b);

          const maxFrame = numericFrames.length > 0 ? numericFrames[numericFrames.length - 1] : 0;

          const frameConfig = {
            start: obj.startFrame || 0,
          };

          // If endFrame is explicitly set and not -1, use it (but cap at maxFrame)
          if (typeof obj.endFrame === "number" && obj.endFrame !== -1) {
            frameConfig.end = Math.min(obj.endFrame, maxFrame);
          } else {
            // Use all available frames from the texture
            frameConfig.end = maxFrame;
          }

          this.scene.anims.create({
            key: animKey,
            frames: this.scene.anims.generateFrameNumbers(obj.spriteKey, frameConfig),
            frameRate: obj.frameRate,
            repeat: -1, // Loop forever
          });
        }

        // Play the animation
        sprite.play(animKey);

        // Store sprite
        this.animatedSprites.push(sprite);
      } catch (error) {
        console.error(`Failed to create animated sprite ${obj.spriteKey}:`, error);
      }
    });
  }

  /**
   * Get current map key
   */
  getCurrentMapKey() {
    return this.currentMapKey;
  }

  /**
   * Get tilemap object
   */
  getTilemap() {
    return this.tilemap;
  }

  /**
   * Get layer by name
   */
  getLayer(name) {
    return this.layers[name];
  }

  /**
   * Get all layers
   */
  getLayers() {
    return this.layers;
  }

  /**
   * Convert world coordinates to tile coordinates
   */
  worldToTileXY(x, y) {
    if (!this.tilemap) return null;
    return this.tilemap.worldToTileXY(x, y);
  }

  /**
   * Convert tile coordinates to world coordinates
   */
  tileToWorldXY(tileX, tileY) {
    if (!this.tilemap) return null;
    return this.tilemap.tileToWorldXY(tileX, tileY);
  }
}
