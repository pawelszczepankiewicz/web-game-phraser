/**
 * InventoryPanel - Display inventory and equipment
 */
export class InventoryPanel {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.container = null;
    this.backpackSlots = [];
    this.equipmentSlots = {};
  }

  /**
   * Create the inventory panel
   */
  create() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const panelWidth = 700;
    const panelHeight = 600;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = height / 2 - panelHeight / 2;

    // Container
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(1000);
    this.container.setScrollFactor(0); // Fix to camera/screen
    this.container.setVisible(false);

    // Background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRect(panelX, panelY, panelWidth, panelHeight);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRect(panelX, panelY, panelWidth, panelHeight);
    this.container.add(bg);

    // Title
    const title = this.scene.add.text(width / 2, panelY + 30, "INVENTORY", {
      font: "24px Arial",
      fill: "#ffffff",
      fontStyle: "bold",
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Equipment section
    this.createEquipmentSection(panelX, panelY);

    // Backpack section
    this.createBackpackSection(panelX, panelY);

    // Instructions
    const instructions = this.scene.add.text(
      width / 2,
      panelY + panelHeight - 40,
      "Click items to equip/unequip | Press I to close",
      {
        font: "14px Arial",
        fill: "#888888",
      }
    );
    instructions.setOrigin(0.5);
    this.container.add(instructions);

    // Update display
    this.updateDisplay();
  }

  /**
   * Create equipment section
   */
  createEquipmentSection(panelX, panelY) {
    const equipX = panelX + 50;
    const equipY = panelY + 80;

    const sectionTitle = this.scene.add.text(equipX, equipY, "EQUIPPED", {
      font: "18px Arial",
      fill: "#ffff00",
      fontStyle: "bold",
    });
    this.container.add(sectionTitle);

    const slots = ["helmet", "armor", "weapon", "shield"];
    const slotSize = 60;
    const spacing = 10;

    slots.forEach((slot, index) => {
      const slotX = equipX;
      const slotY = equipY + 40 + index * (slotSize + spacing);

      // Slot background
      const slotBg = this.scene.add.graphics();
      slotBg.fillStyle(0x333333, 1);
      slotBg.fillRect(slotX, slotY, slotSize, slotSize);
      slotBg.lineStyle(2, 0x666666, 1);
      slotBg.strokeRect(slotX, slotY, slotSize, slotSize);
      this.container.add(slotBg);

      // Slot label
      const label = this.scene.add.text(
        slotX + slotSize + 10,
        slotY + slotSize / 2,
        slot.toUpperCase(),
        {
          font: "14px Arial",
          fill: "#ffffff",
        }
      );
      label.setOrigin(0, 0.5);
      this.container.add(label);

      // Item text
      const itemText = this.scene.add.text(
        slotX + slotSize / 2,
        slotY + slotSize / 2,
        "",
        {
          font: "10px Arial",
          fill: "#ffffff",
        }
      );
      itemText.setOrigin(0.5);
      this.container.add(itemText);

      // Interactive zone
      const zone = this.scene.add
        .zone(slotX, slotY, slotSize, slotSize)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });

      zone.on("pointerdown", () => {
        this.onEquipmentSlotClick(slot);
      });

      this.equipmentSlots[slot] = {
        bg: slotBg,
        text: itemText,
        zone: zone,
      };
    });
  }

  /**
   * Create backpack section
   */
  createBackpackSection(panelX, panelY) {
    const backpackX = panelX + 300;
    const backpackY = panelY + 80;

    const sectionTitle = this.scene.add.text(
      backpackX,
      backpackY,
      "BACKPACK (40 slots)",
      {
        font: "18px Arial",
        fill: "#ffff00",
        fontStyle: "bold",
      }
    );
    this.container.add(sectionTitle);

    const slotSize = 50;
    const spacing = 5;
    const cols = 8;
    const rows = 5;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        const slotX = backpackX + col * (slotSize + spacing);
        const slotY = backpackY + 40 + row * (slotSize + spacing);

        // Slot background
        const slotBg = this.scene.add.graphics();
        slotBg.fillStyle(0x333333, 1);
        slotBg.fillRect(slotX, slotY, slotSize, slotSize);
        slotBg.lineStyle(2, 0x666666, 1);
        slotBg.strokeRect(slotX, slotY, slotSize, slotSize);
        this.container.add(slotBg);

        // Item text
        const itemText = this.scene.add.text(
          slotX + slotSize / 2,
          slotY + slotSize / 2,
          "",
          {
            font: "10px Arial",
            fill: "#ffffff",
            wordWrap: { width: slotSize - 10 },
          }
        );
        itemText.setOrigin(0.5);
        this.container.add(itemText);

        // Interactive zone
        const zone = this.scene.add
          .zone(slotX, slotY, slotSize, slotSize)
          .setOrigin(0)
          .setInteractive({ useHandCursor: true });

        zone.on("pointerdown", () => {
          this.onBackpackSlotClick(index);
        });

        this.backpackSlots.push({
          bg: slotBg,
          text: itemText,
          zone: zone,
        });
      }
    }
  }

  /**
   * Handle equipment slot click
   */
  onEquipmentSlotClick(slot) {
    if (!this.scene.inventorySystem) return;

    const equipped = this.scene.inventorySystem.getEquipped();
    if (equipped[slot]) {
      // Unequip item
      this.scene.inventorySystem.unequipItem(slot);
      this.updateDisplay();
    }
  }

  /**
   * Handle backpack slot click
   */
  onBackpackSlotClick(index) {
    if (!this.scene.inventorySystem) return;

    const backpack = this.scene.inventorySystem.getBackpack();
    if (backpack[index]) {
      // Equip item if wearable
      const item = backpack[index];
      if (item.wearable) {
        this.scene.inventorySystem.equipItem(item.instanceId);
        this.updateDisplay();
      }
    }
  }

  /**
   * Update display
   */
  updateDisplay() {
    if (!this.scene.inventorySystem) return;

    // Update equipment slots
    const equipped = this.scene.inventorySystem.getEquipped();
    Object.keys(this.equipmentSlots).forEach((slot) => {
      const item = equipped[slot];
      const slotUI = this.equipmentSlots[slot];

      if (item) {
        slotUI.text.setText(item.name.substring(0, 10));
      } else {
        slotUI.text.setText("");
      }
    });

    // Update backpack slots
    const backpack = this.scene.inventorySystem.getBackpack();
    this.backpackSlots.forEach((slot, index) => {
      const item = backpack[index];

      if (item) {
        let text = item.name.substring(0, 8);
        if (item.stackable) {
          text += `\nx${item.quantity}`;
        }
        slot.text.setText(text);
      } else {
        slot.text.setText("");
      }
    });
  }

  /**
   * Toggle visibility
   */
  toggle() {
    this.visible = !this.visible;
    if (this.container) {
      this.container.setVisible(this.visible);
      if (this.visible) {
        this.updateDisplay();
      }
    }
  }

  /**
   * Show panel
   */
  show() {
    this.visible = true;
    if (this.container) {
      this.container.setVisible(true);
      this.updateDisplay();
    }
  }

  /**
   * Hide panel
   */
  hide() {
    this.visible = false;
    if (this.container) {
      this.container.setVisible(false);
    }
  }

  /**
   * Check if visible
   */
  isVisible() {
    return this.visible;
  }
}
