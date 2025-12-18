import Phaser from "phaser";
import { Player } from "../entities/Player.js";
import { MapManager } from "../systems/MapManager.js";
import { CollisionManager } from "../systems/CollisionManager.js";
import { StatsSystem } from "../systems/StatsSystem.js";
import { InventorySystem } from "../systems/InventorySystem.js";
import { QuestSystem } from "../systems/QuestSystem.js";
import { LocalMonsterManager } from "../systems/LocalMonsterManager.js";
import { LocalCombatSystem } from "../systems/LocalCombatSystem.js";
import { LocalGameLoop } from "../systems/LocalGameLoop.js";
import { LootBagManager } from "../systems/LootBagManager.js";
import { NPCManager } from "../systems/NPCManager.js";
import { ProjectileManager } from "../systems/ProjectileManager.js";
import { SoundManager } from "../systems/SoundManager.js";
import * as VueBridge from "../utils/VueBridge.js";
import { firebasePersistence } from "../systems/FirebasePersistence.js";
import { tileHasCollision, getCollisionBox } from "../utils/TileUtils.js";
import { getItem } from "../shared/data/Items.js";

/**
 * GameScene - Main game scene
 */
export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    // Prevent infinite restart loops
    const now = Date.now();
    if (!window.__LAST_SCENE_CREATE_TIME__) {
      window.__LAST_SCENE_CREATE_TIME__ = now;
    } else {
      const timeSinceLastCreate = now - window.__LAST_SCENE_CREATE_TIME__;
      if (timeSinceLastCreate < 1000) {
        // Don't prevent the create, but warn about it
      }
      window.__LAST_SCENE_CREATE_TIME__ = now;
    }

    // Reset transitioning flag
    this.transitioning = false;

    // Load character data (set by LoginComponent via main.js from Firebase)
    const characterData = window.GAME_CHARACTER_DATA;
    if (!characterData) {
      return;
    }

    // Initialize systems
    this.mapManager = new MapManager(this);
    this.collisionManager = new CollisionManager(this);
    this.statsSystem = new StatsSystem(this, characterData.stats);
    this.inventorySystem = new InventorySystem(this, characterData.inventory);
    this.questSystem = new QuestSystem(this, characterData.quests);
    this.localMonsterManager = new LocalMonsterManager(this);
    this.localCombatSystem = new LocalCombatSystem(this);
    this.lootBagManager = new LootBagManager(this);
    this.npcManager = new NPCManager(this);
    this.projectileManager = new ProjectileManager(this);
    this.soundManager = new SoundManager(this);
    this.soundManager.initialize();
    this.soundManager.playMusic("quest");

    // Initialize local game loop for single-player mode
    this.localGameLoop = new LocalGameLoop(this);

    // Load map
    const tilemap = this.mapManager.loadMap(characterData.map);

    if (!tilemap) {
      return;
    }

    // Initialize collisions
    this.collisionManager.initializeFromMap(this.mapManager);

    // Get and store respawn point for this map
    this.respawnPoint = this.mapManager.getRespawnPoint();
    if (!this.respawnPoint) {
      this.respawnPoint = this.mapManager.getPlayerSpawnPoint(null);
    }

    // Determine spawn point based on fromMap or use saved position
    let spawnX, spawnY;

    if (characterData.fromMap) {
      // Coming from another map, use spawn point
      const spawnPoint = this.mapManager.getPlayerSpawnPoint(characterData.fromMap);
      spawnX = spawnPoint.x;
      spawnY = spawnPoint.y;

      // Clear fromMap after using it
      delete characterData.fromMap;
    } else if (characterData.useRespawnPoint) {
      // Respawning after death, use respawn point
      spawnX = this.respawnPoint.x;
      spawnY = this.respawnPoint.y;

      // IMPORTANT: Update characterData position to respawn point BEFORE saving
      characterData.x = spawnX;
      characterData.y = spawnY;

      // Clear flag and save with new position
      delete characterData.useRespawnPoint;
      window.GAME_CHARACTER_DATA = characterData;

      // Flag to send respawn after setupMultiplayer registers listeners
      this.pendingRespawn = { x: spawnX, y: spawnY };
    } else {
      // Use saved position (normal case)
      spawnX = characterData.x;
      spawnY = characterData.y;
    }

    // Create player
    this.player = new Player(this, spawnX, spawnY);

    // Restore health if respawning
    if (this.pendingRespawn) {
      this.pendingRespawn = null;

      if (this.statsSystem) {
        const maxHealth = this.statsSystem.getStat("maxHealth");
        this.statsSystem.setStat("health", maxHealth);
        this.statsSystem.resetDeathState();
      }
    }

    // Initialize local monsters from map (single-player mode)
    this.localMonsterManager.initializeFromMap(this.mapManager);

    // Start the local game loop
    this.localGameLoop.start();

    // Initialize NPCs from map
    this.npcManager.spawnNPCsFromMap(this.mapManager);

    // Setup death callback for stats system
    this.statsSystem.setDeathCallback(() => {
      // Prevent death immediately after spawning (grace period)
      const timeSinceCreate = Date.now() - window.__LAST_SCENE_CREATE_TIME__;
      if (timeSinceCreate < 2000) {
        // Reset health to prevent immediate death loop
        this.statsSystem.stats.health = this.statsSystem.stats.maxHealth;
        this.statsSystem.isDead = false;
        return;
      }

      // Call player die method which emits the "player-death" event
      this.player.die();
    });

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
    this.targetMonster = null; // Monster to auto-attack while in range
    this.input.on("pointerdown", (pointer) => {
      // Check if loot bag is open - don't process clicks if it is
      const store = window.__GAME_STORE__;
      const lootBagOpen = store && store.ui.lootVisible;
      if (lootBagOpen) return;

      // Convert screen coordinates to world coordinates
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      // Check if shift key is held (attack without moving)
      const shiftHeld = pointer.event.shiftKey;

      // Check if clicking on a monster (use local monster manager)
      const monster = this.localMonsterManager.getMonsterAtPosition(worldX, worldY);
      if (monster) {
        // Set target monster for continuous attacking
        this.targetMonster = monster;

        // Try to attack immediately - use appropriate attack method
        if (this.player.hasRangedWeapon()) {
          // Ranged weapon: fire projectile at monster position
          this.player.attackPosition(monster.x, monster.y);
        } else {
          // Melee weapon: direct attack
          this.player.attackMonster(monster);
        }

        // If shift is held, don't move toward the monster
        if (!shiftHeld && !this.player.canAttackMonster(monster)) {
          // Move toward monster to get in range
          this.targetPosition = { x: monster.x, y: monster.y };
        } else {
          // Clear movement target when shift-attacking or already in range
          this.targetPosition = null;
        }
      } else {
        // Clear target monster when clicking elsewhere
        this.targetMonster = null;

        if (shiftHeld && this.player.hasRangedWeapon()) {
          // Shift+click with ranged weapon: fire at position
          this.player.attackPosition(worldX, worldY);
          this.targetPosition = null;
        } else if (!shiftHeld) {
          // Set target position for player to move towards
          this.targetPosition = { x: worldX, y: worldY };
        }
      }
    });

    // Initialize portals
    this.initializePortals();

    // Connect to Vue store
    this.connectToVue();

    // Register shutdown handler to clean up sounds on scene restart/stop
    this.events.on("shutdown", this.shutdown, this);

    // Listen for player death
    this.events.on("player-death", () => {
      // Close any open UI panels
      VueBridge.closeLootBag();

      // Get current character data
      const characterData = window.GAME_CHARACTER_DATA;

      // Keep player in current map (don't send to starting_map)
      characterData.map = this.mapManager.getCurrentMapKey();
      characterData.useRespawnPoint = true; // Flag to use respawn point

      // Reset health to full
      const currentStats = this.statsSystem.exportStats();
      currentStats.health = currentStats.maxHealth;
      characterData.stats = currentStats;

      // IMPORTANT: Preserve all inventory including equipped items
      characterData.inventory = this.inventorySystem.exportInventory();
      characterData.quests = this.questSystem.exportQuests();

      // Save to window global
      window.GAME_CHARACTER_DATA = characterData;

      // Fade out, then restart scene
      this.cameras.main.fadeOut(200, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.restart();
      });
    });

    // Listen for monster kills (from LocalMonsterManager)
    this.events.on("monster-killed", (data) => {
      // Play monster death sound
      if (this.soundManager) {
        this.soundManager.play("monster_death");
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

    // Add debug visuals\
    if (this.game.config.physics.arcade.debug) {
      this.createDebugVisuals(tilemap);

      // Create hitbox debug graphics
      this.hitboxDebugGraphics = this.add.graphics();
      this.hitboxDebugGraphics.setDepth(1001);

      // Create player position marker (green circle)
      this.playerMarker = this.add.graphics();
      this.playerMarker.setDepth(1000);
    }

    // Fade in from black (500ms)
    this.cameras.main.fadeIn(200, 0, 0, 0);
  }

  /**
   * Create debug visuals
   */
  createDebugVisuals() {
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

    collisionGraphics.lineStyle(2, 0xffff00, 0.6);

    for (const layerName in layers) {
      const layer = layers[layerName];

      // Iterate through all tiles in the layer
      for (let y = 0; y < tilemap.height; y++) {
        for (let x = 0; x < tilemap.width; x++) {
          const tile = layer.getTileAt(x, y);

          if (tile && tileHasCollision(tile)) {
            const worldPos = tilemap.tileToWorldXY(x, y);
            if (worldPos) {
              // Get collision box using utility function
              const collisionBox = getCollisionBox(tile, worldPos, layerName);

              // Draw the actual collision box
              collisionGraphics.strokeRect(
                collisionBox.x,
                collisionBox.y,
                collisionBox.width,
                collisionBox.height
              );
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
    if (!this.localMonsterManager) return;

    const spawnGraphics = this.add.graphics();
    spawnGraphics.setDepth(670);

    // Get spawn data from local monster manager
    const spawnData = this.localMonsterManager.spawnData;

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
        name: "character name",
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
    // Use current item definition for visual properties so updates to Items.js take effect
    Object.entries(equipped).forEach(([slot, item]) => {
      if (item && item.visible) {
        const itemDef = getItem(item.itemId);
        const animatedSprite = itemDef?.animatedSprite ?? item.animatedSprite;
        const staticWearableSprite = itemDef?.staticWearableSprite ?? item.staticWearableSprite;
        if (animatedSprite || staticWearableSprite) {
          this.player.equipItem(slot, animatedSprite, staticWearableSprite);
        }
      }
    });

    // Set weapon data on player for attack range/cooldown calculations
    if (equipped.weapon) {
      this.player.setEquippedWeapon(equipped.weapon);
    }
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
    const characterData = window.GAME_CHARACTER_DATA;
    const currentMap = characterData.map;

    // Update map
    characterData.map = targetMapKey;
    characterData.fromMap = currentMap; // Save where we're coming from

    // Update with current state
    characterData.stats = this.statsSystem.exportStats();
    characterData.inventory = this.inventorySystem.exportInventory();
    characterData.quests = this.questSystem.exportQuests();

    // Save to window global
    window.GAME_CHARACTER_DATA = characterData;

    // Save to Firebase
    firebasePersistence.saveCharacter(characterData);

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
    const characterData = window.GAME_CHARACTER_DATA;
    characterData.map = this.mapManager.getCurrentMapKey();
    characterData.x = this.player.x;
    characterData.y = this.player.y;
    characterData.stats = this.statsSystem.exportStats();
    characterData.inventory = this.inventorySystem.exportInventory();
    characterData.quests = this.questSystem.exportQuests();

    // Save to window global
    window.GAME_CHARACTER_DATA = characterData;

    // Save directly to Firebase
    firebasePersistence.saveCharacter(characterData);
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

      // Auto-attack target monster if in range
      if (this.targetMonster && this.targetMonster.active) {
        // Check if monster is still alive and in range
        if (this.player.canAttackMonster(this.targetMonster)) {
          if (this.player.hasRangedWeapon()) {
            // Ranged weapon: fire projectile at monster position
            this.player.attackPosition(this.targetMonster.x, this.targetMonster.y);
          } else {
            // Melee weapon: direct attack
            this.player.attackMonster(this.targetMonster);
          }
        }
      } else if (this.targetMonster && !this.targetMonster.active) {
        // Clear dead monster target
        this.targetMonster = null;
      }

      // Check portal collisions
      this.checkPortalCollisions();

      // Update Vue store with player position
      VueBridge.updatePosition(this.player.x, this.player.y);
    }

    // Update player position marker
    if (this.playerMarker && this.player) {
      this.playerMarker.clear();
      this.playerMarker.fillStyle(0x00ff00, 0.8);
      this.playerMarker.fillCircle(this.player.x, this.player.y, 3);
    }

    // Update local game loop (handles monsters, combat, projectiles)
    if (this.localGameLoop) {
      this.localGameLoop.update(this.time.now, this.game.loop.delta);
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
    if (this.localMonsterManager) {
      const monsters = this.localMonsterManager.getMonsters();
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

    // Stop local game loop
    if (this.localGameLoop) {
      this.localGameLoop.stop();
    }

    // Stop all sounds and music to prevent duplication on map change
    if (this.soundManager) {
      this.soundManager.stopMusic();
      this.soundManager.stopAll();
    }

    // Cleanup local monsters
    if (this.localMonsterManager) {
      this.localMonsterManager.clear();
    }

    // Cleanup projectiles
    if (this.projectileManager) {
      this.projectileManager.clear();
    }
  }
}
