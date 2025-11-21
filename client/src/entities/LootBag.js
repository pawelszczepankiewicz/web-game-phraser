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

    // Set origin to center
    this.setOrigin(0.5, 0.5);

    // Set depth for proper layering
    this.setDepth(95); // Below player (100) but above ground

    // Make interactive
    this.setInteractive({ cursor: "pointer" });

    // Click handler
    this.on("pointerdown", () => {
      this.openLootUI();
    });

    // Hover effects
    this.on("pointerover", () => {
      this.setScale(1.1);
    });

    this.on("pointerout", () => {
      this.setScale(1.0);
    });

    // Schedule despawn
    this.despawnTimer = scene.time.delayedCall(this.despawnTime, () => {
      this.despawn();
    });

    console.log(`LootBag created with ${this.items.length} items`);
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
      console.log(`Too far from loot bag (${Math.round(distance)}px). Need to be within 100px.`);
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
    console.log("Loot bag despawning...");

    // Cancel despawn timer if still active
    if (this.despawnTimer) {
      this.despawnTimer.remove();
    }

    // Fade out animation
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
   * Update - check for despawn time
   */
  update(time, delta) {
    // Could add floating animation here
  }

  /**
   * Cleanup on destroy
   */
  destroy(fromScene) {
    if (this.despawnTimer) {
      this.despawnTimer.remove();
    }
    super.destroy(fromScene);
  }
}
