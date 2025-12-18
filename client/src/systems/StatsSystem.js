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

    // Enforce constraints - health must never exceed maxHealth
    if (statName === "health" && value > this.stats.maxHealth) {
      this.stats.health = this.stats.maxHealth;
    }
    // When maxHealth is reduced, clamp current health to new maximum
    if (statName === "maxHealth" && this.stats.health > value) {
      this.stats.health = value;
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
   * Take damage with block chance based on armor vs attacker strength
   * @param {number} amount - Raw damage amount
   * @param {number} attackerStrength - Attacker's strength (used for block calculation)
   * @returns {Object} { damage: number, blocked: boolean }
   */
  takeDamage(amount, attackerStrength = amount) {
    // Don't take damage if already dead
    if (this.isDead) {
      return { damage: 0, blocked: false };
    }

    // Calculate block chance: armor / (armor + attackerStrength)
    // Higher armor vs lower attacker strength = higher block chance
    const armor = this.stats.armor || 0;
    const blockChance = armor > 0 ? armor / (armor + attackerStrength) : 0;

    // Roll for block
    const blocked = Math.random() < blockChance;

    if (blocked) {
      return { damage: 0, blocked: true };
    }

    // Full damage if not blocked
    this.modifyStat("health", -amount);

    if (this.stats.health <= 0) {
      this.stats.health = 0;
      this.onDeath();
    }

    return { damage: amount, blocked: false };
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
