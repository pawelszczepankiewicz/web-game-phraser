<template>
  <div class="toast-container">
    <transition-group name="toast" tag="div">
      <div v-for="toast in gameStore.toasts" :key="toast.id" class="toast" :class="toast.type">
        <div class="toast-icon">{{ getToastIcon(toast.type) }}</div>
        <div class="toast-message">{{ toast.message }}</div>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { useGameStore } from "../stores/gameStore";

const gameStore = useGameStore();

const getToastIcon = (type) => {
  switch (type) {
    case "error":
      return "❌";
    case "warning":
      return "⚠️";
    case "success":
      return "✅";
    case "info":
    default:
      return "ℹ️";
  }
};
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toast {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  max-width: 400px;
  padding: 16px 20px;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 3px solid var(--rpg-border-gold);
  border-radius: 8px;
  color: var(--rpg-text-light);
  font-family: "Quattrocento", serif;
  font-size: 14px;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.9),
    inset 0 1px 0 rgba(255, 215, 0, 0.3);
  pointer-events: auto;
}

.toast-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

/* Toast type variants */
.toast.error {
  border-color: var(--rpg-red);
  background: linear-gradient(135deg, #2a0f0f 0%, #3a1212 100%);
}

.toast.warning {
  border-color: #ff9800;
  background: linear-gradient(135deg, #2a1f0f 0%, #3a2812 100%);
}

.toast.success {
  border-color: var(--rpg-green);
  background: linear-gradient(135deg, #0f2a1a 0%, #12351f 100%);
}

.toast.info {
  border-color: #2196f3;
  background: linear-gradient(135deg, #0f1a2a 0%, #121f3a 100%);
}

/* Toast animations */
.toast-enter-active {
  animation: slideInRight 0.3s ease-out;
}

.toast-leave-active {
  animation: slideOutRight 0.3s ease-in;
}

@keyframes slideInRight {
  from {
    transform: translateX(120%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(120%);
    opacity: 0;
  }
}
</style>
