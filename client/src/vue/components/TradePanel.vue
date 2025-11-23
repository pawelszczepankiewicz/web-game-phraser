<template>
  <div v-if="gameStore.ui.tradeVisible" class="trade-overlay">
    <div class="trade-panel">
      <!-- Header -->
      <div class="panel-header">
        <div class="header-decoration"></div>
        <h2>TRADING WITH {{ gameStore.trade.traderName.toUpperCase() }}</h2>
        <button class="close-btn" @click="closeTrade">✕</button>
      </div>

      <!-- Content -->
      <div class="panel-content">
        <div class="trade-container">
          <!-- Player Side (Left) -->
          <div class="trade-column player-column">
            <div class="column-header">
              <h3>YOUR INVENTORY</h3>
              <div class="gold-display">
                <span class="gold-icon">💰</span>
                <span class="gold-amount">{{ gameStore.inventory.gold || 0 }}</span>
              </div>
            </div>
            <div class="trade-hint">Right-click to SELL</div>
            <div class="items-grid">
              <div
                v-for="item in playerItems"
                :key="item.instanceId"
                class="item-slot filled"
                @contextmenu.prevent="sellItem(item)"
                @mouseenter="showTooltip($event, item, 'sell')"
                @mouseleave="hideTooltip"
              >
                <img :src="getItemImagePath(item)" :alt="item.name" />
                <div v-if="item.quantity > 1" class="quantity-badge">
                  {{ item.quantity }}
                </div>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="trade-divider"></div>

          <!-- Trader Side (Right) -->
          <div class="trade-column trader-column">
            <div class="column-header">
              <h3>TRADER'S GOODS</h3>
              <div class="gold-display">
                <span class="gold-icon">💰</span>
                <span class="gold-amount">∞</span>
              </div>
            </div>
            <div class="trade-hint">Right-click to BUY</div>
            <div class="items-grid">
              <div
                v-for="item in gameStore.trade.traderInventory"
                :key="item.instanceId"
                class="item-slot filled"
                @contextmenu.prevent="buyItem(item)"
                @mouseenter="showTooltip($event, item, 'buy')"
                @mouseleave="hideTooltip"
              >
                <img :src="getItemImagePath(item)" :alt="item.name" />
                <div v-if="item.quantity > 1" class="quantity-badge">
                  {{ item.quantity }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tooltip -->
      <div
        v-if="tooltip.visible"
        class="tooltip"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div class="tooltip-header">{{ tooltip.item?.name }}</div>
        <div class="tooltip-content">
          <div v-if="tooltip.item?.description" class="tooltip-description">
            {{ tooltip.item.description }}
          </div>
          <div class="tooltip-stats">
            <div v-for="(value, key) in tooltip.item?.stats" :key="key" class="stat-line">
              <span class="stat-name">{{ formatStatName(key) }}:</span>
              <span class="stat-value" :class="{ positive: value > 0 }">
                {{ value > 0 ? '+' : '' }}{{ value }}
              </span>
            </div>
          </div>
          <div class="tooltip-price" :class="tooltip.action">
            <span v-if="tooltip.action === 'buy'">BUY: {{ tooltip.item?.price || 0 }} gold</span>
            <span v-if="tooltip.action === 'sell'">SELL: {{ Math.floor((tooltip.item?.price || 0) * 0.5) }} gold</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();

// Tooltip state
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  item: null,
  action: null
});

// Get player's backpack items (not equipped, not gold)
const playerItems = computed(() => {
  return gameStore.inventory.backpack.filter(item =>
    item !== null && item.itemId !== 'gold'
  );
});

