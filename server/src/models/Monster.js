import { distance, isInRange, getRandomPointInPolygon } from "../../../shared/utils/geometry.js";
import { generateUniqueId } from "../../../shared/utils/random.js";
import { ATTACK_RANGE } from "../../../shared/constants.js";

/**
 * Server-side Monster model
 * Handles monster state, AI, and combat (melee and ranged)
 */
export class Monster {
  constructor(spawnData, spawnPoint) {
    // Unique ID for this monster instance
    this.id = generateUniqueId("monster");

    // Position
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.spawnPoint = { ...spawnPoint };

    // Monster type and properties from spawn data
    this.monsterType = spawnData.monsterType;
    this.map = spawnData.map;

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
    this.currentPatternIndex = 0; // For cycling through multiple attack patterns

    // Patrol configuration
    this.patrol = spawnData.patrol !== undefined ? spawnData.patrol : true;
    this.patrolArea = spawnData.polygon || null;

    // Spawn data reference for respawning
    this.spawnDataId = spawnData.id;

    // AI state
    this.state = "idle"; // idle, patrolling, chasing, attacking, casting
    this.targetPlayerId = null;
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
    this.active = true;
    this.deathTime = null;
  }

  /**
   * Check if monster has ranged attack capability
   */
  hasRangedAttack() {
    return this.rangedAttack && this.rangedAttack.enabled;
  }

