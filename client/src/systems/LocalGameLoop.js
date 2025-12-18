import { rollMonsterLoot } from "../shared/data/Monsters.js";
import { LOOT_BAG_DESPAWN_TIME } from "../shared/constants.js";

/**
 * LocalGameLoop - Coordinates all local game systems for single-player mode
 * Replaces the server's GameStateManager with client-side game logic
 */
export class LocalGameLoop {
  constructor(scene) {
    this.scene = scene;
    this.isRunning = false;
  }

  /**
   * Start the local game loop
   * Called after all systems are initialized
   */
  start() {
    this.isRunning = true;

    // Listen for monster death events to handle loot
    this.scene.events.on("monster-killed", this.onMonsterKilled, this);
  }

  /**
   * Stop the local game loop
   */
  stop() {
    this.isRunning = false;
    this.scene.events.off("monster-killed", this.onMonsterKilled, this);
  }

  /**
   * Main update loop - called by GameScene.update()
   * @param {number} time - Current time
   * @param {number} delta - Delta time in ms
   */
  update(time, delta) {
    if (!this.isRunning) return;

    // 1. Update monsters and collect attack results
    const attackResults = this.updateMonsters(time, delta);

    // 2. Process monster attacks (melee and ranged)
    this.processMonsterAttacks(attackResults);

    // 3. Update projectiles with collision detection
    this.updateProjectiles(time, delta);

    // 4. Check loot bag despawns
    this.checkLootBagDespawns();
  }

  /**
   * Update all monsters
   * @param {number} time - Current time
   * @param {number} delta - Delta time in ms
   * @returns {Array} Attack results from monsters
   */
  updateMonsters(time, delta) {
    if (!this.scene.localMonsterManager) return [];
    return this.scene.localMonsterManager.update(time, delta);
  }

  /**
   * Process monster attacks (melee and ranged)
   * @param {Array} attackResults - Attack results from monster updates
   */
  processMonsterAttacks(attackResults) {
    if (!this.scene.localCombatSystem || attackResults.length === 0) return;
    this.scene.localCombatSystem.processAttackResults(attackResults);
  }

  /**
   * Update projectiles with collision detection
   * @param {number} time - Current time
   * @param {number} delta - Delta time in ms
   */
  updateProjectiles(time, delta) {
    if (!this.scene.projectileManager) return;
    this.scene.projectileManager.updateLocal(time, delta);
  }

  /**
   * Check for loot bags that should despawn
   */
  checkLootBagDespawns() {
    if (!this.scene.lootBagManager) return;

    const now = Date.now();
    const despawnTime = LOOT_BAG_DESPAWN_TIME;

    // Check each loot bag
    const lootBags = this.scene.lootBagManager.getLootBags
      ? this.scene.lootBagManager.getLootBags()
      : [];

    for (const lootBag of lootBags) {
      if (lootBag.createdAt && now - lootBag.createdAt >= despawnTime) {
        this.scene.lootBagManager.removeLootBag(lootBag.id);
      }
    }
  }

  /**
   * Handle monster killed event
   * @param {Object} data - Monster death data { monsterId, monsterType, x, y }
   */
  onMonsterKilled(data) {
    const { monsterType, x, y } = data;

    // Roll loot
    const lootItems = rollMonsterLoot(monsterType);

    // Create loot bag if there's loot
    if (lootItems.length > 0 && this.scene.lootBagManager) {
      this.scene.lootBagManager.createLootBag({
        x: x,
        y: y,
        items: lootItems,
        createdAt: Date.now(),
      });
    }

    // Update quest progress
    this.updateQuestProgress(monsterType);
  }

  /**
   * Update quest progress for monster kill
   * @param {string} monsterType - Type of monster killed
   */
  updateQuestProgress(monsterType) {
    if (!this.scene.questSystem) return;

    // Check if any active quest has this monster as an objective
    const quests = this.scene.questSystem.getActiveQuests
      ? this.scene.questSystem.getActiveQuests()
      : [];

    let questUpdated = false;

    for (const quest of quests) {
      if (!quest.objectives) continue;

      for (const objective of quest.objectives) {
        if (objective.type === "kill" && objective.target === monsterType) {
          // Increment progress
          objective.current = (objective.current || 0) + 1;
          questUpdated = true;

          // Check if objective is complete
          if (objective.current >= objective.required) {
          }
        }
      }
    }

    // Update UI if quest was updated
    if (questUpdated && this.scene.questSystem.updateUI) {
      this.scene.questSystem.updateUI();
    }
  }

  /**
   * Get the player reference
   * @returns {Player|null}
   */
  getPlayer() {
    return this.scene.player || null;
  }

  /**
   * Check if player is alive
   * @returns {boolean}
   */
  isPlayerAlive() {
    const player = this.getPlayer();
    if (!player) return false;

    const health = this.scene.statsSystem ? this.scene.statsSystem.getStat("health") : 0;

    return health > 0;
  }

  /**
   * Handle player death
   */
  handlePlayerDeath() {
    // Emit player death event for UI handling
    this.scene.events.emit("player-died");

    // Could add respawn logic here
  }
}