// Get item image path
const getItemImagePath = (item) => {
  if (!item) return '';

  // Use icon property for UI display
  if (item.icon) {
    // Check if it's a full path (starts with /) or just a sprite key
    if (item.icon.startsWith('/')) {
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

// Format stat names
const formatStatName = (key) => {
  const names = {
    health: 'Health',
    maxHealth: 'Max Health',
    attackStrength: 'Attack',
    armor: 'Armor',
    defense: 'Defense'
  };
  return names[key] || key;
};

// Show tooltip
const showTooltip = (event, item, action) => {
  tooltip.value = {
    visible: true,
    x: event.clientX + 10,
    y: event.clientY - 10,
    item: item,
    action: action
  };
};

// Hide tooltip
const hideTooltip = () => {
  tooltip.value.visible = false;
};

// Sell item to trader
const sellItem = (item) => {
  if (!item) return;

  // Emit sell event to Phaser
  window.dispatchEvent(new CustomEvent('sell-item', {
    detail: {
      instanceId: item.instanceId,
      price: Math.floor((item.price || 0) * 0.5) // Sell for 50% of buy price
    }
  }));

  console.log(`Selling ${item.name} for ${Math.floor((item.price || 0) * 0.5)} gold`);
};

// Buy item from trader
const buyItem = (item) => {
  if (!item) return;

  const price = item.price || 0;

  // Check if player has enough gold (use inventory.gold as single source of truth)
  const playerGold = gameStore.inventory.gold || 0;
  if (playerGold < price) {
    gameStore.showToast(`Not enough gold! Need ${price} gold.`, 'error', 3000);
    return;
  }

  // Emit buy event to Phaser
  window.dispatchEvent(new CustomEvent('buy-item', {
    detail: {
      itemId: item.itemId,
      price: price
    }
  }));

  console.log(`Buying ${item.name} for ${price} gold`);
};

// Close trade panel
const closeTrade = () => {
  gameStore.closeTrade();
};
</script>

<style scoped>
.trade-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  pointer-events: auto;
}

.trade-panel {
  width: 900px;
  max-height: 90vh;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 4px solid var(--rpg-border-gold);
  border-radius: 8px;
  color: var(--rpg-text-light);
  font-family: 'Quattrocento', serif;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 215, 0, 0.3);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
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
  width: 150px;
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
  box-shadow: 0 0 10px rgba(196, 30, 58, 0.5);
  transform: translateY(-50%) scale(1.1);
}

.panel-content {
  padding: 30px;
}

.trade-container {
  display: flex;
  gap: 20px;
}

.trade-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, var(--rpg-bg-light) 0%, var(--rpg-bg-medium) 100%);
  border: 3px solid var(--rpg-bronze);
  border-radius: 6px;
}

.column-header h3 {
  margin: 0;
  font-family: 'Cinzel', serif;
  font-size: 18px;
  font-weight: 600;
  color: var(--rpg-text-gold);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
}

.gold-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--rpg-gold);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.gold-icon {
  font-size: 20px;
}

.trade-hint {
  text-align: center;
  font-size: 12px;
  color: var(--rpg-gold-dark);
  font-style: italic;
  padding: 5px;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--rpg-bronze);
  border-radius: 6px;
  max-height: 400px;
  overflow-y: auto;
}

.item-slot {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, var(--rpg-bg-medium) 0%, var(--rpg-bg-dark) 100%);
  border: 2px solid var(--rpg-bronze);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.item-slot.filled {
  border-color: var(--rpg-gold-dark);
}

.item-slot:hover {
  border-color: var(--rpg-gold);
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
}

.item-slot img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.8));
}

.quantity-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.8);
  color: var(--rpg-gold);
  font-size: 12px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--rpg-gold-dark);
}

.trade-divider {
  width: 2px;
  background: linear-gradient(180deg, transparent, var(--rpg-gold), transparent);
  margin: 20px 0;
}

/* Tooltip */
.tooltip {
  position: fixed;
  z-index: 10000;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 3px solid var(--rpg-border-gold);
  border-radius: 6px;
  padding: 12px 15px;
  min-width: 200px;
  max-width: 300px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.9);
  pointer-events: none;
}

.tooltip-header {
  font-family: 'Cinzel', serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--rpg-text-gold);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  margin-bottom: 8px;
  border-bottom: 2px solid var(--rpg-bronze);
  padding-bottom: 5px;
}

.tooltip-content {
  font-size: 13px;
  color: var(--rpg-text-light);
}

.tooltip-description {
  margin-bottom: 8px;
  font-style: italic;
  color: rgba(245, 230, 211, 0.8);
}

.tooltip-stats {
  margin-bottom: 8px;
}

.stat-line {
  display: flex;
  justify-content: space-between;
  margin: 4px 0;
}

.stat-name {
  color: var(--rpg-text-light);
}

.stat-value {
  color: var(--rpg-text-gold);
  font-weight: 700;
}

.stat-value.positive {
  color: var(--rpg-green);
}

.tooltip-price {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 2px solid var(--rpg-bronze);
  font-family: 'Cinzel', serif;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.tooltip-price.buy {
  color: var(--rpg-gold);
}

.tooltip-price.sell {
  color: var(--rpg-green);
}

/* Scrollbar for items grid */
.items-grid::-webkit-scrollbar {
  width: 8px;
}

.items-grid::-webkit-scrollbar-track {
  background: var(--rpg-bg-dark);
  border-radius: 4px;
}

.items-grid::-webkit-scrollbar-thumb {
  background: var(--rpg-bronze);
  border-radius: 4px;
}

.items-grid::-webkit-scrollbar-thumb:hover {
  background: var(--rpg-gold-dark);
}
</style>
