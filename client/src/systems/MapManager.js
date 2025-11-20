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

    console.log('Tilemap created:', {
      key: mapKey,
      tilesets: this.tilemap.tilesets.length,
      layers: this.tilemap.layers.length
    });

    // Add tilesets
    const tilesets = [];
    this.tilemap.tilesets.forEach(tilesetData => {
      console.log('Loading tileset:', tilesetData.name);
      const tileset = this.tilemap.addTilesetImage(
        tilesetData.name,
        tilesetData.name
      );
      if (tileset) {
        tilesets.push(tileset);
        console.log('Tileset loaded successfully:', tilesetData.name);
      } else {
        console.error('Failed to load tileset:', tilesetData.name);
      }
    });

    // Create layers
    this.tilemap.layers.forEach(layerData => {
      console.log('Processing layer:', layerData.name, 'type:', layerData.type, 'tilemapLayer:', layerData.tilemapLayer);

      // Check if it's a tile layer (has data array)
      if (layerData.data && layerData.data.length > 0) {
        const layer = this.tilemap.createLayer(layerData.name, tilesets, 0, 0);

        if (layer) {
          this.layers[layerData.name] = layer;

          // Set depth for proper layering
          if (layerData.name === 'ground') {
            layer.setDepth(0);
          } else if (layerData.name === 'props') {
            layer.setDepth(50);
          }

          console.log('Layer created:', layerData.name, 'depth:', layer.depth, 'visible:', layer.visible);
        } else {
          console.error('Failed to create layer:', layerData.name);
        }
      } else {
        console.log('Skipping non-tile layer:', layerData.name);
      }
    });

    console.log(`Map loaded: ${mapKey}`, 'Layers:', Object.keys(this.layers));
    return this.tilemap;
  }

  /**
   * Unload current map
   */
  unloadMap() {
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

    objectLayers.forEach(objectLayer => {
      if (objectLayer.name === 'collisions') {
        objectLayer.objects.forEach(obj => {
          if (obj.polygon) {
            collisions.push({
              type: 'polygon',
              x: obj.x,
              y: obj.y,
              polygon: obj.polygon
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

    objectLayers.forEach(objectLayer => {
      if (objectLayer.name === 'portal') {
        objectLayer.objects.forEach(obj => {
          const targetMap = obj.properties?.find(p => p.name === 'targetMap')?.value;
          if (targetMap) {
            portals.push({
              x: obj.x,
              y: obj.y,
              width: obj.width,
              height: obj.height,
              targetMap: targetMap
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
    this.tilemap.tilesets.forEach(tileset => {
      // tileData is an object in Phaser 3, not an array
      if (tileset.tileData) {
        Object.keys(tileset.tileData).forEach(tileId => {
          const data = tileset.tileData[tileId];
          if (data && data.collision) {
            collisions.push({
              tileId: parseInt(tileId) + tileset.firstgid,
              collision: data.collision
            });
          }
        });
      }
    });

    return collisions;
  }

  /**
   * Get spawn points from map
   */
  getSpawnPoints() {
    if (!this.tilemap) return [];

    const spawnPoints = [];
    const objectLayers = this.tilemap.objects;

    objectLayers.forEach(objectLayer => {
      if (objectLayer.name === 'spawns' || objectLayer.name === 'spawn') {
        objectLayer.objects.forEach(obj => {
          spawnPoints.push({
            x: obj.x,
            y: obj.y,
            type: obj.type || 'player'
          });
        });
      }
    });

    return spawnPoints;
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
