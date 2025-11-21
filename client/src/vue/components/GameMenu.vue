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
  height: 70px;
  background: linear-gradient(180deg, var(--rpg-bg-medium) 0%, var(--rpg-bg-dark) 100%);
  border-top: 4px solid var(--rpg-border-gold);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  z-index: 1000;
  box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 215, 0, 0.2);
}

.menu-btn {
  position: relative;
  background: linear-gradient(135deg, var(--rpg-bg-light) 0%, var(--rpg-bg-medium) 100%);
  border: 3px solid var(--rpg-bronze);
  color: var(--rpg-text-gold);
  padding: 12px 24px;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  font-family: 'Cinzel', serif;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 215, 0, 0.2);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.menu-btn:hover {
  background: linear-gradient(135deg, var(--rpg-bg-medium) 0%, var(--rpg-bg-light) 100%);
  border-color: var(--rpg-gold);
  color: var(--rpg-gold);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 215, 0, 0.3), inset 0 1px 0 rgba(255, 215, 0, 0.4);
}

.menu-btn:active {
  transform: translateY(0px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(0, 0, 0, 0.5);
}

.logout-btn {
  background: linear-gradient(135deg, #4a1810 0%, var(--rpg-red) 100%);
  border-color: #8b0000;
  margin-left: 20px;
}

.logout-btn:hover {
  background: linear-gradient(135deg, var(--rpg-red) 0%, #ff4444 100%);
  border-color: #ff6666;
  color: #fff;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 69, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
</style>
