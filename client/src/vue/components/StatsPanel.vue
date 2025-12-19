<template>
  <div class="stats-panel">
    <!-- Health Bar -->
    <div class="health-section">
      <div class="health-bar-container">
        <div class="health-bar" :style="{ width: healthPercentage + '%' }"></div>
        <span class="health-text"
          >{{ gameStore.stats.health }} / {{ gameStore.stats.maxHealth }}</span
        >
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-item" title="Attack Strength">
        <span class="stat-icon">⚔</span>
        <span class="stat-value">{{ gameStore.stats.attackStrength }}</span>
      </div>
      <div class="stat-item" title="Armor">
        <span class="stat-icon">🛡</span>
        <span class="stat-value">{{ gameStore.stats.armor }}</span>
      </div>
      <div class="stat-item" title="Speed">
        <span class="stat-icon">👢</span>
        <span class="stat-value">{{ gameStore.stats.speed }}</span>
      </div>
      <div class="stat-item" title="Gold">
        <span class="stat-icon">💰</span>
        <span class="stat-value">{{ gameStore.gold }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useGameStore } from "../stores/gameStore";

const gameStore = useGameStore();

const healthPercentage = computed(() => {
  return (gameStore.stats.health / gameStore.stats.maxHealth) * 100;
});
</script>

<style scoped>
.stats-panel {
  position: fixed;
  bottom: 140px;
  right: 40px;
  width: 155px;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 2px solid var(--rpg-border-gold);
  border-radius: 8px;
  padding: 10px;
  color: var(--rpg-text-light);
  font-family: "Quattrocento", serif;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.9),
    inset 0 1px 0 rgba(255, 215, 0, 0.3);
  z-index: 1000;
  pointer-events: auto;
}

.health-section {
  margin-bottom: 10px;
}

.health-bar-container {
  position: relative;
  width: 100%;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid var(--rpg-bronze);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.8);
}

.health-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #8b0000 0%, var(--rpg-red) 50%, #ff4444 100%);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(196, 30, 58, 0.8);
}

.health-text {
  position: absolute;
  width: 100%;
  text-align: center;
  line-height: 20px;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  text-shadow:
    1px 1px 2px #000,
    -1px -1px 2px #000,
    1px -1px 2px #000,
    -1px 1px 2px #000;
  z-index: 1;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--rpg-bronze);
  border-radius: 4px;
  padding: 4px 6px;
  cursor: help;
}

.stat-icon {
  font-size: 14px;
}

.stat-value {
  font-size: 12px;
  font-weight: bold;
  color: var(--rpg-text-gold);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

/* Hide on smaller screens */
@media (max-width: 959px) {
  .stats-panel {
    display: none;
  }
}
</style>