  /**
   * Get the current attack pattern (for monsters with multiple patterns)
   * @returns {Object|null} Current pattern config or null
   */
  getCurrentPattern() {
    if (!this.hasRangedAttack()) return null;

    // Support both old single-pattern and new multi-pattern config
    if (this.rangedAttack.patterns && this.rangedAttack.patterns.length > 0) {
      return this.rangedAttack.patterns[this.currentPatternIndex];
    }

    // Legacy single-pattern support
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
   * @param {number} distanceToTarget - Distance to target in pixels
   * @returns {boolean}
   */
  shouldUseRangedAttack(distanceToTarget) {
    if (!this.hasRangedAttack()) return false;

    const meleeRange = this.rangedAttack.meleeRange || ATTACK_RANGE;
    const rangedRange = this.rangedAttack.range || 300;

    // Use ranged if target is beyond melee range but within ranged range
    return distanceToTarget > meleeRange && distanceToTarget <= rangedRange;
  }

  /**
   * Check if ranged attack is off cooldown
   */
  canRangedAttack() {
    if (!this.hasRangedAttack()) return false;

    const now = Date.now();
    const currentPattern = this.getCurrentPattern();
    const cooldown = currentPattern ? currentPattern.cooldown : 3000;
    return now - this.lastRangedAttackTime >= cooldown;
  }

  /**
   * Update monster AI (called every server tick)
   * @param {number} deltaTime - Time since last update in seconds
   * @param {Map} playersOnMap - Map of players on this map
   * @returns {Object|null} - Attack result if monster attacked, null otherwise
   */
  update(deltaTime, playersOnMap) {
    if (!this.active) return null;

    let attackResult = null;

    // Find closest player in range (consider both melee and ranged range)
    let closestPlayer = null;
    let closestDistance = Infinity;

    // Determine max aggro range (ranged range if available, else attackRadius)
    const maxAggroRange = this.hasRangedAttack()
      ? Math.max(this.attackRadius, this.rangedAttack.range)
      : this.attackRadius;

    for (const player of playersOnMap.values()) {
      if (!player.isAlive()) continue;

      const dist = distance(this.x, this.y, player.x, player.y);
      if (dist <= maxAggroRange && dist < closestDistance) {
        closestDistance = dist;
        closestPlayer = player;
      }
    }

    if (closestPlayer) {
      // Player in aggro range
      this.targetPlayerId = closestPlayer.userId;

      // Track when player first entered range
      if (this.enteredRangeTime === null) {
        this.enteredRangeTime = Date.now();
      }

      // Determine attack type based on distance
      const shouldRanged = this.shouldUseRangedAttack(closestDistance);
      const meleeRange = this.hasRangedAttack()
        ? this.rangedAttack.meleeRange || ATTACK_RANGE
        : ATTACK_RANGE;

      if (shouldRanged && this.canRangedAttack()) {
        // In ranged attack range - stop and cast
        this.state = "casting";
        this.velocityX = 0;
        this.velocityY = 0;

        // Face the target
        this.updateDirection(closestPlayer.x - this.x, closestPlayer.y - this.y);

        attackResult = this.tryRangedAttack(closestPlayer);
      } else if (closestDistance > meleeRange) {
        // Move towards player to get in melee range
        this.state = "chasing";
        this.moveTowards(closestPlayer.x, closestPlayer.y, deltaTime);
      } else {
        // In melee attack range, try to attack
        this.state = "attacking";
        this.velocityX = 0;
        this.velocityY = 0;

        attackResult = this.tryAttack(closestPlayer);
      }
    } else {
      // No player in range, reset combat state
      if (this.targetPlayerId !== null) {
        this.enteredRangeTime = null;
        this.hasAttackedOnce = false;
        this.targetPlayerId = null;
      }

      // Patrol behavior
      if (this.patrol && this.patrolArea) {
        this.updatePatrol(deltaTime);
      } else {
        this.state = "idle";
        this.velocityX = 0;
        this.velocityY = 0;
      }
    }

    return attackResult;
  }

  /**
   * Move towards a target position
   */
  moveTowards(targetX, targetY, deltaTime) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      // Normalize and apply speed
      const moveX = (dx / dist) * this.speed * deltaTime;
      const moveY = (dy / dist) * this.speed * deltaTime;

      this.x += moveX;
      this.y += moveY;
      this.velocityX = (dx / dist) * this.speed;
      this.velocityY = (dy / dist) * this.speed;

      // Update direction for animation
      this.updateDirection(dx, dy);
    }
  }

  /**
   * Update patrol behavior
   */
  updatePatrol(deltaTime) {
    // Wait at patrol point
    if (this.patrolWaitTime > 0) {
      this.patrolWaitTime -= deltaTime * 1000; // Convert to ms
      this.state = "idle";
      this.velocityX = 0;
      this.velocityY = 0;
      return;
    }

    // Get new patrol target if needed
    if (!this.patrolTarget) {
      this.patrolTarget = getRandomPointInPolygon(this.patrolArea);
      if (!this.patrolTarget) {
        this.patrolTarget = this.spawnPoint;
      }
    }

    // Check if reached patrol target
    const distToTarget = distance(this.x, this.y, this.patrolTarget.x, this.patrolTarget.y);
    if (distToTarget < 10) {
      // Reached target, wait and pick new target
      this.patrolWaitTime = 1000 + Math.random() * 2000; // 1-3 seconds
      this.patrolTarget = null;
      this.state = "idle";
      this.velocityX = 0;
      this.velocityY = 0;
    } else {
      // Move towards patrol target (slower than chasing)
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
   * Try to attack a player
   * @returns {Object|null} Attack result with damage info
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

    // Calculate damage (will be applied by server)
    return {
      type: "melee",
      targetUserId: player.userId,
      damage: this.attackStrength,
      monsterId: this.id,
    };
  }

  /**
   * Try ranged attack on a player
   * @param {Object} player - Target player
   * @returns {Object|null} Ranged attack result with projectile info
   */
  tryRangedAttack(player) {
    if (!this.hasRangedAttack()) return null;

    const now = Date.now();

    // Check first attack delay
    if (!this.hasAttackedOnce && this.enteredRangeTime !== null) {
      const timeSinceEntered = now - this.enteredRangeTime;
      if (timeSinceEntered < this.firstAttackDelay) {
        return null;
      }
    }

    // Check ranged attack cooldown
    if (!this.canRangedAttack()) {
      return null;
    }

    // Get the current attack pattern
    const currentPattern = this.getCurrentPattern();

    // Fire ranged attack!
    this.lastRangedAttackTime = now;
    this.hasAttackedOnce = true;

    // Build ranged config by merging base config with current pattern
    const rangedConfig = {
      ...this.rangedAttack,
      damage: currentPattern.damage,
      pattern: currentPattern.pattern,
      projectileCount: currentPattern.projectileCount,
      spreadAngle: currentPattern.spreadAngle,
    };

    // Advance to next pattern for the next attack
    this.nextPattern();

    // Return ranged attack info - GameStateManager will create projectiles
    return {
      type: "ranged",
      monsterId: this.id,
      targetUserId: player.userId,
      targetX: player.x,
      targetY: player.y,
      rangedConfig: rangedConfig,
      monster: this, // Reference for projectile creation
    };
  }

  /**
   * Take damage from a player attack
   * @param {number} damage - Raw damage amount
   * @param {string} attackerId - ID of the player who attacked
   * @returns {Object} Result of taking damage
   */
  takeDamage(damage, attackerId) {
    if (!this.active) {
      return { hit: false, reason: "monster_inactive" };
    }

    // Apply damage (monsters don't have armor in this system)
    const actualDamage = Math.max(1, damage);
    this.health = Math.max(0, this.health - actualDamage);

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
   * Monster dies
   */
  die() {
    this.active = false;
    this.deathTime = Date.now();
    this.health = 0;
  }

  /**
   * Check if monster is alive
   */
  isAlive() {
    return this.active && this.health > 0;
  }

  /**
   * Get hitbox for combat calculations
   */
  getHitbox() {
    return {
      x: this.x - this.hitboxWidth / 2,
      y: this.y - this.hitboxHeight,
      width: this.hitboxWidth,
      height: this.hitboxHeight,
      centerX: this.x,
      centerY: this.y - this.hitboxHeight / 2,
    };
  }

  /**
   * Get state for broadcasting to clients
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
}
