<template>
  <div class="game-menu">
    <button class="menu-btn" @click="gameStore.toggleStats">
      <img src="/public/assets/ui/fb601.png" />
    </button>
    <button class="menu-btn" @click="gameStore.toggleInventory">
      <img src="/public/assets/ui/fb158.png" />
    </button>
    <button class="menu-btn" @click="gameStore.toggleQuests">
      <img src="/public/assets/ui/fb662.png" />
    </button>
    <button class="menu-btn logout-btn" @click="handleLogout">
      <img src="/public/assets/ui/fb640.png" />
    </button>
  </div>
</template>

<script setup>
import { useGameStore } from "../stores/gameStore";

const gameStore = useGameStore();

const handleLogout = () => {
  // Emit event to Phaser to handle logout
  window.dispatchEvent(new CustomEvent("logout"));
};
</script>

<style scoped>
.game-menu {
  position: fixed;
  bottom: 40px;
  left: auto;
  right: 40px;
  padding: 12px;
  background: linear-gradient(
    180deg,
    var(--rpg-bg-medium) 0%,
    var(--rpg-bg-dark) 100%
  );
  /* background-image: url("/assets/sprites/static/textures/texture_rock_1_16px.png");
  background-repeat: repeat;
  background-size: 32px; */
  border: 2px solid var(--rpg-border-gold);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.9),
    inset 0 1px 0 rgba(255, 215, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  z-index: 1000;
  box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.8),
    inset 0 1px 0 rgba(255, 215, 0, 0.2);
}

.menu-btn {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(
    135deg,
    var(--rpg-bg-light) 0%,
    var(--rpg-bg-medium) 100%
  );
  border: 1px solid var(--rpg-bronze);
  color: var(--rpg-text-gold);
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 4px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 215, 0, 0.2);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.menu-btn:hover {
  background: linear-gradient(
    135deg,
    var(--rpg-bg-medium) 0%,
    var(--rpg-bg-light) 100%
  );
  border-color: var(--rpg-gold);
  color: var(--rpg-gold);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 215, 0, 0.3),
    inset 0 1px 0 rgba(255, 215, 0, 0.4);
}

.menu-btn:active {
  transform: translateY(0px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(0, 0, 0, 0.5);
}

.logout-btn {
  background: linear-gradient(135deg, #4a1810 0%, var(--rpg-red) 100%);
  border-color: #8b0000;
  margin-left: 20px;
  padding: 2px;
}

.logout-btn:hover {
  background: linear-gradient(135deg, var(--rpg-red) 0%, #ff4444 100%);
  border-color: #ff6666;
  color: #fff;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 69, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}
</style>
