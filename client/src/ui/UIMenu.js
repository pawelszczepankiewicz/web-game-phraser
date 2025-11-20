/**
 * UIMenu - Fixed UI menu with buttons
 */
export class UIMenu {
  constructor(scene) {
    this.scene = scene;
    this.container = null;
    this.buttons = {};
  }

  /**
   * Create the UI menu
   */
  create() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    // Container
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(900);
    this.container.setScrollFactor(0); // Fix to camera/screen

    // Menu background
    const menuHeight = 60;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(0, height - menuHeight, width, menuHeight);
    this.container.add(bg);

    // Button configuration
    const buttonConfigs = [
      { key: 'stats', label: 'Stats (O)', callback: () => this.scene.statsPanel.toggle() },
      { key: 'inventory', label: 'Inventory (I)', callback: () => this.scene.inventoryPanel.toggle() },
      { key: 'quests', label: 'Quests (P)', callback: () => this.scene.questPanel.toggle() },
      { key: 'logout', label: 'Logout', callback: () => this.logout() }
    ];

    const buttonWidth = 140;
    const buttonHeight = 40;
    const buttonSpacing = 10;
    const startX = width / 2 - ((buttonConfigs.length * buttonWidth + (buttonConfigs.length - 1) * buttonSpacing) / 2);
    const buttonY = height - menuHeight / 2 - buttonHeight / 2;

    // Create buttons
    buttonConfigs.forEach((config, index) => {
      const buttonX = startX + (index * (buttonWidth + buttonSpacing));
      this.createButton(buttonX, buttonY, buttonWidth, buttonHeight, config.label, config.callback);
    });
  }

  /**
   * Create a button
   */
  createButton(x, y, width, height, label, callback) {
    // Button background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x4a4a4a, 1);
    bg.fillRect(x, y, width, height);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRect(x, y, width, height);
    this.container.add(bg);

    // Button text
    const text = this.scene.add.text(x + width / 2, y + height / 2, label, {
      font: '14px Arial',
      fill: '#ffffff'
    });
    text.setOrigin(0.5);
    this.container.add(text);

    // Interactive zone
    const zone = this.scene.add.zone(x, y, width, height)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x6a6a6a, 1);
      bg.fillRect(x, y, width, height);
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRect(x, y, width, height);
    });

    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x4a4a4a, 1);
      bg.fillRect(x, y, width, height);
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRect(x, y, width, height);
    });

    zone.on('pointerdown', callback);

    this.container.add(zone);
  }

  /**
   * Logout
   */
  logout() {
    // Save character data before logout
    if (this.scene.player && this.scene.statsSystem && this.scene.inventorySystem && this.scene.questSystem) {
      const characterData = {
        name: this.scene.storage.loadCharacter().name,
        map: this.scene.mapManager.getCurrentMapKey(),
        x: this.scene.player.x,
        y: this.scene.player.y,
        stats: this.scene.statsSystem.exportStats(),
        inventory: this.scene.inventorySystem.exportInventory(),
        quests: this.scene.questSystem.exportQuests()
      };

      this.scene.storage.saveCharacter(characterData);
    }

    // Clear character data (logout)
    this.scene.storage.clearAllData();

    // Return to login scene
    this.scene.scene.start('LoginScene');
  }
}
