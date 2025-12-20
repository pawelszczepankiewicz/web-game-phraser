<template>
  <div class="quick-actions-bar">
    <div
      v-for="(item, index) in gameStore.quickSlots"
      :key="index"
      class="quick-slot"
      :class="{ filled: item !== null }"
      @click="useQuickSlot(index)"
    >
      <div class="slot-key">{{ getKeyLabel(index) }}</div>
      <div v-if="item" class="slot-item">
        <img :src="getItemImagePath(item)" :alt="item.name" />
        <div v-if="item.quantity > 1" class="quantity-badge">
          {{ item.quantity }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from "../stores/gameStore";

const gameStore = useGameStore();

// Get key label (1-9, 0)
const getKeyLabel = (index) => {
  return index === 9 ? "0" : (index + 1).toString();
};

// Get item image path
const getItemImagePath = (item) => {
  if (!item) return "";

  // Use icon property for UI display
  if (item.icon) {
    // Check if it's a full path (starts with /) or just a sprite key
    if (item.icon.startsWith("/")) {
      return item.icon; // Use full path directly
    }
    // Construct path from sprite key based on item type
    if (item.wearable) {
      // Wearable items (equipment)
      return `/assets/sprites/static/equipment/${item.category}/${item.icon}.png`;
    } else {
      // Non-wearable items (consumables, currency)
      return `/assets/sprites/static/items/${item.icon}.png`;
    }
  }

  return `/assets/sprites/static/items/item_loot_bag.png`;
};

// Use item in quick slot
const useQuickSlot = (index) => {
  const item = gameStore.quickSlots[index];
  if (!item) return;

  // Emit event to Phaser to use the item
  window.dispatchEvent(
    new CustomEvent("use-quick-slot", {
      detail: { slotIndex: index },
    })
  );
};
</script>

<style scoped>
.quick-actions-bar {
  position: fixed;
  bottom: 40px;
  left: 40px;
  display: flex;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 2px solid var(--rpg-border-gold);
  border-radius: 8px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.9),
    inset 0 1px 0 rgba(255, 215, 0, 0.3);
  z-index: 1000;
  pointer-events: auto;
}

.quick-slot {
  position: relative;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--rpg-bg-medium) 0%, var(--rpg-bg-dark) 100%);
  border: 2px solid var(--rpg-bronze);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-slot:hover {
  border-color: var(--rpg-gold);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
}

.quick-slot.filled {
  border-color: var(--rpg-gold-dark);
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, var(--rpg-bg-dark) 100%);
}

.slot-key {
  position: absolute;
  top: 2px;
  left: 4px;
  font-family: "Cinzel", serif;
  font-size: 11px;
  font-weight: 700;
  color: var(--rpg-bronze);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  pointer-events: none;
}

.slot-item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.slot-item img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.8));
}

.quantity-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.8);
  color: var(--rpg-gold);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 3px;
  border: 1px solid var(--rpg-gold-dark);
  pointer-events: none;
}

/* Hide on smaller screens */
@media (max-width: 450px) {
  .quick-actions-bar {
    display: none;
  }
}
</style>
