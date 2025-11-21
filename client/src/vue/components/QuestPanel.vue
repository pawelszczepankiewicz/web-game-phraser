<template>
  <div v-if="gameStore.ui.questsVisible" class="panel quest-panel">
    <div class="panel-header">
      <div class="header-decoration"></div>
      <h2>📜 QUEST LOG 📜</h2>
      <button class="close-btn" @click="gameStore.toggleQuests">✕</button>
    </div>

    <div class="panel-content">
      <!-- Active Quests -->
      <div class="quest-section">
        <h3>ACTIVE QUESTS</h3>

        <div v-if="gameStore.activeQuests.length === 0" class="empty-message">
          No active quests
        </div>

        <div v-for="quest in gameStore.activeQuests" :key="quest.instanceId" class="quest-item">
          <div class="quest-name">{{ quest.name }}</div>
          <div class="quest-description">{{ quest.description }}</div>

          <div
            v-for="(objective, index) in quest.objectives"
            :key="index"
            class="quest-objective"
            :class="{ completed: objective.current >= objective.required }"
          >
            - {{ objective.description }}: {{ objective.current }}/{{ objective.required }}
          </div>
        </div>
      </div>

      <!-- Completed Quests -->
      <div class="quest-section">
        <h3>COMPLETED QUESTS</h3>

        <div v-if="gameStore.completedQuests.length === 0" class="empty-message">
          No completed quests
        </div>

        <div v-for="quest in gameStore.completedQuests" :key="quest.instanceId" class="quest-item completed">
          <div class="quest-name">✓ {{ quest.name }}</div>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      Press P to close
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();
</script>

<style scoped>
.quest-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 650px;
  max-height: 85vh;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 4px solid var(--rpg-border-gold);
  border-radius: 8px;
  color: var(--rpg-text-light);
  font-family: 'Quattrocento', serif;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 215, 0, 0.3);
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
  font-family: 'Cinzel', serif;
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
  overflow-y: auto;
  flex: 1;
}

.panel-content::-webkit-scrollbar {
  width: 10px;
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
  background: var(--rpg-gold-dark);
}

.quest-section {
  margin-bottom: 30px;
}

.quest-section h3 {
  color: var(--rpg-text-gold);
  font-family: 'Cinzel', serif;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 15px 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--rpg-bronze);
}

.empty-message {
  color: var(--rpg-bronze);
  font-style: italic;
  font-size: 15px;
  text-align: center;
  padding: 20px;
  opacity: 0.7;
}

.quest-item {
  background: rgba(0, 0, 0, 0.4);
  border: 3px solid var(--rpg-bronze);
  border-radius: 6px;
  padding: 18px;
  margin-bottom: 15px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.quest-item:hover {
  border-color: var(--rpg-gold-dark);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.2);
}

.quest-item.completed {
  border-color: var(--rpg-green);
  background: rgba(0, 50, 0, 0.2);
}

.quest-name {
  font-size: 18px;
  font-weight: bold;
  font-family: 'Cinzel', serif;
  margin-bottom: 10px;
  color: var(--rpg-text-light);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.5px;
}

.quest-item.completed .quest-name {
  color: var(--rpg-green);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8), 0 0 8px rgba(154, 205, 50, 0.4);
}

.quest-description {
  font-size: 14px;
  color: var(--rpg-text-light);
  opacity: 0.9;
  margin-bottom: 12px;
  line-height: 1.5;
}

.quest-objective {
  font-size: 13px;
  color: var(--rpg-text-light);
  margin: 8px 0 8px 20px;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-left: 3px solid var(--rpg-bronze);
  border-radius: 2px;
}

.quest-objective.completed {
  color: var(--rpg-green);
  border-left-color: var(--rpg-green);
  background: rgba(0, 50, 0, 0.2);
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
