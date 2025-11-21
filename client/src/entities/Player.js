import Phaser from 'phaser';

/**
 * Player entity with animations and movement
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'character_walk', 0);

    // Add to scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Player properties
    this.speed = 150;
    this.moving = false;
    this.currentDirection = 's';

    // Combat properties
    this.lastAttackTime = 0;
    this.attackRate = 500; // Attack every 500ms
    this.targetMonster = null;

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
      ring_right: null
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
    // Top-left screen health bar
    this.healthBarBg = this.scene.add.graphics();
    this.healthBarBg.setDepth(101);
    this.healthBarBg.setScrollFactor(0); // Fixed to screen

    this.healthBarFill = this.scene.add.graphics();
    this.healthBarFill.setDepth(102);
    this.healthBarFill.setScrollFactor(0); // Fixed to screen

    this.healthBarText = this.scene.add.text(0, 0, '', {
      fontSize: '14px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });
    this.healthBarText.setDepth(103);
    this.healthBarText.setScrollFactor(0);

    // Above player health bar
    this.playerHealthBarBg = this.scene.add.graphics();
    this.playerHealthBarBg.setDepth(101);

    this.playerHealthBarFill = this.scene.add.graphics();
    this.playerHealthBarFill.setDepth(102);

    this.playerHealthText = this.scene.add.text(0, 0, '', {
      fontSize: '10px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.playerHealthText.setDepth(103);
    this.playerHealthText.setOrigin(0.5, 0.5);

    this.updateHealthBar();
  }

  /**
   * Update health bar position and fill
   */
  updateHealthBar() {
    if (!this.healthBarBg || !this.healthBarFill || !this.scene.statsSystem) return;

    const stats = this.scene.statsSystem.exportStats();

    // Top-left screen health bar
    const barWidth = 200;
    const barHeight = 20;
    const x = 20;
    const y = 20;

    // Background
    this.healthBarBg.clear();
    this.healthBarBg.fillStyle(0x000000, 0.8);
    this.healthBarBg.fillRect(x, y, barWidth, barHeight);
    this.healthBarBg.lineStyle(2, 0xffffff, 0.5);
    this.healthBarBg.strokeRect(x, y, barWidth, barHeight);

    // Fill
    const healthPercent = stats.health / stats.maxHealth;
    const fillWidth = (barWidth - 4) * healthPercent;

    this.healthBarFill.clear();
    // Color based on health: green -> yellow -> red
    let color = 0x00ff00;
    if (healthPercent < 0.5) color = 0xffff00;
    if (healthPercent < 0.25) color = 0xff0000;

    this.healthBarFill.fillStyle(color, 1);
    this.healthBarFill.fillRect(x + 2, y + 2, fillWidth, barHeight - 4);

    // Health text on top-left bar
    this.healthBarText.setText(`${Math.ceil(stats.health)}/${stats.maxHealth}`);
    this.healthBarText.setPosition(x + barWidth / 2 - this.healthBarText.width / 2, y + 2);

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
    this.playerHealthBarFill.fillRect(playerBarX + 1, playerBarY + 1, playerFillWidth, playerBarHeight - 2);

    // Health text above player health bar
    this.playerHealthText.setText(`${Math.ceil(stats.health)}/${stats.maxHealth}`);
    this.playerHealthText.setPosition(this.x, playerBarY - 8);
  }

  /**
   * Take damage from attack
   */
  takeDamage(amount) {
    if (!this.scene.statsSystem) return;

    this.scene.statsSystem.takeDamage(amount);
    this.updateHealthBar();

    // Flash effect
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      this.clearTint();
    });

    // Check if player died
    const stats = this.scene.statsSystem.exportStats();
    if (stats.health <= 0) {
      this.die();
    }
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
   * Check if monster is within attack range (100px between hitboxes)
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

    return distance < 100;
  }

  /**
   * Attack a monster
   */
  attackMonster(monster) {
    const now = Date.now();
    if (now - this.lastAttackTime < this.attackRate) {
      return; // Still in cooldown
    }

    // Check if monster is in range
    if (!this.canAttackMonster(monster)) {
      console.log('Monster too far away to attack!');
      return;
    }

    this.lastAttackTime = now;

    // Get attack strength from stats
    const stats = this.scene.statsSystem.exportStats();
    const attackPower = stats.attackStrength || 1;

    console.log(`Player attacking monster with ${attackPower} damage. Monster health: ${monster.health}/${monster.maxHealth}`);

    // Deal damage to monster
    if (monster && monster.takeDamage) {
      monster.takeDamage(attackPower);
    }

    // Play attack animation (flash)
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100,
      yoyo: true,
      ease: 'Power2'
    });
  }

  /**
   * Player death
   */
  die() {
    console.log('Player died!');
    // Emit death event to GameScene
    this.scene.events.emit('player-death');
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
   * Update animation based on movement direction
   */
  updateAnimation(velocityX, velocityY) {
    if (velocityX === 0 && velocityY === 0) {
      // Standing still
      if (this.moving) {
        this.moving = false;
        if (this.currentDirection === 'n') {
          this.play('stand_n');
        } else {
          this.play('stand_s');
        }
      }
      return;
    }

    this.moving = true;

    // Determine direction and animation
    // For isometric, we need to consider the angle
    const angle = Math.atan2(velocityY, velocityX) * 180 / Math.PI;

    if (angle >= -22.5 && angle < 22.5) {
      // East
      this.currentDirection = 'e';
      this.setFlipX(false);
      this.play('walk_e', true);
    } else if (angle >= 22.5 && angle < 67.5) {
      // South-East
      this.currentDirection = 's';
      this.setFlipX(false);
      this.play('walk_s', true);
    } else if (angle >= 67.5 && angle < 112.5) {
      // South
      this.currentDirection = 's';
      this.setFlipX(false);
      this.play('walk_s', true);
    } else if (angle >= 112.5 && angle < 157.5) {
      // South-West
      this.currentDirection = 's';
      this.setFlipX(false);
      this.play('walk_s', true);
    } else if (angle >= 157.5 || angle < -157.5) {
      // West
      this.currentDirection = 'w';
      this.setFlipX(true);
      this.play('walk_e', true);
    } else if (angle >= -157.5 && angle < -112.5) {
      // North-West
      this.currentDirection = 'n';
      this.setFlipX(false);
      this.play('walk_n', true);
    } else if (angle >= -112.5 && angle < -67.5) {
      // North
      this.currentDirection = 'n';
      this.setFlipX(false);
      this.play('walk_n', true);
    } else if (angle >= -67.5 && angle < -22.5) {
      // North-East
      this.currentDirection = 'n';
      this.setFlipX(false);
      this.play('walk_n', true);
    }
  }

  /**
   * Equip item sprite
   */
  equipItem(slot, spriteKey, iconSprite = null) {
    // Remove existing sprite if any
    if (this.equipmentSprites[slot]) {
      this.equipmentSprites[slot].destroy();
      this.equipmentSprites[slot] = null;
    }

    // Create new sprite if spriteKey provided
    if (spriteKey || iconSprite) {
      let sprite;

      // For shields and weapons, use static icon image positioned on sides
      if ((slot === 'shield' || slot === 'weapon') && iconSprite) {
        // Load from iconSprite path if it starts with /
        const texturePath = iconSprite.startsWith('/') ? iconSprite : spriteKey;

        // Try to get or load the texture
        let textureKey = `${slot}_icon`;
        if (!this.scene.textures.exists(textureKey)) {
          // Load the texture dynamically if not already loaded
          this.scene.load.image(textureKey, texturePath);
          this.scene.load.once('complete', () => {
            if (this.scene && this.scene.textures.exists(textureKey)) {
              const sprite = this.scene.add.image(this.x, this.y, textureKey);
              sprite.setOrigin(0.5, 0.5);
              sprite.setDepth(this.depth + 1);
              sprite.setScale(1.0); // Original icon size
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
          sprite.setScale(1.0); // Original icon size
          sprite.isStatic = true; // Mark as static
          sprite.slot = slot; // Store slot info for positioning
          this.equipmentSprites[slot] = sprite;
        }
      } else {
        // For other equipment (armor, helmet, boots), use animated sprites
        sprite = this.scene.add.sprite(this.x, this.y, spriteKey, 0);
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
      } else {
        // Debug: show what animations ARE available
        const allAnims = Object.keys(this.scene.anims.anims.entries);
        const matchingAnims = allAnims.filter(k => k.includes(textureKey));
        console.warn(`Equipment animation "${equipmentAnimKey}" does not exist for sprite "${textureKey}"`);
        console.warn(`Available animations for ${textureKey}:`, matchingAnims);
      }
    }
  }

  /**
   * Update equipment sprites position to match player
   */
  updateEquipmentPosition() {
    Object.values(this.equipmentSprites).forEach(sprite => {
      if (sprite) {
        if (sprite.isStatic) {
          // Static equipment (shields and weapons) - position on sides
          const slot = sprite.slot;
          const offsetX = 20; // Distance from player center
          const offsetY = -30; // Height offset (above player's feet)

          // When facing right: weapon on right, shield on left
          // When facing left (flipX): weapon on left, shield on right
          if (slot === 'shield') {
            if (this.flipX) {
              // Facing left: shield on right side
              sprite.setPosition(this.x + offsetX, this.y + offsetY);
            } else {
              // Facing right: shield on left side
              sprite.setPosition(this.x - offsetX, this.y + offsetY);
            }
          } else if (slot === 'weapon') {
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
    Object.values(this.equipmentSprites).forEach(sprite => {
      if (sprite) sprite.destroy();
    });

    // Clean up health bars and text
    if (this.healthBarBg) this.healthBarBg.destroy();
    if (this.healthBarFill) this.healthBarFill.destroy();
    if (this.healthBarText) this.healthBarText.destroy();
    if (this.playerHealthBarBg) this.playerHealthBarBg.destroy();
    if (this.playerHealthBarFill) this.playerHealthBarFill.destroy();
    if (this.playerHealthText) this.playerHealthText.destroy();

    super.destroy();
  }
}
