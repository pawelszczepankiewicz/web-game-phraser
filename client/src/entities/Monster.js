import Phaser from 'phaser';

/**
 * Monster entity with AI, animations, and combat
 */
export class Monster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, spawnData) {
    // Handle both "slime" and "monster_slime" formats
    let spriteKey = spawnData.monsterType;
    if (!spriteKey.startsWith('monster_')) {
      spriteKey = `monster_${spriteKey}`;
    }
    super(scene, x, y, spriteKey, 0);

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Monster properties from spawn data
    this.monsterType = spawnData.monsterType;
    this.spriteKey = spriteKey; // Store the actual sprite key used
    this.maxHealth = spawnData.health;
    this.health = spawnData.health;
    this.attackStrength = spawnData.attackStrength;
    this.attackRate = spawnData.attackRate;
    this.attackRadius = spawnData.attackRadius;
    this.patrol = spawnData.patrol;
    this.patrolArea = spawnData.polygon; // Polygon points for patrol area
    this.spawnPoint = { x, y };

    // Hitbox for combat
    this.hitboxWidth = spawnData.hitboxWidth || 30;
    this.hitboxHeight = spawnData.hitboxHeight || 40;

    // Combat state
    this.lastAttackTime = 0;
    this.target = null; // Player reference when in combat

    // AI state
    this.speed = 80;
    this.currentDirection = 's';
    this.patrolTarget = null;
    this.patrolWaitTime = 0;

    // Set origin to bottom center (feet position)
    this.setOrigin(0.5, 1);

    // Set depth for proper layering
    this.setDepth(100);

    // Collision body size
    this.body.setSize(40, 20);
    this.body.setOffset(30, 80);

    // Create health bar
    this.createHealthBar();

