import * as VueBridge from "../utils/VueBridge.js";
import { PLAYER_DEFAULT_STATS } from "../shared/constants.js";

/**
 * StatsSystem - Manages character statistics (SINGLE SOURCE OF TRUTH)
 * Automatically syncs to Vue gameStore for UI reactivity
 * Default values come from shared/constants.js PLAYER_DEFAULT_STATS
 */
export class StatsSystem {
  constructor(scene, initialStats) {
    this.scene = scene;
    this.stats = {
      ...PLAYER_DEFAULT_STATS,
      ...initialStats,
    };

    // Listeners for stat changes
    this.listeners = [];

    // Death callback
    this.deathCallback = null;

    // Death flag to prevent multiple death triggers
    this.isDead = false;

    // Initial sync to Vue store
    this.syncToVueStore();
  }

  /**
   * Sync stats to Vue store for UI reactivity
   */
  syncToVueStore() {
    VueBridge.updateStats(this.stats);
  }

  /**
   * Get a stat value
   */
  getStat(statName) {
    return this.stats[statName] || 0;
  }

  /**
   * Set a stat value
   */
  setStat(statName, value) {
    const oldValue = this.stats[statName];
    this.stats[statName] = value;

    // Enforce constraints
    if (statName === "health" && value > this.stats.maxHealth) {
      this.stats.health = this.stats.maxHealth;
    }

    // Notify listeners
    this.notifyListeners(statName, oldValue, this.stats[statName]);

    // Auto-sync to Vue store
    this.syncToVueStore();
  }

  /**
   * Modify a stat by a delta amount
   */
  modifyStat(statName, delta) {
    const currentValue = this.getStat(statName);
    this.setStat(statName, currentValue + delta);
  }

  /**
   * Get all stats
   */
  getAllStats() {
    return { ...this.stats };
  }

  /**
   * Update stats (called from scene update)
   */
  update() {
    // Future: Handle stat regeneration, status effects, etc.
  }

  /**
   * Add listener for stat changes
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of stat change
   */
  notifyListeners(statName, oldValue, newValue) {
    this.listeners.forEach((callback) => {
      callback(statName, oldValue, newValue);
    });
  }

  /**
   * Take damage
   */
  takeDamage(amount) {
    // Don't take damage if already dead
    if (this.isDead) {
      return 0;
    }

    const damageAfterArmor = Math.max(1, amount - this.stats.armor);
    this.modifyStat("health", -damageAfterArmor);

    if (this.stats.health <= 0) {
      this.stats.health = 0;
      this.onDeath();
    }

    return damageAfterArmor;
  }

  /**
   * Heal
   */
  heal(amount) {
    this.modifyStat("health", amount);
  }

  /**
   * Handle death
   */
  onDeath() {
    // Prevent multiple death triggers
    if (this.isDead) {
      return;
    }

    this.isDead = true;

    if (this.deathCallback) {
      this.deathCallback();
    }
  }

  /**
   * Set death callback
   */
  setDeathCallback(callback) {
    this.deathCallback = callback;
  }

  /**
   * Reset death state (called on respawn)
   */
  resetDeathState() {
    this.isDead = false;
  }

  /**
   * Export stats for saving
   */
  exportStats() {
    return { ...this.stats };
  }

  /**
   * Import stats from save data
   */
  importStats(stats) {
    this.stats = { ...this.stats, ...stats };
    // Reset death state when stats are imported (on respawn)
    this.isDead = false;
    this.notifyListeners("all", null, this.stats);
    // Auto-sync to Vue store
    this.syncToVueStore();
  }
}
