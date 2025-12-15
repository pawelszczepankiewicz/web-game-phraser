import Phaser from "phaser";

/**
 * Client-side Projectile entity
 * Renders and animates projectiles from server state
 */
export class Projectile extends Phaser.GameObjects.Sprite {
  constructor(scene, state) {
    // Determine the sprite key based on projectile type
    const spriteKey = `projectile_${state.type}`;

    super(scene, state.x, state.y, spriteKey);

    // Add to scene
    scene.add.existing(this);

    // Store state
    this.id = state.id;
    this.projectileType = state.type;
    this.velocityX = state.velocityX;
    this.velocityY = state.velocityY;
    this.rotation = state.rotation;
    this.ownerId = state.ownerId;
    this.serverX = state.x;
    this.serverY = state.y;

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
   * Client-side update with interpolation
   * @param {number} time - Current time
   * @param {number} delta - Delta time in ms
   */
  update(time, delta) {
    // Interpolate towards server position
    const deltaSeconds = delta / 1000;

    // Predictive movement based on velocity
    const predictedX = this.serverX + this.velocityX * deltaSeconds;
    const predictedY = this.serverY + this.velocityY * deltaSeconds;

    // Smooth interpolation
    this.x = Phaser.Math.Linear(this.x, predictedX, this.interpolationSpeed);
    this.y = Phaser.Math.Linear(this.y, predictedY, this.interpolationSpeed);
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
