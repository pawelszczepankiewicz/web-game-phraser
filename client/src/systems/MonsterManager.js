import { RemoteMonster } from "../entities/RemoteMonster.js";

/**
 * MonsterManager - Client-side monster rendering
 * Monsters are spawned and controlled by the server; this manager handles rendering
 */
export class MonsterManager {
  constructor(scene) {
    this.scene = scene;
    // monsterId -> RemoteMonster
    this.monsters = new Map();
    // Track last update time for each monster (for stale detection)
    this.lastSeenTime = new Map();
    // How long to keep monsters that go out of range (ms)
    this.staleTimeout = 5000;
  }

  /**
   * Update monsters from server state
   * Called every frame with the latest state-update from server
   * @param {Array} monsterStates - Array of monster state objects from server
   */
  updateFromServer(monsterStates) {
    if (!monsterStates) return;

    const now = Date.now();

    // Track which monsters we received updates for
    const updatedIds = new Set();

    for (const state of monsterStates) {
      updatedIds.add(state.id);
      this.lastSeenTime.set(state.id, now);

      // Check if we already have this monster
      if (this.monsters.has(state.id)) {
        // Update existing monster
        const monster = this.monsters.get(state.id);
        monster.updateFromServer(state);
        // Make sure it's visible (might have been hidden when out of range)
        if (!monster.visible) {
          monster.setVisible(true);
          if (monster.healthBarBg) monster.healthBarBg.setVisible(true);
          if (monster.healthBarFill) monster.healthBarFill.setVisible(true);
          if (monster.healthText) monster.healthText.setVisible(true);
        }
      } else {
        // Create new monster
        this.spawnMonster(state);
        this.lastSeenTime.set(state.id, now);
      }
    }

    // Handle monsters not in current update (out of interest range)
    // Don't destroy them immediately - just hide them
    // They'll be destroyed only if stale for too long or server says they died
    for (const [id, monster] of this.monsters.entries()) {
      if (!updatedIds.has(id)) {
        const lastSeen = this.lastSeenTime.get(id) || 0;
        const timeSinceLastSeen = now - lastSeen;

        if (timeSinceLastSeen > this.staleTimeout) {
          // Monster has been out of range too long, clean it up
          monster.destroy();
          this.monsters.delete(id);
          this.lastSeenTime.delete(id);
        } else {
          // Just hide the monster, keep it cached
          monster.setVisible(false);
          if (monster.healthBarBg) monster.healthBarBg.setVisible(false);
          if (monster.healthBarFill) monster.healthBarFill.setVisible(false);
          if (monster.healthText) monster.healthText.setVisible(false);
        }
      }
    }
  }

  /**
   * Spawn a monster from server state
   * @param {Object} state - Monster state from server
   * @returns {RemoteMonster}
   */
  spawnMonster(state) {
    const monster = new RemoteMonster(this.scene, state);
    this.monsters.set(state.id, monster);
    return monster;
  }

  /**
   * Handle monster damage from server
   * @param {Object} data - Damage event data
   */
  onMonsterDamaged(data) {
    const monster = this.monsters.get(data.monsterId);
    if (monster) {
      monster.health = data.health;
      monster.maxHealth = data.maxHealth;
      monster.updateHealthBar();
      monster.showDamage(data.damage);
    }
  }

  /**
   * Handle monster death from server
   * @param {Object} data - Death event data
   */
  onMonsterDied(data) {
    const monster = this.monsters.get(data.monsterId);
    if (monster) {
      monster.die();
      this.monsters.delete(data.monsterId);
    }

    // Emit event for quest tracking etc
    this.scene.events.emit("monster-killed", {
      monsterId: data.monsterId,
      monsterType: data.monsterType,
      killerId: data.killerId,
      x: data.x,
      y: data.y,
    });
  }

  /**
   * Update all monsters (interpolation)
   */
  update(time, delta) {
    for (const monster of this.monsters.values()) {
      if (monster.active) {
        monster.update(time, delta);
      }
    }
  }

  /**
   * Get monster at position (for clicking)
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @returns {RemoteMonster|null}
   */
  getMonsterAtPosition(x, y) {
    for (const monster of this.monsters.values()) {
      if (monster.active && monster.hitboxContains(x, y)) {
        return monster;
      }
    }
    return null;
  }

  /**
   * Get monster by ID
   * @param {string} id - Monster ID
   * @returns {RemoteMonster|null}
   */
  getMonsterById(id) {
    return this.monsters.get(id) || null;
  }

  /**
   * Get all active monsters
   * @returns {Array<RemoteMonster>}
   */
  getMonsters() {
    return Array.from(this.monsters.values()).filter((m) => m.active);
  }

  /**
   * Clear all monsters
   */
  clear() {
    for (const monster of this.monsters.values()) {
      if (monster.active) {
        monster.destroy();
      }
    }
    this.monsters.clear();
  }

  /**
   * Initialize - placeholder for compatibility
   * Monsters are spawned by server, not from map
   */
  initializeFromMap() {
    // No-op: Server handles spawning
    console.log("[MonsterManager] Waiting for server to send monsters...");
  }
}
