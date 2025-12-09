import Phaser from "phaser";

/**
 * RemoteMonster - Renders monsters controlled by the server
 * Client only handles rendering and visual updates; all state comes from server
 */
export class RemoteMonster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, monsterState) {
    // Handle both "slime" and "monster_slime" formats
    let spriteKey = monsterState.monsterType;
    if (!spriteKey.startsWith("monster_")) {
      spriteKey = `monster_${spriteKey}`;
    }
    super(scene, monsterState.x, monsterState.y, spriteKey, 0);

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Store ID for updates
    this.id = monsterState.id;
    this.monsterType = monsterState.monsterType;
    this.spriteKey = spriteKey;

    // State from server
    this.serverX = monsterState.x;
    this.serverY = monsterState.y;
    this.health = monsterState.health;
    this.maxHealth = monsterState.maxHealth;
    this.currentDirection = monsterState.currentDirection || "s";
    this.serverState = monsterState.state || "idle";
    this.serverVelocityX = monsterState.velocityX || 0;
    this.serverVelocityY = monsterState.velocityY || 0;

    // Hitbox from monster data (approximate)
    this.hitboxWidth = 30;
    this.hitboxHeight = 40;

    // Set origin to bottom center (feet position)
    this.setOrigin(0.5, 1);

    // Set depth for proper layering
    this.setDepth(50);

    // Collision body size
    this.body.setSize(40, 20);
    this.body.setOffset(30, 80);

    // Create health bar
    this.createHealthBar();

    // Play initial animation
    this.updateAnimation();

    // Interpolation for smooth movement
    this.lastUpdateTime = Date.now();
  }

  /**
   * Update from server state
   * @param {Object} state - Monster state from server
   */
  updateFromServer(state) {
    this.serverX = state.x;
    this.serverY = state.y;
    this.health = state.health;
    this.maxHealth = state.maxHealth;
    this.currentDirection = state.currentDirection || this.currentDirection;
    this.serverState = state.state || this.serverState;
    this.serverVelocityX = state.velocityX || 0;
    this.serverVelocityY = state.velocityY || 0;
    this.lastUpdateTime = Date.now();

    this.updateHealthBar();
    this.updateAnimation();
  }

  /**
   * Update position (interpolation toward server position)
   */
  update(time, delta) {
    if (!this.active) return;

    // Interpolate toward server position
    const lerpFactor = 0.2;
    this.x = Phaser.Math.Linear(this.x, this.serverX, lerpFactor);
    this.y = Phaser.Math.Linear(this.y, this.serverY, lerpFactor);

    // Update health bar position
    this.updateHealthBar();
  }

  /**
   * Create health bar above monster
   */
  createHealthBar() {
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.setDepth(101);

    this.healthBarFill = this.scene.add.graphics();
    this.healthBarFill.setDepth(102);

    this.healthText = this.scene.add.text(0, 0, "", {
      fontSize: "10px",
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.healthText.setDepth(103);
    this.healthText.setOrigin(0.5, 0.5);

    this.updateHealthBar();
  }

  /**
   * Update health bar position and fill
   */
  updateHealthBar() {
    if (!this.healthBarBg || !this.healthBarFill) return;

    const barWidth = 50;
    const barHeight = 6;
    const x = this.x - barWidth / 2;
    const y = this.y - this.hitboxHeight - 20;

    // Background
    this.healthBarBg.clear();
    this.healthBarBg.fillStyle(0x000000, 0.8);
    this.healthBarBg.fillRect(x, y, barWidth, barHeight);
    this.healthBarBg.lineStyle(1, 0xffffff, 0.5);
    this.healthBarBg.strokeRect(x, y, barWidth, barHeight);

    // Fill
    const healthPercent = this.health / this.maxHealth;
    const fillWidth = (barWidth - 2) * healthPercent;

    this.healthBarFill.clear();
    let color = 0x00ff00;
    if (healthPercent < 0.5) color = 0xffff00;
    if (healthPercent < 0.25) color = 0xff0000;

    this.healthBarFill.fillStyle(color, 1);
    this.healthBarFill.fillRect(x + 1, y + 1, fillWidth, barHeight - 2);

    // Health text
    this.healthText.setText(`${Math.ceil(this.health)}/${this.maxHealth}`);
    this.healthText.setPosition(this.x, y - 8);
  }

  /**
   * Show damage effect
   * @param {number} damage - Damage amount
   */
  showDamage(damage) {
    // Flash red
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    // Floating damage number
    const damageText = this.scene.add.text(this.x, this.y - this.hitboxHeight - 30, `-${damage}`, {
      fontSize: "14px",
      fill: "#ff0000",
      stroke: "#000000",
      strokeThickness: 2,
    });
    damageText.setOrigin(0.5, 0.5);
    damageText.setDepth(150);

    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => damageText.destroy(),
    });
  }

  /**
   * Update animation based on state and direction
   */
  updateAnimation() {
    if (this.serverState === "idle" || this.serverState === "attacking") {
      // Standing animation - only use s or n
      let standDirection = this.currentDirection;
      if (standDirection === "e" || standDirection === "w") {
        standDirection = "s";
      }
      this.play(`${this.spriteKey}_stand_${standDirection}`, true);
    } else {
      // Walking animation
      this.play(`${this.spriteKey}_walk_${this.currentDirection}`, true);
    }

    // Flip sprite for west direction
    this.setFlipX(this.currentDirection === "w");
  }

  /**
   * Get hitbox bounds for combat
   */
  getHitbox() {
    return new Phaser.Geom.Rectangle(
      this.x - this.hitboxWidth / 2,
      this.y - this.hitboxHeight,
      this.hitboxWidth,
      this.hitboxHeight
    );
  }

  /**
   * Check if point is inside hitbox
   */
  hitboxContains(x, y) {
    const hitbox = this.getHitbox();
    return hitbox.contains(x, y);
  }

  /**
   * Play death animation
   */
  die() {
    // Remove health bar
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBarFill) this.healthBarFill.destroy();
    if (this.healthText) this.healthText.destroy();

    // Fade out
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  /**
   * Cleanup on destroy
   */
  destroy(fromScene) {
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBarFill) this.healthBarFill.destroy();
    if (this.healthText) this.healthText.destroy();
    super.destroy(fromScene);
  }
}
