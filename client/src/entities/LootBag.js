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
    this.serverId = null; // Server ID for multiplayer sync
    this.isServerManaged = false; // If true, server handles despawn

    console.log("💼 LootBag created at", x, y, "with", this.items.length, "items:", this.items.map(i => i.name));

    // Set origin to center
    this.setOrigin(0.5, 0.5);

    // Set depth for proper layering (below monsters so they're clickable first)
    this.setDepth(85); // Below monsters (90) and player (100)

    // Make interactive
    this.setInteractive({ cursor: "pointer" });

    // Create hover hint text (initially hidden)
    this.hintText = scene.add.text(0, 0, "Ctrl + Click to Open", {
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

    // Ctrl+Click to open (prevents accidental opening during combat)
    this.on("pointerdown", (pointer) => {
      // Only open if Ctrl key is pressed
      if (pointer.event.ctrlKey || pointer.event.metaKey) {
        this.openLootUI();
      }
    });

    // Schedule despawn (only for client-managed loot bags)
    this.despawnTimer = null;
    if (!this.isServerManaged) {
      this.despawnTimer = scene.time.delayedCall(this.despawnTime, () => {
        this.despawn();
      });
    }
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

    const distance = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);

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
    // Prevent opening if already despawning
    if (this.despawning) {
      console.log("⚠️ Cannot open loot bag - already despawning");
      return;
    }

    // Prevent opening if no items
    if (this.items.length === 0) {
      console.log("⚠️ Cannot open loot bag - no items!");
      return;
    }

    // Check distance to player
    const player = this.scene.player;
    if (!player) {
      console.warn("No player found in scene");
      return;
    }

    const distance = Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y);

    // Only allow opening if within 100px
    if (distance > 100) {
      // Could show a message to the player here
      return;
    }

    console.log("📦 Opening loot bag with", this.items.length, "items:", this.items.map(i => i.name));
    console.log("📦 LootBag ID:", this.id, "ServerID:", this.serverId);

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
    console.log("🗑️ Removing item", instanceId, "from loot bag. Current items:", this.items.length);
    const index = this.items.findIndex((item) => item.instanceId === instanceId);
    if (index > -1) {
      const removedItem = this.items[index];
      this.items.splice(index, 1);
      console.log("✅ Removed", removedItem.name, "- Items remaining:", this.items.length);

      // If no items left, make non-interactive immediately and despawn
      if (this.items.length === 0) {
        console.log("💨 Loot bag is empty - despawning!");
        // Make non-interactive IMMEDIATELY to prevent re-opening
        this.disableInteractive();
        this.despawn();
      }
    } else {
      console.warn("⚠️ Item", instanceId, "not found in loot bag!");
    }
  }

  /**
   * Despawn the loot bag
   */
  despawn() {
    // Prevent multiple despawn calls
    if (this.despawning) {
      console.log("⚠️ Already despawning, ignoring duplicate call");
      return;
    }
    this.despawning = true;

    console.log("🗑️ Despawning loot bag ID:", this.id, "ServerID:", this.serverId);

    // Hide hint text immediately
    if (this.hintText) {
      this.hintText.setVisible(false);
    }

    // Make non-interactive immediately to prevent clicks during fade
    this.disableInteractive();

    // Close loot UI if this bag is currently open
    this.scene.events.emit("close-loot-bag", this);

    // Notify LootBagManager to remove this bag from tracking
    if (this.scene.lootBagManager && this.id) {
      this.scene.lootBagManager.removeLootBag(this);
    }

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
        this.destroy();
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
    // Destroy hint text
    if (this.hintText) {
      this.hintText.destroy();
    }
    // Ensure removal from manager
    if (this.scene && this.scene.lootBagManager && this.id) {
      this.scene.lootBagManager.removeLootBag(this);
    }
    super.destroy(fromScene);
  }
}
