import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to map files (relative to server)
const MAPS_PATH = join(__dirname, "../../../client/public/maps");

/**
 * MapDataLoader - Loads and parses Tiled map JSON files for server use
 */
export class MapDataLoader {
  constructor() {
    this.mapCache = new Map(); // mapKey -> parsed data
  }

  /**
   * Load a map file
   * @param {string} mapKey - Map identifier (e.g., "starting_map")
   * @returns {Object|null} Parsed map data or null if not found
   */
  loadMap(mapKey) {
    // Check cache first
    if (this.mapCache.has(mapKey)) {
      return this.mapCache.get(mapKey);
    }

    const mapPath = join(MAPS_PATH, `${mapKey}.json`);

    if (!existsSync(mapPath)) {
      console.error(`[MapDataLoader] Map file not found: ${mapPath}`);
      return null;
    }

    try {
      const mapJson = readFileSync(mapPath, "utf8");
      const mapData = JSON.parse(mapJson);

      // Cache the parsed data
      this.mapCache.set(mapKey, mapData);

      console.log(`[MapDataLoader] Loaded map: ${mapKey}`);
      return mapData;
    } catch (error) {
      console.error(`[MapDataLoader] Failed to load map ${mapKey}:`, error);
      return null;
    }
  }

  /**
   * Get monster spawn objects from a map
   * @param {string} mapKey - Map identifier
   * @returns {Array} Array of spawn data objects
   */
  getMonsterSpawns(mapKey) {
    const mapData = this.loadMap(mapKey);
    if (!mapData) return [];

    const spawns = [];
    const tileHeight = mapData.tileheight || 32;

    // Check if map is staggered isometric (for Y offset)
    const isStaggered = mapData.orientation === "staggered";
    const offsetY = isStaggered ? tileHeight : 0;

    // Find the spawns object layer
    for (const layer of mapData.layers) {
      if (layer.type === "objectgroup" && layer.name === "spawns") {
        for (const obj of layer.objects) {
          // Check if this is a monster spawn (name === "monster" and has polygon)
          if (obj.name === "monster" && obj.polygon) {
            // Parse properties
            const properties = {};
            if (obj.properties) {
              for (const prop of obj.properties) {
                properties[prop.name] = prop.value;
              }
            }

            // Only add if monsterType is defined
            if (properties.monsterType) {
              // Convert polygon points to world coordinates with Y offset
              const polygon = obj.polygon.map((point) => ({
                x: obj.x + point.x,
                y: obj.y + point.y + offsetY,
              }));

              spawns.push({
                id: `spawn_${mapKey}_${obj.id}`,
                map: mapKey,
                x: obj.x,
                y: obj.y + offsetY,
                width: obj.width || 100,
                height: obj.height || 100,
                polygon: polygon,
                monsterType: properties.monsterType,
                maxCount: properties.maxCount || 1,
                respawn: properties.respawn !== undefined ? properties.respawn : true,
                spawnRate: properties.spawnRate || 30000,
                patrol: properties.patrol !== undefined ? properties.patrol : true,
              });
            }
          }
        }
      }
    }

    console.log(`[MapDataLoader] Found ${spawns.length} monster spawn zones in ${mapKey}`);
    return spawns;
  }

  /**
   * Get player spawn points from a map
   * @param {string} mapKey - Map identifier
   * @returns {Array} Array of spawn point objects
   */
  getPlayerSpawns(mapKey) {
    const mapData = this.loadMap(mapKey);
    if (!mapData) return [];

    const spawns = [];
    const tileHeight = mapData.tileheight || 32;
    const isStaggered = mapData.orientation === "staggered";
    const offsetY = isStaggered ? tileHeight : 0;

    for (const layer of mapData.layers) {
      if (layer.type === "objectgroup" && (layer.name === "spawns" || layer.name === "spawn")) {
        for (const obj of layer.objects) {
          if (obj.name === "player" || obj.type === "player") {
            const properties = {};
            if (obj.properties) {
              for (const prop of obj.properties) {
                properties[prop.name] = prop.value;
              }
            }

            spawns.push({
              x: obj.x,
              y: obj.y + offsetY,
              default: properties.default || false,
              fromMap: properties.fromMap || null,
            });
          }
        }
      }
    }

    return spawns;
  }

  /**
   * Get respawn point from a map
   * @param {string} mapKey - Map identifier
   * @returns {Object|null} Respawn point {x, y} or null
   */
  getRespawnPoint(mapKey) {
    const mapData = this.loadMap(mapKey);
    if (!mapData) return null;

    const tileHeight = mapData.tileheight || 32;
    const isStaggered = mapData.orientation === "staggered";
    const offsetY = isStaggered ? tileHeight : 0;

    for (const layer of mapData.layers) {
      if (layer.type === "objectgroup") {
        for (const obj of layer.objects) {
          if (obj.name === "playerRespawn" && obj.point) {
            return {
              x: obj.x,
              y: obj.y + offsetY,
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Get all available map keys
   * @returns {Array<string>} Array of map keys
   */
  getAvailableMaps() {
    // For now, return known maps. Could be made dynamic by scanning directory.
    return ["starting_map", "second_map", "third_map"];
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.mapCache.clear();
  }
}

// Export singleton
export const mapDataLoader = new MapDataLoader();
