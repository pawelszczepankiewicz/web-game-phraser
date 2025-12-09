import { Projectile } from "../entities/Projectile.js";

/**
 * Client-side ProjectileManager
 * Manages rendering and updates of projectiles from server
 */
export class ProjectileManager {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = new Map(); // projectileId -> Projectile
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
}
