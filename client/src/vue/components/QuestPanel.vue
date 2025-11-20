<template>
  <div v-if="gameStore.ui.questsVisible" class="panel quest-panel">
    <div class="panel-header">
      <h2>QUEST LOG</h2>
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
  width: 600px;
  max-height: 80vh;
  background: rgba(0, 0, 0, 0.9);
  border: 2px solid #fff;
  color: #fff;
  font-family: Arial, sans-serif;
  display: flex;
  flex-direction: column;
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
  overflow-y: auto;
  flex: 1;
}

.quest-section {
  margin-bottom: 30px;
}

.quest-section h3 {
  color: #ffff00;
  font-size: 18px;
  margin: 0 0 15px 0;
}

.empty-message {
  color: #888;
  font-style: italic;
  font-size: 14px;
}

.quest-item {
  background: #222;
  border: 1px solid #444;
  padding: 15px;
  margin-bottom: 10px;
}

.quest-item.completed {
  border-color: #0f0;
}

.quest-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #fff;
}

.quest-item.completed .quest-name {
  color: #0f0;
}

.quest-description {
  font-size: 12px;
  color: #ccc;
  margin-bottom: 10px;
}

.quest-objective {
  font-size: 12px;
  color: #fff;
  margin: 5px 0 5px 20px;
}

.quest-objective.completed {
  color: #0f0;
}

.panel-footer {
  padding: 10px 20px;
  text-align: center;
  color: #888;
  font-size: 14px;
  border-top: 2px solid #444;
}
</style>
