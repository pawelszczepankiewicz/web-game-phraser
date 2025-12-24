import Phaser from "phaser";
import { SoundManager } from "../systems/SoundManager.js";

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

    const loadingText = this.add.text(width / 2, height / 2 - 50, "Loading...", {
      font: "20px Arial",
      fill: "#ffffff",
    });
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

    // Load tilesets as images for tilemap
    // Load tilesets as spritesheets for dynamic prop sprites (separate keys)
    this.load.image("starter_tilepack_1", "/assets/tilesets/starter_tilepack_1.png");
    this.load.spritesheet("starter_tilepack_1_sheet", "/assets/tilesets/starter_tilepack_1.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.image("starter_tilepack_2", "/assets/tilesets/starter_tilepack_2.png");
    this.load.spritesheet("starter_tilepack_2_sheet", "/assets/tilesets/starter_tilepack_2.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.image("simple_building_tilepack", "/assets/tilesets/simple_building_tilepack.png");
    this.load.spritesheet(
      "simple_building_tilepack_sheet",
      "/assets/tilesets/simple_building_tilepack.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );
    this.load.image("small_grasspack", "/assets/tilesets/small_grasspack.png");
    this.load.spritesheet("small_grasspack_sheet", "/assets/tilesets/small_grasspack.png", {
      frameWidth: 64,
      frameHeight: 64,
    });

    this.load.image("trees_tileset_1", "/assets/tilesets/trees_tileset_1.png");
    this.load.spritesheet("trees_tileset_1_sheet", "/assets/tilesets/trees_tileset_1.png", {
      frameWidth: 633,
      frameHeight: 719,
    });
    this.load.image("trees_tileset_2", "/assets/tilesets/trees_tileset_2.png");
    this.load.spritesheet("trees_tileset_2_sheet", "/assets/tilesets/trees_tileset_2.png", {
      frameWidth: 633,
      frameHeight: 719,
    });
    this.load.image("trees_tileset_3", "/assets/tilesets/trees_tileset_3.png");
    this.load.spritesheet("trees_tileset_3_sheet", "/assets/tilesets/trees_tileset_3.png", {
      frameWidth: 633,
      frameHeight: 719,
    });

    // Load character sprites
    this.load.spritesheet(
      "character_walk",
      "/assets/sprites/animated/character/character_body_walk.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );

    // Load equipment sprites (animated, 100x100 frames, 3x3 grid)
    this.load.spritesheet(
      "equipment_helmet_leather",
      "/assets/sprites/animated/equipment/helmet/equipment_helmet_leather.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "equipment_armor_leather",
      "/assets/sprites/animated/equipment/armor/equipment_armor_leather.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "equipment_boots_leather",
      "/assets/sprites/animated/equipment/boots/equipment_boots_leather.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );

    this.load.spritesheet(
      "equipment_helmet_iron",
      "/assets/sprites/animated/equipment/helmet/equipment_helmet_iron.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "equipment_armor_iron",
      "/assets/sprites/animated/equipment/armor/equipment_armor_iron.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "equipment_boots_iron",
      "/assets/sprites/animated/equipment/boots/equipment_boots_iron.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );

    this.load.spritesheet(
      "equipment_helmet_steel",
      "/assets/sprites/animated/equipment/helmet/equipment_helmet_steel.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "equipment_armor_steel",
      "/assets/sprites/animated/equipment/armor/equipment_armor_steel.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "equipment_boots_steel",
      "/assets/sprites/animated/equipment/boots/equipment_boots_steel.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );

    this.load.spritesheet(
      "equipment_helmet_mithril",
      "/assets/sprites/animated/equipment/helmet/equipment_helmet_mithril.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "equipment_armor_mithril",
      "/assets/sprites/animated/equipment/armor/equipment_armor_mithril.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "equipment_boots_mithril",
      "/assets/sprites/animated/equipment/boots/equipment_boots_mithril.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );

    this.load.spritesheet(
      "equipment_helmet_dragon",
      "/assets/sprites/animated/equipment/helmet/equipment_helmet_dragon.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "equipment_armor_dragon",
      "/assets/sprites/animated/equipment/armor/equipment_armor_dragon.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "equipment_boots_dragon",
      "/assets/sprites/animated/equipment/boots/equipment_boots_dragon.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );

    this.load.spritesheet(
      "equipment_helmet_infernal",
      "/assets/sprites/animated/equipment/helmet/equipment_helmet_infernal.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "equipment_armor_infernal",
      "/assets/sprites/animated/equipment/armor/equipment_armor_infernal.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "equipment_boots_infernal",
      "/assets/sprites/animated/equipment/boots/equipment_boots_infernal.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );

    // Load environmental animated sprites (campfires, portals, etc.)
    // Add your animated environmental sprites here
    this.load.spritesheet("campfire", "/assets/sprites/animated/items/campfire.png", {
      frameWidth: 36, // 216 / 6 frames = 36px per frame
      frameHeight: 48,
    });
    this.load.spritesheet("portal", "/assets/sprites/animated/items/portal.png", {
      frameWidth: 224, // 216 / 6 frames = 36px per frame
      frameHeight: 252,
    });

    // Load item sprites (static)
    this.load.image("item_gold_coin", "/assets/sprites/static/items/item_gold_coin.png");

    this.load.image("item_loot_bag", "/assets/sprites/static/items/item_loot_bag.png");

    // Load static equipment icons (for inventory/loot display only)
    this.load.image(
      "equipment_armor_leather_static",
      "/assets/sprites/static/equipment/armor/equipment_armor_leather_static.png"
    );

    this.load.image(
      "equipment_helmet_leather_static",
      "/assets/sprites/static/equipment/helmet/equipment_helmet_leather_static.png"
    );

    this.load.image(
      "equipment_boots_leather_static",
      "/assets/sprites/static/equipment/boots/equipment_boots_leather_static.png"
    );

    // Load monster sprites (300x300, 3x3 grid, 100x100 frames)
    this.load.spritesheet("monster_slime", "/assets/sprites/animated/monsters/monster_slime.png", {
      frameWidth: 100,
      frameHeight: 100,
    });
    this.load.spritesheet(
      "monster_goblin",
      "/assets/sprites/animated/monsters/monster_goblin.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "monster_skeleton",
      "/assets/sprites/animated/monsters/monster_skeleton.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet("monster_wolf", "/assets/sprites/animated/monsters/monster_wolf.png", {
      frameWidth: 100,
      frameHeight: 100,
    });
    this.load.spritesheet("monster_orc", "/assets/sprites/animated/monsters/monster_orc.png", {
      frameWidth: 100,
      frameHeight: 100,
    });
    this.load.spritesheet(
      "monster_dark_mage",
      "/assets/sprites/animated/monsters/monster_dark_mage.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet("monster_troll", "/assets/sprites/animated/monsters/monster_troll.png", {
      frameWidth: 100,
      frameHeight: 100,
    });
    this.load.spritesheet(
      "monster_wraith",
      "/assets/sprites/animated/monsters/monster_wraith.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "monster_dragon_whelp",
      "/assets/sprites/animated/monsters/monster_dragon_whelp.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );
    this.load.spritesheet(
      "monster_deamon",
      "/assets/sprites/animated/monsters/monster_deamon.png",
      {
        frameWidth: 100,
        frameHeight: 100,
      }
    );

    // Load NPC sprites (300x300, 3x3 grid, 100x100 frames)
    this.load.spritesheet("npc_aibit", "/assets/sprites/animated/npc/npc_aibit.png", {
      frameWidth: 100,
      frameHeight: 100,
    });

    this.load.spritesheet("npc_sadrax", "/assets/sprites/animated/npc/npc_sadrax.png", {
      frameWidth: 100,
      frameHeight: 100,
    });

    // Load projectile sprites
    this.load.spritesheet("projectile_fireball", "/assets/sprites/animated/attacks/fireball.png", {
      frameWidth: 64, // 216 / 6 frames = 36px per frame
      frameHeight: 64,
    });

    // Arrow projectile (single 64x64 frame)
    this.load.image("projectile_arrow", "/assets/sprites/animated/attacks/arrow.png");

    // Load weapon static icons
    this.load.image(
      "weapon_wood_crossbow_static",
      "/assets/sprites/static/equipment/weapon/weapon_wood_crossbow.png"
    );

    // Load sound effects
    const soundsToLoad = SoundManager.getSoundsToLoad();
    for (const { key, path } of soundsToLoad) {
      this.load.audio(key, path);
    }
  }

  create() {
    // Create character animations
    this.createCharacterAnimations();

    // Create equipment animations
    this.createEquipmentAnimations();

    // Create monster animations
    this.createMonsterAnimations();

    // Create NPC animations
    this.createNPCAnimations();

    // Create projectile animations
    this.createProjectileAnimations();

    // Note: Environmental animations are created dynamically per sprite instance in MapManager
    // No need to pre-define them here

    // Authentication is handled by Vue, always start GameScene
    // Character data is loaded from window.GAME_CHARACTER_DATA (set by LoginComponent)
    this.scene.start("GameScene");
  }

  createCharacterAnimations() {
    // Idle (frame 0)
    this.anims.create({
      key: "idle",
      frames: [{ key: "character_walk", frame: 0 }],
      frameRate: 1,
    });

    // Walking (frames 1-2 looped)
    this.anims.create({
      key: "walk",
      frames: this.anims.generateFrameNumbers("character_walk", {
        frames: [1, 2],
      }),
      frameRate: 8,
      repeat: -1,
    });
  }

  createEquipmentAnimations() {
    // Create animations for each equipment piece that matches player animations
    const equipmentTypes = [
      "equipment_helmet_leather",
      "equipment_armor_leather",
      "equipment_boots_leather",
      "equipment_helmet_iron",
      "equipment_armor_iron",
      "equipment_boots_iron",
      "equipment_helmet_steel",
      "equipment_armor_steel",
      "equipment_boots_steel",
      "equipment_helmet_mithril",
      "equipment_armor_mithril",
      "equipment_boots_mithril",
      "equipment_helmet_dragon",
      "equipment_armor_dragon",
      "equipment_boots_dragon",
      "equipment_helmet_infernal",
      "equipment_armor_infernal",
      "equipment_boots_infernal",
    ];

    equipmentTypes.forEach((equipmentKey) => {
      // Idle (frame 0)
      this.anims.create({
        key: `${equipmentKey}_idle`,
        frames: [{ key: equipmentKey, frame: 0 }],
        frameRate: 1,
      });

      // Walking (frames 1-2 looped)
      this.anims.create({
        key: `${equipmentKey}_walk`,
        frames: this.anims.generateFrameNumbers(equipmentKey, {
          frames: [1, 2],
        }),
        frameRate: 8,
        repeat: -1,
      });
    });
  }

  createMonsterAnimations() {
    // Create animations for each monster type
    const monsterTypes = [
      "slime",
      "goblin",
      "skeleton",
      "wolf",
      "orc",
      "dark_mage",
      "troll",
      "wraith",
      "dragon_whelp",
      "deamon",
    ]; // Add more monster types here as they're added

    monsterTypes.forEach((type) => {
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
  }

  createNPCAnimations() {
    // Create animations for each NPC
    const npcTypes = ["aibit", "sadrax"]; // Add more NPC names here as they're added

    npcTypes.forEach((type) => {
      const spriteKey = `npc_${type}`;

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
  }

  createProjectileAnimations() {
    // Fireball flying animation (6 frames)
    this.anims.create({
      key: "projectile_fireball_fly",
      frames: this.anims.generateFrameNumbers("projectile_fireball", {
        start: 0,
        end: 0,
      }),
      frameRate: 12,
      repeat: -1,
    });

    // Fireball hit animation (reuse same frames but faster, no repeat)
    this.anims.create({
      key: "projectile_fireball_hit",
      frames: this.anims.generateFrameNumbers("projectile_fireball", {
        start: 0,
        end: 0,
      }),
      frameRate: 24,
      repeat: 0,
    });

    // Arrow is a single static image - no animation needed
    // The Projectile entity handles this by checking if animation exists
  }
}
