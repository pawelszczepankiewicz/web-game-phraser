import Phaser from "phaser";

/**
 * NPC - Non-player character with wandering behavior and interactions
 */
export class NPC extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, npcData) {
    const spriteKey = `npc_${npcData.name}`;
    super(scene, x, y, spriteKey, 0);

    // Add to scene
    scene.add.existing(this);

    // NPC properties
    this.npcName = npcData.name;
    this.isTrader = npcData.trading || false;
    this.isQuestGiver = npcData.questGiver || false;

    // Spawn point (for wandering radius)
    this.spawnX = x;
    this.spawnY = y;
    this.wanderRadius = 50;

    // Movement properties
    this.speed = 30;
    this.wanderTimer = 0;
    this.wanderDelay = 2000; // Change direction every 2 seconds
    this.currentDirection = { x: 0, y: 0 };

    // Visual setup
    this.setOrigin(0.5, 1); // Bottom center
    this.setDepth(100); // Same as player

    // Make interactive
    this.setInteractive({ cursor: "pointer" });

    // Click handler
    this.on("pointerdown", () => {
      this.handleInteraction();
    });

    // Hover effects
    this.on("pointerover", () => {
      this.setTint(0xdddddd);
    });

    this.on("pointerout", () => {
      this.clearTint();
    });

    // Start with standing animation
    this.play(`${spriteKey}_stand_s`);
  }

  /**
   * Handle player interaction
   */
  handleInteraction() {
    // Check distance to player
    const player = this.scene.player;
    if (!player) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);

    // Only allow interaction if within 100px
    if (distance > 100) {
      return;
    }

    // Emit event for scene to handle
    this.scene.events.emit("npc-interact", {
      npc: this,
      name: this.npcName,
      isTrader: this.isTrader,
      isQuestGiver: this.isQuestGiver,
    });
  }

  /**
   * Update NPC behavior (wandering)
   */
  update(time, delta) {
    this.wanderTimer += delta;

    // Change direction periodically
    if (this.wanderTimer >= this.wanderDelay) {
      this.wanderTimer = 0;
      this.chooseRandomDirection();
    }

    // Move in current direction
    if (this.currentDirection.x !== 0 || this.currentDirection.y !== 0) {
      const newX = this.x + this.currentDirection.x * this.speed * (delta / 1000);
      const newY = this.y + this.currentDirection.y * this.speed * (delta / 1000);

      // Check if still within wander radius
      const distanceFromSpawn = Phaser.Math.Distance.Between(newX, newY, this.spawnX, this.spawnY);

      if (distanceFromSpawn <= this.wanderRadius) {
        this.x = newX;
        this.y = newY;
        this.updateAnimation(this.currentDirection.x, this.currentDirection.y);
      } else {
        // Turn back towards spawn point
        this.currentDirection.x = 0;
        this.currentDirection.y = 0;
        this.updateAnimation(0, 0);
      }
    }
  }

  /**
   * Choose a random direction to wander
   */
  chooseRandomDirection() {
    const rand = Math.random();

    if (rand < 0.3) {
      // Stand still
      this.currentDirection = { x: 0, y: 0 };
    } else {
      // Random direction
      const angle = Math.random() * Math.PI * 2;
      this.currentDirection = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };
    }
  }

  /**
   * Update animation based on movement
   */
  updateAnimation(velocityX, velocityY) {
    const spriteKey = `npc_${this.npcName}`;

    // If not moving, play standing animation
    if (velocityX === 0 && velocityY === 0) {
      const currentAnim = this.anims.currentAnim;
      if (currentAnim) {
        const animKey = currentAnim.key;
        if (animKey.includes("_n")) {
          this.play(`${spriteKey}_stand_n`, true);
        } else {
          this.play(`${spriteKey}_stand_s`, true);
        }
      } else {
        this.play(`${spriteKey}_stand_s`, true);
      }
      return;
    }

    // Determine direction based on velocity
    const angle = Math.atan2(velocityY, velocityX);
    const degrees = (angle * 180) / Math.PI;

    let direction = "s";
    let flipX = false;

    if (degrees >= -22.5 && degrees < 22.5) {
      direction = "e";
    } else if (degrees >= 22.5 && degrees < 67.5) {
      direction = "s";
    } else if (degrees >= 67.5 && degrees < 112.5) {
      direction = "s";
    } else if (degrees >= 112.5 && degrees < 157.5) {
      direction = "s";
      flipX = true;
    } else if (degrees >= 157.5 || degrees < -157.5) {
      direction = "w";
    } else if (degrees >= -157.5 && degrees < -112.5) {
      direction = "n";
      flipX = true;
    } else if (degrees >= -112.5 && degrees < -67.5) {
      direction = "n";
    } else if (degrees >= -67.5 && degrees < -22.5) {
      direction = "n";
    }

    // Set flip
    this.setFlipX(flipX && direction === "e");

    // Play walk animation
    const animKey = `${spriteKey}_walk_${direction}`;
    if (this.scene.anims.exists(animKey)) {
      this.play(animKey, true);
    }
  }
}
