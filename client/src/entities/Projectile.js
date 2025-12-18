import Phaser from "phaser";
import { generateUniqueId } from "../shared/utils/random.js";

/**
 * Client-side Projectile entity
 * Renders and animates projectiles, supports local collision detection for single-player
 */
export class Projectile extends Phaser.GameObjects.Sprite {
  constructor(scene, state) {
    // Determine the sprite key based on projectile type
    const spriteKey = `projectile_${state.type}`;

    super(scene, state.x, state.y, spriteKey);

    // Add to scene
    scene.add.existing(this);

    // Store state
    this.id = state.id || generateUniqueId("proj");
    this.projectileType = state.type;
    this.velocityX = state.velocityX;
    this.velocityY = state.velocityY;
    this.rotation = state.rotation;
    this.ownerId = state.ownerId;
    this.ownerType = state.ownerType || "monster"; // "monster" or "player"
    this.damage = state.damage || 10;
    this.serverX = state.x;
    this.serverY = state.y;

    // Local mode properties
    this.isLocal = state.isLocal || false;
    this.maxRange = state.maxRange || 500;
    this.startX = state.x;
    this.startY = state.y;
    this.hasHit = false;

    // Hitbox size
    this.hitboxSize = state.hitboxSize || 16;

    // Set origin to center
    this.setOrigin(0.5, 0.5);

    // Set rotation to face direction of travel
    this.setRotation(this.rotation);

    // Set depth above most objects but below UI
    this.setDepth(150);

    // Play animation if it exists (some projectiles like arrow are static)
    const flyAnimKey = `projectile_${state.type}_fly`;
    if (this.scene.anims.exists(flyAnimKey)) {
      this.play(flyAnimKey, true);
    }

    // Interpolation settings
    this.interpolationSpeed = 0.3;
  }

  /**
   * Update from server state
   * @param {Object} state - Projectile state from server
   */
  updateFromServer(state) {
    this.serverX = state.x;
    this.serverY = state.y;
    this.velocityX = state.velocityX;
    this.velocityY = state.velocityY;
    this.rotation = state.rotation;

    // Update rotation
    this.setRotation(this.rotation);
  }

  /**
   * Client-side update with interpolation or local movement
   * @param {number} time - Current time
   * @param {number} delta - Delta time in ms
   */
  update(time, delta) {
    const deltaSeconds = delta / 1000;

    if (this.isLocal) {
      // Local mode - move directly based on velocity
      this.x += this.velocityX * deltaSeconds;
      this.y += this.velocityY * deltaSeconds;

      // Update server position to match (for consistency)
      this.serverX = this.x;
      this.serverY = this.y;

      // Check if projectile has traveled beyond max range
      const distTraveled = Phaser.Math.Distance.Between(
        this.startX,
        this.startY,
        this.x,
        this.y
      );

      if (distTraveled >= this.maxRange) {
        this.expire();
        return;
      }
    } else {
      // Multiplayer mode - interpolate towards server position
      const predictedX = this.serverX + this.velocityX * deltaSeconds;
      const predictedY = this.serverY + this.velocityY * deltaSeconds;

      // Smooth interpolation
      this.x = Phaser.Math.Linear(this.x, predictedX, this.interpolationSpeed);
      this.y = Phaser.Math.Linear(this.y, predictedY, this.interpolationSpeed);
    }
  }

  /**
   * Check collision with player (for monster projectiles)
   * @param {Player} player - The player to check collision against
   * @returns {boolean} True if collision detected
   */
  checkPlayerCollision(player) {
    if (this.hasHit || !player || !player.active) return false;
    if (this.ownerType === "player") return false; // Don't hit own projectiles

    // Simple circle collision
    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    const collisionRadius = this.hitboxSize / 2 + 16; // projectile hitbox + player radius

    return dist <= collisionRadius;
  }

  /**
   * Check collision with a monster (for player projectiles)
   * @param {LocalMonster} monster - The monster to check collision against
   * @returns {boolean} True if collision detected
   */
  checkMonsterCollision(monster) {
    if (this.hasHit || !monster || !monster.active) return false;
    if (this.ownerType === "monster" && this.ownerId === monster.id) return false; // Don't hit self

    // Use monster's hitbox if available
    const monsterHitboxWidth = monster.hitboxWidth || 32;
    const monsterHitboxHeight = monster.hitboxHeight || 32;

    // AABB collision check
    const halfWidth = monsterHitboxWidth / 2;
    const halfHeight = monsterHitboxHeight / 2;
    const projRadius = this.hitboxSize / 2;

    // Check if projectile circle overlaps with monster rectangle
    const closestX = Phaser.Math.Clamp(this.x, monster.x - halfWidth, monster.x + halfWidth);
    const closestY = Phaser.Math.Clamp(this.y, monster.y - halfHeight, monster.y + halfHeight);

    const distX = this.x - closestX;
    const distY = this.y - closestY;
    const distSquared = distX * distX + distY * distY;

    return distSquared <= projRadius * projRadius;
  }

  /**
   * Mark projectile as hit (prevents multiple hits)
   */
  markHit() {
    this.hasHit = true;
  }

  /**
   * Play hit effect and destroy
   */
  onHit() {
    // Play hit animation if available
    const hitAnimKey = `projectile_${this.projectileType}_hit`;
    if (this.scene.anims.exists(hitAnimKey)) {
      this.play(hitAnimKey);
      this.once("animationcomplete", () => {
        this.destroy();
      });
    } else {
      // Simple fade out
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scale: 1.5,
        duration: 150,
        onComplete: () => {
          this.destroy();
        },
      });
    }
  }

  /**
   * Destroy projectile (when it goes out of range or expires)
   */
  expire() {
    // Fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 100,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
