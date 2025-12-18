import Phaser from "phaser";
import { getItem } from "../shared/data/Items.js";

/**
 * Player entity with animations and movement
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "character_walk", 0);

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Player properties
    this.speed = 150;
    this.moving = false;
    this.currentDirection = "s";

    // Combat properties
    this.lastAttackTime = 0;
    this.attackRate = 500; // Attack every 500ms (default melee)
    this.targetMonster = null;

    // Equipped weapon info (set by InventoryManager)
    this.equippedWeaponData = null;

    // Hitbox for combat (fixed size)
    this.hitboxWidth = 25;
    this.hitboxHeight = 64;

    // Equipment sprites (rendered on top of player)
    this.equipmentSprites = {
      helmet: null,
      armor: null,
      weapon: null,
      shield: null,
      boots: null,
      amulet: null,
      ring_left: null,
      ring_right: null,
    };

    // Set origin to bottom center (feet position)
    this.setOrigin(0.5, 1);

    // Set depth for proper layering
    this.setDepth(100);

    // Collision body size (smaller than sprite for better feel)
    this.body.setSize(40, 20);
    this.body.setOffset(30, 80);

    // Create health bar
    this.createHealthBar();
  }

  /**
   * Create health bar above player
   */
  createHealthBar() {
    // Above player health bar
    this.playerHealthBarBg = this.scene.add.graphics();
    this.playerHealthBarBg.setDepth(101);

    this.playerHealthBarFill = this.scene.add.graphics();
    this.playerHealthBarFill.setDepth(102);

    this.playerHealthText = this.scene.add.text(0, 0, "", {
      fontSize: "10px",
      fill: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.playerHealthText.setDepth(103);
    this.playerHealthText.setOrigin(0.5, 0.5);

    this.updateHealthBar();
  }

  /**
   * Update health bar position and fill
   */
  updateHealthBar() {
    if (!this.playerHealthBarBg || !this.playerHealthBarFill || !this.scene.statsSystem) return;

    const stats = this.scene.statsSystem.exportStats();
    const healthPercent = stats.health / stats.maxHealth;

    // Color based on health: green -> yellow -> red
    let color = 0x00ff00;
    if (healthPercent < 0.5) color = 0xffff00;
    if (healthPercent < 0.25) color = 0xff0000;

    // Above player health bar (positioned above hitbox, not sprite)
    const playerBarWidth = 60;
    const playerBarHeight = 6;
    const playerBarX = this.x - playerBarWidth / 2;
    const playerBarY = this.y - this.hitboxHeight - 20; // 20px above hitbox top

    // Background
    this.playerHealthBarBg.clear();
    this.playerHealthBarBg.fillStyle(0x000000, 0.8);
    this.playerHealthBarBg.fillRect(playerBarX, playerBarY, playerBarWidth, playerBarHeight);
    this.playerHealthBarBg.lineStyle(1, 0xffffff, 0.5);
    this.playerHealthBarBg.strokeRect(playerBarX, playerBarY, playerBarWidth, playerBarHeight);

    // Fill
    const playerFillWidth = (playerBarWidth - 2) * healthPercent;
    this.playerHealthBarFill.clear();
    this.playerHealthBarFill.fillStyle(color, 1);
    this.playerHealthBarFill.fillRect(
      playerBarX + 1,
      playerBarY + 1,
      playerFillWidth,
      playerBarHeight - 2
    );

    // Health text above player health bar
    this.playerHealthText.setText(`${Math.ceil(stats.health)}/${stats.maxHealth}`);
    this.playerHealthText.setPosition(this.x, playerBarY - 8);
  }

  /**
   * Take damage from attack (legacy - use LocalCombatSystem for proper block handling)
   */
  takeDamage(amount, attackerStrength = amount) {
    if (!this.scene.statsSystem) return;

    const result = this.scene.statsSystem.takeDamage(amount, attackerStrength);
    this.updateHealthBar();

    if (result.blocked) {
      this.showBlockEffect();
    } else {
      this.showDamageEffect(result.damage);
    }
  }

  /**
   * Show damage effect when server tells us we took damage
   * @param {number} damage - Amount of damage taken
   */
  showDamageEffect(damage) {
    // Flash red
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.active) this.clearTint();
    });

    // Floating damage number
    const damageText = this.scene.add.text(this.x, this.y - this.hitboxHeight - 30, `-${damage}`, {
      fontSize: "16px",
      fill: "#ff0000",
      stroke: "#000000",
      strokeThickness: 3,
    });
    damageText.setOrigin(0.5, 0.5);
    damageText.setDepth(150);

    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 40,
      alpha: 0,
      duration: 1200,
      onComplete: () => damageText.destroy(),
    });

    // Update health bar
    this.updateHealthBar();
  }

  /**
   * Show block effect when attack is blocked by armor
   */
  showBlockEffect() {
    // Flash blue/white to indicate block
    this.setTint(0x88ccff);
    this.scene.time.delayedCall(150, () => {
      if (this.active) this.clearTint();
    });

    // Floating "BLOCKED" text
    const blockText = this.scene.add.text(this.x, this.y - this.hitboxHeight - 30, "BLOCKED", {
      fontSize: "14px",
      fill: "#88ccff",
      stroke: "#000000",
      strokeThickness: 3,
    });
    blockText.setOrigin(0.5, 0.5);
    blockText.setDepth(150);

    this.scene.tweens.add({
      targets: blockText,
      y: blockText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => blockText.destroy(),
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
   * Check if player has a ranged weapon equipped
   * @returns {boolean}
   */
  hasRangedWeapon() {
    return (
      this.equippedWeaponData &&
      this.equippedWeaponData.weaponType === "ranged" &&
      this.equippedWeaponData.rangedAttack
    );
  }

  /**
   * Get the attack range based on equipped weapon
   * @returns {number} Attack range in pixels
   */
  getAttackRange() {
    if (this.hasRangedWeapon()) {
      return this.equippedWeaponData.rangedAttack.range || 350;
    }
    return 100; // Default melee range
  }

  /**
   * Get the attack cooldown based on equipped weapon
   * @returns {number} Attack cooldown in ms
   */
  getAttackCooldown() {
    if (this.hasRangedWeapon()) {
      return this.equippedWeaponData.rangedAttack.cooldown || 1500;
    }
    return this.attackRate; // Default melee rate
  }

  /**
   * Set the equipped weapon data (called by InventoryManager when equipping)
   * @param {Object|null} weaponData - Weapon item data or null if unequipped
   */
  setEquippedWeapon(weaponData) {
    this.equippedWeaponData = weaponData;
  }

  /**
   * Check if monster is within attack range
   */
  canAttackMonster(monster) {
    if (!monster.getHitbox) return false;

    const playerHitbox = this.getHitbox();
    const monsterHitbox = monster.getHitbox();

    // Calculate distance between hitbox centers
    const distance = Phaser.Math.Distance.Between(
      playerHitbox.centerX,
      playerHitbox.centerY,
      monsterHitbox.centerX,
      monsterHitbox.centerY
    );

    // Use weapon-specific range
    return distance < this.getAttackRange();
  }

  /**
   * Attack a monster - Local combat for single-player
   * Damage is calculated locally through LocalCombatSystem
   */
  attackMonster(monster) {
    const now = Date.now();
    const cooldown = this.getAttackCooldown();

    if (now - this.lastAttackTime < cooldown) {
      return;
    }

    // Range check
    if (!this.canAttackMonster(monster)) {
      return;
    }

    this.lastAttackTime = now;

    // Use local combat system for single-player
    if (this.scene.localCombatSystem) {
      this.scene.localCombatSystem.handlePlayerAttack(this, monster);
    }

    // Play attack sound
    if (this.scene.soundManager) {
      const soundAction = this.hasRangedWeapon() ? "player_attack_ranged" : "player_attack_melee";
      this.scene.soundManager.play(soundAction);
    }

    // Play attack animation (visual feedback only)
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      yoyo: true,
      ease: "Power2",
    });

    // Play weapon animation (swing for melee, no swing for ranged)
    if (!this.hasRangedWeapon()) {
      this.playWeaponAttackAnimation();
    }
  }

  /**
   * Attack a position (for ranged weapons) - fires projectile toward target location
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   */
  attackPosition(targetX, targetY) {
    if (!this.hasRangedWeapon()) {
      return; // Only ranged weapons can attack positions
    }

    const now = Date.now();
    const cooldown = this.getAttackCooldown();

    if (now - this.lastAttackTime < cooldown) {
      return;
    }

    // Check if target is within range
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.getAttackRange()) {
      return; // Out of range
    }

    this.lastAttackTime = now;

    // Create projectile locally for single-player
    if (this.scene.projectileManager) {
      this.scene.projectileManager.createPlayerProjectile(this, targetX, targetY);
    }

    // Play ranged attack sound
    if (this.scene.soundManager) {
      this.scene.soundManager.play("player_attack_ranged");
    }

    // Play attack animation (visual feedback only)
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      yoyo: true,
      ease: "Power2",
    });
  }

  /**
   * Play weapon attack animation (swing)
   */
  playWeaponAttackAnimation() {
    const weaponSprite = this.equipmentSprites["weapon"];
    if (!weaponSprite) return;

    // Determine swing direction based on player facing
    // When facing right: weapon on right side, swing clockwise
    // When facing left: weapon on left side, swing counter-clockwise
    const swingAngle = this.flipX ? -90 : 90; // degrees

    // Store original rotation
    const originalRotation = weaponSprite.angle || 0;

    // Create swing animation
    this.scene.tweens.add({
      targets: weaponSprite,
      angle: originalRotation + swingAngle,
      duration: 150,
      ease: "Power2",
      yoyo: true,
      onComplete: () => {
        // Ensure weapon returns to original rotation
        weaponSprite.angle = originalRotation;
      },
    });
  }

  /**
   * Player death
   */
  die() {
    // Emit death event to GameScene
    this.scene.events.emit("player-death");
  }

  /**
   * Update player movement and animation
   */
  update(cursors) {
    if (!cursors) return;

    let velocityX = 0;
    let velocityY = 0;

    // Calculate movement based on arrow keys
    if (cursors.left.isDown) {
      velocityX = -1;
    } else if (cursors.right.isDown) {
      velocityX = 1;
    }

    if (cursors.up.isDown) {
      velocityY = -1;
    } else if (cursors.down.isDown) {
      velocityY = 1;
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= 0.707;
      velocityY *= 0.707;
    }

    // Apply velocity
    this.body.setVelocity(velocityX * this.speed, velocityY * this.speed);

    // Update animation based on movement
    this.updateAnimation(velocityX, velocityY);

    // Update equipment sprites position
    this.updateEquipmentPosition();
  }

  /**
   * Update animation based on movement
   */
  updateAnimation(velocityX, velocityY) {
    if (velocityX === 0 && velocityY === 0) {
      // Standing still - play idle
      if (this.moving) {
        this.moving = false;
        this.play("idle");
      }
      return;
    }

    // Moving - play walk animation
    if (!this.moving) {
      this.moving = true;
      this.play("walk", true);
    }

    // Flip sprite based on horizontal direction
    if (velocityX < 0) {
      this.setFlipX(true);
    } else if (velocityX > 0) {
      this.setFlipX(false);
    }
  }

  /**
   * Equip item sprite
   * @param {string} slot - Equipment slot (helmet, armor, boots, weapon, shield)
   * @param {string|null} animatedSprite - 300x300 3x3 grid sprite key for animated wearables (helmet, armor, boots)
   * @param {string|null} staticWearableSprite - Static sprite path/key for weapons and shields
   */
  equipItem(slot, animatedSprite = null, staticWearableSprite = null) {
    // Remove existing sprite if any
    if (this.equipmentSprites[slot]) {
      this.equipmentSprites[slot].destroy();
      this.equipmentSprites[slot] = null;
    }

    // Create new sprite if provided
    if (animatedSprite || staticWearableSprite) {
      let sprite;

      // For shields and weapons, use static sprite positioned on sides
      if ((slot === "shield" || slot === "weapon") && staticWearableSprite) {
        // Support both string path and object with path/scale
        const isObject = typeof staticWearableSprite === "object" && staticWearableSprite !== null;
        const spritePath = isObject ? staticWearableSprite.path : staticWearableSprite;
        const spriteScale = isObject ? (staticWearableSprite.scale ?? 1.0) : 1.0;

        // Load from staticWearableSprite path if it starts with /
        const texturePath = spritePath.startsWith("/") ? spritePath : animatedSprite;

        // Generate unique texture key from the path
        const textureKey = texturePath.replace(/[^a-zA-Z0-9]/g, "_");

        if (!this.scene.textures.exists(textureKey)) {
          // Load the texture dynamically if not already loaded
          this.scene.load.image(textureKey, texturePath);
          this.scene.load.once("complete", () => {
            if (this.scene && this.scene.textures.exists(textureKey)) {
              const sprite = this.scene.add.image(this.x, this.y, textureKey);
              sprite.setOrigin(0.5, 0.5);
              sprite.setDepth(this.depth + 1);
              sprite.setScale(spriteScale);
              sprite.isStatic = true; // Mark as static
              sprite.slot = slot; // Store slot info for positioning
              this.equipmentSprites[slot] = sprite;
              this.updateEquipmentPosition();
            }
          });
          this.scene.load.start();
        } else {
          sprite = this.scene.add.image(this.x, this.y, textureKey);
          sprite.setOrigin(0.5, 0.5);
          sprite.setDepth(this.depth + 1);
          sprite.setScale(spriteScale);
          sprite.isStatic = true; // Mark as static
          sprite.slot = slot; // Store slot info for positioning
          this.equipmentSprites[slot] = sprite;
        }
      } else if (animatedSprite) {
        // For other equipment (armor, helmet, boots), use animated sprites
        sprite = this.scene.add.sprite(this.x, this.y, animatedSprite, 0);
        sprite.setOrigin(0.5, 1);
        sprite.setDepth(this.depth + 1);
        this.equipmentSprites[slot] = sprite;

        // Sync animation with player
        this.syncEquipmentAnimation(sprite);
      }
    }
  }

  /**
   * Sync equipment sprite animation with player
   */
  syncEquipmentAnimation(sprite) {
    if (!sprite) return;

    // Copy current flip state
    sprite.setFlipX(this.flipX);

    if (this.anims.currentAnim) {
      const playerAnimKey = this.anims.currentAnim.key;

      // Get equipment sprite texture key
      const textureKey = sprite.texture.key;

      // Construct equipment-specific animation key
      const equipmentAnimKey = `${textureKey}_${playerAnimKey}`;

      // Check if animation exists in global animation manager
      const globalAnimExists = this.scene.anims.exists(equipmentAnimKey);

      if (globalAnimExists) {
        // Check if we need to change animation
        if (!sprite.anims.currentAnim || sprite.anims.currentAnim.key !== equipmentAnimKey) {
          sprite.play(equipmentAnimKey);
        }

        // Sync the current frame progress with player's animation
        if (sprite.anims.currentAnim && sprite.anims.isPlaying && this.anims.isPlaying) {
          const playerProgress = this.anims.getProgress();
          sprite.anims.setProgress(playerProgress);
        }
      }
    }
  }

  /**
   * Update equipment sprites position to match player
   */
  updateEquipmentPosition() {
    Object.values(this.equipmentSprites).forEach((sprite) => {
      if (sprite) {
        if (sprite.isStatic) {
          // Static equipment (shields and weapons) - position on sides
          const slot = sprite.slot;
          const offsetX = 20; // Distance from player center
          const offsetY = -30; // Height offset (above player's feet)

          // When facing right: weapon on right, shield on left
          // When facing left (flipX): weapon on left, shield on right
          if (slot === "shield") {
            if (this.flipX) {
              // Facing left: shield on right side
              sprite.setPosition(this.x + offsetX, this.y + offsetY);
            } else {
              // Facing right: shield on left side
              sprite.setPosition(this.x - offsetX, this.y + offsetY);
            }
          } else if (slot === "weapon") {
            if (this.flipX) {
              // Facing left: weapon on left side
              sprite.setPosition(this.x - offsetX, this.y + offsetY);
            } else {
              // Facing right: weapon on right side
              sprite.setPosition(this.x + offsetX, this.y + offsetY);
            }
          }

          // Copy flip state to static equipment
          sprite.setFlipX(this.flipX);
        } else {
          // Animated equipment (armor, helmet, boots) - follow player exactly
          sprite.setPosition(this.x, this.y);
          this.syncEquipmentAnimation(sprite);
        }
      }
    });
  }

  /**
   * Clean up when player is destroyed
   */
  destroy() {
    Object.values(this.equipmentSprites).forEach((sprite) => {
      if (sprite) sprite.destroy();
    });

    // Clean up health bar
    if (this.playerHealthBarBg) this.playerHealthBarBg.destroy();
    if (this.playerHealthBarFill) this.playerHealthBarFill.destroy();
    if (this.playerHealthText) this.playerHealthText.destroy();

    super.destroy();
  }
}
