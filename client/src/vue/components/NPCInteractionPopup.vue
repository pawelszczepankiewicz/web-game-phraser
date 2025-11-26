<template>
  <div
    v-if="gameStore.ui.npcInteractionVisible && gameStore.npc.currentNPC"
    class="npc-interaction-overlay"
  >
    <div class="npc-interaction-panel">
      <div class="panel-header">
        <div class="header-decoration"></div>
        <h2>{{ gameStore.npc.currentNPC.name.toUpperCase() }}</h2>
        <button class="close-btn" @click="closeInteraction">✕</button>
      </div>

      <div class="panel-content">
        <div class="npc-options">
          <!-- Show Trade button if NPC is a trader -->
          <button
            v-if="gameStore.npc.currentNPC.isTrader"
            class="option-btn trade-btn"
            @click="openTrade"
          >
            🛒 TRADE
          </button>

          <!-- Show Quests button if NPC is a quest giver -->
          <button
            v-if="gameStore.npc.currentNPC.isQuestGiver"
            class="option-btn quest-btn"
            @click="openQuests"
          >
            📜 QUESTS
          </button>

          <!-- Always show Close button -->
          <button class="option-btn close-option-btn" @click="closeInteraction">❌ CLOSE</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from "../stores/gameStore";
import { getTraderInventory } from "../../data/Traders.js";

const gameStore = useGameStore();

const closeInteraction = () => {
  gameStore.hideNPCInteraction();
};

const openTrade = () => {
  const npcName = gameStore.npc.currentNPC.name;
  const traderInventory = getTraderInventory(npcName);
  gameStore.openTrade(npcName, traderInventory);
};

const openQuests = () => {
  const npcName = gameStore.npc.currentNPC.name;
  gameStore.openNPCQuests(npcName);
};
</script>

<style scoped>
.npc-interaction-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2500;
  pointer-events: auto;
}

.npc-interaction-panel {
  width: 400px;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 4px solid var(--rpg-border-gold);
  border-radius: 8px;
  color: var(--rpg-text-light);
  font-family: "Quattrocento", serif;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.9),
    inset 0 1px 0 rgba(255, 215, 0, 0.3);
  animation: popIn 0.3s ease-out;
}

@keyframes popIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.panel-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(180deg, var(--rpg-bg-light) 0%, var(--rpg-bg-medium) 100%);
  border-bottom: 3px double var(--rpg-border-gold);
  border-radius: 4px 4px 0 0;
}

.header-decoration {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
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
  padding: 40px 30px;
}

.npc-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.option-btn {
  padding: 15px 20px;
  font-family: "Cinzel", serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--rpg-text-light);
  background: linear-gradient(135deg, var(--rpg-bg-light) 0%, var(--rpg-bg-medium) 100%);
  border: 3px solid var(--rpg-bronze);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 1px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.option-btn:hover {
  border-color: var(--rpg-gold);
  background: linear-gradient(135deg, var(--rpg-bg-medium) 0%, var(--rpg-bg-light) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.trade-btn:hover {
  border-color: var(--rpg-green);
  box-shadow: 0 4px 12px rgba(154, 205, 50, 0.3);
}

.quest-btn:hover {
  border-color: #4169e1;
  box-shadow: 0 4px 12px rgba(65, 105, 225, 0.3);
}

.close-option-btn:hover {
  border-color: var(--rpg-red);
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}
</style>
