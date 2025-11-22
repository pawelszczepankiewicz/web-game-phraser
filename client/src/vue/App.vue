<template>
  <div id="vue-app">
    <!-- Debug Info -->
    <div class="debug-info">
      <div>Map: {{ gameStore.character.map }}</div>
      <div>
        Position: {{ gameStore.character.x }}, {{ gameStore.character.y }}
      </div>
    </div>

    <!-- UI Components -->
    <StatsPanel />
    <InventoryPanel />
    <QuestPanel />
    <LootPanel />
    <GameMenu />
    <NPCInteractionPopup />
    <TradePanel />
    <NPCQuestPanel />
    <QuickActionsBar />
    <Toast />
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useGameStore } from "./stores/gameStore";
import StatsPanel from "./components/StatsPanel.vue";
import InventoryPanel from "./components/InventoryPanel.vue";
import QuestPanel from "./components/QuestPanel.vue";
import LootPanel from "./components/LootPanel.vue";
import GameMenu from "./components/GameMenu.vue";
import NPCInteractionPopup from "./components/NPCInteractionPopup.vue";
import TradePanel from "./components/TradePanel.vue";
import NPCQuestPanel from "./components/NPCQuestPanel.vue";
import QuickActionsBar from "./components/QuickActionsBar.vue";
import Toast from "./components/Toast.vue";

const gameStore = useGameStore();

onMounted(() => {
  // Listen for keyboard events
  document.addEventListener("keydown", (e) => {
    // Check if user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    if (e.key === "o" || e.key === "O") {
      gameStore.toggleStats();
    } else if (e.key === "i" || e.key === "I") {
      gameStore.toggleInventory();
    } else if (e.key === "p" || e.key === "P") {
      gameStore.toggleQuests();
    } else if (e.key === "Escape") {
      gameStore.closeAllPanels();
    } else if (e.key >= "1" && e.key <= "9") {
      // Only use quick slot if inventory is NOT open (to avoid conflict with assignment)
      if (!gameStore.ui.inventoryVisible) {
        const slotIndex = parseInt(e.key) - 1;
        window.dispatchEvent(new CustomEvent('use-quick-slot', {
          detail: { slotIndex }
        }));
      }
    } else if (e.key === "0") {
      // Only use quick slot if inventory is NOT open (to avoid conflict with assignment)
      if (!gameStore.ui.inventoryVisible) {
        window.dispatchEvent(new CustomEvent('use-quick-slot', {
          detail: { slotIndex: 9 }
        }));
      }
    }
  });
});
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Quattrocento:wght@400;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#vue-app {
  pointer-events: none;
}

#vue-app > * {
  pointer-events: auto;
}

.debug-info {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: #ffd700;
  padding: 5px 10px;
  font-family: 'Quattrocento', serif;
  font-size: 12px;
  z-index: 1100;
  pointer-events: none;
  border: 1px solid #d4af37;
}

.debug-info div {
  margin-bottom: 2px;
}

.panel {
  z-index: 1000;
}

/* Shared RPG Panel Styles */
:root {
  --rpg-gold: #ffd700;
  --rpg-gold-dark: #d4af37;
  --rpg-bronze: #cd7f32;
  --rpg-bg-dark: #1a0f08;
  --rpg-bg-medium: #2a1810;
  --rpg-bg-light: #3a2418;
  --rpg-text-light: #f5e6d3;
  --rpg-text-gold: #ffd700;
  --rpg-border-gold: #d4af37;
  --rpg-red: #c41e3a;
  --rpg-green: #9acd32;
}
</style>
