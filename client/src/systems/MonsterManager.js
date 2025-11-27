import { Monster } from "../entities/Monster.js";
import { createMonsterSpawnData } from "../../../shared/data/Monsters.js";

/**
 * MonsterManager - Handles monster spawning, respawning, and management
 */
export class MonsterManager {
  constructor(scene) {
    this.scene = scene;
    this.monsters = [];
    this.spawnData = [];
    this.pendingRespawns = [];
  }

  /**
   * Initialize monsters from map spawn objects
   */
  initializeFromMap(mapManager) {
    this.clear();

    const spawnObjects = mapManager.getSpawnObjects();

    // Get tilemap for Y offset
    const tilemap = mapManager.getTilemap();
    let offsetY = 0;
    if (tilemap && (tilemap.orientation === 2 || tilemap.orientation === "staggered")) {
      offsetY = tilemap.tileHeight;
    }

    spawnObjects.forEach((spawnObj) => {
      // Get spawn-specific properties from Tiled (only spawn management properties)
      const spawnProps = {
        monsterType: spawnObj.properties.monsterType,
        maxCount: spawnObj.properties.maxCount || 1,
        respawn: spawnObj.properties.respawn !== undefined ? spawnObj.properties.respawn : true,
        spawnRate: spawnObj.properties.spawnRate || 30000,
        patrol: spawnObj.properties.patrol !== undefined ? spawnObj.properties.patrol : true,
        polygon: spawnObj.polygon.map((point) => ({
          x: spawnObj.x + point.x,
          y: spawnObj.y + point.y + offsetY,
        })),
        spawnArea: {
          x: spawnObj.x,
          y: spawnObj.y + offsetY,
          width: spawnObj.width || 100,
          height: spawnObj.height || 100,
        },
      };

      // Merge with monster type data from Monsters.js
      const spawnData = createMonsterSpawnData(spawnProps);

      // Store spawn data for respawning
      this.spawnData.push(spawnData);

      for (let i = 0; i < spawnData.maxCount; i++) {
        this.spawnMonster(spawnData);
      }
    });
  }

  /**
   * Spawn a monster from spawn data
   */
  spawnMonster(spawnData) {
    // Get random spawn point inside polygon
    const spawnPoint = this.getRandomPointInPolygon(spawnData.polygon);

    const monster = new Monster(this.scene, spawnPoint.x, spawnPoint.y, spawnData);
    this.monsters.push(monster);

    return monster;
  }

  /**
   * Get random point inside polygon
   */
  getRandomPointInPolygon(polygon) {
    // Get bounding box
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    polygon.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });

    // Try random points until we find one inside polygon
    let attempts = 0;
    while (attempts < 50) {
      const x = Phaser.Math.Between(minX, maxX);
      const y = Phaser.Math.Between(minY, maxY);

      if (this.isPointInPolygon(x, y, polygon)) {
        return { x, y };
      }
      attempts++;
    }

    // Fallback to center of bounding box
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
    };
  }

  /**
   * Check if point is inside polygon
   */
  isPointInPolygon(x, y, points) {
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
   * Handle monster death and respawn
   */
  onMonsterDeath(monster) {
    const index = this.monsters.indexOf(monster);
    if (index > -1) {
      this.monsters.splice(index, 1);
    }

    const spawnData = this.spawnData.find((data) => data.monsterType === monster.monsterType);

    if (spawnData && spawnData.respawn) {
      this.scene.time.delayedCall(spawnData.spawnRate, () => {
        this.spawnMonster(spawnData);
      });
    }
  }

  /**
   * Update all monsters
   */
  update(time, delta, player) {
    // Update all monsters
    this.monsters.forEach((monster) => {
      if (monster.active) {
        monster.update(time, delta, player);

        // Check if monster is dead
        if (monster.health <= 0 && monster.active) {
          this.onMonsterDeath(monster);
        }
      }
    });
  }

  /**
   * Get monster at position (for clicking on hitbox)
   */
  getMonsterAtPosition(x, y) {
    for (let i = this.monsters.length - 1; i >= 0; i--) {
      const monster = this.monsters[i];
      if (monster.active && monster.hitboxContains) {
        // Check if clicking on monster's hitbox
        if (monster.hitboxContains(x, y)) {
          return monster;
        }
      }
    }
    return null;
  }

  /**
   * Get all active monsters
   */
  getMonsters() {
    return this.monsters.filter((m) => m.active);
  }

  /**
   * Clear all monsters
   */
  clear() {
    this.monsters.forEach((monster) => {
      if (monster.active) {
        monster.destroy();
      }
    });
    this.monsters = [];
    this.spawnData = [];
    this.pendingRespawns = [];
  }
}
