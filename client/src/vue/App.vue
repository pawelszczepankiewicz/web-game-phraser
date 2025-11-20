<template>
  <div id="vue-app">
    <!-- Debug Info -->
    <div class="debug-info">
      <div>Map: {{ gameStore.character.map }}</div>
      <div>Position: {{ gameStore.character.x }}, {{ gameStore.character.y }}</div>
    </div>

    <!-- UI Components -->
    <StatsPanel />
    <InventoryPanel />
    <QuestPanel />
    <GameMenu />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useGameStore } from './stores/gameStore';
import StatsPanel from './components/StatsPanel.vue';
import InventoryPanel from './components/InventoryPanel.vue';
import QuestPanel from './components/QuestPanel.vue';
import GameMenu from './components/GameMenu.vue';

const gameStore = useGameStore();

onMounted(() => {
  // Listen for keyboard events
  document.addEventListener('keydown', (e) => {
    if (e.key === 'o' || e.key === 'O') {
      gameStore.toggleStats();
    } else if (e.key === 'i' || e.key === 'I') {
      gameStore.toggleInventory();
    } else if (e.key === 'p' || e.key === 'P') {
      gameStore.toggleQuests();
    } else if (e.key === 'Escape') {
      gameStore.closeAllPanels();
    }
  });
});
</script>

<style>
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
  left: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: #ffff00;
  padding: 5px 10px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  z-index: 1100;
  pointer-events: none;
}

.debug-info div {
  margin-bottom: 2px;
}

.panel {
  z-index: 1000;
}
</style>
