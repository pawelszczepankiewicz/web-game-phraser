import { Projectile } from "../models/Projectile.js";

/**
 * ProjectileManager - Server-side projectile management
 * Handles creation, updates, collision detection, and cleanup
 */
export class ProjectileManager {
  constructor(playerManager) {
    this.playerManager = playerManager;
    this.monsterManager = null; // Set later via setMonsterManager
    this.projectiles = new Map(); // projectileId -> Projectile
  }

  /**
   * Set reference to MonsterManager for collision detection
   * @param {MonsterManager} monsterManager
   */
  setMonsterManager(monsterManager) {
    this.monsterManager = monsterManager;
  }

  /**
   * Create a single projectile
   * @param {Object} config - Projectile configuration
   * @returns {Projectile} The created projectile
   */
  createProjectile(config) {
    const projectile = new Projectile(config);
    this.projectiles.set(projectile.id, projectile);
    return projectile;
  }

  /**
   * Create projectiles based on attack pattern
   * @param {Object} attacker - Monster or entity firing the projectiles
   * @param {Object} target - Target player
   * @param {Object} rangedConfig - Ranged attack configuration from monster data
   * @returns {Array<Projectile>} Array of created projectiles
   */
  createProjectilesFromPattern(attacker, target, rangedConfig) {
    const projectiles = [];
    const pattern = rangedConfig.pattern || "single";
    const count = rangedConfig.projectileCount || 1;
    const spreadAngle = rangedConfig.spreadAngle || 0;

    // Calculate base angle to target
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const baseAngle = Math.atan2(dy, dx);

    if (pattern === "single") {
      // Single projectile aimed at target
      const projectile = this.createProjectile({
        x: attacker.x,
        y: attacker.y,
        targetX: target.x,
        targetY: target.y,
        speed: rangedConfig.projectile.speed,
        damage: rangedConfig.damage,
        ownerId: attacker.id,
        ownerType: "monster",
        targetPlayerId: target.userId,
        type: rangedConfig.projectile.type,
        width: rangedConfig.projectile.width,
        height: rangedConfig.projectile.height,
        maxRange: rangedConfig.range,
        map: attacker.map,
      });
      projectiles.push(projectile);
    } else if (pattern === "ring") {
      // Multiple projectiles in a circular/spread pattern
      const spreadRadians = (spreadAngle * Math.PI) / 180;

      // For full 360 ring, distribute evenly; otherwise center on target
      let angleStep, startAngle;
      if (spreadAngle >= 360) {
        // Full ring - evenly distribute all projectiles
        angleStep = (2 * Math.PI) / count;
        startAngle = 0; // Start from angle 0 (east)
      } else {
        // Partial spread - center on target direction
        angleStep = count > 1 ? spreadRadians / (count - 1) : 0;
        startAngle = baseAngle - spreadRadians / 2;
      }

      for (let i = 0; i < count; i++) {
        const angle = startAngle + angleStep * i;
        const targetDist = rangedConfig.range;
        const targetX = attacker.x + Math.cos(angle) * targetDist;
        const targetY = attacker.y + Math.sin(angle) * targetDist;

        const projectile = this.createProjectile({
          x: attacker.x,
          y: attacker.y,
          targetX: targetX,
          targetY: targetY,
          speed: rangedConfig.projectile.speed,
          damage: rangedConfig.damage,
          ownerId: attacker.id,
          ownerType: "monster",
          type: rangedConfig.projectile.type,
          width: rangedConfig.projectile.width,
          height: rangedConfig.projectile.height,
          maxRange: rangedConfig.range,
          map: attacker.map,
        });
        projectiles.push(projectile);
      }
    }

    return projectiles;
  }

  /**
   * Update all projectiles and check collisions
   * @param {number} deltaTime - Time since last update in seconds
   * @returns {Object} { playerHits: Array, monsterHits: Array }
   */
  update(deltaTime) {
    const playerHits = [];
    const monsterHits = [];
    const toRemove = [];

    for (const [id, projectile] of this.projectiles.entries()) {
      // Update position
      const stillActive = projectile.update(deltaTime);

      if (!stillActive) {
        toRemove.push(id);
        continue;
      }

      // Check collisions based on projectile owner type
      if (projectile.ownerType === "monster") {
        // Monster projectiles hit players
        const playersOnMap = this.playerManager.getPlayersOnMap(projectile.map);

        for (const player of playersOnMap) {
          if (projectile.checkPlayerCollision(player)) {
            playerHits.push({
              projectile: projectile,
              player: player,
              damage: projectile.damage,
            });

            projectile.onHit();
            toRemove.push(id);
            break;
          }
        }
      } else if (projectile.ownerType === "player" && this.monsterManager) {
        // Player projectiles hit monsters
        const monstersOnMap = this.monsterManager.getMonstersOnMap(projectile.map);

        for (const monster of monstersOnMap) {
          if (!monster.active) continue;

          if (projectile.checkMonsterCollision(monster)) {
            monsterHits.push({
              projectile: projectile,
              monster: monster,
              damage: projectile.damage,
              attackerId: projectile.ownerId,
            });

            projectile.onHit();
            toRemove.push(id);
            break;
          }
        }
      }
    }

    // Remove inactive projectiles
    for (const id of toRemove) {
      this.projectiles.delete(id);
    }

    return { playerHits, monsterHits };
  }

  /**
   * Get all active projectiles on a specific map
   * @param {string} mapKey - Map identifier
   * @returns {Array<Projectile>}
   */
  getProjectilesOnMap(mapKey) {
    const result = [];
    for (const projectile of this.projectiles.values()) {
      if (projectile.map === mapKey && projectile.active) {
        result.push(projectile);
      }
    }
    return result;
  }

  /**
   * Get projectiles in range for interest management
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} range - Range in pixels
   * @param {string} mapKey - Map identifier
   * @returns {Array<Projectile>}
   */
  getProjectilesInRange(x, y, range, mapKey) {
    const result = [];
    const rangeSquared = range * range;

    for (const projectile of this.projectiles.values()) {
      if (projectile.map !== mapKey || !projectile.active) continue;

      const dx = projectile.x - x;
      const dy = projectile.y - y;
      const distSquared = dx * dx + dy * dy;

      if (distSquared <= rangeSquared) {
        result.push(projectile);
      }
    }

    return result;
  }

  /**
   * Remove a projectile by ID
   * @param {string} projectileId
   */
  removeProjectile(projectileId) {
    this.projectiles.delete(projectileId);
  }

  /**
   * Get total projectile count
   */
  getCount() {
    return this.projectiles.size;
  }

  /**
   * Clear all projectiles
   */
  clear() {
    this.projectiles.clear();
  }
}
