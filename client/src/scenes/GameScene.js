import Phaser from "phaser";
import { Storage } from "../utils/Storage.js";
import { Player } from "../entities/Player.js";
import { RemotePlayer } from "../entities/RemotePlayer.js";
import { MapManager } from "../systems/MapManager.js";
import { CollisionManager } from "../systems/CollisionManager.js";
import { StatsSystem } from "../systems/StatsSystem.js";
import { InventorySystem } from "../systems/InventorySystem.js";
import { QuestSystem } from "../systems/QuestSystem.js";
import { MonsterManager } from "../systems/MonsterManager.js";
import { LootBagManager } from "../systems/LootBagManager.js";
import { NPCManager } from "../systems/NPCManager.js";
import * as VueBridge from "../utils/VueBridge.js";
import { socketManager } from "../utils/SocketManager.js";
import { getMonsterData } from "../../../shared/data/Monsters.js";
import { tileHasCollision, getCollisionBox, getTilesetProperties } from "../utils/TileUtils.js";

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

    // Load character data from server (set by LoginComponent via main.js)
    const characterData = window.GAME_CHARACTER_DATA;
    if (!characterData) {
      console.error("No character data available from server");
      return;
    }

    // Also save to localStorage for backwards compatibility
    this.storage.saveCharacter(characterData);

    // Migrate old character stats to new base values
    this.migrateCharacterStats(characterData);

    // Initialize systems
    this.mapManager = new MapManager(this);
    this.collisionManager = new CollisionManager(this);
    this.statsSystem = new StatsSystem(this, characterData.stats);
    this.inventorySystem = new InventorySystem(this, characterData.inventory);
    this.questSystem = new QuestSystem(this, characterData.quests);
    this.monsterManager = new MonsterManager(this);
    this.lootBagManager = new LootBagManager(this);
    this.npcManager = new NPCManager(this);

    // Load map
    const tilemap = this.mapManager.loadMap(characterData.map);

    if (!tilemap) {
      console.error("Failed to load map:", characterData.map);
      return;
    }

    // Initialize collisions
    this.collisionManager.initializeFromMap(this.mapManager);

    // Determine spawn point based on fromMap or use saved position
    let spawnX, spawnY;
    if (characterData.fromMap) {
      // Coming from another map, use spawn point
      const spawnPoint = this.mapManager.getPlayerSpawnPoint(characterData.fromMap);
      spawnX = spawnPoint.x;
      spawnY = spawnPoint.y;
      // Clear fromMap after using it
      delete characterData.fromMap;
      this.storage.saveCharacter(characterData);
    } else if (characterData.useDefaultSpawn) {
      // Use default spawn (e.g., after death)
      const spawnPoint = this.mapManager.getPlayerSpawnPoint(null);
      spawnX = spawnPoint.x;
      spawnY = spawnPoint.y;
      // Clear flag after using it
      delete characterData.useDefaultSpawn;
      this.storage.saveCharacter(characterData);
    } else {
      // Use saved position (normal case)
      spawnX = characterData.x;
      spawnY = characterData.y;
    }

    // Create player
    this.player = new Player(this, spawnX, spawnY);

    // Initialize remote players map
    this.remotePlayers = new Map(); // userId -> RemotePlayer
    this.setupMultiplayer();

    // Initialize monsters from map
    this.monsterManager.initializeFromMap(this.mapManager);

    // Initialize NPCs from map
    this.npcManager.spawnNPCsFromMap(this.mapManager);

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

    // Set camera bounds to map size
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    // Store for debug visuals
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;

    // Setup controls
    this.cursors = this.input.keyboard.createCursorKeys();

    // Setup mouse navigation and monster attack
    this.targetPosition = null;
    this.input.on("pointerdown", (pointer) => {
      // Check if loot bag is open - don't process clicks if it is
      const store = window.__GAME_STORE__;
      const lootBagOpen = store && store.ui.lootVisible;
      if (lootBagOpen) return;

      // Convert screen coordinates to world coordinates
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      // Check if clicking on a monster
      const monster = this.monsterManager.getMonsterAtPosition(worldX, worldY);
      if (monster) {
        // Attack the monster
        this.player.attackMonster(monster);
      } else {
        // Set target position for player to move towards
        this.targetPosition = { x: worldX, y: worldY };
      }
    });

    // Initialize portals
    this.initializePortals();

    // Connect to Vue store
    this.connectToVue();

    // Listen for player death
    this.events.on("player-death", () => {
      // Close any open UI panels
      VueBridge.closeLootBag();

      // Get current character data (from server or localStorage)
      const characterData = window.GAME_CHARACTER_DATA || this.storage.loadCharacter();
      characterData.map = "starting_map";
      characterData.useDefaultSpawn = true; // Flag to use default spawn point

      // Reset health to full
      const currentStats = this.statsSystem.exportStats();
      currentStats.health = currentStats.maxHealth;
      characterData.stats = currentStats;

      // IMPORTANT: Preserve all inventory including equipped items
      characterData.inventory = this.inventorySystem.exportInventory();
      characterData.quests = this.questSystem.exportQuests();

      // Save to both localStorage and window global
      this.storage.saveCharacter(characterData);
      window.GAME_CHARACTER_DATA = characterData;

      // TODO: Send death/respawn to server for multiplayer sync
      // socketManager.sendPlayerDeath();

      // Fade out, then restart scene
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.restart();
      });
    });

    this.events.on("monster-died", (data) => {
      // Create loot bag from monster drops
      const monsterData = getMonsterData(data.monsterType);
      if (monsterData && monsterData.lootTable) {
        const lootDrops = this.rollMonsterLoot(monsterData.lootTable);
        if (lootDrops.length > 0) {
          this.lootBagManager.createLootBag(data.x, data.y, lootDrops);
        }
      }

      if (this.questSystem) {
        // Get active quests from QuestSystem
        const activeQuests = this.questSystem.getActiveQuests();
        let questsUpdated = false;

        // Check each active quest for matching kill objectives
        activeQuests.forEach((quest) => {
          quest.objectives.forEach((objective, objIndex) => {
            if (objective.type === "kill" && objective.target === data.monsterType) {
              if (objective.current < objective.required) {
                // Update quest progress through QuestSystem
                const beforeCount = objective.current;
                this.questSystem.updateQuestProgress(quest.id, objIndex, 1);
                questsUpdated = true;

                // Get updated quest state after QuestSystem processed it
                const updatedQuest =
                  this.questSystem.activeQuests.find((q) => q.id === quest.id) ||
                  this.questSystem.completedQuests.find((q) => q.id === quest.id);

                if (updatedQuest) {
                  const afterCount = updatedQuest.objectives[objIndex].current;

                  // Check if quest was completed
                  if (this.questSystem.completedQuests.find((q) => q.id === quest.id)) {
                    VueBridge.showToast(
                      `Quest Complete: ${
                        quest.name
                      }! Return to ${quest.giver.toUpperCase()} for rewards.`,
                      "success",
                      5000
                    );
                  } else {
                    VueBridge.showToast(
                      `Quest Progress: ${objective.description} ${afterCount}/${objective.required}`,
                      "info",
                      2000
                    );
                  }
                }
              }
            }
          });
        });

        // Sync updated quest state to Vue store
        if (questsUpdated) {
          const store = window.__GAME_STORE__;
          if (store) {
            store.updateQuests({
              active: this.questSystem.activeQuests,
              completed: this.questSystem.completedQuests,
            });
          }
        }
      }
    });

    // Listen for loot bag opening (when player clicks loot bag)
    this.events.on("open-loot-bag", (data) => {
      VueBridge.openLootBag(data.lootBag, data.items);
    });

    // Listen for loot bag closing (when loot bag despawns)
    this.events.on("close-loot-bag", (lootBag) => {
      VueBridge.closeLootBag();
    });

    // Listen for NPC interaction (when player clicks NPC)
    this.events.on("npc-interact", (data) => {
      VueBridge.showNPCInteraction(data);
    });

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

    // Fade in from black (500ms)
    this.cameras.main.fadeIn(200, 0, 0, 0);
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
    // Debug visuals removed
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

          if (tile && tileHasCollision(tile)) {
            collisionTileCount++;
            const worldPos = tilemap.tileToWorldXY(x, y);
            if (worldPos) {
              // Debug logging for large tiles
              if (tile.width > 100 || tile.height > 100) {
                const collisionBox = getCollisionBox(tile, worldPos, layerName);
                console.log('Large tile collision box:', {
                  tileIndex: tile.index,
                  tileProperties: tile.properties,
                  fullTileSize: { width: tile.width, height: tile.height },
                  collisionDimensions: {
                    width: tile.properties?.collisionBoxWidth || tile.width,
                    height: tile.properties?.collisionBoxHeight || tile.height
                  },
                  collisionOrigin: {
                    x: tile.properties?.collisionBoxOriginX ?? 0,
                    y: tile.properties?.collisionBoxOriginY ?? 0
                  },
                  calculatedCollisionBox: collisionBox
                });
              }

              // Get collision box using utility function
              const collisionBox = getCollisionBox(tile, worldPos, layerName);

              // Draw the actual collision box
              collisionGraphics.strokeRect(collisionBox.x, collisionBox.y, collisionBox.width, collisionBox.height);
            }
          }
        }
      }
    }
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
      portalGraphics.strokeRect(portal.x, portal.y, portal.width, portal.height);
    });
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

        const infoText = this.add.text(centerX, centerY, `${spawn.monsterType}\n${spawn.count}x`, {
          fontSize: "12px",
          fill: "#ffaa00",
          stroke: "#000000",
          strokeThickness: 3,
          align: "center",
        });
        infoText.setOrigin(0.5, 0.5);
        infoText.setDepth(671);
      }
    });
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

    // Sync equipped items with player sprites
    this.syncEquipmentOnLoad();

    // Setup event listeners for Vue -> Phaser communication
    VueBridge.setupVueEventListeners(this);

    // Listen to system changes and update Vue
    this.inventorySystem.addListener(() => {
      VueBridge.updateInventory(this.inventorySystem.exportInventory());
    });

    this.questSystem.addListener(() => {
      VueBridge.updateQuests(this.questSystem.exportQuests());
    });
  }

  /**
   * Sync equipped items with player sprites on game load
   */
  syncEquipmentOnLoad() {
    if (!this.player || !this.inventorySystem) return;

    const inventory = this.inventorySystem.exportInventory();
    const equipped = inventory.equipped;

    // Iterate through all equipment slots and apply sprites
    Object.entries(equipped).forEach(([slot, item]) => {
      if (item && (item.animatedSprite || item.staticWearableSprite) && item.visible) {
        this.player.equipItem(slot, item.animatedSprite, item.staticWearableSprite);
      }
    });
  }

  /**
   * Initialize portals
   */
  initializePortals() {
    this.portals = this.mapManager.getPortalObjects();

    // Apply Y offset to match Phaser's staggered isometric rendering
    const tilemap = this.mapManager.getTilemap();
    if (tilemap && (tilemap.orientation === 2 || tilemap.orientation === "staggered")) {
      const offsetY = tilemap.tileHeight; // Full tile height offset

      this.portals.forEach((portal) => {
        portal.y += offsetY;
      });
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

    // Get current character data
    const characterData = window.GAME_CHARACTER_DATA || this.storage.loadCharacter();
    const currentMap = characterData.map;

    // Update map
    characterData.map = targetMapKey;
    characterData.fromMap = currentMap; // Save where we're coming from

    // Update with current state
    characterData.stats = this.statsSystem.exportStats();
    characterData.inventory = this.inventorySystem.exportInventory();
    characterData.quests = this.questSystem.exportQuests();

    // Save to both localStorage and window global
    this.storage.saveCharacter(characterData);
    window.GAME_CHARACTER_DATA = characterData;

    // Send map change to server for persistence
    if (socketManager.isReady()) {
      socketManager.sendMapChange(targetMapKey, characterData.x, characterData.y);
    }

    // Fade out, then restart scene
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.restart();
    });
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

    // Get current character data
    const characterData = window.GAME_CHARACTER_DATA || this.storage.loadCharacter();
    characterData.map = this.mapManager.getCurrentMapKey();
    characterData.x = this.player.x;
    characterData.y = this.player.y;
    characterData.stats = this.statsSystem.exportStats();
    characterData.inventory = this.inventorySystem.exportInventory();
    characterData.quests = this.questSystem.exportQuests();

    // Save to localStorage and window global
    this.storage.saveCharacter(characterData);
    window.GAME_CHARACTER_DATA = characterData;

    // Send to server for Firebase persistence
    if (socketManager.isReady()) {
      socketManager.sendInventoryUpdate(characterData.inventory, characterData.stats);
      socketManager.sendQuestUpdate(characterData.quests);
    }
  }

  /**
   * Roll for loot drops from monster loot table
   */
  rollMonsterLoot(lootTable) {
    const drops = [];

    lootTable.forEach((entry) => {
      const roll = Math.random();

      if (roll <= entry.dropRate) {
        let quantity;
        if (entry.minQuantity !== undefined && entry.maxQuantity !== undefined) {
          quantity = Math.floor(
            Math.random() * (entry.maxQuantity - entry.minQuantity + 1) + entry.minQuantity
          );
        } else {
          quantity = entry.quantity || 1;
        }

        drops.push({
          itemId: entry.itemId,
          quantity: quantity,
        });
      }
    });

    return drops;
  }

  update() {
    // Update player
    if (this.player && this.cursors) {
      // Check if loot bag is open - disable movement if it is
      const store = window.__GAME_STORE__;
      const lootBagOpen = store && store.ui.lootVisible;

      // Get movement input from keyboard
      let velocityX = 0;
      let velocityY = 0;

      // Check keyboard input (only if loot bag is not open)
      const keyboardInput =
        !lootBagOpen &&
        (this.cursors.left.isDown ||
          this.cursors.right.isDown ||
          this.cursors.up.isDown ||
          this.cursors.down.isDown);

      // Clear target position if loot bag is open
      if (lootBagOpen && this.targetPosition) {
        this.targetPosition = null;
      }

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
      } else if (!lootBagOpen && this.targetPosition) {
        // Move towards mouse click target (only if loot bag is not open)
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

      // Send position to server for multiplayer
      if (socketManager.isReady()) {
        // Send actual velocity (velocityX/Y are normalized direction, multiply by speed for pixel velocity)
        socketManager.sendPlayerMove(
          this.player.x,
          this.player.y,
          velocityX * speed,
          velocityY * speed
        );
      }
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

    // Update NPCs
    if (this.npcManager) {
      this.npcManager.update(this.time.now, this.game.loop.delta);
    }

    // Update loot bags
    if (this.lootBagManager) {
      this.lootBagManager.update(this.time.now, this.game.loop.delta);
    }

    // Update player health bar
    if (this.player) {
      this.player.updateHealthBar();
      // Update equipment sprites to follow player
      this.player.updateEquipmentPosition();
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

    // Update remote players
    if (this.remotePlayers) {
      this.remotePlayers.forEach((remotePlayer) => {
        remotePlayer.update();
      });
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

      monsters.forEach((monster) => {
        if (monster.active && monster.getHitbox) {
          const hitbox = monster.getHitbox();
          this.hitboxDebugGraphics.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
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
   * Setup multiplayer - listen for other players
   */
  setupMultiplayer() {
    if (!socketManager.isReady()) {
      return;
    }

    // Listen for state updates from server
    socketManager.on("state-update", (data) => {
      this.handleStateUpdate(data);
    });

    // Listen for loot bag events from server
    socketManager.on("loot-bag-created", (data) => {
      this.lootBagManager.createLootBagFromServer(data);
    });

    socketManager.on("loot-bag-item-removed", (data) => {
      this.lootBagManager.removeItemFromLootBag(data.lootBagId, data.instanceId);
    });

    socketManager.on("loot-bag-despawned", (data) => {
      this.lootBagManager.despawnLootBagById(data.lootBagId);
    });

    socketManager.on("monster-damaged", (data) => {
      const monster = this.monsterManager.monsters.find((m) => m.id === data.monsterId);
      if (monster) {
        monster.health = data.health;
        monster.updateHealthBar();

        monster.setTint(0xff0000);
        this.time.delayedCall(100, () => {
          monster.clearTint();
        });
      }
    });

    socketManager.on("monster-died", (data) => {
      const monster = this.monsterManager.monsters.find((m) => m.id === data.monsterId);
      if (monster && monster.active) {
        this.events.emit("monster-died", { monsterType: monster.monsterType });
        this.monsterManager.onMonsterDeath(monster);
      }
    });
  }

  /**
   * Handle state update from server
   */
  handleStateUpdate(data) {
    if (!data || !data.players) return;

    const myUserId = window.GAME_USER_ID;
    const currentPlayerIds = new Set();

    // Update or create remote players
    data.players.forEach((playerData) => {
      // Skip ourselves
      if (playerData.userId === myUserId) return;

      currentPlayerIds.add(playerData.userId);

      if (this.remotePlayers.has(playerData.userId)) {
        // Update existing remote player
        const remotePlayer = this.remotePlayers.get(playerData.userId);
        remotePlayer.updateState(playerData);
      } else {
        // Create new remote player
        const remotePlayer = new RemotePlayer(this, playerData.userId, playerData);
        this.remotePlayers.set(playerData.userId, remotePlayer);
      }
    });

    // Remove players that are no longer in the update
    this.remotePlayers.forEach((remotePlayer, userId) => {
      if (!currentPlayerIds.has(userId)) {
        remotePlayer.destroy();
        this.remotePlayers.delete(userId);
      }
    });
  }

  /**
   * Migrate old character stats to new base values
   * Converts old format (100 HP, 10 attack) to new format (10 HP, 1 attack)
   */
  migrateCharacterStats(characterData) {
    if (!characterData.stats) return;

    // Check if using old stats format (health > 50 indicates old format)
    if (characterData.stats.maxHealth > 50 || characterData.stats.attackStrength > 5) {
      // Calculate equipment bonuses (difference from base)
      const oldBaseHealth = 100;
      const oldBaseAttack = 10;
      const healthBonus = characterData.stats.maxHealth - oldBaseHealth;
      const attackBonus = characterData.stats.attackStrength - oldBaseAttack;

      // Apply new base stats + equipment bonuses
      const newBaseHealth = 10;
      const newBaseAttack = 1;

      characterData.stats.maxHealth = newBaseHealth + healthBonus;
      characterData.stats.health = Math.min(
        characterData.stats.health,
        characterData.stats.maxHealth
      );
      characterData.stats.attackStrength = newBaseAttack + attackBonus;

      // Save the migrated data
      this.storage.saveCharacter(characterData);
    }
  }
}
