import Phaser from "phaser";
import { distance, isInRange, getRandomPointInPolygon } from "../shared/utils/geometry.js";
import { generateUniqueId } from "../shared/utils/random.js";
import { ATTACK_RANGE } from "../shared/constants.js";

/**
 * LocalMonster - Client-side monster with full AI for single-player mode
 * Combines server AI logic with Phaser rendering
 */
export class LocalMonster extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, spawnData, spawnPoint) {
    // Handle both "slime" and "monster_slime" formats
    let spriteKey = spawnData.monsterType;
    if (!spriteKey.startsWith("monster_")) {
      spriteKey = `monster_${spriteKey}`;
    }

    super(scene, spawnPoint.x, spawnPoint.y, spriteKey, 0);

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Unique ID for this monster instance
    this.id = generateUniqueId("monster");
    this.monsterType = spawnData.monsterType;
    this.spriteKey = spriteKey;
    this.map = spawnData.map;

    // Position and spawn data
    this.spawnPoint = { ...spawnPoint };
    this.spawnDataId = spawnData.id;

    // Stats from monster type definition
    this.maxHealth = spawnData.health;
    this.health = spawnData.health;
    this.attackStrength = spawnData.attackStrength;
    this.attackRate = spawnData.attackRate;
    this.attackRadius = spawnData.attackRadius;
    this.firstAttackDelay = spawnData.firstAttackDelay || 0;
    this.speed = spawnData.speed || 60;

    // Hitbox dimensions
    this.hitboxWidth = spawnData.hitboxWidth || 30;
    this.hitboxHeight = spawnData.hitboxHeight || 40;

    // Ranged attack configuration (optional)
    this.rangedAttack = spawnData.rangedAttack || null;
    this.lastRangedAttackTime = 0;
    this.currentPatternIndex = 0;

    // Patrol configuration
    this.patrol = spawnData.patrol !== undefined ? spawnData.patrol : true;
    this.patrolArea = spawnData.polygon || null;

    // AI state
    this.state = "idle";
    this.targetPlayer = null;
    this.patrolTarget = null;
    this.patrolWaitTime = 0;
    this.velocityX = 0;
    this.velocityY = 0;
    this.currentDirection = "s";

    // Combat state
    this.lastAttackTime = 0;
    this.enteredRangeTime = null;
    this.hasAttackedOnce = false;

    // Active state
    this.deathTime = null;

    // Set origin to bottom center (feet position)
    this.setOrigin(0.5, 1);
    this.setDepth(50);

    // Collision body size
    this.body.setSize(40, 20);
    this.body.setOffset(30, 80);

    // Create health bar
    this.createHealthBar();

