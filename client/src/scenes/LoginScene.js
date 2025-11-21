import Phaser from 'phaser';
import { Storage } from '../utils/Storage.js';

/**
 * LoginScene - Character creation/login interface
 */
export class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
    this.characterName = '';
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Title
    const title = this.add.text(width / 2, height / 4, 'MMO RPG GAME', {
      font: '48px Arial',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height / 4 + 60, 'Enter Your Character Name', {
      font: '24px Arial',
      fill: '#cccccc'
    });
    subtitle.setOrigin(0.5);

    // Input box background
    const inputBox = this.add.graphics();
    inputBox.fillStyle(0x222222, 1);
    inputBox.fillRect(width / 2 - 150, height / 2 - 25, 300, 50);
    inputBox.lineStyle(2, 0xffffff, 1);
    inputBox.strokeRect(width / 2 - 150, height / 2 - 25, 300, 50);

    // Character name display
    this.nameText = this.add.text(width / 2, height / 2, '', {
      font: '20px Arial',
      fill: '#ffffff'
    });
    this.nameText.setOrigin(0.5);

    // Placeholder text
    this.placeholderText = this.add.text(width / 2, height / 2, 'Type your name...', {
      font: '20px Arial',
      fill: '#666666'
    });
    this.placeholderText.setOrigin(0.5);

    // Create button
    const buttonY = height / 2 + 80;
    const button = this.add.graphics();
    button.fillStyle(0x4a4a4a, 1);
    button.fillRect(width / 2 - 100, buttonY - 20, 200, 50);
    button.lineStyle(2, 0xffffff, 1);
    button.strokeRect(width / 2 - 100, buttonY - 20, 200, 50);

    const buttonText = this.add.text(width / 2, buttonY + 5, 'START GAME', {
      font: '20px Arial',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    buttonText.setOrigin(0.5);

    // Make button interactive
    const buttonZone = this.add.zone(width / 2, buttonY + 5, 200, 50)
      .setInteractive({ useHandCursor: true });

    buttonZone.on('pointerover', () => {
      button.clear();
      button.fillStyle(0x6a6a6a, 1);
      button.fillRect(width / 2 - 100, buttonY - 20, 200, 50);
      button.lineStyle(2, 0xffffff, 1);
      button.strokeRect(width / 2 - 100, buttonY - 20, 200, 50);
    });

    buttonZone.on('pointerout', () => {
      button.clear();
      button.fillStyle(0x4a4a4a, 1);
      button.fillRect(width / 2 - 100, buttonY - 20, 200, 50);
      button.lineStyle(2, 0xffffff, 1);
      button.strokeRect(width / 2 - 100, buttonY - 20, 200, 50);
    });

    buttonZone.on('pointerdown', () => {
      this.startGame();
    });

    // Instructions
    const instructions = this.add.text(width / 2, height - 80, 'Press ENTER to start', {
      font: '16px Arial',
      fill: '#888888'
    });
    instructions.setOrigin(0.5);

    // Keyboard input
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === 'Enter') {
        this.startGame();
      } else if (event.key === 'Backspace') {
        this.characterName = this.characterName.slice(0, -1);
        this.updateNameDisplay();
      } else if (event.key.length === 1 && this.characterName.length < 20) {
        // Only allow letters, numbers, and spaces
        if (/^[a-zA-Z0-9 ]$/.test(event.key)) {
          this.characterName += event.key;
          this.updateNameDisplay();
        }
      }
    });
  }

  updateNameDisplay() {
    this.nameText.setText(this.characterName);
    this.placeholderText.setVisible(this.characterName.length === 0);
  }

  startGame() {
    const trimmedName = this.characterName.trim();

    if (trimmedName.length < 3) {
      // Show error message
      const errorText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2 + 130,
        'Name must be at least 3 characters',
        {
          font: '16px Arial',
          fill: '#ff4444'
        }
      );
      errorText.setOrigin(0.5);

      // Remove error message after 3 seconds
      this.time.delayedCall(3000, () => {
        errorText.destroy();
      });
      return;
    }

    // Create character data
    const characterData = {
      name: trimmedName,
      map: 'starting_map',
      x: 500,
      y: 500,
      stats: {
        health: 10,
        maxHealth: 10,
        attackStrength: 1,
        armor: 5
      },
      inventory: {
        backpack: [],
        equipped: {
          helmet: null,
          armor: null,
          weapon: null,
          shield: null,
          boots: null,
          amulet: null,
          ring_left: null,
          ring_right: null
        },
        gold: 100
      },
      quests: {
        active: [],
        completed: []
      }
    };

    // Save character
    Storage.saveCharacter(characterData);

    // Start game
    this.scene.start('GameScene');
  }
}
