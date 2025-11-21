import Phaser from "phaser";
import { Storage } from "../utils/Storage.js";

/**
 * BootScene - Loads all game assets
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Display loading text
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const loadingText = this.add.text(
      width / 2,
      height / 2 - 50,
      "Loading...",
      {
        font: "20px Arial",
        fill: "#ffffff",
      }
    );
    loadingText.setOrigin(0.5, 0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2, 320, 50);

    // Progress bar
    this.load.on("progress", (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 30);
    });

    this.load.on("complete", () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // Load maps
    this.load.tilemapTiledJSON("starting_map", "/maps/starting_map.json");
    this.load.tilemapTiledJSON("second_map", "/maps/second_map.json");
    this.load.tilemapTiledJSON("third_map", "/maps/third_map.json");

    // Load tilesets
    this.load.image(
      "starter_tilepack_1",
      "/assets/tilesets/starter_tilepack_1.png"
    );
    this.load.image(
      "starter_tilepack_2",
      "/assets/tilesets/starter_tilepack_2.png"
    );

    // Load character sprites
    this.load.spritesheet(
      "character_walk",
      "/assets/sprites/animated/character/character_body_walk.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );

    // Load equipment sprites
    this.load.spritesheet(
      "helmet_leather",
      "/assets/sprites/animated/equipment/helmet/equipment_helmet_leather.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );

    // Load item sprites
    this.load.image(
      "item_gold_coin",
      "/assets/sprites/static/items/item_gold_coin.png"
    );

    // Load monster sprites (300x300, 3x3 grid, 100x100 frames)
    this.load.spritesheet(
      "monster_slime",
      "/assets/sprites/animated/monsters/monster_slime.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
  }

  create() {
    // Create character animations
    this.createCharacterAnimations();

    // Create monster animations
    this.createMonsterAnimations();

    // Check if player is logged in
    if (Storage.isLoggedIn()) {
      this.scene.start("GameScene");
    } else {
      this.scene.start("LoginScene");
    }
  }

  createCharacterAnimations() {
    // Standing front (frame 0)
    this.anims.create({
      key: "stand_s",
      frames: [{ key: "character_walk", frame: 0 }],
      frameRate: 1,
    });

    // Walking S/SE (frames 1, 2)
    this.anims.create({
      key: "walk_s",
      frames: this.anims.generateFrameNumbers("character_walk", {
        frames: [0, 1, 2],
      }),
      frameRate: 8,
      repeat: -1,
    });

    // Walking E (frames 3, 4, 5)
    this.anims.create({
      key: "walk_e",
      frames: this.anims.generateFrameNumbers("character_walk", {
        frames: [3, 4, 5],
      }),
      frameRate: 8,
      repeat: -1,
    });

    // Standing back (frame 6)
    this.anims.create({
      key: "stand_n",
      frames: [{ key: "character_walk", frame: 6 }],
      frameRate: 1,
    });

    // Walking N/NE (frames 7, 8)
    this.anims.create({
      key: "walk_n",
      frames: this.anims.generateFrameNumbers("character_walk", {
        frames: [6, 7, 8],
      }),
      frameRate: 8,
      repeat: -1,
    });

    // Walking W (flipped E animation)
    this.anims.create({
      key: "walk_w",
      frames: this.anims.generateFrameNumbers("character_walk", {
        frames: [3, 4, 5],
      }),
      frameRate: 8,
      repeat: -1,
    });
  }

  createMonsterAnimations() {
    // Create animations for each monster type
    const monsterTypes = ['slime']; // Add more monster types here as they're added

    monsterTypes.forEach(type => {
      const spriteKey = `monster_${type}`;

      // Standing animations (frame 0 for south, frame 6 for north)
      this.anims.create({
        key: `${spriteKey}_stand_s`,
        frames: [{ key: spriteKey, frame: 0 }],
        frameRate: 1,
      });

      this.anims.create({
        key: `${spriteKey}_stand_n`,
        frames: [{ key: spriteKey, frame: 6 }],
        frameRate: 1,
      });

      // Walking S (frames 0, 1, 2)
      this.anims.create({
        key: `${spriteKey}_walk_s`,
        frames: this.anims.generateFrameNumbers(spriteKey, {
          frames: [0, 1, 2],
        }),
        frameRate: 8,
        repeat: -1,
      });

      // Walking E (frames 3, 4, 5)
      this.anims.create({
        key: `${spriteKey}_walk_e`,
        frames: this.anims.generateFrameNumbers(spriteKey, {
          frames: [3, 4, 5],
        }),
        frameRate: 8,
        repeat: -1,
      });

      // Walking N (frames 6, 7, 8)
      this.anims.create({
        key: `${spriteKey}_walk_n`,
        frames: this.anims.generateFrameNumbers(spriteKey, {
          frames: [6, 7, 8],
        }),
        frameRate: 8,
        repeat: -1,
      });

      // Walking W (same as E, will be flipped in code)
      this.anims.create({
        key: `${spriteKey}_walk_w`,
        frames: this.anims.generateFrameNumbers(spriteKey, {
          frames: [3, 4, 5],
        }),
        frameRate: 8,
        repeat: -1,
      });
    });

    console.log('Monster animations created');
  }
}
