<template>
  <div v-if="gameStore.ui.npcQuestsVisible" class="npc-quest-overlay">
    <div class="npc-quest-panel">
      <!-- Header -->
      <div class="panel-header">
        <div class="header-decoration"></div>
        <h2>{{ npcName.toUpperCase() }} - QUESTS</h2>
        <button class="close-btn" @click="closePanel">✕</button>
      </div>

      <!-- Content -->
      <div class="panel-content">
        <!-- Available Quests -->
        <div v-if="availableQuests.length > 0" class="quest-section">
          <h3 class="section-title">📋 Available Quests</h3>
          <div v-for="quest in availableQuests" :key="quest.id" class="quest-card">
            <div class="quest-header">
              <h4>{{ quest.name }}</h4>
              <button class="accept-btn" @click="acceptQuest(quest)">ACCEPT</button>
            </div>
            <p class="quest-description">{{ quest.description }}</p>
            <div class="quest-objectives">
              <div v-for="(obj, index) in quest.objectives" :key="index" class="objective">
                <span class="objective-icon">⚔</span>
                {{ obj.description }}: 0/{{ obj.required }}
              </div>
            </div>
            <div class="quest-rewards">
              <strong>Rewards:</strong>
              <span v-if="quest.rewards.gold" class="reward-item"
                >💰 {{ quest.rewards.gold }} Gold</span
              >
              <span v-if="quest.rewards.items" class="reward-item">
                📦 {{ quest.rewards.items.length }} Items
              </span>
            </div>
          </div>
        </div>

        <!-- Active Quests -->
        <div v-if="activeQuests.length > 0" class="quest-section">
          <h3 class="section-title">⏳ Active Quests</h3>
          <div v-for="quest in activeQuests" :key="quest.instanceId" class="quest-card active">
            <h4>{{ quest.name }}</h4>
            <p class="quest-description">{{ quest.description }}</p>
            <div class="quest-objectives">
              <div v-for="(obj, index) in quest.objectives" :key="index" class="objective">
                <span class="objective-icon" :class="{ completed: obj.current >= obj.required }">
                  {{ obj.current >= obj.required ? "✓" : "⚔" }}
                </span>
                <span :class="{ completed: obj.current >= obj.required }">
                  {{ obj.description }}: {{ obj.current }}/{{ obj.required }}
                </span>
              </div>
            </div>
            <div v-if="isQuestComplete(quest)" class="complete-message">
              ✅ Quest Complete! Return to {{ npcName }} for rewards.
            </div>
          </div>
        </div>

        <!-- Completed Quests (Ready for Reward) -->
        <div v-if="completedQuests.length > 0" class="quest-section">
          <h3 class="section-title">✅ Completed Quests</h3>
          <div
            v-for="quest in completedQuests"
            :key="quest.instanceId"
            class="quest-card completed"
          >
            <h4>{{ quest.name }}</h4>
            <p class="quest-description">{{ quest.description }}</p>

            <!-- Reward Slots -->
            <div class="rewards-section">
              <h5>🎁 Claim Your Rewards:</h5>
              <div class="reward-slots">
                <!-- Gold Reward -->
                <div
                  v-if="quest.rewards.gold"
                  class="reward-slot"
                  @click="claimReward(quest, 'gold', quest.rewards.gold)"
                >
                  <div class="reward-icon">💰</div>
                  <div class="reward-name">{{ quest.rewards.gold }} Gold</div>
                </div>

                <!-- Item Rewards -->
                <div
                  v-for="(itemId, index) in quest.rewards.items"
                  :key="index"
                  class="reward-slot"
                  @click="claimReward(quest, 'item', itemId)"
                >
                  <img :src="getItemImage(itemId)" :alt="getItemName(itemId)" class="reward-icon" />
                  <div class="reward-name">{{ getItemName(itemId) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Quests Message -->
        <div
          v-if="
            availableQuests.length === 0 &&
            activeQuests.length === 0 &&
            completedQuests.length === 0
          "
          class="no-quests"
        >
          <p>{{ npcName }} has no quests available at this time.</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="panel-footer">Click items to claim rewards | ESC to close</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useGameStore } from "../stores/gameStore";
import { QUESTS } from "../../../../shared/data/Quests.js";
import { getItem } from "../../../../shared/data/Items.js";

const gameStore = useGameStore();

// Get NPC name from current NPC or last opened
const npcName = computed(() => {
  return gameStore.npc.currentNPC?.name || "SADRAX";
});

// Get available quests for this NPC
const availableQuests = computed(() => {
  const npc = npcName.value.toLowerCase();
  return Object.values(QUESTS).filter(
    (q) =>
      q.giver === npc &&
      !gameStore.quests.active.find((aq) => aq.id === q.id) &&
      !gameStore.quests.completed.find((cq) => cq.id === q.id)
  );
});

// Get active quests for this NPC
const activeQuests = computed(() => {
  const npc = npcName.value.toLowerCase();
  return gameStore.quests.active.filter((q) => q.giver === npc);
});

// Get completed quests for this NPC
const completedQuests = computed(() => {
  const npc = npcName.value.toLowerCase();
  return gameStore.quests.completed.filter((q) => q.giver === npc && q.status === "completed");
});

// Check if quest is complete
const isQuestComplete = (quest) => {
  return quest.objectives.every((obj) => obj.current >= obj.required);
};

// Accept quest
const acceptQuest = (quest) => {
  window.dispatchEvent(
    new CustomEvent("accept-quest", {
      detail: { questId: quest.id },
    })
  );
  gameStore.showToast(`Quest accepted: ${quest.name}`, "success", 3000);
};

// Claim reward
const claimReward = (quest, rewardType, rewardValue) => {
  window.dispatchEvent(
    new CustomEvent("claim-quest-reward", {
      detail: {
        questInstanceId: quest.instanceId,
        rewardType,
        rewardValue,
      },
    })
  );
};

// Get item image
const getItemImage = (itemId) => {
  const item = getItem(itemId);
  if (!item) return "/assets/sprites/static/items/item_loot_bag.png";

  // Use icon property for UI display
  if (item.icon) {
    // Check if it's a full path (starts with /) or just a sprite key
    if (item.icon.startsWith("/")) {
      return item.icon; // Use full path directly
    }
    // Construct path from sprite key based on item type
    if (item.wearable) {
      // Wearable items (equipment)
      return `/assets/sprites/static/equipment/${item.category}/${item.icon}.png`;
    } else {
      // Non-wearable items (consumables, currency)
      return `/assets/sprites/static/items/${item.icon}.png`;
    }
  }

  return "/assets/sprites/static/items/item_loot_bag.png";
};

// Get item name
const getItemName = (itemId) => {
  const item = getItem(itemId);
  return item ? item.name : itemId;
};

// Close panel
const closePanel = () => {
  gameStore.closeNPCQuests();
};
</script>

<style scoped>
.npc-quest-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  pointer-events: auto;
}

