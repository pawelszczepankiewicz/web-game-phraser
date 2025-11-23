import Phaser from 'phaser';

/**
 * RemotePlayer - Represents another player in the game world
 */
export class RemotePlayer extends Phaser.GameObjects.Sprite {
  constructor(scene, userId, playerData) {
    super(scene, playerData.x, playerData.y, 'character_walk', 0);

    this.scene = scene;
    this.userId = userId;
    this.name = playerData.name;
    this.targetX = playerData.x;
    this.targetY = playerData.y;
    this.lastDirection = 's'; // Default facing south
    this.lastEquipmentHash = null; // Track equipment changes

    // Add to scene
    scene.add.existing(this);
    this.setDepth(100); // Same depth as local player
    this.setOrigin(0.5, 1); // Bottom center origin for isometric

    // Equipment sprites (overlays)
    this.equipmentSprites = {
      helmet: null,
      armor: null,
      boots: null,
      weapon: null,
      shield: null
    };

    // Name label
    this.nameText = scene.add.text(this.x, this.y - 60, this.name, {
      fontSize: '12px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontFamily: 'Arial'
    });
    this.nameText.setOrigin(0.5, 0.5);
    this.nameText.setDepth(101);

    // Initialize equipment
    if (playerData.inventory && playerData.inventory.equipped) {
      this.updateEquipment(playerData.inventory.equipped);
    }

    // Play standing animation
    this.anims.play('stand_s', true);
  }

  /**
   * Update equipment sprites based on equipped items
   */
  updateEquipment(equipped) {
    const slots = ['helmet', 'armor', 'boots', 'weapon', 'shield'];

    slots.forEach(slot => {
      const item = equipped[slot];

      // Remove old sprite if it exists
      if (this.equipmentSprites[slot]) {
        this.equipmentSprites[slot].destroy();
        this.equipmentSprites[slot] = null;
      }

      // Create new sprite if item is equipped
      if (item) {
        // For shields and weapons, use iconSprite (static images)
        if ((slot === 'shield' || slot === 'weapon') && item.iconSprite) {
          const texturePath = item.iconSprite.startsWith('/') ? item.iconSprite : item.sprite;
          const textureKey = `${slot}_icon_${this.userId}`; // Unique key per remote player

          // Try to get or load the texture
          if (!this.scene.textures.exists(textureKey)) {
            // Load the texture dynamically if not already loaded
            this.scene.load.image(textureKey, texturePath);
            this.scene.load.once('complete', () => {
              // Only create sprite if this slot is still empty and we're not destroyed
              if (this.scene && this.scene.textures.exists(textureKey) && !this.equipmentSprites[slot]) {
                const sprite = this.scene.add.image(this.x, this.y, textureKey);
                sprite.setOrigin(0.5, 0.5);
                sprite.setDepth(this.depth + 1);
                sprite.setScale(1.0);
                sprite.isStatic = true;
                sprite.slot = slot;
                this.equipmentSprites[slot] = sprite;
                // Update position immediately
                this.updateEquipmentPosition();
              }
            });
            this.scene.load.start();
          } else {
            const sprite = this.scene.add.image(this.x, this.y, textureKey);
            sprite.setOrigin(0.5, 0.5);
            sprite.setDepth(this.depth + 1);
            sprite.setScale(1.0);
            sprite.isStatic = true;
            sprite.slot = slot;
            this.equipmentSprites[slot] = sprite;
          }
        }
        // For other equipment (helmet, armor, boots), use animated sprites
        else if (item.sprite) {
          const spriteKey = item.sprite; // Use item.sprite (e.g., 'equipment_helmet_leather')
          const isAnimated = item.spriteType === 'animated' || item.animated;

          // Check if this is an animated item (has animations)
          if (isAnimated && this.scene.anims.exists(`${spriteKey}_stand_s`)) {
            const sprite = this.scene.add.sprite(this.x, this.y, spriteKey, 0);
            sprite.setOrigin(0.5, 1);
            sprite.setDepth(this.depth);
            this.equipmentSprites[slot] = sprite;

            // Sync initial animation with player
            const currentAnim = this.anims.currentAnim?.key || 'stand_s';
            const equipmentAnimKey = `${spriteKey}_${currentAnim}`;
            if (this.scene.anims.exists(equipmentAnimKey)) {
              sprite.anims.play(equipmentAnimKey, true);
            }
            sprite.setFlipX(this.flipX);
          } else if (!isAnimated) {
            // Static equipment without animations
            const sprite = this.scene.add.sprite(this.x, this.y, spriteKey, 0);
            sprite.setOrigin(0.5, 1);
            sprite.setDepth(this.depth);
            this.equipmentSprites[slot] = sprite;
          } else {
            // Animated but animations don't exist - try static fallback
            if (this.scene.textures.exists(spriteKey)) {
              const sprite = this.scene.add.sprite(this.x, this.y, spriteKey, 0);
              sprite.setOrigin(0.5, 1);
              sprite.setDepth(this.depth);
              this.equipmentSprites[slot] = sprite;
            }
          }
        }
      }
    });
  }