    // Play initial animation
    this.updateAnimation();
  }

  /**
   * Check if monster has ranged attack capability
   */
  hasRangedAttackCapability() {
    return this.rangedAttack && this.rangedAttack.enabled;
  }

  /**
   * Get the current attack pattern
   */
  getCurrentPattern() {
    if (!this.hasRangedAttackCapability()) return null;

    if (this.rangedAttack.patterns && this.rangedAttack.patterns.length > 0) {
      return this.rangedAttack.patterns[this.currentPatternIndex];
    }

    return {
      pattern: this.rangedAttack.pattern || "single",
      damage: this.rangedAttack.damage || 10,
      cooldown: this.rangedAttack.cooldown || 3000,
      projectileCount: this.rangedAttack.projectileCount || 1,
      spreadAngle: this.rangedAttack.spreadAngle || 0,
    };
  }

  /**
   * Advance to the next attack pattern
   */
  nextPattern() {
    if (this.rangedAttack.patterns && this.rangedAttack.patterns.length > 1) {
      this.currentPatternIndex = (this.currentPatternIndex + 1) % this.rangedAttack.patterns.length;
    }
  }

  /**
   * Check if monster should use ranged attack based on distance
   */
  shouldUseRangedAttack(distanceToTarget) {
    if (!this.hasRangedAttackCapability()) return false;

    const meleeRange = this.rangedAttack.meleeRange || ATTACK_RANGE;
    const rangedRange = this.rangedAttack.range || 300;

    return distanceToTarget > meleeRange && distanceToTarget <= rangedRange;
  }

  /**
   * Check if ranged attack is off cooldown
   */
  canRangedAttack() {
    if (!this.hasRangedAttackCapability()) return false;

    const now = Date.now();
    const currentPattern = this.getCurrentPattern();
    const cooldown = currentPattern ? currentPattern.cooldown : 3000;
    return now - this.lastRangedAttackTime >= cooldown;
  }

  /**
   * Update monster AI (called every frame)
   * @param {number} deltaTime - Time since last update in seconds
   * @param {Object} player - The player object
   * @returns {Object|null} - Attack result if monster attacked
   */
  update(deltaTime, player) {
    if (!this.active) return null;

    let attackResult = null;

    // Check if player is alive and in range
    const playerAlive = player && player.active && this.scene.statsSystem?.getStat("health") > 0;

    if (playerAlive) {
      const dist = distance(this.x, this.y, player.x, player.y);
      const maxAggroRange = this.hasRangedAttackCapability()
        ? Math.max(this.attackRadius, this.rangedAttack.range)
        : this.attackRadius;

      if (dist <= maxAggroRange) {
        // Player in aggro range
        this.targetPlayer = player;

        if (this.enteredRangeTime === null) {
          this.enteredRangeTime = Date.now();
        }

        const shouldRanged = this.shouldUseRangedAttack(dist);
        const meleeRange = this.hasRangedAttackCapability()
          ? this.rangedAttack.meleeRange || ATTACK_RANGE
          : ATTACK_RANGE;

        if (shouldRanged && this.canRangedAttack()) {
          // Ranged attack mode
          this.state = "casting";
          this.velocityX = 0;
          this.velocityY = 0;
          this.updateDirection(player.x - this.x, player.y - this.y);
          attackResult = this.tryRangedAttack(player);
        } else if (dist > meleeRange) {
          // Chase player
          this.state = "chasing";
          this.moveTowards(player.x, player.y, deltaTime);
        } else {
          // Melee attack mode
          this.state = "attacking";
          this.velocityX = 0;
          this.velocityY = 0;
          attackResult = this.tryAttack(player);
        }
      } else {
        // Player out of range
        this.resetCombatState();
        this.updatePatrolBehavior(deltaTime);
      }
    } else {
      // No valid player target
      this.resetCombatState();
      this.updatePatrolBehavior(deltaTime);
    }

    // Update visuals
    this.updateAnimation();
    this.updateHealthBar();
    this.setDepth(this.y);

    return attackResult;
  }

  /**
   * Reset combat state when player leaves range
   */
  resetCombatState() {
    if (this.targetPlayer !== null) {
      this.enteredRangeTime = null;
      this.hasAttackedOnce = false;
      this.targetPlayer = null;
    }
  }

  /**
   * Update patrol behavior
   */
  updatePatrolBehavior(deltaTime) {
    if (this.patrol && this.patrolArea) {
      this.updatePatrol(deltaTime);
    } else {
      this.state = "idle";
      this.velocityX = 0;
      this.velocityY = 0;
    }
  }

  /**
   * Move towards a target position
   */
  moveTowards(targetX, targetY, deltaTime) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const moveX = (dx / dist) * this.speed * deltaTime;
      const moveY = (dy / dist) * this.speed * deltaTime;

      this.x += moveX;
      this.y += moveY;
      this.velocityX = (dx / dist) * this.speed;
      this.velocityY = (dy / dist) * this.speed;

      this.updateDirection(dx, dy);
    }
  }

  /**
   * Update patrol behavior
   */
  updatePatrol(deltaTime) {
    if (this.patrolWaitTime > 0) {
      this.patrolWaitTime -= deltaTime * 1000;
      this.state = "idle";
      this.velocityX = 0;
      this.velocityY = 0;
      return;
    }

    if (!this.patrolTarget) {
      this.patrolTarget = getRandomPointInPolygon(this.patrolArea);
      if (!this.patrolTarget) {
        this.patrolTarget = this.spawnPoint;
      }
    }

    const distToTarget = distance(this.x, this.y, this.patrolTarget.x, this.patrolTarget.y);
    if (distToTarget < 10) {
      this.patrolWaitTime = 1000 + Math.random() * 2000;
      this.patrolTarget = null;
      this.state = "idle";
      this.velocityX = 0;
      this.velocityY = 0;
    } else {
      this.state = "patrolling";
      const patrolSpeed = this.speed * 0.5;
      const dx = this.patrolTarget.x - this.x;
      const dy = this.patrolTarget.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        const moveX = (dx / dist) * patrolSpeed * deltaTime;
        const moveY = (dy / dist) * patrolSpeed * deltaTime;

        this.x += moveX;
        this.y += moveY;
        this.velocityX = (dx / dist) * patrolSpeed;
        this.velocityY = (dy / dist) * patrolSpeed;

        this.updateDirection(dx, dy);
      }
    }
  }

  /**
   * Update direction based on movement
   */
  updateDirection(dx, dy) {
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    if (angle >= -45 && angle < 45) {
      this.currentDirection = "e";
    } else if (angle >= 45 && angle < 135) {
      this.currentDirection = "s";
    } else if (angle >= -135 && angle < -45) {
      this.currentDirection = "n";
    } else {
      this.currentDirection = "w";
    }
  }

  /**
   * Try to attack a player (melee)
   */
  tryAttack(player) {
    const now = Date.now();

    // Check first attack delay
    if (!this.hasAttackedOnce && this.enteredRangeTime !== null) {
      const timeSinceEntered = now - this.enteredRangeTime;
      if (timeSinceEntered < this.firstAttackDelay) {
        return null;
      }
    }

    // Check attack cooldown
    if (now - this.lastAttackTime < this.attackRate) {
      return null;
    }

    // Check if player is in attack range
    if (!isInRange(this.x, this.y, player.x, player.y, ATTACK_RANGE)) {
      return null;
    }

    // Attack!
    this.lastAttackTime = now;
    this.hasAttackedOnce = true;

    return {
      type: "melee",
      target: player,
      damage: this.attackStrength,
      monsterId: this.id,
    };
  }

  /**
   * Try ranged attack on a player
   */
  tryRangedAttack(player) {
    if (!this.hasRangedAttackCapability()) return null;

    const now = Date.now();

    if (!this.hasAttackedOnce && this.enteredRangeTime !== null) {
      const timeSinceEntered = now - this.enteredRangeTime;
      if (timeSinceEntered < this.firstAttackDelay) {
        return null;
      }
    }

    if (!this.canRangedAttack()) {
      return null;
    }

    const currentPattern = this.getCurrentPattern();

    this.lastRangedAttackTime = now;
    this.hasAttackedOnce = true;

    const rangedConfig = {
      ...this.rangedAttack,
      damage: currentPattern.damage,
      pattern: currentPattern.pattern,
      projectileCount: currentPattern.projectileCount,
      spreadAngle: currentPattern.spreadAngle,
    };

    this.nextPattern();

    return {
      type: "ranged",
      monsterId: this.id,
      target: player,
      targetX: player.x,
      targetY: player.y,
      rangedConfig: rangedConfig,
      monster: this,
    };
  }

  /**
   * Take damage from a player attack
   */
  takeDamage(damage, attackerId) {
    if (!this.active) {
      return { hit: false, reason: "monster_inactive" };
    }

    const actualDamage = Math.max(1, damage);
    this.health = Math.max(0, this.health - actualDamage);

    // Show damage effect
    this.showDamage(actualDamage);

    const result = {
      hit: true,
      damage: actualDamage,
      health: this.health,
      maxHealth: this.maxHealth,
      killed: this.health <= 0,
      killerId: this.health <= 0 ? attackerId : null,
    };

    if (result.killed) {
      this.die();
    }

    return result;
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

    this.healthBarBg.clear();
    this.healthBarBg.fillStyle(0x000000, 0.8);
    this.healthBarBg.fillRect(x, y, barWidth, barHeight);
    this.healthBarBg.lineStyle(1, 0xffffff, 0.5);
    this.healthBarBg.strokeRect(x, y, barWidth, barHeight);

    const healthPercent = this.health / this.maxHealth;
    const fillWidth = (barWidth - 2) * healthPercent;

    this.healthBarFill.clear();
    let color = 0x00ff00;
    if (healthPercent < 0.5) color = 0xffff00;
    if (healthPercent < 0.25) color = 0xff0000;

    this.healthBarFill.fillStyle(color, 1);
    this.healthBarFill.fillRect(x + 1, y + 1, fillWidth, barHeight - 2);

    this.healthText.setText(`${Math.ceil(this.health)}/${this.maxHealth}`);
    this.healthText.setPosition(this.x, y - 8);
  }

  /**
   * Show damage effect
   */
  showDamage(damage) {
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

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
    if (this.state === "idle" || this.state === "attacking" || this.state === "casting") {
      let standDirection = this.currentDirection;
      if (standDirection === "e" || standDirection === "w") {
        standDirection = "s";
      }
      this.play(`${this.spriteKey}_stand_${standDirection}`, true);
    } else {
      this.play(`${this.spriteKey}_walk_${this.currentDirection}`, true);
    }

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
   * Monster dies
   */
  die() {
    this.active = false;
    this.deathTime = Date.now();
    this.health = 0;

    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBarFill) this.healthBarFill.destroy();
    if (this.healthText) this.healthText.destroy();

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
   * Check if monster is alive
   */
  isAlive() {
    return this.active && this.health > 0;
  }

  /**
   * Get state for external systems
   */
  getState() {
    return {
      id: this.id,
      monsterType: this.monsterType,
      x: this.x,
      y: this.y,
      health: this.health,
      maxHealth: this.maxHealth,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      currentDirection: this.currentDirection,
      state: this.state,
      active: this.active,
    };
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