.npc-quest-panel {
  width: 800px;
  max-height: 90vh;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 4px solid var(--rpg-border-gold);
  border-radius: 8px;
  color: var(--rpg-text-light);
  font-family: "Quattrocento", serif;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.9),
    inset 0 1px 0 rgba(255, 215, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(180deg, var(--rpg-bg-light) 0%, var(--rpg-bg-medium) 100%);
  border-bottom: 3px double var(--rpg-border-gold);
}

.header-decoration {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 150px;
  height: 4px;
  background: linear-gradient(90deg, transparent, var(--rpg-gold), transparent);
}

.panel-header h2 {
  margin: 0;
  font-family: "Cinzel", serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--rpg-text-gold);
  text-shadow:
    2px 2px 4px rgba(0, 0, 0, 0.8),
    0 0 10px rgba(255, 215, 0, 0.5);
  letter-spacing: 2px;
}

.close-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--rpg-bg-dark);
  border: 2px solid var(--rpg-bronze);
  color: var(--rpg-text-gold);
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: var(--rpg-red);
  border-color: var(--rpg-gold);
  color: #fff;
  box-shadow: 0 0 10px rgba(196, 30, 58, 0.5);
  transform: translateY(-50%) scale(1.1);
}

.panel-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.quest-section {
  margin-bottom: 30px;
}