  /**
   * Update player state from server
   */
  updateState(playerData) {
    // Update target position (we'll lerp to it for smooth movement)
    this.targetX = playerData.x;
    this.targetY = playerData.y;

    // Update equipment only if it changed (to prevent constant recreation)
    if (playerData.inventory && playerData.inventory.equipped) {
      const equipmentHash = JSON.stringify(playerData.inventory.equipped);
      if (equipmentHash !== this.lastEquipmentHash) {
        this.lastEquipmentHash = equipmentHash;
        this.updateEquipment(playerData.inventory.equipped);
      }
    }

    // Update animation based on velocity
    const velocityX = playerData.velocityX || 0;
    const velocityY = playerData.velocityY || 0;

    this.updateAnimation(velocityX, velocityY);
  }

  /**
   * Update animation based on movement direction
   */
  updateAnimation(velocityX, velocityY) {
    let newDirection = this.lastDirection;

    // Check if velocity values are very small (treat as standing)
    const isMoving = Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1;

    if (!isMoving) {
      // Standing still
      const standAnim = `stand_${this.lastDirection}`;
      if (this.anims.currentAnim?.key !== standAnim) {
        this.anims.play(standAnim, true);
        this.updateEquipmentAnimations(standAnim);
      }
    } else {
      // Moving - determine direction
      const angle = Math.atan2(velocityY, velocityX);
      const degrees = angle * (180 / Math.PI);

      // Map angle to 4 directions (N, S, E, W)
      if (degrees >= -45 && degrees < 45) {
        newDirection = 'e';
        this.setFlipX(false);
      } else if (degrees >= 45 && degrees < 135) {
        newDirection = 's';
        this.setFlipX(false);
      } else if (degrees >= 135 || degrees < -135) {
        newDirection = 'w';
        this.setFlipX(true);
      } else {
        newDirection = 'n';
        this.setFlipX(false);
      }

      this.lastDirection = newDirection;

      // Play walk animation (handling E/W flip)
      const walkAnim = newDirection === 'w' ? 'walk_e' : `walk_${newDirection}`;
      if (this.anims.currentAnim?.key !== walkAnim) {
        this.anims.play(walkAnim, true);
      }

      this.updateEquipmentAnimations(walkAnim);
    }
  }

  /**
   * Update equipment sprite animations
   */
  updateEquipmentAnimations(baseAnim) {
    Object.entries(this.equipmentSprites).forEach(([slot, sprite]) => {
      if (!sprite) return;

      // Skip animation for static equipment (weapons, shields)
      if (sprite.isStatic) {
        // Just match flip state, no animation
        sprite.setFlipX(this.flipX);
        return;
      }

      const equipmentAnim = `${sprite.texture.key}_${baseAnim}`;

      // Only animate if this sprite has animations and has anims property (is a Sprite, not Image)
      if (sprite.anims && this.scene.anims.exists(equipmentAnim)) {
        // Check if already playing this animation
        if (sprite.anims.currentAnim?.key !== equipmentAnim) {
          sprite.anims.play(equipmentAnim, true);
        }
      }

      // Match flip state for all equipment
      sprite.setFlipX(this.flipX);
    });
  }

  /**
   * Update equipment sprite positions
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
        }
        sprite.setDepth(this.depth);
      }
    });
  }

  /**
   * Update - called each frame
   */
  update() {
    // Smooth interpolation to target position
    const lerpFactor = 0.3; // Adjust for smoothness (0-1)
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;

    // Only move if far enough from target
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      this.x += dx * lerpFactor;
      this.y += dy * lerpFactor;
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
    }

    // Update equipment and name label positions
    this.updateEquipmentPosition();
    this.nameText.x = this.x;
    this.nameText.y = this.y - 60;
  }

  /**
   * Destroy this remote player
   */
  destroy() {
    // Destroy equipment sprites
    Object.values(this.equipmentSprites).forEach(sprite => {
      if (sprite) sprite.destroy();
    });

    // Destroy name label
    if (this.nameText) {
      this.nameText.destroy();
    }

    // Destroy self
    super.destroy();
  }
}
