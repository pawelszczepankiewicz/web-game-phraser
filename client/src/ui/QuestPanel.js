/**
 * QuestPanel - Display active and completed quests
 */
export class QuestPanel {
  constructor(scene) {
    this.scene = scene;
    this.visible = false;
    this.container = null;
    this.questTexts = [];
  }

  /**
   * Create the quest panel
   */
  create() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;

    const panelWidth = 600;
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
    const title = this.scene.add.text(width / 2, panelY + 30, 'QUEST LOG', {
      font: '24px Arial',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.container.add(title);

    // Active quests section
    const activeY = panelY + 80;
    const activeTitle = this.scene.add.text(panelX + 30, activeY, 'ACTIVE QUESTS', {
      font: '18px Arial',
      fill: '#ffff00',
      fontStyle: 'bold'
    });
    this.container.add(activeTitle);

    // Active quests container
    this.activeQuestsContainer = this.scene.add.container(0, 0);
    this.container.add(this.activeQuestsContainer);

    // Completed quests section
    const completedY = panelY + 280;
    const completedTitle = this.scene.add.text(panelX + 30, completedY, 'COMPLETED QUESTS', {
      font: '18px Arial',
      fill: '#00ff00',
      fontStyle: 'bold'
    });
    this.container.add(completedTitle);

    // Completed quests container
    this.completedQuestsContainer = this.scene.add.container(0, 0);
    this.container.add(this.completedQuestsContainer);

    // Instructions
    const instructions = this.scene.add.text(width / 2, panelY + panelHeight - 40, 'Press P to close', {
      font: '16px Arial',
      fill: '#888888'
    });
    instructions.setOrigin(0.5);
    this.container.add(instructions);

    // Update display
    this.updateDisplay();
  }

  /**
   * Update display
   */
  updateDisplay() {
    if (!this.scene.questSystem) return;

    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    const panelWidth = 600;
    const panelHeight = 500;
    const panelX = width / 2 - panelWidth / 2;
    const panelY = height / 2 - panelHeight / 2;

    // Clear existing quest texts
    this.activeQuestsContainer.removeAll(true);
    this.completedQuestsContainer.removeAll(true);

    // Active quests
    const activeQuests = this.scene.questSystem.getActiveQuests();
    const activeY = panelY + 120;
    const leftX = panelX + 40;

    if (activeQuests.length === 0) {
      const noQuestsText = this.scene.add.text(leftX, activeY, 'No active quests', {
        font: '14px Arial',
        fill: '#888888',
        fontStyle: 'italic'
      });
      this.activeQuestsContainer.add(noQuestsText);
    } else {
      activeQuests.forEach((quest, index) => {
        const questY = activeY + (index * 60);

        // Quest name
        const nameText = this.scene.add.text(leftX, questY, quest.name, {
          font: '16px Arial',
          fill: '#ffffff',
          fontStyle: 'bold'
        });
        this.activeQuestsContainer.add(nameText);

        // Quest description
        const descText = this.scene.add.text(leftX, questY + 20, quest.description, {
          font: '12px Arial',
          fill: '#cccccc',
          wordWrap: { width: panelWidth - 80 }
        });
        this.activeQuestsContainer.add(descText);

        // Quest objectives
        quest.objectives.forEach((objective, objIndex) => {
          const objText = this.scene.add.text(leftX + 20, questY + 35 + (objIndex * 15),
            `- ${objective.description}: ${objective.current}/${objective.required}`, {
            font: '12px Arial',
            fill: objective.current >= objective.required ? '#00ff00' : '#ffffff'
          });
          this.activeQuestsContainer.add(objText);
        });
      });
    }

    // Completed quests
    const completedQuests = this.scene.questSystem.getCompletedQuests();
    const completedY = panelY + 320;

    if (completedQuests.length === 0) {
      const noQuestsText = this.scene.add.text(leftX, completedY, 'No completed quests', {
        font: '14px Arial',
        fill: '#888888',
        fontStyle: 'italic'
      });
      this.completedQuestsContainer.add(noQuestsText);
    } else {
      completedQuests.forEach((quest, index) => {
        const questY = completedY + (index * 25);

        // Quest name with checkmark
        const nameText = this.scene.add.text(leftX, questY, `✓ ${quest.name}`, {
          font: '14px Arial',
          fill: '#00ff00'
        });
        this.completedQuestsContainer.add(nameText);
      });
    }
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
