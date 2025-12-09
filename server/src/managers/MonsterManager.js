import { Monster } from "../models/Monster.js";
import { mapDataLoader } from "../utils/MapDataLoader.js";
import { getMonsterData } from "../../../shared/data/Monsters.js";
import { getRandomPointInPolygon } from "../../../shared/utils/geometry.js";
import { MONSTER_DEFAULT_RESPAWN_TIME } from "../../../shared/constants.js";

/**
 * MonsterManager - Server-side monster spawning, AI, and state management
 */
export class MonsterManager {
  constructor(playerManager) {
    this.playerManager = playerManager;

    // All active monsters: monsterId -> Monster
    this.monsters = new Map();

    // Spawn data per map: mapKey -> Array of spawn configs
    this.spawnDataByMap = new Map();

    // Track monster counts per spawn zone for respawning
    // spawnDataId -> { current: number, max: number }
    this.spawnCounts = new Map();

    // Pending respawns: Array of { spawnDataId, respawnAt }
    this.pendingRespawns = [];

    // Loaded maps
    this.loadedMaps = new Set();
  }

  /**
   * Initialize monsters for a map (called when first player joins a map)
   * @param {string} mapKey - Map identifier
   */
  initializeMap(mapKey) {
    if (this.loadedMaps.has(mapKey)) {
      return; // Already loaded
    }

    console.log(`[MonsterManager] Initializing monsters for map: ${mapKey}`);

    // Get spawn data from map file
    const spawnObjects = mapDataLoader.getMonsterSpawns(mapKey);

    if (spawnObjects.length === 0) {
      console.log(`[MonsterManager] No monster spawns found in ${mapKey}`);
      this.loadedMaps.add(mapKey);
      return;
    }

    // Store spawn data for this map
    this.spawnDataByMap.set(mapKey, []);

    for (const spawnObj of spawnObjects) {
      // Get monster type stats from shared data
      const monsterTypeData = getMonsterData(spawnObj.monsterType);

      // Merge spawn config with monster type data
      const spawnData = {
        ...spawnObj,
        ...monsterTypeData,
        id: spawnObj.id,
        map: mapKey,
      };

      this.spawnDataByMap.get(mapKey).push(spawnData);

      // Initialize spawn count tracking
      this.spawnCounts.set(spawnData.id, {
        current: 0,
        max: spawnData.maxCount,
      });

      // Spawn initial monsters
      for (let i = 0; i < spawnData.maxCount; i++) {
        this.spawnMonster(spawnData);
      }
    }

    this.loadedMaps.add(mapKey);
    console.log(
      `[MonsterManager] Spawned ${this.getMonstersOnMap(mapKey).length} monsters on ${mapKey}`
    );
  }

  /**
   * Spawn a single monster from spawn data
   * @param {Object} spawnData - Spawn configuration
   * @returns {Monster|null} The spawned monster or null
   */
  spawnMonster(spawnData) {
    // Get random spawn point in polygon
    const spawnPoint = getRandomPointInPolygon(spawnData.polygon);
    if (!spawnPoint) {
      console.error(`[MonsterManager] Failed to get spawn point for ${spawnData.id}`);
      return null;
    }

    // Create monster
    const monster = new Monster(spawnData, spawnPoint);

    // Add to monsters map
    this.monsters.set(monster.id, monster);

    // Update spawn count
    const count = this.spawnCounts.get(spawnData.id);
    if (count) {
      count.current++;
    }

    console.log(
      `[MonsterManager] Spawned ${spawnData.monsterType} at (${Math.round(spawnPoint.x)}, ${Math.round(spawnPoint.y)}) on ${spawnData.map}`
    );

    return monster;
  }

  /**
   * Update all monsters (called every server tick)
   * @param {number} deltaTime - Time since last update in seconds
   * @returns {Array} Array of attack results to process
   */
  update(deltaTime) {
    const attackResults = [];

    // Process respawns
    this.processRespawns();

    // Update each monster
    for (const monster of this.monsters.values()) {
      if (!monster.active) continue;

      // Get players on the monster's map
      const playersOnMap = new Map();
      for (const player of this.playerManager.getAllPlayers()) {
        if (player.map === monster.map) {
          playersOnMap.set(player.userId, player);
        }
      }

      // Update monster AI
      const attackResult = monster.update(deltaTime, playersOnMap);
      if (attackResult) {
        attackResults.push(attackResult);
      }
    }

    return attackResults;
  }

