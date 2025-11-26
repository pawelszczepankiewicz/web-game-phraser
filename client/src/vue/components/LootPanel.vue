<template>
  <div v-if="gameStore.ui.lootVisible" class="panel loot-panel">
    <div class="panel-header">
      <div class="header-decoration"></div>
      <h2>💰 LOOT BAG 💰</h2>
      <button class="close-btn" @click="closeLoot">✕</button>
    </div>

    <div class="panel-content">
      <div v-if="gameStore.loot.items.length === 0" class="empty-message">
        <p>No items in this loot bag</p>
      </div>

      <div v-else class="loot-grid">
        <div
          v-for="item in gameStore.loot.items"
          :key="item.instanceId"
          class="loot-item"
          @click="handleItemClick(item)"
          @mouseenter="handleItemMouseEnter($event, item)"
          @mousemove="handleItemMouseMove($event)"
          @mouseleave="handleItemMouseLeave"
        >
          <div class="item-icon">
            <img :src="getItemImagePath(item)" :alt="item.name" />
          </div>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div v-if="item.stackable" class="item-quantity">x{{ item.quantity }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-footer">Click items to pick up | ESC to close</div>
  </div>

  <!-- Tooltip Panel - outside the panel container to avoid transform issues -->
  <div
    v-if="gameStore.ui.lootVisible && hoveredItem"
    class="item-tooltip"
    :style="{
      left: tooltipPosition.x + 'px',
      top: tooltipPosition.y + 'px',
    }"
  >
    <div class="tooltip-header">{{ hoveredItem.name }}</div>
    <div v-if="hoveredItem.description" class="tooltip-description">
      {{ hoveredItem.description }}
    </div>
    <div
      v-if="hoveredItem.stats && Object.keys(hoveredItem.stats).length > 0"
      class="tooltip-stats"
    >
      <div class="tooltip-section-title">Stats:</div>
      <div v-for="(value, stat) in hoveredItem.stats" :key="stat" class="tooltip-stat">
        {{ stat }}: <span class="stat-value">+{{ value }}</span>
      </div>
    </div>
    <div v-if="hoveredItem.effects && hoveredItem.effects.length > 0" class="tooltip-effects">
      <div class="tooltip-section-title">Effects:</div>
      <div v-for="effect in hoveredItem.effects" :key="effect.type" class="tooltip-effect">
        {{ effect.type }}: <span class="effect-value">{{ effect.value }}</span>
      </div>
    </div>
    <div v-if="hoveredItem.type" class="tooltip-type">
      Type: <span class="type-value">{{ hoveredItem.type }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useGameStore } from "../stores/gameStore";

const gameStore = useGameStore();

// Tooltip state
const hoveredItem = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });

const closeLoot = () => {
  gameStore.closeLootBag();
};

const handleItemClick = (item) => {
  // Emit event to Phaser to handle item pickup
  window.dispatchEvent(
    new CustomEvent("pickup-loot-item", {
      detail: {
        instanceId: item.instanceId,
        lootBagRef: gameStore.loot.lootBagRef,
      },
    })
  );
};

const handleItemMouseEnter = (event, item) => {
  hoveredItem.value = item;
  updateTooltipPosition(event);
};

const handleItemMouseMove = (event) => {
  if (hoveredItem.value) {
    updateTooltipPosition(event);
  }
};

const handleItemMouseLeave = () => {
  hoveredItem.value = null;
};

const updateTooltipPosition = (event) => {
  tooltipPosition.value = {
    x: event.clientX + 10,
    y: event.clientY - 10,
  };
};

const getItemImagePath = (item) => {
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
  // Fallback image
  return `/assets/sprites/static/items/item_loot_bag.png`;
};

