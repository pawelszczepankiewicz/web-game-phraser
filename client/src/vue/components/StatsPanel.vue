<template>
  <div v-if="gameStore.ui.statsVisible" class="panel stats-panel">
    <div class="panel-header">
      <h2>CHARACTER STATS</h2>
      <button class="close-btn" @click="gameStore.toggleStats">✕</button>
    </div>

    <div class="panel-content">
      <div class="character-name">{{ gameStore.characterName }}</div>

      <div class="stat-row">
        <span class="stat-label">Health:</span>
        <span class="stat-value">{{ gameStore.stats.health }} / {{ gameStore.stats.maxHealth }}</span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Attack Strength:</span>
        <span class="stat-value">{{ gameStore.stats.attackStrength }}</span>
      </div>

      <div class="stat-row">
        <span class="stat-label">Armor:</span>
        <span class="stat-value">{{ gameStore.stats.armor }}</span>
      </div>
    </div>

    <div class="panel-footer">
      Press O to close
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();
</script>

<style scoped>
.stats-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #fff;
  color: #fff;
  font-family: Arial, sans-serif;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 2px solid #fff;
}

.panel-header h2 {
  margin: 0;
  font-size: 24px;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
}

.close-btn:hover {
  color: #ff4444;
}

.panel-content {
  padding: 20px;
}

.character-name {
  color: #ffff00;
  font-size: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 18px;
}

.stat-label {
  font-weight: bold;
}

.panel-footer {
  padding: 10px 20px;
  text-align: center;
  color: #888;
  font-size: 14px;
  border-top: 2px solid #444;
}
</style>