  /**
   * Process pending monster respawns
   */
  processRespawns() {
    const now = Date.now();
    const toRespawn = [];

    // Find respawns that are ready
    for (let i = this.pendingRespawns.length - 1; i >= 0; i--) {
      const respawn = this.pendingRespawns[i];
      if (now >= respawn.respawnAt) {
        toRespawn.push(respawn);
        this.pendingRespawns.splice(i, 1);
      }
    }

    // Spawn the monsters
    for (const respawn of toRespawn) {
      const spawnData = this.getSpawnDataById(respawn.spawnDataId);
      if (spawnData && spawnData.respawn) {
        const count = this.spawnCounts.get(spawnData.id);
        if (count && count.current < count.max) {
          this.spawnMonster(spawnData);
        }
      }
    }
  }

  /**
   * Handle monster death
   * @param {Monster} monster - The monster that died
   */
  onMonsterDeath(monster) {
    // Update spawn count
    const count = this.spawnCounts.get(monster.spawnDataId);
    if (count) {
      count.current = Math.max(0, count.current - 1);
    }

    // Schedule respawn if enabled
    const spawnData = this.getSpawnDataById(monster.spawnDataId);
    if (spawnData && spawnData.respawn) {
      const respawnDelay = spawnData.spawnRate || MONSTER_DEFAULT_RESPAWN_TIME;
      this.pendingRespawns.push({
        spawnDataId: monster.spawnDataId,
        respawnAt: Date.now() + respawnDelay,
      });
      console.log(
        `[MonsterManager] ${monster.monsterType} will respawn in ${respawnDelay / 1000}s`
      );
    }

    // Remove from active monsters after a delay (for death animation)
    setTimeout(() => {
      this.monsters.delete(monster.id);
    }, 1000);
  }

  /**
   * Get a monster by ID
   * @param {string} monsterId - Monster ID
   * @returns {Monster|undefined}
   */
  getMonster(monsterId) {
    return this.monsters.get(monsterId);
  }

  /**
   * Get all monsters on a specific map
   * @param {string} mapKey - Map identifier
   * @returns {Array<Monster>}
   */
  getMonstersOnMap(mapKey) {
    const monsters = [];
    for (const monster of this.monsters.values()) {
      if (monster.map === mapKey && monster.active) {
        monsters.push(monster);
      }
    }
    return monsters;
  }

  /**
   * Get monsters in range of a position (for interest management)
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} range - Range in pixels
   * @param {string} mapKey - Map identifier
   * @returns {Array<Monster>}
   */
  getMonstersInRange(x, y, range, mapKey) {
    const monsters = [];
    const rangeSquared = range * range;

    for (const monster of this.monsters.values()) {
      if (monster.map !== mapKey || !monster.active) continue;

      const dx = monster.x - x;
      const dy = monster.y - y;
      const distSquared = dx * dx + dy * dy;

      if (distSquared <= rangeSquared) {
        monsters.push(monster);
      }
    }

    return monsters;
  }

  /**
   * Get spawn data by ID
   * @param {string} spawnDataId - Spawn data ID
   * @returns {Object|null}
   */
  getSpawnDataById(spawnDataId) {
    for (const spawns of this.spawnDataByMap.values()) {
      for (const spawn of spawns) {
        if (spawn.id === spawnDataId) {
          return spawn;
        }
      }
    }
    return null;
  }

  /**
   * Get monster state for broadcasting to clients
   * @param {string} mapKey - Map identifier
   * @returns {Array} Array of monster state objects
   */
  getMonsterStates(mapKey) {
    return this.getMonstersOnMap(mapKey).map((m) => m.getState());
  }

  /**
   * Get total monster count
   * @returns {number}
   */
  getTotalCount() {
    return this.monsters.size;
  }

  /**
   * Clean up monsters for a map (when no players are on it)
   * @param {string} mapKey - Map identifier
   */
  unloadMap(mapKey) {
    // Remove monsters on this map
    for (const [id, monster] of this.monsters.entries()) {
      if (monster.map === mapKey) {
        this.monsters.delete(id);
      }
    }

    // Remove spawn data
    this.spawnDataByMap.delete(mapKey);

    // Remove spawn counts
    for (const [spawnId] of this.spawnCounts.entries()) {
      if (spawnId.includes(mapKey)) {
        this.spawnCounts.delete(spawnId);
      }
    }

    // Remove pending respawns
    this.pendingRespawns = this.pendingRespawns.filter((r) => !r.spawnDataId.includes(mapKey));

    this.loadedMaps.delete(mapKey);
    console.log(`[MonsterManager] Unloaded map: ${mapKey}`);
  }
}
