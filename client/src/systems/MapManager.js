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

    console.log(`Loading map: ${mapKey}`);

    // Create tilemap
    this.tilemap = this.scene.make.tilemap({ key: mapKey });
    this.currentMapKey = mapKey;

    console.log("Tilemap created:", {
      key: mapKey,
      tilesets: this.tilemap.tilesets.length,
      layers: this.tilemap.layers.length,
    });

    // Add tilesets
    const tilesets = [];
    this.tilemap.tilesets.forEach((tilesetData) => {
      console.log("Loading tileset:", tilesetData.name);
      const tileset = this.tilemap.addTilesetImage(
        tilesetData.name,
        tilesetData.name
      );
      if (tileset) {
        tilesets.push(tileset);
        console.log("Tileset loaded successfully:", tilesetData.name);
      } else {
        console.error("Failed to load tileset:", tilesetData.name);
      }
    });

    // Create layers
    this.tilemap.layers.forEach((layerData) => {
      console.log(
        "Processing layer:",
        layerData.name,
        "type:",
        layerData.type,
        "tilemapLayer:",
        layerData.tilemapLayer
      );

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
          } else if (layerData.name === "buildings") {
            layer.setDepth(101); // Buildings render in front of player (player is at depth 100)
          }

          console.log(
            "Layer created:",
            layerData.name,
            "depth:",
            layer.depth,
            "visible:",
            layer.visible
          );
        } else {
          console.error("Failed to create layer:", layerData.name);
        }
      } else {
        console.log("Skipping non-tile layer:", layerData.name);
      }
    });

    console.log(`Map loaded: ${mapKey}`, "Layers:", Object.keys(this.layers));

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

    const propsLayer = this.layers["props"];
    if (!propsLayer) {
      console.log("No props layer found for dynamic sprites");
      return;
    }

    console.log("Creating dynamic prop sprites for collision tiles...");

    // Iterate through all tiles in props layer
    for (let y = 0; y < this.tilemap.height; y++) {
      for (let x = 0; x < this.tilemap.width; x++) {
        const tile = propsLayer.getTileAt(x, y);

        if (tile && tile.index > 0) {
          // Check if tile has collision property
          let hasCollision = false;

          // Check tile-level properties
          if (tile.properties && tile.properties.collision === true) {
            hasCollision = true;
          }

          // Check tileset-level properties
          if (tile.tileset && tile.tileset.tileData) {
            const localTileId = tile.index - tile.tileset.firstgid;
            const tilesetTile = tile.tileset.getTileProperties(localTileId);
            if (tilesetTile && tilesetTile.collision === true) {
              hasCollision = true;
            }
          }

          if (hasCollision) {
            // Skip if tile doesn't have a tileset
            if (!tile.tileset) {
              console.warn(`Tile at (${x}, ${y}) has collision but no tileset`);
              continue;
            }

            // Get tile's world position
            const worldPos = this.tilemap.tileToWorldXY(x, y);

            // Calculate local tile ID (frame index in the tileset)
            const localTileId = tile.index - tile.tileset.firstgid;

            // Use spritesheet version of tileset (with "_sheet" suffix)
            const spritesheetKey = tile.tileset.name + "_sheet";

            // Check if the frame exists in the tileset spritesheet
            const texture = this.scene.textures.get(spritesheetKey);
            if (!texture || !texture.has(localTileId)) {
              console.warn(
                `Tile at (${x}, ${y}) frame ${localTileId} not found in tileset ${spritesheetKey}`
              );
              continue;
            }

            try {
              // Create sprite for this tile using spritesheet
              const sprite = this.scene.add.sprite(
                worldPos.x + tile.width / 2,
                worldPos.y + tile.height / 2,
                spritesheetKey,
                localTileId
              );

              // Store tile's bottom Y position for depth sorting
              sprite.tileBottomY = worldPos.y + tile.height;

              // Initial depth (will be updated based on player position)
              sprite.setDepth(100);

              // Store in array for depth updates
              this.dynamicPropSprites.push(sprite);

              // Make tile invisible but keep it for collision
              tile.setAlpha(0);
            } catch (error) {
              console.error(
                `Failed to create sprite for tile at (${x}, ${y}):`,
                error
              );
            }
          }
        }
      }
    }

    console.log(
      `Created ${this.dynamicPropSprites.length} dynamic prop sprites`
    );

    // Debug: log first few sprites
    if (this.dynamicPropSprites.length > 0) {
      console.log("First dynamic sprite:", {
        x: this.dynamicPropSprites[0].x,
        y: this.dynamicPropSprites[0].y,
        tileBottomY: this.dynamicPropSprites[0].tileBottomY,
        depth: this.dynamicPropSprites[0].depth,
      });
    }
  }

  /**
   * Update depth of dynamic prop sprites based on player position
   * Call this every frame from GameScene update loop
   */
  updatePropDepths(playerY) {
    this.dynamicPropSprites.forEach((sprite, index) => {
      // Debug logging for first sprite only (to avoid spam)
      // if (index === 0 && Math.random() < 0.01) { // Log ~1% of frames
      //   console.log('Depth update:', {
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
          const targetMap = obj.properties?.find(
            (p) => p.name === "targetMap"
          )?.value;
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
      const fromMapSpawn = spawnPoints.find(
        (spawn) => spawn.fromMap === fromMap
      );
      if (fromMapSpawn) {
        console.log(`Using spawn point from ${fromMap}:`, fromMapSpawn);
        return fromMapSpawn;
      }
    }

    // Otherwise, use default spawn point
    const defaultSpawn = spawnPoints.find((spawn) => spawn.default === true);
    if (defaultSpawn) {
      console.log("Using default spawn point:", defaultSpawn);
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
      console.log("No animated sprite objects found in map");
      return;
    }

    console.log(`Creating ${animatedObjects.length} animated sprites...`);

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
          const frameConfig = {
            start: obj.startFrame,
          };

          // If endFrame is -1, use all frames from startFrame onwards
          if (obj.endFrame !== -1) {
            frameConfig.end = obj.endFrame;
          } else {
            // Use all available frames
            frameConfig.start = obj.startFrame;
            frameConfig.end = this.scene.textures.get(obj.spriteKey).frameTotal - 1;
          }

          this.scene.anims.create({
            key: animKey,
            frames: this.scene.anims.generateFrameNumbers(obj.spriteKey, frameConfig),
            frameRate: obj.frameRate,
            repeat: -1, // Loop forever
          });

          console.log(
            `Created animation: ${animKey} (frames ${frameConfig.start}-${frameConfig.end} @ ${obj.frameRate}fps)`
          );
        }

        // Play the animation
        sprite.play(animKey);

        // Store sprite
        this.animatedSprites.push(sprite);

        console.log(`Created animated sprite: ${obj.spriteKey} at (${obj.x}, ${obj.y})`);
      } catch (error) {
        console.error(`Failed to create animated sprite ${obj.spriteKey}:`, error);
      }
    });

    console.log(`Created ${this.animatedSprites.length} animated sprites`);
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
