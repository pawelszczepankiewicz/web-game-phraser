<template>
  <div v-if="gameStore.ui.statsVisible" class="panel stats-panel">
    <div class="panel-header">
      <div class="header-decoration"></div>
      <h2>CHARACTER</h2>
      <button class="close-btn" @click="gameStore.toggleStats">✕</button>
    </div>

    <div class="panel-content">
      <div class="character-name">{{ gameStore.characterName }}</div>
      <div class="stats-container">
        <div class="stat-group">
          <div class="stat-label">❤ Health</div>
          <div class="health-bar-container">
            <div
              class="health-bar"
              :style="{ width: healthPercentage + '%' }"
            ></div>
            <span class="health-text"
              >{{ gameStore.stats.health }} /
              {{ gameStore.stats.maxHealth }}</span
            >
          </div>
        </div>

        <div class="stat-group">
          <div class="stat-label">⚔ Attack</div>
          <div class="stat-value">{{ gameStore.stats.attackStrength }}</div>
        </div>

        <div class="stat-group">
          <div class="stat-label">🛡 Armor</div>
          <div class="stat-value">{{ gameStore.stats.armor }}</div>
        </div>
      </div>
    </div>

    <div class="panel-footer">Press O to close</div>
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 420px;
  background: linear-gradient(
    135deg,
    var(--rpg-bg-dark) 0%,
    var(--rpg-bg-medium) 100%
  );
  border: 4px solid var(--rpg-border-gold);
  border-radius: 8px;
  color: var(--rpg-text-light);
  font-family: "Quattrocento", serif;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9),
    inset 0 1px 0 rgba(255, 215, 0, 0.3);
}

.panel-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(
    180deg,
    var(--rpg-bg-light) 0%,
    var(--rpg-bg-medium) 100%
  );
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
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 215, 0, 0.5);
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
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 0 15px rgba(255, 69, 0, 0.6);
}

.panel-content {
  padding: 25px;
}

.character-name {
  color: var(--rpg-text-gold);
  font-family: "Cinzel", serif;
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 25px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 15px rgba(255, 215, 0, 0.4);
  padding-bottom: 15px;
  border-bottom: 2px solid var(--rpg-bronze);
}

.stats-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-group {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--rpg-bronze);
  border-radius: 6px;
  padding: 15px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}

.stat-label {
  font-size: 16px;
  font-weight: bold;
  color: var(--rpg-gold-dark);
  margin-bottom: 10px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--rpg-text-light);
  text-align: center;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
}

.health-bar-container {
  position: relative;
  width: 100%;
  height: 32px;
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
  background: linear-gradient(
    90deg,
    #8b0000 0%,
    var(--rpg-red) 50%,
    #ff4444 100%
  );
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(196, 30, 58, 0.8);
}

.health-text {
  position: absolute;
  width: 100%;
  text-align: center;
  line-height: 28px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  text-shadow: 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000,
    -1px 1px 2px #000;
  z-index: 1;
}

.panel-footer {
  padding: 15px 20px;
  text-align: center;
  color: var(--rpg-gold-dark);
  font-size: 13px;
  border-top: 3px double var(--rpg-border-gold);
  background: var(--rpg-bg-dark);
  border-radius: 0 0 4px 4px;
  font-style: italic;
}
</style>
