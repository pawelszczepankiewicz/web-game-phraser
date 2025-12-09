import { getQuest } from "../../../shared/data/Quests.js";

/**
 * QuestManager - Server-side quest validation
 * Tracks monster kills and validates quest progress
 */
export class QuestManager {
  constructor(playerManager, inventoryManager) {
    this.playerManager = playerManager;
    this.inventoryManager = inventoryManager;

    // Track kills per player: playerId -> { monsterType: count }
    this.playerKillCounts = new Map();
  }

  /**
   * Record a monster kill for a player
   * @param {string} playerId - The player who killed the monster
   * @param {string} monsterType - The type of monster killed
   */
  recordKill(playerId, monsterType) {
    if (!this.playerKillCounts.has(playerId)) {
      this.playerKillCounts.set(playerId, {});
    }

    const kills = this.playerKillCounts.get(playerId);
    kills[monsterType] = (kills[monsterType] || 0) + 1;

    return kills[monsterType];
  }

  /**
   * Get kill count for a player and monster type
   */
  getKillCount(playerId, monsterType) {
    const kills = this.playerKillCounts.get(playerId);
    return kills ? kills[monsterType] || 0 : 0;
  }

  /**
   * Accept a quest for a player
   * @param {Player} player - The player
   * @param {string} questId - Quest ID to accept
   * @returns {Object} Result
   */
  acceptQuest(player, questId) {
    if (!player) {
      return { success: false, reason: "invalid_player" };
    }

    const questData = getQuest(questId);
    if (!questData) {
      return { success: false, reason: "quest_not_found" };
    }

    // Check if already active
    if (player.quests.active.find((q) => q.id === questId)) {
      return { success: false, reason: "quest_already_active" };
    }

    // Check if already completed (and not repeatable)
    if (player.quests.completed.find((q) => q.id === questId)) {
      return { success: false, reason: "quest_already_completed" };
    }

    // Create quest instance with progress tracking
    const questInstance = {
      id: questId,
      name: questData.name,
      description: questData.description,
      giver: questData.giver,
      objectives: questData.objectives.map((obj) => ({
        ...obj,
        current: 0,
      })),
      rewards: questData.rewards,
      acceptedAt: Date.now(),
    };

    player.quests.active.push(questInstance);

    return { success: true, quest: questInstance };
  }

  /**
   * Update quest progress when monster is killed
   * @param {Player} player - The player
   * @param {string} monsterType - Monster type killed
   * @returns {Array} Updated quests
   */
  onMonsterKilled(player, monsterType) {
    if (!player) return [];

    const updatedQuests = [];

    // Check each active quest for matching objectives
    for (const quest of player.quests.active) {
      let questUpdated = false;

      for (const objective of quest.objectives) {
        if (objective.type === "kill" && objective.target === monsterType) {
          if (objective.current < objective.required) {
            objective.current += 1;
            questUpdated = true;
          }
        }
      }

      if (questUpdated) {
        updatedQuests.push(quest);

        // Check if quest is complete
        const isComplete = quest.objectives.every((obj) => obj.current >= obj.required);
        if (isComplete) {
          // Move to completed
          const index = player.quests.active.indexOf(quest);
          if (index > -1) {
            player.quests.active.splice(index, 1);
            quest.completedAt = Date.now();
            player.quests.completed.push(quest);
          }
        }
      }
    }

    return updatedQuests;
  }

  /**
   * Claim quest rewards
   * @param {Player} player - The player
   * @param {string} questId - Quest ID to claim rewards for
   * @returns {Object} Result with rewards
   */
  claimRewards(player, questId) {
    if (!player) {
      return { success: false, reason: "invalid_player" };
    }

    // Find quest in completed list
    const questIndex = player.quests.completed.findIndex((q) => q.id === questId);
    if (questIndex === -1) {
      return { success: false, reason: "quest_not_completed" };
    }

    const quest = player.quests.completed[questIndex];

    // Check if already claimed
    if (quest.rewardsClaimed) {
      return { success: false, reason: "rewards_already_claimed" };
    }

    // Grant rewards
    const grantedRewards = [];

    // Gold reward
    if (quest.rewards.gold) {
      const goldResult = this.inventoryManager.addGold(player, quest.rewards.gold);
      if (goldResult.success) {
        grantedRewards.push({ type: "gold", amount: quest.rewards.gold });
      }
    }

    // Item rewards
    if (quest.rewards.items && quest.rewards.items.length > 0) {
      for (const itemReward of quest.rewards.items) {
        const itemResult = this.inventoryManager.addItemToPlayer(player, {
          itemId: itemReward.itemId,
          quantity: itemReward.quantity || 1,
        });

        if (itemResult.success) {
          grantedRewards.push({
            type: "item",
            itemId: itemReward.itemId,
            quantity: itemReward.quantity || 1,
          });
        }
      }
    }

    // Mark as claimed
    quest.rewardsClaimed = true;
    quest.claimedAt = Date.now();

    // Remove from completed list (fully done)
    player.quests.completed.splice(questIndex, 1);

    return { success: true, rewards: grantedRewards };
  }

  /**
   * Validate quest update from client
   * Returns true if the update is valid based on server-tracked kills
   */
  validateQuestProgress(player, questId, objectiveIndex, claimedProgress) {
    const quest = player.quests.active.find((q) => q.id === questId);
    if (!quest) return false;

    const objective = quest.objectives[objectiveIndex];
    if (!objective) return false;

    if (objective.type === "kill") {
      const serverKillCount = this.getKillCount(player.userId, objective.target);
      // Allow progress up to server-tracked kills
      return claimedProgress <= serverKillCount;
    }

    // For non-kill objectives, trust client for now
    return true;
  }

  /**
   * Clear kill counts for a player (on disconnect)
   */
  clearPlayerData(playerId) {
    this.playerKillCounts.delete(playerId);
  }
}
