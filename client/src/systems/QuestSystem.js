import { getQuest, createQuestInstance } from '../data/Quests.js';

/**
 * QuestSystem - Manages quests
 */
export class QuestSystem {
  constructor(scene, initialQuests) {
    this.scene = scene;
    this.activeQuests = initialQuests?.active || [];
    this.completedQuests = initialQuests?.completed || [];

    // Listeners for quest changes
    this.listeners = [];
  }

  /**
   * Start a quest
   */
  startQuest(questId) {
    // Check if quest already active or completed
    if (this.isQuestActive(questId) || this.isQuestCompleted(questId)) {
      console.log('Quest already active or completed');
      return false;
    }

    const quest = createQuestInstance(questId);
    if (!quest) {
      console.error('Invalid quest ID:', questId);
      return false;
    }

    this.activeQuests.push(quest);
    this.notifyListeners('start', quest);
    console.log(`Quest started: ${quest.name}`);
    return true;
  }

  /**
   * Update quest progress
   */
  updateQuestProgress(questId, objectiveIndex, amount = 1) {
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest) return false;

    const objective = quest.objectives[objectiveIndex];
    if (!objective) return false;

    objective.current = Math.min(objective.current + amount, objective.required);

    // Check if quest is completed
    const allComplete = quest.objectives.every(obj => obj.current >= obj.required);
    if (allComplete) {
      this.completeQuest(questId);
    } else {
      this.notifyListeners('progress', quest);
    }

    return true;
  }

  /**
   * Complete a quest
   */
  completeQuest(questId) {
    const index = this.activeQuests.findIndex(q => q.id === questId);
    if (index === -1) return false;

    const quest = this.activeQuests[index];
    quest.completed = true;
    quest.status = 'completed';
    quest.completedAt = Date.now();

    // Remove from active
    this.activeQuests.splice(index, 1);

    // Add to completed
    this.completedQuests.push(quest);

    // NOTE: Rewards are NOT given automatically
    // Player must manually claim rewards from quest panel

    this.notifyListeners('complete', quest);
    console.log(`Quest completed: ${quest.name}`);
    return true;
  }

  /**
   * Give quest rewards
   */
  giveRewards(quest) {
    if (!quest.rewards) return;

    // Experience
    if (quest.rewards.experience) {
      // Future: Add experience to character
      console.log(`Gained ${quest.rewards.experience} experience`);
    }

    // Gold
    if (quest.rewards.gold) {
      // Future: Add gold to character
      console.log(`Gained ${quest.rewards.gold} gold`);
    }

    // Items
    if (quest.rewards.items && this.scene.inventorySystem) {
      quest.rewards.items.forEach(itemId => {
        this.scene.inventorySystem.addItem(itemId);
      });
    }
  }

  /**
   * Check if quest is active
   */
  isQuestActive(questId) {
    return this.activeQuests.some(q => q.id === questId);
  }

  /**
   * Check if quest is completed
   */
  isQuestCompleted(questId) {
    return this.completedQuests.some(q => q.id === questId);
  }

  /**
   * Get active quests
   */
  getActiveQuests() {
    return [...this.activeQuests];
  }

  /**
   * Get completed quests
   */
  getCompletedQuests() {
    return [...this.completedQuests];
  }

  /**
   * Add listener for quest changes
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
   * Notify listeners of quest change
   */
  notifyListeners(action, quest) {
    this.listeners.forEach(callback => {
      callback(action, quest);
    });
  }

  /**
   * Export quests for saving
   */
  exportQuests() {
    return {
      active: this.activeQuests,
      completed: this.completedQuests
    };
  }

  /**
   * Import quests from save data
   */
  importQuests(quests) {
    this.activeQuests = quests.active || [];
    this.completedQuests = quests.completed || [];
    this.notifyListeners('import', null);
  }
}
