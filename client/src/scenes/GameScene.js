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
import { tileHasCollision, getCollisionBox, getTilesetProperties } from "../utils/TileUtils.js";
import { getItem } from "../shared/data/Items.js";
import { rollPropLoot } from "../shared/data/LootTables.js";

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

    // Track looted props to prevent re-looting (key: "x,y")
    this.lootedProps = new Set();

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
    this.hoveredLootProp = null; // Track hovered lootable prop for visual feedback

    // Handle hover effects for lootable props
    this.input.on("pointermove", (pointer) => {
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;

      // Check if hovering over a lootable prop
      const lootableProp = this.getLootablePropAtPosition(worldX, worldY);

      if (lootableProp) {
        // Change cursor to pointer
        this.input.setDefaultCursor("pointer");

        // Highlight the prop if different from currently hovered
        if (!this.hoveredLootProp || this.hoveredLootProp.propKey !== lootableProp.propKey) {
          // Remove highlight from previous prop
          this.unhighlightLootProp();

          // Highlight new prop
          this.highlightLootProp(lootableProp);
          this.hoveredLootProp = lootableProp;
        }
      } else {
        // Reset cursor
        this.input.setDefaultCursor("default");

        // Remove highlight
        if (this.hoveredLootProp) {
          this.unhighlightLootProp();
          this.hoveredLootProp = null;
        }
      }
    });

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
        return;
      }

      // Check if clicking on a lootable prop
      const lootableProp = this.getLootablePropAtPosition(worldX, worldY);
      if (lootableProp) {
        // Check if player is close enough to loot (100 pixels)
        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          lootableProp.worldX + lootableProp.width / 2,
          lootableProp.worldY + lootableProp.height / 2
        );

        if (distance <= 100) {
          // Loot the prop immediately
          this.lootProp(lootableProp);
          this.targetPosition = null;
        } else {
          // Move toward prop to loot it
          this.targetPosition = {
            x: lootableProp.worldX + lootableProp.width / 2,
            y: lootableProp.worldY + lootableProp.height / 2,
          };
          // Store pending loot action
          this.pendingLootProp = lootableProp;
        }
        this.targetMonster = null;
        return;
      }

      // Clear target monster when clicking elsewhere
      this.targetMonster = null;
      this.pendingLootProp = null;

      if (shiftHeld && this.player.hasRangedWeapon()) {
        // Shift+click with ranged weapon: fire at position
        this.player.attackPosition(worldX, worldY);
        this.targetPosition = null;
      } else if (!shiftHeld) {
        // Set target position for player to move towards
        this.targetPosition = { x: worldX, y: worldY };
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

      // Preserve quick slots from Vue store
      const store = window.__GAME_STORE__;
      if (store) {
        characterData.quickSlots = store.quickSlots;
      }

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

    // Fade in from black
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

    // Draw lootable prop areas (yellow borders)
    this.drawLootablePropsDebug();
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
   * Draw lootable props debug visuals
   */
  drawLootablePropsDebug() {
    const tilemap = this.mapManager.getTilemap();
    if (!tilemap) return;

    const lootGraphics = this.add.graphics();
    lootGraphics.setDepth(680);

    const clickPadding = 10;
    let lootableCount = 0;

    // Check ground layer tiles for lootType (barrels, etc.)
    const groundLayer = this.mapManager.layers.ground;
    if (groundLayer) {
      groundLayer.forEachTile((tile) => {
        if (!tile || tile.index <= 0) return;

        // Check if tile has lootType
        let lootType = tile.properties?.lootType;
        if (!lootType) {
          const tilesetProps = getTilesetProperties(tile);
          lootType = tilesetProps?.lootType;
        }

        if (lootType) {
          const propKey = `ground_${tile.x},${tile.y}`;
          if (this.lootedProps.has(propKey)) return; // Skip already looted

          lootableCount++;
          const worldPos = tilemap.tileToWorldXY(tile.x, tile.y);

          // Draw yellow rectangle around lootable tile
          lootGraphics.lineStyle(2, 0xffff00, 0.9);
          lootGraphics.fillStyle(0xffff00, 0.15);
          lootGraphics.strokeRect(
            worldPos.x - clickPadding,
            worldPos.y - clickPadding,
            tilemap.tileWidth + clickPadding * 2,
            tilemap.tileHeight + clickPadding * 2
          );
          lootGraphics.fillRect(
            worldPos.x - clickPadding,
            worldPos.y - clickPadding,
            tilemap.tileWidth + clickPadding * 2,
            tilemap.tileHeight + clickPadding * 2
          );

          // Draw loot type label
          const labelText = this.add.text(
            worldPos.x + tilemap.tileWidth / 2,
            worldPos.y - 5,
            lootType,
            {
              fontSize: "10px",
              fill: "#ffff00",
              stroke: "#000000",
              strokeThickness: 2,
            }
          );
          labelText.setOrigin(0.5, 1);
          labelText.setDepth(681);
        }
      });
    }

    // Also check props layer sprites
    const propsLayer = this.mapManager.layers.props;
    const propSprites = this.mapManager.dynamicPropSprites || [];

    for (const sprite of propSprites) {
      if (sprite.layerName !== "props") continue;
      if (sprite.tileX === undefined || sprite.tileY === undefined) continue;

      const tile = propsLayer?.getTileAt(sprite.tileX, sprite.tileY);
      if (!tile) continue;

      let lootType = tile.properties?.lootType;
      if (!lootType) {
        const tilesetProps = getTilesetProperties(tile);
        lootType = tilesetProps?.lootType;
      }

      if (lootType) {
        const propKey = `props_${sprite.tileX},${sprite.tileY}`;
        if (this.lootedProps.has(propKey)) continue;

        lootableCount++;
        const bounds = sprite.getBounds();
        lootGraphics.lineStyle(2, 0xffff00, 0.9);
        lootGraphics.fillStyle(0xffff00, 0.15);
        lootGraphics.strokeRect(
          bounds.x - clickPadding,
          bounds.y - clickPadding,
          bounds.width + clickPadding * 2,
          bounds.height + clickPadding * 2
        );
        lootGraphics.fillRect(
          bounds.x - clickPadding,
          bounds.y - clickPadding,
          bounds.width + clickPadding * 2,
          bounds.height + clickPadding * 2
        );

        const labelText = this.add.text(bounds.x + bounds.width / 2, bounds.y - 5, lootType, {
          fontSize: "10px",
          fill: "#ffff00",
          stroke: "#000000",
          strokeThickness: 2,
        });
        labelText.setOrigin(0.5, 1);
        labelText.setDepth(681);
      }
    }
  }

  /**
   * Connect to Vue store
   */
  connectToVue() {
    // Get character data including quick slots
    const characterData = window.GAME_CHARACTER_DATA;

    // Load initial game data into Vue store
    const gameData = {
      character: {
        name: characterData?.name || "character name",
        map: this.mapManager.getCurrentMapKey(),
        x: this.player.x,
        y: this.player.y,
      },
      stats: this.statsSystem.exportStats(),
      inventory: this.inventorySystem.exportInventory(),
      quests: this.questSystem.exportQuests(),
      quickSlots: characterData?.quickSlots || [null, null, null],
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

    // Get quick slots from Vue store
    const store = window.__GAME_STORE__;
    if (store) {
      characterData.quickSlots = store.quickSlots;
    }

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

    // Get quick slots from Vue store
    const store = window.__GAME_STORE__;
    if (store) {
      characterData.quickSlots = store.quickSlots;
    }

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

          // Check for pending loot prop
          if (this.pendingLootProp) {
            this.lootProp(this.pendingLootProp);
            this.pendingLootProp = null;
          }
        } else {
          // Normalize direction vector
          velocityX = dx / distance;
          velocityY = dy / distance;
        }
      }

      // Calculate intended new position
      const speed = (this.statsSystem ? this.statsSystem.getStat("speed") : 150) || 150;
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

  /**
   * Get lootable prop at position
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @returns {Object|null} Prop data with lootType, position, and tile info
   */
  getLootablePropAtPosition(worldX, worldY) {
    try {
      const tilemap = this.mapManager.getTilemap();
      if (!tilemap) return null;

      const propsLayer = this.mapManager.layers.props;
      const groundLayer = this.mapManager.layers.ground;
      const clickPadding = 10;

      // First, check if clicking on any dynamic prop sprite directly
      // This is more accurate for isometric maps where tile positions can be offset
      const propSprites = this.mapManager.dynamicPropSprites || [];
      for (const sprite of propSprites) {
        // Only check props layer sprites
        if (sprite.layerName !== "props") continue;

        // Check if click is within expanded sprite bounds
        const bounds = sprite.getBounds();
        const expandedBounds = new Phaser.Geom.Rectangle(
          bounds.x - clickPadding,
          bounds.y - clickPadding,
          bounds.width + clickPadding * 2,
          bounds.height + clickPadding * 2
        );
        if (expandedBounds.contains(worldX, worldY)) {
          if (sprite.tileX === undefined || sprite.tileY === undefined) continue;

          const tileX = sprite.tileX;
          const tileY = sprite.tileY;

          const tile = propsLayer?.getTileAt(tileX, tileY);
          if (!tile) continue;

          let lootType = tile.properties?.lootType;
          if (!lootType) {
            const tilesetProps = getTilesetProperties(tile);
            lootType = tilesetProps?.lootType;
          }
          if (!lootType) continue;

          const propKey = `props_${tileX},${tileY}`;
          if (this.lootedProps.has(propKey)) continue;

          const tileWorldPos = tilemap.tileToWorldXY(tileX, tileY);

          return {
            lootType: lootType,
            tileX: tileX,
            tileY: tileY,
            worldX: tileWorldPos.x,
            worldY: tileWorldPos.y,
            width: tilemap.tileWidth,
            height: tile.height || tilemap.tileHeight,
            tile: tile,
            propKey: propKey,
            sprite: sprite,
            layer: "props",
          };
        }
      }

      // Check tile grid directly (for ground layer lootables like barrels)
      const tilePos = tilemap.worldToTileXY(worldX, worldY);
      if (!tilePos || tilePos.x === undefined || tilePos.y === undefined) return null;

      const tilesToCheck = [
        { x: Math.floor(tilePos.x), y: Math.floor(tilePos.y) },
        { x: Math.floor(tilePos.x), y: Math.floor(tilePos.y) - 1 },
        { x: Math.floor(tilePos.x), y: Math.floor(tilePos.y) + 1 },
        { x: Math.floor(tilePos.x) - 1, y: Math.floor(tilePos.y) },
        { x: Math.floor(tilePos.x) + 1, y: Math.floor(tilePos.y) },
      ];

      // Check ground layer first (for barrels, etc.)
      if (groundLayer) {
        for (const pos of tilesToCheck) {
          const tileX = pos.x;
          const tileY = pos.y;

          if (tileX < 0 || tileY < 0 || tileX >= tilemap.width || tileY >= tilemap.height) {
            continue;
          }

          const tile = groundLayer.getTileAt(tileX, tileY);
          if (!tile || tile.index <= 0) continue;

          let lootType = tile.properties?.lootType;
          if (!lootType) {
            const tilesetProps = getTilesetProperties(tile);
            lootType = tilesetProps?.lootType;
          }
          if (!lootType) continue;

          const propKey = `ground_${tileX},${tileY}`;
          if (this.lootedProps.has(propKey)) continue;

          const tileWorldPos = tilemap.tileToWorldXY(tileX, tileY);
          if (!tileWorldPos) continue;

          return {
            lootType: lootType,
            tileX: tileX,
            tileY: tileY,
            worldX: tileWorldPos.x,
            worldY: tileWorldPos.y,
            width: tilemap.tileWidth,
            height: tilemap.tileHeight,
            tile: tile,
            propKey: propKey,
            layer: "ground",
          };
        }
      }

      // Also check props layer
      if (propsLayer) {
        for (const pos of tilesToCheck) {
          const tileX = pos.x;
          const tileY = pos.y;

          if (tileX < 0 || tileY < 0 || tileX >= tilemap.width || tileY >= tilemap.height) {
            continue;
          }

          const tile = propsLayer.getTileAt(tileX, tileY);
          if (!tile) continue;

          let lootType = tile.properties?.lootType;
          if (!lootType) {
            const tilesetProps = getTilesetProperties(tile);
            lootType = tilesetProps?.lootType;
          }
          if (!lootType) continue;

          const propKey = `props_${tileX},${tileY}`;
          if (this.lootedProps.has(propKey)) continue;

          const tileWorldPos = tilemap.tileToWorldXY(tileX, tileY);
          if (!tileWorldPos) continue;

          return {
            lootType: lootType,
            tileX: tileX,
            tileY: tileY,
            worldX: tileWorldPos.x,
            worldY: tileWorldPos.y,
            width: tilemap.tileWidth,
            height: tile.height || tilemap.tileHeight,
            tile: tile,
            propKey: propKey,
            layer: "props",
          };
        }
      }

      return null;
    } catch (error) {
      // Silently fail if there's any issue with coordinate conversion
      return null;
    }
  }

  /**
   * Loot a prop and create a loot bag
   * @param {Object} propData - Data from getLootablePropAtPosition
   */
  lootProp(propData) {
    if (!propData || !propData.lootType) return;

    // Mark as looted
    this.lootedProps.add(propData.propKey);

    // Roll for loot
    const lootItems = rollPropLoot(propData.lootType);

    // Create loot bag if there's loot
    if (lootItems.length > 0 && this.lootBagManager) {
      this.lootBagManager.createLootBag({
        x: propData.worldX + propData.width / 2,
        y: propData.worldY + propData.height / 2,
        items: lootItems,
        createdAt: Date.now(),
      });

      // Play loot sound
      if (this.soundManager) {
        this.soundManager.play("pickup");
      }
    } else {
      // Show "empty" toast if no loot
      VueBridge.showToast("Empty...", "info", 1500);
    }

    // Hide the prop tile (make it appear looted)
    if (propData.tile) {
      propData.tile.setAlpha(0);
    }

    // Also hide corresponding sprite if it exists
    const propSprites = this.mapManager.dynamicPropSprites || [];
    for (const sprite of propSprites) {
      // Check if sprite is at this tile position
      const spriteWorldPos = this.mapManager
        .getTilemap()
        .tileToWorldXY(propData.tileX, propData.tileY);
      if (
        Math.abs(sprite.x - spriteWorldPos.x) < 5 &&
        Math.abs(sprite.y - (spriteWorldPos.y + propData.height)) < 5
      ) {
        sprite.setAlpha(0);
        break;
      }
    }
  }

  /**
   * Highlight a lootable prop with a golden tint
   * @param {Object} propData - Prop data from getLootablePropAtPosition
   */
  highlightLootProp(propData) {
    if (!propData) return;

    // Find the sprite for this prop
    const propSprites = this.mapManager.dynamicPropSprites || [];
    const tilemap = this.mapManager.getTilemap();
    if (!tilemap) return;

    const spriteWorldPos = tilemap.tileToWorldXY(propData.tileX, propData.tileY);
    if (!spriteWorldPos) return;

    for (const sprite of propSprites) {
      if (
        Math.abs(sprite.x - spriteWorldPos.x) < 5 &&
        Math.abs(sprite.y - (spriteWorldPos.y + propData.height)) < 5
      ) {
        // Store original tint and apply golden highlight
        sprite._originalTint = sprite.tintTopLeft;
        sprite.setTint(0xffdd88); // Golden tint
        this.highlightedSprite = sprite;
        return;
      }
    }

    // If no sprite found, highlight the tile directly
    if (propData.tile) {
      propData.tile._originalTint = propData.tile.tint;
      propData.tile.tint = 0xffdd88;
      this.highlightedTile = propData.tile;
    }
  }

  /**
   * Remove highlight from the currently highlighted prop
   */
  unhighlightLootProp() {
    // Unhighlight sprite
    if (this.highlightedSprite) {
      if (this.highlightedSprite._originalTint !== undefined) {
        this.highlightedSprite.clearTint();
      } else {
        this.highlightedSprite.clearTint();
      }
      this.highlightedSprite = null;
    }

    // Unhighlight tile
    if (this.highlightedTile) {
      if (this.highlightedTile._originalTint !== undefined) {
        this.highlightedTile.tint = this.highlightedTile._originalTint;
      } else {
        this.highlightedTile.tint = 0xffffff;
      }
      this.highlightedTile = null;
    }
  }
}
