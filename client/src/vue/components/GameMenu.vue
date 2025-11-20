<template>
  <div class="game-menu">
    <button class="menu-btn" @click="gameStore.toggleStats">Stats (O)</button>
    <button class="menu-btn" @click="gameStore.toggleInventory">Inventory (I)</button>
    <button class="menu-btn" @click="gameStore.toggleQuests">Quests (P)</button>
    <button class="menu-btn logout-btn" @click="handleLogout">Logout</button>
  </div>
</template>

<script setup>
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();

const handleLogout = () => {
  // Emit event to Phaser to handle logout
  window.dispatchEvent(new CustomEvent('logout'));
};
</script>

<style scoped>
.game-menu {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  z-index: 1000;
}

.menu-btn {
  background: #4a4a4a;
  border: 2px solid #fff;
  color: #fff;
  padding: 10px 20px;
  font-size: 14px;
  cursor: pointer;
  font-family: Arial, sans-serif;
  transition: background 0.2s;
}

.menu-btn:hover {
  background: #6a6a6a;
}

.logout-btn {
  background: #8a2a2a;
}

.logout-btn:hover {
  background: #aa3a3a;
}
</style>
