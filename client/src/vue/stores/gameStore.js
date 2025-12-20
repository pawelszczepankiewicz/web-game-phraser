import { defineStore } from "pinia";
import { PLAYER_DEFAULT_STATS } from "../../shared/constants.js";

/**
 * Game Store - Centralized state management for game data
 * This store is shared between Phaser and Vue components
 *
 * NOTE: Stats are managed by StatsSystem (single source of truth).
 * This store just holds reactive copies for Vue UI display.
 */
export const useGameStore = defineStore("game", {
  state: () => ({
    // Character info
    character: {
      name: "",
      map: "",
      x: 0,
      y: 0,
    },

    // Stats - defaults from shared/constants.js, updated by StatsSystem
    stats: { ...PLAYER_DEFAULT_STATS },

    // Inventory
    inventory: {
      backpack: [],
      equipped: {
        helmet: null,
        armor: null,
        weapon: null,
        shield: null,
        boots: null,
        amulet: null,
        ring_left: null,
        ring_right: null,
      },
    },

    // Quests
    quests: {
      active: [],
      completed: [],
    },

    // UI state
    ui: {
      statsVisible: false,
      inventoryVisible: false,
      questsVisible: false,
      lootVisible: false,
      npcInteractionVisible: false,
      tradeVisible: false,
      npcQuestsVisible: false,
    },

    // Loot bag state
    loot: {
      lootBagRef: null, // Reference to the loot bag entity
      items: [], // Items in the loot bag
    },

    // NPC interaction state
    npc: {
      currentNPC: null, // { npc, name, isTrader, isQuestGiver }
    },

    // Trading state
    trade: {
      traderName: "",
      traderInventory: [],
    },

    // Gold
    gold: 0,

    // Quick action slots (1-3 keys)
    quickSlots: Array(3).fill(null),

    // Toast messages
    toasts: [],
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
    activeQuestCount: (state) => state.quests.active.length,
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

    // Stats actions - just receives updates from StatsSystem (source of truth)
    updateStats(stats) {
      this.stats = { ...this.stats, ...stats };
    },

    // Inventory actions
    updateInventory(inventory) {
      this.inventory = { ...this.inventory, ...inventory };
      // Also update gold if present in inventory
      if (inventory.gold !== undefined) {
        this.gold = inventory.gold;
      }
    },

    addItemToBackpack(item) {
      this.inventory.backpack.push(item);
    },

    removeItemFromBackpack(instanceId) {
      const index = this.inventory.backpack.findIndex((i) => i.instanceId === instanceId);
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
      // Create new arrays to ensure Vue reactivity
      this.quests = {
        active: quests.active ? [...quests.active] : [...this.quests.active],
        completed: quests.completed ? [...quests.completed] : [...this.quests.completed],
      };
    },

    addQuest(quest) {
      this.quests.active.push(quest);
    },

    updateQuestProgress(questId, objectiveIndex, amount) {
      const quest = this.quests.active.find((q) => q.id === questId);
      if (quest && quest.objectives[objectiveIndex]) {
        quest.objectives[objectiveIndex].current += amount;
      }
    },

    completeQuest(questId) {
      const index = this.quests.active.findIndex((q) => q.id === questId);
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
      this.ui.lootVisible = false;
    },

    // Loot bag actions
    openLootBag(lootBagRef, items) {
      this.loot.lootBagRef = lootBagRef;
      this.loot.items = items;
      this.ui.lootVisible = true;
    },

    closeLootBag() {
      this.ui.lootVisible = false;
      this.loot.lootBagRef = null;
      this.loot.items = [];
    },

    removeItemFromLoot(instanceId) {
      const index = this.loot.items.findIndex((item) => item.instanceId === instanceId);
      if (index !== -1) {
        this.loot.items.splice(index, 1);

        // If no items left, close the loot panel
        if (this.loot.items.length === 0) {
          this.closeLootBag();
        }
      }
    },

    // Load all game data
    loadGameData(data) {
      if (data.character) this.updateCharacter(data.character);
      if (data.stats) this.updateStats(data.stats);
      if (data.inventory) this.updateInventory(data.inventory);
      if (data.quests) this.updateQuests(data.quests);
    },

    // Toast actions
    showToast(message, type = "info", duration = 3000) {
      const toast = {
        id: Date.now() + Math.random(),
        message,
        type, // 'info', 'success', 'warning', 'error'
      };

      this.toasts.push(toast);

      // Auto-dismiss after duration
      setTimeout(() => {
        this.removeToast(toast.id);
      }, duration);
    },

    removeToast(id) {
      const index = this.toasts.findIndex((t) => t.id === id);
      if (index !== -1) {
        this.toasts.splice(index, 1);
      }
    },

    // NPC interaction actions
    showNPCInteraction(npcData) {
      this.npc.currentNPC = npcData;
      this.ui.npcInteractionVisible = true;
    },

    hideNPCInteraction() {
      this.ui.npcInteractionVisible = false;
      this.npc.currentNPC = null;
    },

    // Trading actions
    openTrade(traderName, traderInventory) {
      this.trade.traderName = traderName;
      this.trade.traderInventory = traderInventory;
      this.ui.tradeVisible = true;
      this.hideNPCInteraction(); // Close interaction popup when trade opens
    },

    closeTrade() {
      this.ui.tradeVisible = false;
      this.trade.traderName = "";
      this.trade.traderInventory = [];
    },

    // NPC Quest actions
    openNPCQuests(npcName) {
      this.ui.npcQuestsVisible = true;
      this.hideNPCInteraction(); // Close interaction popup when quest panel opens
    },

    closeNPCQuests() {
      this.ui.npcQuestsVisible = false;
    },

    // Gold actions
    updateGold(amount) {
      this.gold = amount;
    },

    addGold(amount) {
      this.gold += amount;
    },

    removeGold(amount) {
      this.gold -= amount;
      if (this.gold < 0) this.gold = 0;
    },

    // Quick slot actions
    assignQuickSlot(slotIndex, item) {
      if (slotIndex >= 0 && slotIndex < 10) {
        // Check if item is already assigned to another slot
        const existingSlotIndex = this.quickSlots.findIndex(
          (slotItem) => slotItem && slotItem.instanceId === item.instanceId
        );

        // Create a new array to trigger reactivity
        const newSlots = [...this.quickSlots];

        // If trying to assign the same item to the same slot, remove it (toggle off)
        if (existingSlotIndex === slotIndex) {
          newSlots[slotIndex] = null;
          this.quickSlots = newSlots;
          return;
        }

        // If item exists in another slot, remove it from that slot first
        if (existingSlotIndex !== -1 && existingSlotIndex !== slotIndex) {
          newSlots[existingSlotIndex] = null;
        }

        // Assign item to the new slot
        newSlots[slotIndex] = item;
        this.quickSlots = newSlots;
      }
    },

    unassignQuickSlot(slotIndex) {
      if (slotIndex >= 0 && slotIndex < 10) {
        // Create a new array to trigger reactivity
        const newSlots = [...this.quickSlots];
        newSlots[slotIndex] = null;
        this.quickSlots = newSlots;
      }
    },

    updateQuickSlots(quickSlots) {
      this.quickSlots = [...quickSlots];
    },

    // Update quick slot item (when quantity changes)
    updateQuickSlotItem(slotIndex, updatedItem) {
      if (slotIndex >= 0 && slotIndex < 3 && this.quickSlots[slotIndex]) {
        // Create a new array to trigger reactivity
        const newSlots = [...this.quickSlots];
        newSlots[slotIndex] = updatedItem;
        this.quickSlots = newSlots;
      }
    },
  },
});