    // Play idle animation
    this.play(`${this.spriteKey}_stand_s`);
  }

  /**
   * Create health bar above monster
   */
  createHealthBar() {
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.setDepth(101);

    this.healthBarFill = this.scene.add.graphics();
    this.healthBarFill.setDepth(102);

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
    const y = this.y - this.height - 10;

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
    // Color based on health: green -> yellow -> red
    let color = 0x00ff00;
    if (healthPercent < 0.5) color = 0xffff00;
    if (healthPercent < 0.25) color = 0xff0000;

    this.healthBarFill.fillStyle(color, 1);
    this.healthBarFill.fillRect(x + 1, y + 1, fillWidth, barHeight - 2);

    // Draw health text
    if (!this.healthText) {
      this.healthText = this.scene.add.text(0, 0, '', {
        fontSize: '10px',
        fill: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2
      });
      this.healthText.setDepth(103);
      this.healthText.setOrigin(0.5, 0.5);
    }

    this.healthText.setText(`${Math.ceil(this.health)}/${this.maxHealth}`);
    this.healthText.setPosition(this.x, y - 8);
  }

  /**
   * Take damage from attack
   */
  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;

    console.log(`Monster took ${amount} damage. Health: ${this.health}/${this.maxHealth}`);

    this.updateHealthBar();

    // Flash effect
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });

    if (this.health <= 0) {
      console.log('Monster died!');
      this.die();
    }
  }

  /**
   * Monster death
   */
  die() {
    // Remove health bar
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBarFill) this.healthBarFill.destroy();

    // Fade out and destroy
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this.destroy();
      }
    });
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
   * Check if player is in attack range (using hitbox distance)
   */
  isPlayerInRange(player) {
    if (!player.getHitbox) {
      // Fallback to simple distance if player doesn't have hitbox
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
      return distance <= this.attackRadius;
    }

    // Get both hitboxes
    const monsterHitbox = this.getHitbox();
    const playerHitbox = player.getHitbox();

    // Calculate distance between hitbox centers
    const monsterCenterX = monsterHitbox.centerX;
    const monsterCenterY = monsterHitbox.centerY;
    const playerCenterX = playerHitbox.centerX;
    const playerCenterY = playerHitbox.centerY;

    const distance = Phaser.Math.Distance.Between(
      monsterCenterX,
      monsterCenterY,
      playerCenterX,
      playerCenterY
    );

    return distance <= this.attackRadius;
  }

  /**
   * Check if point is inside patrol polygon
   */
  isPointInPolygon(x, y) {
    const points = this.patrolArea;
    let inside = false;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x;
      const yi = points[i].y;
      const xj = points[j].x;
      const yj = points[j].y;

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Get random point inside patrol polygon
   */
  getRandomPatrolPoint() {
    // Get bounding box of polygon
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    this.patrolArea.forEach(point => {
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

      if (this.isPointInPolygon(x, y)) {
        return { x, y };
      }
      attempts++;
    }

    // Fallback to spawn point
    return this.spawnPoint;
  }

  /**
   * Check if can attack player (within 100px)
   */
  canAttackPlayer(player) {
    if (!player.getHitbox) return false;

    const monsterHitbox = this.getHitbox();
    const playerHitbox = player.getHitbox();

    // Calculate distance between hitbox centers
    const distance = Phaser.Math.Distance.Between(
      monsterHitbox.centerX,
      monsterHitbox.centerY,
      playerHitbox.centerX,
      playerHitbox.centerY
    );

    return distance < 100;
  }

  /**
   * Attack the player
   */
  attackPlayer(player) {
    const now = Date.now();
    if (now - this.lastAttackTime < this.attackRate) {
      return; // Still in cooldown
    }

    // Check if player is in attack range
    if (!this.canAttackPlayer(player)) {
      return;
    }

    this.lastAttackTime = now;

    // Deal damage to player
    if (player && player.takeDamage) {
      player.takeDamage(this.attackStrength);
    }

    // Play attack animation (for now just flash)
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }

  /**
   * Update monster AI and movement
   */
  update(time, delta, player) {
    if (!this.active) return;

    // Check if player is in attack range
    if (player && this.isPlayerInRange(player)) {
      this.target = player;

      // Calculate distance to player
      const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

      // Only move if more than 20px away to avoid collision
      if (distance > 20) {
        // Move towards player
        const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
        const velocityX = Math.cos(angle) * this.speed;
        const velocityY = Math.sin(angle) * this.speed;

        this.body.setVelocity(velocityX, velocityY);
        this.updateAnimation(velocityX, velocityY);
      } else {
        // Stop moving when close enough
        this.body.setVelocity(0, 0);
        this.updateAnimation(0, 0);
      }

      // Attack player
      this.attackPlayer(player);
    } else {
      this.target = null;

      // Patrol behavior
      if (this.patrol) {
        if (!this.patrolTarget || Phaser.Math.Distance.Between(this.x, this.y, this.patrolTarget.x, this.patrolTarget.y) < 10) {
          // Reached patrol point or no target, wait then get new point
          if (this.patrolWaitTime <= 0) {
            this.patrolTarget = this.getRandomPatrolPoint();
            this.patrolWaitTime = Phaser.Math.Between(1000, 3000);
          } else {
            this.patrolWaitTime -= delta;
            this.body.setVelocity(0, 0);
            this.updateAnimation(0, 0);
          }
        } else {
          // Move towards patrol point
          const angle = Phaser.Math.Angle.Between(this.x, this.y, this.patrolTarget.x, this.patrolTarget.y);
          const velocityX = Math.cos(angle) * (this.speed * 0.5); // Patrol slower
          const velocityY = Math.sin(angle) * (this.speed * 0.5);

          this.body.setVelocity(velocityX, velocityY);
          this.updateAnimation(velocityX, velocityY);
        }
      } else {
        // Stationary - just idle
        this.body.setVelocity(0, 0);
        this.updateAnimation(0, 0);
      }
    }

    // Update health bar position
    this.updateHealthBar();
  }

  /**
   * Update animation based on movement direction
   */
  updateAnimation(velocityX, velocityY) {
    if (velocityX === 0 && velocityY === 0) {
      // Standing still - use stored direction but only s or n
      let standDirection = this.currentDirection;
      if (standDirection === 'e' || standDirection === 'w') {
        standDirection = 's'; // Default to south for east/west standing
      }
      this.play(`${this.spriteKey}_stand_${standDirection}`, true);
    } else {
      // Moving - determine direction
      const angle = Math.atan2(velocityY, velocityX);
      const degrees = angle * (180 / Math.PI);

      // Determine base direction (8 directions)
      let direction;
      if (degrees >= -22.5 && degrees < 22.5) {
        direction = 'e';
      } else if (degrees >= 22.5 && degrees < 67.5) {
        direction = 's'; // SE -> S
      } else if (degrees >= 67.5 && degrees < 112.5) {
        direction = 's';
      } else if (degrees >= 112.5 && degrees < 157.5) {
        direction = 's'; // SW -> S
      } else if (degrees >= 157.5 || degrees < -157.5) {
        direction = 'w';
      } else if (degrees >= -157.5 && degrees < -112.5) {
        direction = 'n'; // NW -> N
      } else if (degrees >= -112.5 && degrees < -67.5) {
        direction = 'n';
      } else if (degrees >= -67.5 && degrees < -22.5) {
        direction = 'n'; // NE -> N
      } else {
        direction = 's'; // Default
      }

      this.currentDirection = direction;

      // Play walking animation
      this.play(`${this.spriteKey}_walk_${direction}`, true);

      // Flip sprite for west direction
      if (direction === 'w') {
        this.setFlipX(true);
      } else {
        this.setFlipX(false);
      }
    }
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