const getItemTooltip = (item) => {
  let tooltip = `${item.name}\n`;

  if (item.description) {
    tooltip += `${item.description}\n`;
  }

  if (item.stats && Object.keys(item.stats).length > 0) {
    tooltip += "\nStats:\n";
    for (const [stat, value] of Object.entries(item.stats)) {
      tooltip += `  ${stat}: +${value}\n`;
    }
  }

  if (item.effects && item.effects.length > 0) {
    tooltip += "\nEffects:\n";
    item.effects.forEach((effect) => {
      tooltip += `  ${effect.type}: ${effect.value}\n`;
    });
  }

  if (item.type) {
    tooltip += `\nType: ${item.type}`;
  }

  return tooltip;
};
</script>

<style scoped>
.loot-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 4px solid var(--rpg-border-gold);
  border-radius: 8px;
  color: var(--rpg-text-light);
  font-family: "Quattrocento", serif;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.9),
    inset 0 1px 0 rgba(255, 215, 0, 0.3);
  z-index: 2000;
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
  font-family: "Cinzel", serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--rpg-text-gold);
  text-shadow:
    2px 2px 4px rgba(0, 0, 0, 0.8),
    0 0 10px rgba(255, 215, 0, 0.5);
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
  box-shadow: 0 0 10px rgba(196, 30, 58, 0.5);
  transform: translateY(-50%) scale(1.1);
}

.panel-content {
  padding: 20px;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.empty-message {
  text-align: center;
  padding: 40px 20px;
  color: var(--rpg-bronze);
  font-size: 18px;
  font-style: italic;
}

.loot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.loot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(58, 36, 24, 0.5);
  border: 2px solid var(--rpg-bronze);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.loot-item:hover {
  background: rgba(58, 36, 24, 0.8);
  border-color: var(--rpg-gold);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.item-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--rpg-bg-dark);
  border: 2px solid var(--rpg-bronze);
  border-radius: 4px;
  font-size: 24px;
  overflow: hidden;
}

.item-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.item-info {
  flex: 1;
}

.item-name {
  font-family: "Cinzel", serif;
  font-size: 16px;
  font-weight: 600;
  color: var(--rpg-text-gold);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  margin-bottom: 4px;
}

.item-quantity {
  font-size: 14px;
  color: var(--rpg-bronze);
}

.panel-footer {
  padding: 12px 20px;
  background: var(--rpg-bg-dark);
  border-top: 2px solid var(--rpg-bronze);
  text-align: center;
  font-size: 14px;
  color: var(--rpg-bronze);
  font-style: italic;
  border-radius: 0 0 4px 4px;
}

/* Custom scrollbar for loot content */
.panel-content::-webkit-scrollbar {
  width: 8px;
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
  background: var(--rpg-gold);
}

/* Item Tooltip */
.item-tooltip {
  position: fixed;
  min-width: 250px;
  max-width: 350px;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 3px solid var(--rpg-border-gold);
  border-radius: 6px;
  padding: 15px;
  color: var(--rpg-text-light);
  font-family: "Quattrocento", serif;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.9),
    inset 0 1px 0 rgba(255, 215, 0, 0.3);
  z-index: 3000;
  pointer-events: none;
  animation: tooltipFadeIn 0.2s ease;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tooltip-header {
  font-family: "Cinzel", serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--rpg-text-gold);
  text-shadow:
    2px 2px 4px rgba(0, 0, 0, 0.8),
    0 0 8px rgba(255, 215, 0, 0.4);
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--rpg-bronze);
}

.tooltip-description {
  font-size: 14px;
  color: var(--rpg-text-light);
  margin-bottom: 10px;
  line-height: 1.4;
  font-style: italic;
}

.tooltip-stats,
.tooltip-effects {
  margin-bottom: 10px;
}

.tooltip-section-title {
  font-family: "Cinzel", serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--rpg-gold-dark);
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.tooltip-stat,
.tooltip-effect {
  font-size: 13px;
  padding: 3px 0;
  padding-left: 10px;
  color: var(--rpg-text-light);
}

.stat-value,
.effect-value {
  color: var(--rpg-green);
  font-weight: bold;
}

.tooltip-type {
  font-size: 12px;
  color: var(--rpg-bronze);
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--rpg-bronze);
}

.type-value {
  color: var(--rpg-gold-dark);
  font-weight: bold;
  text-transform: capitalize;
}
</style>
