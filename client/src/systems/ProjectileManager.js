import { Projectile } from "../entities/Projectile.js";
import { generateUniqueId } from "../../../shared/utils/random.js";

/**
 * Client-side ProjectileManager
 * Manages rendering and updates of projectiles
 * Supports both server-synced mode and local single-player mode
 */
export class ProjectileManager {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = new Map(); // projectileId -> Projectile

    // Local mode - for single-player
    this.isLocalMode = true; // Default to local mode now
  }

  /**
   * Update projectiles from server state
   * @param {Array} projectileStates - Array of projectile states from server
   */
  updateFromServer(projectileStates) {
    if (!projectileStates) return;

    const updatedIds = new Set();

    for (const state of projectileStates) {
      updatedIds.add(state.id);

      if (this.projectiles.has(state.id)) {
        // Update existing projectile
        const projectile = this.projectiles.get(state.id);
        projectile.updateFromServer(state);
      } else {
        // Create new projectile
        this.createProjectile(state);
      }
    }

    // Remove projectiles not in update (they've been destroyed server-side)
    for (const [id, projectile] of this.projectiles.entries()) {
      if (!updatedIds.has(id)) {
        projectile.expire();
        this.projectiles.delete(id);
      }
    }
  }

  /**
   * Handle projectiles-created event from server
   * @param {Array} projectileStates - Array of new projectile states
   */
  onProjectilesCreated(projectileStates) {
    for (const state of projectileStates) {
      if (!this.projectiles.has(state.id)) {
        this.createProjectile(state);
      }
    }
  }

  /**
   * Handle projectile-hit event from server
   * @param {Object} data - Hit event data { projectileId, targetUserId, damage }
   */
  onProjectileHit(data) {
    const projectile = this.projectiles.get(data.projectileId);
    if (projectile) {
      projectile.onHit();
      this.projectiles.delete(data.projectileId);
    }
  }

  /**
   * Create a projectile from server state
   * @param {Object} state - Projectile state
   * @returns {Projectile}
   */
  createProjectile(state) {
    const projectile = new Projectile(this.scene, state);
    this.projectiles.set(state.id, projectile);
    return projectile;
  }

  /**
   * Update all projectiles (interpolation)
   * @param {number} time - Current time
   * @param {number} delta - Delta time in ms
   */
  update(time, delta) {
    for (const projectile of this.projectiles.values()) {
      if (projectile.active) {
        projectile.update(time, delta);
      }
    }
  }

  /**
   * Get projectile by ID
   * @param {string} id - Projectile ID
   * @returns {Projectile|null}
   */
  getProjectile(id) {
    return this.projectiles.get(id) || null;
  }

  /**
   * Clear all projectiles
   */
  clear() {
    for (const projectile of this.projectiles.values()) {
      if (projectile.active) {
        projectile.destroy();
      }
    }
    this.projectiles.clear();
  }

  // ============================================
  // LOCAL MODE METHODS - Single-player projectiles
  // ============================================

  /**
   * Create a player projectile (for ranged attacks)
   * @param {Player} player - The player firing the projectile
   * @param {number} targetX - Target X position
   * @param {number} targetY - Target Y position
   * @param {Object} weaponConfig - Optional weapon configuration
   * @returns {Projectile} The created projectile
   */
  createPlayerProjectile(player, targetX, targetY, weaponConfig = {}) {
    // Calculate direction and velocity
    const dx = targetX - player.x;
    const dy = targetY - player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return null;

    const speed = weaponConfig.speed || 400;
    const velocityX = (dx / dist) * speed;
    const velocityY = (dy / dist) * speed;
    const rotation = Math.atan2(dy, dx);

    // Get damage from player stats
    const damage = this.scene.statsSystem
      ? this.scene.statsSystem.getStat("attackStrength")
      : 10;

    const state = {
      id: generateUniqueId("proj"),
      x: player.x,
      y: player.y,
      velocityX: velocityX,
      velocityY: velocityY,
      rotation: rotation,
      type: weaponConfig.type || "arrow",
      ownerId: player.id || "player",
      ownerType: "player",
      damage: damage,
      maxRange: weaponConfig.range || 500,
      hitboxSize: weaponConfig.hitboxSize || 16,
      isLocal: true,
    };

    const projectile = new Projectile(this.scene, state);
    this.projectiles.set(state.id, projectile);

    // Play shoot sound
    if (this.scene.soundManager) {
      this.scene.soundManager.play("shoot_arrow");
    }

    return projectile;
  }

  /**
   * Create projectiles from monster ranged attack
   * @param {LocalMonster} monster - The monster firing
   * @param {number} targetX - Target X position
   * @param {number} targetY - Target Y position
   * @param {Object} rangedConfig - Ranged attack configuration
   * @returns {Array<Projectile>} Array of created projectiles
   */
  createProjectilesFromMonster(monster, targetX, targetY, rangedConfig) {
    const projectiles = [];
    const pattern = rangedConfig.pattern || "single";
    const count = rangedConfig.projectileCount || 1;
    const spreadAngle = rangedConfig.spreadAngle || 0;

    // Calculate base angle to target
    const dx = targetX - monster.x;
    const dy = targetY - monster.y;
    const baseAngle = Math.atan2(dy, dx);

    const speed = rangedConfig.projectile?.speed || 300;
    const damage = rangedConfig.damage || 10;
    const maxRange = rangedConfig.range || 400;
    const projectileType = rangedConfig.projectile?.type || "fireball";

    if (pattern === "single") {
      // Single projectile aimed at target
      const velocityX = Math.cos(baseAngle) * speed;
      const velocityY = Math.sin(baseAngle) * speed;

      const state = {
        id: generateUniqueId("proj"),
        x: monster.x,
        y: monster.y,
        velocityX: velocityX,
        velocityY: velocityY,
        rotation: baseAngle,
        type: projectileType,
        ownerId: monster.id,
        ownerType: "monster",
        damage: damage,
        maxRange: maxRange,
        hitboxSize: rangedConfig.projectile?.width || 16,
        isLocal: true,
      };

      const projectile = new Projectile(this.scene, state);
      this.projectiles.set(state.id, projectile);
      projectiles.push(projectile);
    } else if (pattern === "ring") {
      // Multiple projectiles in a circular/spread pattern
      const spreadRadians = (spreadAngle * Math.PI) / 180;

      let angleStep, startAngle;
      if (spreadAngle >= 360) {
        // Full ring - evenly distribute all projectiles
        angleStep = (2 * Math.PI) / count;
        startAngle = 0;
      } else {
        // Partial spread - center on target direction
        angleStep = count > 1 ? spreadRadians / (count - 1) : 0;
        startAngle = baseAngle - spreadRadians / 2;
      }

      for (let i = 0; i < count; i++) {
        const angle = startAngle + angleStep * i;
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;

        const state = {
          id: generateUniqueId("proj"),
          x: monster.x,
          y: monster.y,
          velocityX: velocityX,
          velocityY: velocityY,
          rotation: angle,
          type: projectileType,
          ownerId: monster.id,
          ownerType: "monster",
          damage: damage,
          maxRange: maxRange,
          hitboxSize: rangedConfig.projectile?.width || 16,
          isLocal: true,
        };

        const projectile = new Projectile(this.scene, state);
        this.projectiles.set(state.id, projectile);
        projectiles.push(projectile);
      }
    }

    // Play projectile sound
    if (this.scene.soundManager) {
      this.scene.soundManager.play("fireball_cast");
    }

    return projectiles;
  }

  /**
   * Update all projectiles with local collision detection
   * @param {number} time - Current time
   * @param {number} delta - Delta time in ms
   */
  updateLocal(time, delta) {
    const toRemove = [];

    for (const [id, projectile] of this.projectiles.entries()) {
      if (!projectile.active) {
        toRemove.push(id);
        continue;
      }

      // Update projectile position
      projectile.update(time, delta);

      // Skip collision check if already hit something
      if (projectile.hasHit) {
        continue;
      }

      // Check collisions based on owner type
      if (projectile.ownerType === "monster") {
        // Monster projectiles hit player
        const player = this.scene.player;
        if (player && player.active && projectile.checkPlayerCollision(player)) {
          projectile.markHit();

          // Apply damage through combat system
          if (this.scene.localCombatSystem) {
            this.scene.localCombatSystem.handleProjectileHitPlayer(
              projectile,
              projectile.damage
            );
          }

          projectile.onHit();
          toRemove.push(id);
        }
      } else if (projectile.ownerType === "player") {
        // Player projectiles hit monsters
        if (this.scene.localMonsterManager) {
          const monsters = this.scene.localMonsterManager.getMonsters();

          for (const monster of monsters) {
            if (projectile.checkMonsterCollision(monster)) {
              projectile.markHit();

              // Apply damage through combat system
              if (this.scene.localCombatSystem) {
                this.scene.localCombatSystem.handleProjectileHitMonster(
                  projectile,
                  monster,
                  projectile.damage
                );
              }

              projectile.onHit();
              toRemove.push(id);
              break;
            }
          }
        }
      }
    }

    // Remove destroyed projectiles
    for (const id of toRemove) {
      this.projectiles.delete(id);
    }
  }
}
