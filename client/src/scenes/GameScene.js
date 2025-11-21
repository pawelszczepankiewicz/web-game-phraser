import Phaser from "phaser";
import { Storage } from "../utils/Storage.js";
import { Player } from "../entities/Player.js";
import { MapManager } from "../systems/MapManager.js";
import { CollisionManager } from "../systems/CollisionManager.js";
import { StatsSystem } from "../systems/StatsSystem.js";
import { InventorySystem } from "../systems/InventorySystem.js";
import { QuestSystem } from "../systems/QuestSystem.js";
import { MonsterManager } from "../systems/MonsterManager.js";
import * as VueBridge from "../utils/VueBridge.js";

/**
 * GameScene - Main game scene
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    // Reset transitioning flag
    this.transitioning = false;

    // Storage
    this.storage = Storage;

    // Load character data
    const characterData = this.storage.loadCharacter();
    if (!characterData) {
      this.scene.start("LoginScene");
      return;
    }

    // Migrate old character stats to new base values
    this.migrateCharacterStats(characterData);

    console.log(
      "Loading character:",
      characterData.name,
      "at position",
      characterData.x,
      characterData.y
    );
    console.log("Map to load:", characterData.map);

    // Initialize systems
    this.mapManager = new MapManager(this);
    this.collisionManager = new CollisionManager(this);
    this.statsSystem = new StatsSystem(this, characterData.stats);
    this.inventorySystem = new InventorySystem(this, characterData.inventory);
    this.questSystem = new QuestSystem(this, characterData.quests);
    this.monsterManager = new MonsterManager(this);

    // Load map
    const tilemap = this.mapManager.loadMap(characterData.map);

    if (!tilemap) {
      console.error("Failed to load map:", characterData.map);
      return;
    }

    console.log("Map loaded successfully:", {
      width: tilemap.width,
      height: tilemap.height,
      tileWidth: tilemap.tileWidth,
      tileHeight: tilemap.tileHeight,
      widthInPixels: tilemap.widthInPixels,
      heightInPixels: tilemap.heightInPixels,
    });

    // Initialize collisions
    this.collisionManager.initializeFromMap(this.mapManager);

    // Determine spawn point based on fromMap or use saved position
    let spawnX, spawnY;
    if (characterData.fromMap) {
      // Coming from another map, use spawn point
      const spawnPoint = this.mapManager.getPlayerSpawnPoint(characterData.fromMap);
      spawnX = spawnPoint.x;
      spawnY = spawnPoint.y;
      console.log(`Spawning player from ${characterData.fromMap} at:`, spawnX, spawnY);
      // Clear fromMap after using it
      delete characterData.fromMap;
      this.storage.saveCharacter(characterData);
    } else if (characterData.useDefaultSpawn) {
      // Use default spawn (e.g., after death)
      const spawnPoint = this.mapManager.getPlayerSpawnPoint(null);
      spawnX = spawnPoint.x;
      spawnY = spawnPoint.y;
      console.log('Spawning player at default spawn point:', spawnX, spawnY);
      // Clear flag after using it
      delete characterData.useDefaultSpawn;
      this.storage.saveCharacter(characterData);
    } else {
      // Use saved position (normal case)
      spawnX = characterData.x;
      spawnY = characterData.y;
      console.log('Spawning player at saved position:', spawnX, spawnY);
    }

    // Create player
    this.player = new Player(this, spawnX, spawnY);

    // Initialize monsters from map
    this.monsterManager.initializeFromMap(this.mapManager);
    console.log("Player created at:", this.player.x, this.player.y);

    // Setup camera
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setZoom(1);

    // Calculate proper bounds for staggered isometric map
    let mapWidth = tilemap.widthInPixels;
    let mapHeight = tilemap.heightInPixels;

    // For staggered isometric, height calculation is different
    // orientation is an enum: 0=orthogonal, 1=isometric, 2=staggered, 3=hexagonal
    if (tilemap.orientation === 2 || tilemap.orientation === "staggered") {
      mapHeight = (tilemap.tileHeight / 2) * (tilemap.height + 1);
    }

    console.log("Map dimensions:", {
      width: tilemap.width,
      height: tilemap.height,
      tileWidth: tilemap.tileWidth,
      tileHeight: tilemap.tileHeight,
      orientation: tilemap.orientation,
      staggerAxis: tilemap.staggerAxis,
      staggerIndex: tilemap.staggerIndex,
      calculatedWidth: mapWidth,
      calculatedHeight: mapHeight,
      originalHeightInPixels: tilemap.heightInPixels,
    });

    // Set camera bounds to map size
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    console.log("Camera bounds set to:", mapWidth, "x", mapHeight);

    // Store for debug visuals
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    // Setup controls
    this.cursors = this.input.keyboard.createCursorKeys();

    // Setup mouse navigation and monster attack
    this.targetPosition = null;
    this.input.on("pointerdown", (pointer) => {
      // Convert screen coordinates to world coordinates
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      // Check if clicking on a monster
      const monster = this.monsterManager.getMonsterAtPosition(worldX, worldY);
      if (monster) {
        // Attack the monster
        this.player.attackMonster(monster);
        console.log(`Attacking monster at: ${monster.x}, ${monster.y}`);
      } else {
        // Set target position for player to move towards
        this.targetPosition = { x: worldX, y: worldY };
        console.log(`Target position set to: ${worldX}, ${worldY}`);
      }
    });

    // Initialize portals
    this.initializePortals();

    // Connect to Vue store
    this.connectToVue();

    // Listen for player death
    this.events.on('player-death', () => {
      console.log('Player died, respawning at default spawn point...');

      // Save character data
      const characterData = this.storage.loadCharacter();
      characterData.map = 'starting_map';
      characterData.useDefaultSpawn = true; // Flag to use default spawn point

      // Reset health to full
      const currentStats = this.statsSystem.exportStats();
      currentStats.health = currentStats.maxHealth;
      characterData.stats = currentStats;

      characterData.inventory = this.inventorySystem.exportInventory();
      characterData.quests = this.questSystem.exportQuests();

      this.storage.saveCharacter(characterData);

      // Restart scene
      this.scene.restart();
    });

    // Start sample quest (for testing)
    if (
      this.questSystem.getActiveQuests().length === 0 &&
      this.questSystem.getCompletedQuests().length === 0
    ) {
      this.questSystem.startQuest("kill_3_monsters");
    }

    // Setup auto-save
    this.setupAutoSave();

    // Add debug visuals
    this.createDebugVisuals(tilemap);

    // Create player position marker (green circle)
    this.playerMarker = this.add.graphics();
    this.playerMarker.setDepth(1000);

    // Create hitbox debug graphics
    this.hitboxDebugGraphics = this.add.graphics();
    this.hitboxDebugGraphics.setDepth(1001);

    console.log("GameScene initialized");
  }

  /**
   * Create debug visuals
   */
  createDebugVisuals(tilemap) {
    // Map border (red rectangle)
    const borderGraphics = this.add.graphics();
    borderGraphics.lineStyle(4, 0xff0000, 1);
    borderGraphics.strokeRect(0, 0, this.mapWidth, this.mapHeight);
    borderGraphics.setDepth(500);

    // Draw collision areas
    this.drawCollisionDebug();

    // Draw portal areas (magenta borders)
    this.drawPortalDebug();

    // Draw monster spawn areas (orange borders)
    this.drawMonsterSpawnDebug();

    // Map name text (fixed to screen)
    const mapNameText = this.add.text(
      10,
      10,
      `Map: ${this.mapManager.getCurrentMapKey()}`,
      {
        font: "16px Arial",
        fill: "#ffff00",
        backgroundColor: "#000000",
        padding: { x: 5, y: 5 },
      }
    );
    mapNameText.setScrollFactor(0);
    mapNameText.setDepth(1100);

    // Player position text (fixed to screen, updates in real-time)
    this.debugPositionText = this.add.text(10, 35, "", {
      font: "14px Arial",
      fill: "#00ff00",
      backgroundColor: "#000000",
      padding: { x: 5, y: 5 },
    });
    this.debugPositionText.setScrollFactor(0);
    this.debugPositionText.setDepth(1100);

    console.log("Debug visuals created");
  }

  /**
   * Draw collision debug visuals
   */
  drawCollisionDebug() {
    const collisionGraphics = this.add.graphics();
    collisionGraphics.setDepth(600);

    // Draw polygon collisions (cyan)
    collisionGraphics.lineStyle(2, 0x00ffff, 0.8);
    this.collisionManager.collisionBodies.forEach((body) => {
      if (body.points && body.points.length > 0) {
        collisionGraphics.beginPath();
        collisionGraphics.moveTo(body.points[0].x, body.points[0].y);
        for (let i = 1; i < body.points.length; i++) {
          collisionGraphics.lineTo(body.points[i].x, body.points[i].y);
        }
        collisionGraphics.closePath();
        collisionGraphics.strokePath();
      }
    });

    // Draw tile collisions (yellow rectangles)
    const tilemap = this.mapManager.getTilemap();
    const layers = this.mapManager.getLayers();

    // Don't apply offset - use tileToWorldXY directly
    const tileOffsetY = 0;

    collisionGraphics.lineStyle(2, 0xffff00, 0.6);

    for (const layerName in layers) {
      const layer = layers[layerName];

      // Iterate through all tiles in the layer
      let collisionTileCount = 0;
      for (let y = 0; y < tilemap.height; y++) {
        for (let x = 0; x < tilemap.width; x++) {
          const tile = layer.getTileAt(x, y);

          if (tile && tile.index > 0) {
            let hasCollision = false;

            // Check tile properties directly
            if (tile.properties && tile.properties.collision === true) {
              hasCollision = true;
            }

            // Also check tileset-level properties
            if (tile.tileset) {
              const localTileId = tile.index - tile.tileset.firstgid;
              const tilesetTile = tile.tileset.getTileProperties(localTileId);
              if (tilesetTile && tilesetTile.collision === true) {
                hasCollision = true;
              }
            }

            if (hasCollision) {
              collisionTileCount++;
              const worldPos = tilemap.tileToWorldXY(x, y);
              if (worldPos) {
                let drawX = worldPos.x;
                let drawY = worldPos.y + tileOffsetY;

                // For props layer, move debug rectangle down by tileHeight (same as collision)
                if (layerName === "props") {
                  drawY += tilemap.tileHeight;
                }

                collisionGraphics.strokeRect(
                  drawX,
                  drawY,
                  tilemap.tileWidth,
                  tilemap.tileHeight
                );
              }
            }
          }
        }
      }
      console.log(
        `Found ${collisionTileCount} collision tiles in layer: ${layerName}`
      );
    }

    console.log("Collision debug visuals drawn");
  }

  /**
   * Draw portal debug visuals
   */
  drawPortalDebug() {
    const portalGraphics = this.add.graphics();
    portalGraphics.setDepth(650);

    // Draw portals (magenta rectangles)
    portalGraphics.lineStyle(3, 0xff00ff, 0.8);

    this.portals.forEach((portal) => {
      portalGraphics.strokeRect(
        portal.x,
        portal.y,
        portal.width,
        portal.height
      );
    });

    console.log(
      `Portal debug visuals drawn for ${this.portals.length} portals`
    );
  }

  /**
   * Draw monster spawn debug visuals
   */
  drawMonsterSpawnDebug() {
    if (!this.monsterManager) return;

    const spawnGraphics = this.add.graphics();
    spawnGraphics.setDepth(670);

    // Get spawn data from monster manager
    const spawnData = this.monsterManager.spawnData;

    // Draw monster spawn polygons (orange borders)
    spawnGraphics.lineStyle(2, 0xff8800, 0.8);
    spawnGraphics.fillStyle(0xff8800, 0.1); // Semi-transparent fill

    spawnData.forEach((spawn) => {
      if (spawn.polygon && spawn.polygon.length > 0) {
        // Draw polygon
        spawnGraphics.beginPath();
        spawnGraphics.moveTo(spawn.polygon[0].x, spawn.polygon[0].y);
        for (let i = 1; i < spawn.polygon.length; i++) {
          spawnGraphics.lineTo(spawn.polygon[i].x, spawn.polygon[i].y);
        }
        spawnGraphics.closePath();
        spawnGraphics.strokePath();
        spawnGraphics.fillPath();

        // Draw spawn info text
        const centerX = spawn.polygon.reduce((sum, p) => sum + p.x, 0) / spawn.polygon.length;
        const centerY = spawn.polygon.reduce((sum, p) => sum + p.y, 0) / spawn.polygon.length;

        const infoText = this.add.text(
          centerX,
          centerY,
          `${spawn.monsterType}\n${spawn.count}x`,
          {
            fontSize: '12px',
            fill: '#ffaa00',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
          }
        );
        infoText.setOrigin(0.5, 0.5);
        infoText.setDepth(671);
      }
    });

    console.log(
      `Monster spawn debug visuals drawn for ${spawnData.length} spawn areas`
    );
  }

  /**
   * Connect to Vue store
   */
  connectToVue() {
    // Load initial game data into Vue store
    const gameData = {
      character: {
        name: this.storage.loadCharacter().name,
        map: this.mapManager.getCurrentMapKey(),
        x: this.player.x,
        y: this.player.y,
      },
      stats: this.statsSystem.exportStats(),
      inventory: this.inventorySystem.exportInventory(),
      quests: this.questSystem.exportQuests(),
    };

    VueBridge.loadGameData(gameData);

    // Setup event listeners for Vue -> Phaser communication
    VueBridge.setupVueEventListeners(this);

    // Listen to system changes and update Vue
    this.inventorySystem.addListener(() => {
      VueBridge.updateInventory(this.inventorySystem.exportInventory());
    });

    this.questSystem.addListener(() => {
      VueBridge.updateQuests(this.questSystem.exportQuests());
    });

    console.log("Connected to Vue store");
  }

  /**
   * Initialize portals
   */
  initializePortals() {
    this.portals = this.mapManager.getPortalObjects();

    // Apply Y offset to match Phaser's staggered isometric rendering
    const tilemap = this.mapManager.getTilemap();
    if (
      tilemap &&
      (tilemap.orientation === 2 || tilemap.orientation === "staggered")
    ) {
      const offsetY = tilemap.tileHeight; // Full tile height offset
      this.portals.forEach((portal) => {
        portal.y += offsetY;
      });
      console.log(
        `Applied Y offset of ${offsetY}px to ${this.portals.length} portals`
      );
    } else {
      console.log(`Found ${this.portals.length} portals`);
    }
  }

  /**
   * Check portal collisions
   */
  checkPortalCollisions() {
    if (!this.player) return;

    this.portals.forEach((portal) => {
      const portalBounds = new Phaser.Geom.Rectangle(
        portal.x,
        portal.y,
        portal.width,
        portal.height
      );

      // Check if player's feet position (player.x, player.y) is inside portal
      if (Phaser.Geom.Rectangle.Contains(portalBounds, this.player.x, this.player.y)) {
        this.transitionToMap(portal.targetMap);
      }
    });
  }

  /**
   * Transition to another map
   */
  transitionToMap(targetMapKey) {
    // Prevent multiple transitions
    if (this.transitioning) return;
    this.transitioning = true;

    console.log(`Transitioning to map: ${targetMapKey}`);

    // Save current position and map info
    const characterData = this.storage.loadCharacter();
    const currentMap = characterData.map;

    characterData.map = targetMapKey;
    characterData.fromMap = currentMap; // Save where we're coming from

    console.log(`Coming from ${currentMap}, going to ${targetMapKey}`);

    characterData.stats = this.statsSystem.exportStats();
    characterData.inventory = this.inventorySystem.exportInventory();
    characterData.quests = this.questSystem.exportQuests();

    this.storage.saveCharacter(characterData);

    // Reload scene
    this.scene.restart();
  }

  /**
   * Setup auto-save
   */
  setupAutoSave() {
    // Auto-save every 30 seconds
    this.time.addEvent({
      delay: 30000,
      callback: this.autoSave,
      callbackScope: this,
      loop: true,
    });
  }

  /**
   * Auto-save game
   */
  autoSave() {
    if (!this.player) return;

    const characterData = this.storage.loadCharacter();
    characterData.map = this.mapManager.getCurrentMapKey();
    characterData.x = this.player.x;
    characterData.y = this.player.y;
    characterData.stats = this.statsSystem.exportStats();
    characterData.inventory = this.inventorySystem.exportInventory();
    characterData.quests = this.questSystem.exportQuests();

    this.storage.saveCharacter(characterData);
    console.log("Game auto-saved");
  }

  update() {
    // Update player
    if (this.player && this.cursors) {
      // Get movement input from keyboard
      let velocityX = 0;
      let velocityY = 0;

      // Check keyboard input
      const keyboardInput =
        this.cursors.left.isDown ||
        this.cursors.right.isDown ||
        this.cursors.up.isDown ||
        this.cursors.down.isDown;

      if (keyboardInput) {
        // Cancel mouse navigation if keyboard is used
        this.targetPosition = null;

        if (this.cursors.left.isDown) velocityX = -1;
        else if (this.cursors.right.isDown) velocityX = 1;
        if (this.cursors.up.isDown) velocityY = -1;
        else if (this.cursors.down.isDown) velocityY = 1;

        // Normalize diagonal movement
        if (velocityX !== 0 && velocityY !== 0) {
          velocityX *= 0.707;
          velocityY *= 0.707;
        }
      } else if (this.targetPosition) {
        // Move towards mouse click target
        const dx = this.targetPosition.x - this.player.x;
        const dy = this.targetPosition.y - this.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If close enough to target, stop moving
        if (distance < 5) {
          this.targetPosition = null;
          this.player.body.setVelocity(0, 0);
          this.player.updateAnimation(0, 0);
        } else {
          // Normalize direction vector
          velocityX = dx / distance;
          velocityY = dy / distance;
        }
      }

      // Calculate intended new position
      const speed = this.player.speed;
      const deltaTime = this.game.loop.delta / 1000; // Convert to seconds
      const intendedX = this.player.x + velocityX * speed * deltaTime;
      const intendedY = this.player.y + velocityY * speed * deltaTime;

      // Check collision at intended position
      if (velocityX !== 0 || velocityY !== 0) {
        const wouldCollide = this.collisionManager.checkCollision(
          this.player,
          intendedX,
          intendedY
        );

        if (!wouldCollide) {
          // Safe to move, update player
          this.player.x = intendedX;
          this.player.y = intendedY;
          this.player.updateAnimation(velocityX, velocityY);
        } else {
          // Collision detected, stop movement
          this.player.body.setVelocity(0, 0);
          this.player.updateAnimation(0, 0);
          // Cancel target if we can't reach it
          if (this.targetPosition) {
            this.targetPosition = null;
          }
        }
      } else {
        // Not moving - ensure standing animation plays
        this.player.body.setVelocity(0, 0);
        this.player.updateAnimation(0, 0);
      }

      // Check portal collisions
      this.checkPortalCollisions();

      // Update Vue store with player position
      VueBridge.updatePosition(this.player.x, this.player.y);
    }

    // Update mouse position debug display
    if (this.debugPositionText && this.input.activePointer) {
      const pointer = this.input.activePointer;
      this.debugPositionText.setText(
        `Player: ${Math.round(this.player.x)}, ${Math.round(
          this.player.y
        )} | ` +
          `Mouse: ${Math.round(pointer.worldX)}, ${Math.round(pointer.worldY)}`
      );
    }

    // Update player position marker
    if (this.playerMarker && this.player) {
      this.playerMarker.clear();
      this.playerMarker.fillStyle(0x00ff00, 0.8);
      this.playerMarker.fillCircle(this.player.x, this.player.y, 3);
    }

    // Update monsters
    if (this.monsterManager) {
      this.monsterManager.update(this.time.now, this.game.loop.delta, this.player);
    }

    // Update player health bar
    if (this.player) {
      this.player.updateHealthBar();
    }

    // Update prop depths for isometric depth sorting
    if (this.mapManager && this.player) {
      this.mapManager.updatePropDepths(this.player.y);
    }

    // Draw hitboxes for debug
    this.drawHitboxes();

    // Update systems
    if (this.statsSystem) {
      this.statsSystem.update();
    }
  }

  /**
   * Draw hitboxes for debug
   */
  drawHitboxes() {
    if (!this.hitboxDebugGraphics) return;

    this.hitboxDebugGraphics.clear();

    // Draw player hitbox (green)
    if (this.player && this.player.getHitbox) {
      const playerHitbox = this.player.getHitbox();
      this.hitboxDebugGraphics.lineStyle(2, 0x00ff00, 1);
      this.hitboxDebugGraphics.strokeRect(
        playerHitbox.x,
        playerHitbox.y,
        playerHitbox.width,
        playerHitbox.height
      );
    }

    // Draw monster hitboxes (red)
    if (this.monsterManager) {
      const monsters = this.monsterManager.getMonsters();
      this.hitboxDebugGraphics.lineStyle(2, 0xff0000, 1);

      monsters.forEach(monster => {
        if (monster.active && monster.getHitbox) {
          const hitbox = monster.getHitbox();
          this.hitboxDebugGraphics.strokeRect(
            hitbox.x,
            hitbox.y,
            hitbox.width,
            hitbox.height
          );
        }
      });
    }
  }

  /**
   * Cleanup on shutdown
   */
  shutdown() {
    // Save game before shutdown
    this.autoSave();

    // Cleanup monsters
    if (this.monsterManager) {
      this.monsterManager.clear();
    }
  }

  /**
   * Migrate old character stats to new base values
   * Converts old format (100 HP, 10 attack) to new format (10 HP, 1 attack)
   */
  migrateCharacterStats(characterData) {
    if (!characterData.stats) return;

    // Check if using old stats format (health > 50 indicates old format)
    if (characterData.stats.maxHealth > 50 || characterData.stats.attackStrength > 5) {
      console.log('Migrating character stats from old format to new format...');

      // Calculate equipment bonuses (difference from base)
      const oldBaseHealth = 100;
      const oldBaseAttack = 10;
      const healthBonus = characterData.stats.maxHealth - oldBaseHealth;
      const attackBonus = characterData.stats.attackStrength - oldBaseAttack;

      // Apply new base stats + equipment bonuses
      const newBaseHealth = 10;
      const newBaseAttack = 1;

      characterData.stats.maxHealth = newBaseHealth + healthBonus;
      characterData.stats.health = Math.min(characterData.stats.health, characterData.stats.maxHealth);
      characterData.stats.attackStrength = newBaseAttack + attackBonus;

      console.log(`Stats migrated: Health ${characterData.stats.health}/${characterData.stats.maxHealth}, Attack ${characterData.stats.attackStrength}`);

      // Save the migrated data
      this.storage.saveCharacter(characterData);
    }
  }
}
