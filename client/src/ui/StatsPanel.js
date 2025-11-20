/**
 * StatsPanel - Display character statistics
 */
export class StatsPanel {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.container = null;
    this.texts = {};
  }

  /**
   * Create the stats panel
   */
  create() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const panelWidth = 400;
    const panelHeight = 500;
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
    const title = this.scene.add.text(width / 2, panelY + 30, 'CHARACTER STATS', {
      font: '24px Arial',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Character name
    const character = this.scene.storage.loadCharacter();
    const nameText = this.scene.add.text(width / 2, panelY + 70, character.name, {
      font: '20px Arial',
      fill: '#ffff00'
    });
    nameText.setOrigin(0.5);
    this.container.add(nameText);

    // Stats
    const statsY = panelY + 120;
    const leftX = panelX + 50;

    // Health
    this.texts.health = this.scene.add.text(leftX, statsY, '', {
      font: '18px Arial',
      fill: '#ffffff'
    });
    this.container.add(this.texts.health);

    // Attack Strength
    this.texts.attackStrength = this.scene.add.text(leftX, statsY + 40, '', {
      font: '18px Arial',
      fill: '#ffffff'
    });
    this.container.add(this.texts.attackStrength);

    // Armor
    this.texts.armor = this.scene.add.text(leftX, statsY + 80, '', {
      font: '18px Arial',
      fill: '#ffffff'
    });
    this.container.add(this.texts.armor);

    // Instructions
    const instructions = this.scene.add.text(width / 2, panelY + panelHeight - 40, 'Press O to close', {
      font: '16px Arial',
      fill: '#888888'
    });
    instructions.setOrigin(0.5);
    this.container.add(instructions);

    // Update stats
    this.updateStats();
  }

  /**
   * Update stats display
   */
  updateStats() {
    if (!this.scene.statsSystem || !this.texts.health) return;

    const stats = this.scene.statsSystem.getAllStats();

    this.texts.health.setText(`Health: ${stats.health} / ${stats.maxHealth}`);
    this.texts.attackStrength.setText(`Attack Strength: ${stats.attackStrength}`);
    this.texts.armor.setText(`Armor: ${stats.armor}`);
  }

  /**
   * Toggle visibility
   */
  toggle() {
    this.visible = !this.visible;
    if (this.container) {
      this.container.setVisible(this.visible);
      if (this.visible) {
        this.updateStats();
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
      this.updateStats();
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
