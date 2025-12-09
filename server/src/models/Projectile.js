import { generateUniqueId } from "../../../shared/utils/random.js";
import { distance } from "../../../shared/utils/geometry.js";

/**
 * Server-side Projectile model
 * Handles projectile movement, collision detection, and damage
 */
export class Projectile {
  constructor(config) {
    this.id = generateUniqueId("projectile");

    // Position and movement
    this.x = config.x;
    this.y = config.y;
    this.targetX = config.targetX;
    this.targetY = config.targetY;
    this.speed = config.speed || 200;

    // Calculate velocity based on direction to target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.velocityX = (dx / dist) * this.speed;
      this.velocityY = (dy / dist) * this.speed;
    } else {
      this.velocityX = 0;
      this.velocityY = this.speed; // Default to moving down
    }

    // Calculate rotation angle (in radians) for sprite rotation
    this.rotation = Math.atan2(dy, dx);

    // Combat properties
    this.damage = config.damage || 10;
    this.ownerId = config.ownerId; // Monster ID that fired this
    this.ownerType = config.ownerType || "monster"; // "monster" or "player"
    this.targetPlayerId = config.targetPlayerId; // Specific target (optional)

    // Projectile properties
    this.type = config.type || "fireball"; // Sprite type
    this.width = config.width || 36;
    this.height = config.height || 48;
    this.maxRange = config.maxRange || 500;
    this.distanceTraveled = 0;

    // Map
    this.map = config.map;

    // State
    this.active = true;
    this.createdAt = Date.now();

    // Hit tracking (prevent multiple hits on same target)
    this.hitTargets = new Set();
  }

  /**
   * Update projectile position
   * @param {number} deltaTime - Time since last update in seconds
   * @returns {boolean} - True if projectile is still active
   */
  update(deltaTime) {
    if (!this.active) return false;

    // Move projectile
    const moveX = this.velocityX * deltaTime;
    const moveY = this.velocityY * deltaTime;

    this.x += moveX;
    this.y += moveY;

    // Track distance traveled
    this.distanceTraveled += Math.sqrt(moveX * moveX + moveY * moveY);

    // Deactivate if max range exceeded
    if (this.distanceTraveled >= this.maxRange) {
      this.active = false;
      return false;
    }

    return true;
  }

  /**
   * Check if projectile hits a player
   * @param {Object} player - Player object with x, y coordinates
   * @returns {boolean} - True if hit
   */
  checkPlayerCollision(player) {
    if (!this.active) return false;
    if (this.hitTargets.has(player.userId)) return false;

    // Simple circle collision (using projectile center and player position)
    const hitRadius = Math.max(this.width, this.height) / 2;
    const playerRadius = 20; // Approximate player hitbox radius

    const dist = distance(this.x, this.y, player.x, player.y);

    if (dist < hitRadius + playerRadius) {
      this.hitTargets.add(player.userId);
      return true;
    }

    return false;
  }

  /**
   * Mark projectile as hit (deactivate after hitting)
   */
  onHit() {
    this.active = false;
  }

  /**
   * Get state for broadcasting to clients
   */
  getState() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      rotation: this.rotation,
      type: this.type,
      ownerId: this.ownerId,
      active: this.active,
    };
  }
}
