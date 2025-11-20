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

    // Equipment sprites (rendered on top of player)
    this.equipmentSprites = {
      helmet: null,
      armor: null,
      weapon: null,
      shield: null
    };

    // Set origin to bottom center (feet position)
    this.setOrigin(0.5, 1);

    // Set depth for proper layering
    this.setDepth(100);

    // Collision body size (smaller than sprite for better feel)
    this.body.setSize(40, 20);
    this.body.setOffset(30, 80);
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
  equipItem(slot, spriteKey) {
    // Remove existing sprite if any
    if (this.equipmentSprites[slot]) {
      this.equipmentSprites[slot].destroy();
      this.equipmentSprites[slot] = null;
    }

    // Create new sprite if spriteKey provided
    if (spriteKey) {
      const sprite = this.scene.add.sprite(this.x, this.y, spriteKey, 0);
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(this.depth + 1);
      this.equipmentSprites[slot] = sprite;

      // Sync animation with player
      this.syncEquipmentAnimation(sprite);
    }
  }

  /**
   * Sync equipment sprite animation with player
   */
  syncEquipmentAnimation(sprite) {
    if (!sprite) return;

    // Copy current animation state
    sprite.setFlipX(this.flipX);

    if (this.anims.currentAnim) {
      const animKey = this.anims.currentAnim.key;
      if (sprite.anims.exists(animKey)) {
        sprite.play(animKey, true);
      }
    }
  }

  /**
   * Update equipment sprites position to match player
   */
  updateEquipmentPosition() {
    Object.values(this.equipmentSprites).forEach(sprite => {
      if (sprite) {
        sprite.setPosition(this.x, this.y);
        this.syncEquipmentAnimation(sprite);
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
    super.destroy();
  }
}
