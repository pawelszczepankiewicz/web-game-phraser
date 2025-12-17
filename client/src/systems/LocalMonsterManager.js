import { LocalMonster } from "../entities/LocalMonster.js";
import { getMonsterData, createMonsterSpawnData } from "../../../shared/data/Monsters.js";
import { getRandomPointInPolygon } from "../../../shared/utils/geometry.js";
import { MONSTER_DEFAULT_RESPAWN_TIME } from "../../../shared/constants.js";

/**
 * LocalMonsterManager - Client-side monster spawning and AI management for single-player
 * Handles monster spawning, updates, and respawning locally
 */
export class LocalMonsterManager {
  constructor(scene) {
    this.scene = scene;

    // All active monsters: monsterId -> LocalMonster
    this.monsters = new Map();

    // Spawn data for current map
    this.spawnData = [];

    // Track monster counts per spawn zone for respawning
    // spawnDataId -> { current: number, max: number }
    this.spawnCounts = new Map();

    // Pending respawns: Array of { spawnDataId, respawnAt }
    this.pendingRespawns = [];
  }

  /**
   * Initialize monsters from map data
   * @param {MapManager} mapManager - The map manager instance
   */
  initializeFromMap(mapManager) {
    const mapKey = mapManager.getCurrentMapKey();
    console.log(`[LocalMonsterManager] Initializing monsters for map: ${mapKey}`);

    // Get spawn objects from map
    const spawnObjects = mapManager.getSpawnObjects();

    if (spawnObjects.length === 0) {
      console.log(`[LocalMonsterManager] No monster spawns found in ${mapKey}`);
      return;
    }

    // Process each spawn object
    for (const spawnObj of spawnObjects) {
      const monsterType = spawnObj.properties?.monsterType;
      if (!monsterType) {
        console.warn("[LocalMonsterManager] Spawn object missing monsterType property");
        continue;
      }

      // Get monster type stats from shared data
      const monsterTypeData = getMonsterData(monsterType);
      if (!monsterTypeData) {
        console.warn(`[LocalMonsterManager] Unknown monster type: ${monsterType}`);
        continue;
      }

      // Convert polygon coordinates (relative to object) to world coordinates
      const worldPolygon = spawnObj.polygon.map((point) => ({
        x: spawnObj.x + point.x,
        y: spawnObj.y + point.y,
      }));

      // Get spawn count from properties (default to 1)
      const maxCount = spawnObj.properties?.count || 1;
      const respawn = spawnObj.properties?.respawn !== false; // Default true
      const spawnRate = spawnObj.properties?.spawnRate || MONSTER_DEFAULT_RESPAWN_TIME;

      // Create spawn data
      const spawnData = {
        id: `spawn_${mapKey}_${this.spawnData.length}`,
        monsterType: monsterType,
        map: mapKey,
        polygon: worldPolygon,
        maxCount: maxCount,
        respawn: respawn,
        spawnRate: spawnRate,
        ...monsterTypeData,
      };

      this.spawnData.push(spawnData);

      // Initialize spawn count tracking
      this.spawnCounts.set(spawnData.id, {
        current: 0,
        max: maxCount,
      });

      // Spawn initial monsters
      for (let i = 0; i < maxCount; i++) {
        this.spawnMonster(spawnData);
      }
    }

    console.log(`[LocalMonsterManager] Spawned ${this.monsters.size} monsters on ${mapKey}`);
  }

  /**
   * Spawn a single monster from spawn data
   * @param {Object} spawnData - Spawn configuration
   * @returns {LocalMonster|null}
   */
  spawnMonster(spawnData) {
    // Get random spawn point in polygon
    const spawnPoint = getRandomPointInPolygon(spawnData.polygon);
    if (!spawnPoint) {
      console.error(`[LocalMonsterManager] Failed to get spawn point for ${spawnData.id}`);
      return null;
    }

    // Create monster
    const monster = new LocalMonster(this.scene, spawnData, spawnPoint);

    // Add to monsters map
    this.monsters.set(monster.id, monster);

    // Update spawn count
    const count = this.spawnCounts.get(spawnData.id);
    if (count) {
      count.current++;
    }

    console.log(
      `[LocalMonsterManager] Spawned ${spawnData.monsterType} at (${Math.round(spawnPoint.x)}, ${Math.round(spawnPoint.y)})`
    );

    return monster;
  }

  /**
   * Update all monsters (called every frame)
   * @param {number} time - Current time
   * @param {number} delta - Delta time in ms
   * @returns {Array} Array of attack results to process
   */
  update(time, delta) {
    const attackResults = [];
    const deltaTime = delta / 1000; // Convert to seconds

    // Process respawns
    this.processRespawns();

    // Get player reference
    const player = this.scene.player;

    // Update each monster
    for (const monster of this.monsters.values()) {
      if (!monster.active) continue;

      // Update monster AI
      const attackResult = monster.update(deltaTime, player);
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
   * @param {LocalMonster} monster - The monster that died
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
        `[LocalMonsterManager] ${monster.monsterType} will respawn in ${respawnDelay / 1000}s`
      );
    }

    // Remove from active monsters after a delay (for death animation)
    this.scene.time.delayedCall(1000, () => {
      this.monsters.delete(monster.id);
    });

    // Emit event for quest tracking, loot creation, etc.
    this.scene.events.emit("monster-killed", {
      monsterId: monster.id,
      monsterType: monster.monsterType,
      killerId: "player",
      x: monster.x,
      y: monster.y,
    });
  }

  /**
   * Get monster by ID
   * @param {string} monsterId - Monster ID
   * @returns {LocalMonster|undefined}
   */
  getMonster(monsterId) {
    return this.monsters.get(monsterId);
  }

  /**
   * Get spawn data by ID
   * @param {string} spawnDataId - Spawn data ID
   * @returns {Object|null}
   */
  getSpawnDataById(spawnDataId) {
    return this.spawnData.find((s) => s.id === spawnDataId) || null;
  }

  /**
   * Get monster at position (for clicking)
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @returns {LocalMonster|null}
   */
  getMonsterAtPosition(x, y) {
    for (const monster of this.monsters.values()) {
      if (monster.active && monster.hitboxContains(x, y)) {
        return monster;
      }
    }
    return null;
  }

  /**
   * Get monster by ID
   * @param {string} id - Monster ID
   * @returns {LocalMonster|null}
   */
  getMonsterById(id) {
    return this.monsters.get(id) || null;
  }

  /**
   * Get all active monsters
   * @returns {Array<LocalMonster>}
   */
  getMonsters() {
    return Array.from(this.monsters.values()).filter((m) => m.active);
  }

  /**
   * Clear all monsters
   */
  clear() {
    for (const monster of this.monsters.values()) {
      if (monster.active) {
        monster.destroy();
      }
    }
    this.monsters.clear();
    this.spawnData = [];
    this.spawnCounts.clear();
    this.pendingRespawns = [];
  }
}
