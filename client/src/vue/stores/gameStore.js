import { defineStore } from 'pinia';

/**
 * Game Store - Centralized state management for game data
 * This store is shared between Phaser and Vue components
 */
export const useGameStore = defineStore('game', {
  state: () => ({
    // Character info
    character: {
      name: '',
      map: '',
      x: 0,
      y: 0
    },

    // Stats
    stats: {
      health: 100,
      maxHealth: 100,
      attackStrength: 10,
      armor: 5
    },

    // Inventory
    inventory: {
      backpack: [],
      equipped: {
        helmet: null,
        armor: null,
        weapon: null,
        shield: null
      }
    },

    // Quests
    quests: {
      active: [],
      completed: []
    },

    // UI state
    ui: {
      statsVisible: false,
      inventoryVisible: false,
      questsVisible: false
    }
  }),

  getters: {
    // Character getters
    characterName: (state) => state.character.name,
    characterPosition: (state) => ({ x: state.character.x, y: state.character.y }),

    // Stats getters
    allStats: (state) => state.stats,
    healthPercentage: (state) => (state.stats.health / state.stats.maxHealth) * 100,

    // Inventory getters
    backpackItems: (state) => state.inventory.backpack,
    equippedItems: (state) => state.inventory.equipped,
    backpackCount: (state) => state.inventory.backpack.length,

    // Quest getters
    activeQuests: (state) => state.quests.active,
    completedQuests: (state) => state.quests.completed,
    activeQuestCount: (state) => state.quests.active.length
  },

  actions: {
    // Character actions
    updateCharacter(data) {
      this.character = { ...this.character, ...data };
    },

    updatePosition(x, y) {
      this.character.x = Math.round(x);
      this.character.y = Math.round(y);
    },

    // Stats actions
    updateStats(stats) {
      this.stats = { ...this.stats, ...stats };
    },

    modifyStat(statName, delta) {
      if (this.stats[statName] !== undefined) {
        this.stats[statName] += delta;

        // Enforce constraints
        if (statName === 'health' && this.stats.health > this.stats.maxHealth) {
          this.stats.health = this.stats.maxHealth;
        }
        if (this.stats.health < 0) {
          this.stats.health = 0;
        }
      }
    },

    // Inventory actions
    updateInventory(inventory) {
      this.inventory = { ...this.inventory, ...inventory };
    },

    addItemToBackpack(item) {
      this.inventory.backpack.push(item);
    },

    removeItemFromBackpack(instanceId) {
      const index = this.inventory.backpack.findIndex(i => i.instanceId === instanceId);
      if (index !== -1) {
        this.inventory.backpack.splice(index, 1);
      }
    },

    equipItem(slot, item) {
      this.inventory.equipped[slot] = item;
    },

    unequipItem(slot) {
      this.inventory.equipped[slot] = null;
    },

    // Quest actions
    updateQuests(quests) {
      this.quests = { ...this.quests, ...quests };
    },

    addQuest(quest) {
      this.quests.active.push(quest);
    },

    updateQuestProgress(questId, objectiveIndex, amount) {
      const quest = this.quests.active.find(q => q.id === questId);
      if (quest && quest.objectives[objectiveIndex]) {
        quest.objectives[objectiveIndex].current += amount;
      }
    },

    completeQuest(questId) {
      const index = this.quests.active.findIndex(q => q.id === questId);
      if (index !== -1) {
        const quest = this.quests.active[index];
        quest.completed = true;
        quest.completedAt = Date.now();
        this.quests.active.splice(index, 1);
        this.quests.completed.push(quest);
      }
    },

    // UI actions
    toggleStats() {
      this.ui.statsVisible = !this.ui.statsVisible;
    },

    toggleInventory() {
      this.ui.inventoryVisible = !this.ui.inventoryVisible;
    },

    toggleQuests() {
      this.ui.questsVisible = !this.ui.questsVisible;
    },

    closeAllPanels() {
      this.ui.statsVisible = false;
      this.ui.inventoryVisible = false;
      this.ui.questsVisible = false;
    },

    // Load all game data
    loadGameData(data) {
      if (data.character) this.updateCharacter(data.character);
      if (data.stats) this.updateStats(data.stats);
      if (data.inventory) this.updateInventory(data.inventory);
      if (data.quests) this.updateQuests(data.quests);
    }
  }
});
