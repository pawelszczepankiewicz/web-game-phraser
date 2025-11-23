import Phaser from "phaser";

/**
 * LootBag - Clickable bag containing items dropped by monsters
 */
export class LootBag extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, items) {
    super(scene, x, y, "item_loot_bag", 0);

    // Add to scene
    scene.add.existing(this);

    // Loot bag properties
    this.items = items || []; // Array of item instances
    this.despawnTime = 60000; // 60 seconds
    this.createdAt = Date.now();
    this.isHovered = false; // Track if mouse is over the loot bag

    // Set origin to center
    this.setOrigin(0.5, 0.5);

    // Set depth for proper layering (below monsters so they're clickable first)
    this.setDepth(85); // Below monsters (90) and player (100)

    // Make interactive
    this.setInteractive({ cursor: "pointer" });

    // Create hover hint text (initially hidden)
    this.hintText = scene.add.text(0, 0, "E - Open", {
      fontSize: "14px",
      fill: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 8, y: 4 },
      stroke: "#ffd700",
      strokeThickness: 1,
    });
    this.hintText.setOrigin(0.5, 1);
    this.hintText.setDepth(1000); // Above everything
    this.hintText.setVisible(false);

    // Hover effects
    this.on("pointerover", () => {
      this.isHovered = true;
      this.setScale(1.1);
      // Check if player is in range before showing hint
      this.updateHintVisibility();
    });

    this.on("pointerout", () => {
      this.isHovered = false;
      this.setScale(1.0);
      this.hintText.setVisible(false);
    });

    // Setup 'E' key listener
    this.eKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.eKey.on("down", () => {
      if (this.isHovered) {
        this.openLootUI();
      }
    });

    // Schedule despawn
    this.despawnTimer = scene.time.delayedCall(this.despawnTime, () => {
      this.despawn();
    });

    console.log(`LootBag created with ${this.items.length} items`);
  }

  /**
   * Check if player is in range and update hint visibility
   */
  updateHintVisibility() {
    if (!this.isHovered) {
      this.hintText.setVisible(false);
      return;
    }

    const player = this.scene.player;
    if (!player) {
      this.hintText.setVisible(false);
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      this.x,
      this.y
    );

    // Show hint only if within 100px range
    if (distance <= 100) {
      this.hintText.setPosition(this.x, this.y - 40);
      this.hintText.setVisible(true);
    } else {
      this.hintText.setVisible(false);
    }
  }

  /**
   * Open loot UI to show items
   */
  openLootUI() {
    // Check distance to player
    const player = this.scene.player;
    if (!player) {
      console.warn("No player found in scene");
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      this.x,
      this.y
    );

    // Only allow opening if within 100px
    if (distance > 100) {
      console.log(
        `Too far from loot bag (${Math.round(
          distance
        )}px). Need to be within 100px.`
      );
      // Could show a message to the player here
      return;
    }

    console.log("Opening loot bag UI...");

    // Emit event for scene to handle
    this.scene.events.emit("open-loot-bag", {
      lootBag: this,
      items: this.items,
    });
  }

  /**
   * Remove an item from the loot bag
   */
  removeItem(instanceId) {
    const index = this.items.findIndex(
      (item) => item.instanceId === instanceId
    );
    if (index > -1) {
      this.items.splice(index, 1);
      console.log(
        `Item removed from loot bag. ${this.items.length} items remaining`
      );

      // If no items left, despawn immediately
      if (this.items.length === 0) {
        this.despawn();
      }
    }
  }

  /**
   * Despawn the loot bag
   */
  despawn() {
    console.log("Loot bag despawning...", {
      active: this.active,
      scene: !!this.scene,
      alpha: this.alpha,
    });

    // Prevent multiple despawn calls
    if (this.despawning) {
      console.log("Already despawning, skipping...");
      return;
    }
    this.despawning = true;

    // Hide hint text immediately
    if (this.hintText) {
      this.hintText.setVisible(false);
    }

    // Make non-interactive immediately to prevent clicks during fade
    this.disableInteractive();

    // Close loot UI if this bag is currently open
    this.scene.events.emit("close-loot-bag", this);

    // Cancel despawn timer if still active
    if (this.despawnTimer) {
      this.despawnTimer.remove();
      this.despawnTimer = null;
    }

    // Stop any existing tweens on this object
    this.scene.tweens.killTweensOf(this);

    // Fade out animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        console.log("Loot bag fade complete, destroying...");
        this.destroy();
        console.log("Loot bag destroyed");
      },
    });
  }

  /**
   * Update - check for despawn time and hint visibility
   */
  update(time, delta) {
    // Update hint visibility if player is hovering
    if (this.isHovered) {
      this.updateHintVisibility();
    }

    // Could add floating animation here
  }

  /**
   * Cleanup on destroy
   */
  destroy(fromScene) {
    if (this.despawnTimer) {
      this.despawnTimer.remove();
    }
    // Remove 'E' key listener
    if (this.eKey) {
      this.eKey.off("down");
      // Only remove key if scene still exists
      if (this.scene && this.scene.input && this.scene.input.keyboard) {
        this.scene.input.keyboard.removeKey(this.eKey);
      }
    }
    // Destroy hint text
    if (this.hintText) {
      this.hintText.destroy();
    }
    super.destroy(fromScene);
  }
}