.section-title {
  font-family: "Cinzel", serif;
  font-size: 18px;
  color: var(--rpg-gold);
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--rpg-bronze);
}

.quest-card {
  background: rgba(58, 36, 24, 0.5);
  border: 2px solid var(--rpg-bronze);
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.quest-card.active {
  border-color: var(--rpg-gold-dark);
}

.quest-card.completed {
  border-color: var(--rpg-green);
  background: rgba(154, 205, 50, 0.1);
}

.quest-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.quest-card h4 {
  margin: 0;
  font-family: "Cinzel", serif;
  font-size: 18px;
  color: var(--rpg-text-gold);
}

.accept-btn {
  background: var(--rpg-green);
  border: 2px solid var(--rpg-gold-dark);
  color: #fff;
  font-family: "Cinzel", serif;
  font-size: 14px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.accept-btn:hover {
  background: var(--rpg-gold);
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(154, 205, 50, 0.5);
}

.quest-description {
  color: var(--rpg-text-light);
  margin: 10px 0;
  font-style: italic;
}

.quest-objectives {
  margin: 15px 0;
}

.objective {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  color: var(--rpg-text-light);
}

.objective-icon {
  font-size: 16px;
}

.objective-icon.completed {
  color: var(--rpg-green);
}

.objective.completed span {
  color: var(--rpg-green);
  text-decoration: line-through;
}

.quest-rewards {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--rpg-bronze);
  color: var(--rpg-bronze);
}

.reward-item {
  margin-left: 10px;
  color: var(--rpg-gold-dark);
}

.complete-message {
  margin-top: 10px;
  padding: 10px;
  background: rgba(154, 205, 50, 0.2);
  border: 2px solid var(--rpg-green);
  border-radius: 4px;
  color: var(--rpg-green);
  text-align: center;
  font-weight: bold;
}

.rewards-section {
  margin-top: 15px;
  padding: 15px;
  background: rgba(255, 215, 0, 0.1);
  border: 2px solid var(--rpg-gold);
  border-radius: 6px;
}

.rewards-section h5 {
  margin: 0 0 15px 0;
  font-family: "Cinzel", serif;
  color: var(--rpg-gold);
  font-size: 16px;
}

.reward-slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.reward-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--rpg-bg-dark);
  border: 2px solid var(--rpg-gold-dark);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reward-slot:hover {
  border-color: var(--rpg-gold);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.reward-icon {
  width: 48px;
  height: 48px;
  font-size: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  object-fit: contain;
  image-rendering: pixelated;
}

.reward-name {
  font-size: 12px;
  color: var(--rpg-text-gold);
  text-align: center;
  font-weight: 600;
}

.no-quests {
  text-align: center;
  padding: 40px 20px;
  color: var(--rpg-bronze);
  font-size: 18px;
  font-style: italic;
}

.panel-footer {
  padding: 12px 20px;
  background: var(--rpg-bg-dark);
  border-top: 2px solid var(--rpg-bronze);
  text-align: center;
  font-size: 14px;
  color: var(--rpg-bronze);
  font-style: italic;
}

/* Scrollbar */
.panel-content::-webkit-scrollbar {
  width: 8px;
}

.panel-content::-webkit-scrollbar-track {
  background: var(--rpg-bg-dark);
  border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--rpg-bronze);
  border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: var(--rpg-gold);
}
</style>
