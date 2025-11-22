<template>
  <div v-if="gameStore.ui.inventoryVisible" class="panel inventory-panel">
    <div class="panel-header">
      <div class="header-decoration"></div>
      <h2>⚔ INVENTORY ⚔</h2>
      <button class="close-btn" @click="gameStore.toggleInventory">✕</button>
    </div>

    <div class="panel-content">
      <div class="inventory-grid">
        <!-- Equipment Section -->
        <div class="equipment-section">
          <h3>⚔ EQUIPPED</h3>

          <div class="equipment-grid">
            <!-- Row 1: Helmet (center) -->
            <div class="equipment-slot helmet-slot">
              <div
                class="slot-box"
                :class="{ filled: gameStore.inventory.equipped.helmet }"
                @click="handleEquipmentClick('helmet')"
                @mouseenter="handleItemMouseEnter($event, gameStore.inventory.equipped.helmet)"
                @mousemove="handleItemMouseMove($event)"
                @mouseleave="handleItemMouseLeave"
              >
                <div v-if="gameStore.inventory.equipped.helmet" class="item-content">
                  <img
                    :src="getItemImagePath(gameStore.inventory.equipped.helmet)"
                    :alt="gameStore.inventory.equipped.helmet.name"
                    class="item-image"
                  />
                </div>
                <div v-else class="empty-slot-content">
                  <div class="slot-icon">{{ slotIcons.helmet }}</div>
                  <span class="slot-label">HELMET</span>
                </div>
              </div>
            </div>

            <!-- Row 2: Weapon, Armor, Shield -->
            <div class="equipment-slot weapon-slot">
              <div
                class="slot-box"
                :class="{ filled: gameStore.inventory.equipped.weapon }"
                @click="handleEquipmentClick('weapon')"
                @mouseenter="handleItemMouseEnter($event, gameStore.inventory.equipped.weapon)"
                @mousemove="handleItemMouseMove($event)"
                @mouseleave="handleItemMouseLeave"
              >
                <div v-if="gameStore.inventory.equipped.weapon" class="item-content">
                  <img
                    :src="getItemImagePath(gameStore.inventory.equipped.weapon)"
                    :alt="gameStore.inventory.equipped.weapon.name"
                    class="item-image"
                  />
                </div>
                <div v-else class="empty-slot-content">
                  <div class="slot-icon">{{ slotIcons.weapon }}</div>
                  <span class="slot-label">WEAPON</span>
                </div>
              </div>
            </div>

            <div class="equipment-slot armor-slot">
              <div
                class="slot-box"
                :class="{ filled: gameStore.inventory.equipped.armor }"
                @click="handleEquipmentClick('armor')"
                @mouseenter="handleItemMouseEnter($event, gameStore.inventory.equipped.armor)"
                @mousemove="handleItemMouseMove($event)"
                @mouseleave="handleItemMouseLeave"
              >
                <div v-if="gameStore.inventory.equipped.armor" class="item-content">
                  <img
                    :src="getItemImagePath(gameStore.inventory.equipped.armor)"
                    :alt="gameStore.inventory.equipped.armor.name"
                    class="item-image"
                  />
                </div>
                <div v-else class="empty-slot-content">
                  <div class="slot-icon">{{ slotIcons.armor }}</div>
                  <span class="slot-label">ARMOR</span>
                </div>
              </div>
            </div>

            <div class="equipment-slot shield-slot">
              <div
                class="slot-box"
                :class="{ filled: gameStore.inventory.equipped.shield }"
                @click="handleEquipmentClick('shield')"
                @mouseenter="handleItemMouseEnter($event, gameStore.inventory.equipped.shield)"
                @mousemove="handleItemMouseMove($event)"
                @mouseleave="handleItemMouseLeave"
              >
                <div v-if="gameStore.inventory.equipped.shield" class="item-content">
                  <img
                    :src="getItemImagePath(gameStore.inventory.equipped.shield)"
                    :alt="gameStore.inventory.equipped.shield.name"
                    class="item-image"
                  />
                </div>
                <div v-else class="empty-slot-content">
                  <div class="slot-icon">{{ slotIcons.shield }}</div>
                  <span class="slot-label">SHIELD</span>
                </div>
              </div>
            </div>

            <!-- Row 3: Ring Left, Boots, Ring Right -->
            <div class="equipment-slot ring-left-slot">
              <div
                class="slot-box"
                :class="{ filled: gameStore.inventory.equipped.ring_left }"
                @click="handleEquipmentClick('ring_left')"
                @mouseenter="handleItemMouseEnter($event, gameStore.inventory.equipped.ring_left)"
                @mousemove="handleItemMouseMove($event)"
                @mouseleave="handleItemMouseLeave"
              >
                <div v-if="gameStore.inventory.equipped.ring_left" class="item-content">
                  <img
                    :src="getItemImagePath(gameStore.inventory.equipped.ring_left)"
                    :alt="gameStore.inventory.equipped.ring_left.name"
                    class="item-image"
                  />
                </div>
                <div v-else class="empty-slot-content">
                  <div class="slot-icon">{{ slotIcons.ring_left }}</div>
                  <span class="slot-label">RING L</span>
                </div>
              </div>
            </div>

            <div class="equipment-slot boots-slot">
              <div
                class="slot-box"
                :class="{ filled: gameStore.inventory.equipped.boots }"
                @click="handleEquipmentClick('boots')"
                @mouseenter="handleItemMouseEnter($event, gameStore.inventory.equipped.boots)"
                @mousemove="handleItemMouseMove($event)"
                @mouseleave="handleItemMouseLeave"
              >
                <div v-if="gameStore.inventory.equipped.boots" class="item-content">
                  <img
                    :src="getItemImagePath(gameStore.inventory.equipped.boots)"
                    :alt="gameStore.inventory.equipped.boots.name"
                    class="item-image"
                  />
                </div>
                <div v-else class="empty-slot-content">
                  <div class="slot-icon">{{ slotIcons.boots }}</div>
                  <span class="slot-label">BOOTS</span>
                </div>
              </div>
            </div>

            <div class="equipment-slot ring-right-slot">
              <div
                class="slot-box"
                :class="{ filled: gameStore.inventory.equipped.ring_right }"
                @click="handleEquipmentClick('ring_right')"
                @mouseenter="handleItemMouseEnter($event, gameStore.inventory.equipped.ring_right)"
                @mousemove="handleItemMouseMove($event)"
                @mouseleave="handleItemMouseLeave"
              >
                <div v-if="gameStore.inventory.equipped.ring_right" class="item-content">
                  <img
                    :src="getItemImagePath(gameStore.inventory.equipped.ring_right)"
                    :alt="gameStore.inventory.equipped.ring_right.name"
                    class="item-image"
                  />
                </div>
                <div v-else class="empty-slot-content">
                  <div class="slot-icon">{{ slotIcons.ring_right }}</div>
                  <span class="slot-label">RING R</span>
                </div>
              </div>
            </div>

            <!-- Row 4: Amulet (center) -->
            <div class="equipment-slot amulet-slot">
              <div
                class="slot-box"
                :class="{ filled: gameStore.inventory.equipped.amulet }"
                @click="handleEquipmentClick('amulet')"
                @mouseenter="handleItemMouseEnter($event, gameStore.inventory.equipped.amulet)"
                @mousemove="handleItemMouseMove($event)"
                @mouseleave="handleItemMouseLeave"
              >
                <div v-if="gameStore.inventory.equipped.amulet" class="item-content">
                  <img
                    :src="getItemImagePath(gameStore.inventory.equipped.amulet)"
                    :alt="gameStore.inventory.equipped.amulet.name"
                    class="item-image"
                  />
                </div>
                <div v-else class="empty-slot-content">
                  <div class="slot-icon">{{ slotIcons.amulet }}</div>
                  <span class="slot-label">AMULET</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Backpack Section -->
        <div class="backpack-section">
          <h3>🎒 BACKPACK ({{ gameStore.backpackCount }}/40)</h3>

          <div class="backpack-grid">
            <div
              v-for="i in 40"
              :key="i"
              class="backpack-slot"
              :class="{ filled: gameStore.inventory.backpack[i - 1] }"
              @click="handleBackpackClick(i - 1)"
              @contextmenu.prevent="handleBackpackRightClick(i - 1)"
              @mouseenter="handleItemMouseEnter($event, gameStore.inventory.backpack[i - 1])"
              @mousemove="handleItemMouseMove($event)"
              @mouseleave="handleItemMouseLeave"
            >
              <div v-if="gameStore.inventory.backpack[i - 1]" class="item-content">
                <img
                  :src="getItemImagePath(gameStore.inventory.backpack[i - 1])"
                  :alt="gameStore.inventory.backpack[i - 1].name"
                  class="item-image"
                />
                <span v-if="gameStore.inventory.backpack[i - 1].stackable" class="quantity">
                  {{ gameStore.inventory.backpack[i - 1].quantity }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      Click items to equip/unequip | Hover + 1-0 to assign to quick slot | Press I to close
    </div>
  </div>

  <!-- Tooltip Panel - outside the panel container to avoid transform issues -->
  <div
    v-if="gameStore.ui.inventoryVisible && hoveredItem"
    class="item-tooltip"
    :style="{
      left: tooltipPosition.x + 'px',
      top: tooltipPosition.y + 'px'
    }"
  >
    <div class="tooltip-header">{{ hoveredItem.name }}</div>
    <div v-if="hoveredItem.description" class="tooltip-description">
      {{ hoveredItem.description }}
    </div>
    <div v-if="hoveredItem.stats && Object.keys(hoveredItem.stats).length > 0" class="tooltip-stats">
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../stores/gameStore';

const gameStore = useGameStore();

// Tooltip state
const hoveredItem = ref(null);
const tooltipPosition = ref({ x: 0, y: 0 });

// Quick slot assignment - listen for 1-0 keys when hovering over item
const handleQuickSlotAssignment = (event) => {
  if (!hoveredItem.value) return;

  const key = event.key;
  let slotIndex = -1;

  // Map key to slot index (1-9 = index 0-8, 0 = index 9)
  if (key >= "1" && key <= "9") {
    slotIndex = parseInt(key) - 1;
  } else if (key === "0") {
    slotIndex = 9;
  }

  if (slotIndex >= 0 && slotIndex < 10) {
    // Only usable items (consumables) can be assigned to quick slots
    if (hoveredItem.value.type === 'consumable') {
      gameStore.assignQuickSlot(slotIndex, hoveredItem.value);
      gameStore.showToast(`Assigned ${hoveredItem.value.name} to slot ${key}`, 'success', 2000);
    } else {
      gameStore.showToast(`Only usable items can be assigned to quick slots`, 'warning', 2000);
    }
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleQuickSlotAssignment);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleQuickSlotAssignment);
});

const equipmentSlots = ['helmet', 'armor', 'weapon', 'shield', 'boots', 'amulet', 'ring_left', 'ring_right'];

const slotIcons = {
  helmet: '⛊',
  armor: '🛡',
  weapon: '⚔',
  shield: '🛡',
  boots: '👢',
  amulet: '📿',
  ring_left: '💍',
  ring_right: '💍'
};

const handleEquipmentClick = (slot) => {
  // Emit event to Phaser to handle unequip logic
  window.dispatchEvent(new CustomEvent('unequip-item', { detail: { slot } }));
};

const handleBackpackClick = (index) => {
  const item = gameStore.inventory.backpack[index];
  if (item && item.wearable) {
    // Emit event to Phaser to handle equip logic
    window.dispatchEvent(new CustomEvent('equip-item', { detail: { instanceId: item.instanceId } }));
  }
};

const handleBackpackRightClick = (index) => {
  const item = gameStore.inventory.backpack[index];
  if (item && item.type === 'consumable') {
    // Emit event to Phaser to handle use logic
    window.dispatchEvent(new CustomEvent('use-item', { detail: { instanceId: item.instanceId } }));
  }
};

const handleItemMouseEnter = (event, item) => {
  if (!item) return;
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
    y: event.clientY - 10
  };
};

const getItemImagePath = (item) => {
  // Use iconSprite if available
  if (item.iconSprite) {
    // Check if it's a full path (starts with /) or just a sprite key
    if (item.iconSprite.startsWith('/')) {
      return item.iconSprite; // Use full path directly
    }
    // Backward compatibility: construct path from sprite key
    return `/assets/sprites/static/equipment/${item.category}/${item.iconSprite}.png`;
  }

  // If item has a sprite, use it; otherwise use fallback
  if (item.sprite) {
    // Check sprite type to determine path
    if (item.spriteType === 'animated') {
      // For animated sprites (equipment), use a placeholder frame or static icon
      return `/assets/sprites/static/items/item_loot_bag.png`;
    } else {
      // For static sprites (gold, potions)
      return `/assets/sprites/static/items/${item.sprite}.png`;
    }
  }
  // Fallback image
  return `/assets/sprites/static/items/item_loot_bag.png`;
};
</script>

<style scoped>
.inventory-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 750px;
  background: linear-gradient(135deg, var(--rpg-bg-dark) 0%, var(--rpg-bg-medium) 100%);
  border: 4px solid var(--rpg-border-gold);
  border-radius: 8px;
  color: var(--rpg-text-light);
  font-family: 'Quattrocento', serif;
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
}

.inventory-grid {
  display: flex;
  gap: 25px;
}

.equipment-section {
  flex: 0 0 280px;
}

.equipment-section h3,
.backpack-section h3 {
  color: var(--rpg-text-gold);
  font-family: 'Cinzel', serif;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 1px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--rpg-bronze);
}

.equipment-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

/* Row 1: Helmet (center) */
.helmet-slot {
  grid-column: 2 / 3;
  grid-row: 1;
}

/* Row 2: Weapon, Armor, Shield */
.weapon-slot {
  grid-column: 1 / 2;
  grid-row: 2;
}

.armor-slot {
  grid-column: 2 / 3;
  grid-row: 2;
}

.shield-slot {
  grid-column: 3 / 4;
  grid-row: 2;
}

/* Row 3: Ring Left, Boots, Ring Right */
.ring-left-slot {
  grid-column: 1 / 2;
  grid-row: 3;
}

.boots-slot {
  grid-column: 2 / 3;
  grid-row: 3;
}

.ring-right-slot {
  grid-column: 3 / 4;
  grid-row: 3;
}

/* Row 4: Amulet (center) */
.amulet-slot {
  grid-column: 2 / 3;
  grid-row: 4;
}

.slot-box {
  position: relative;
  width: 100%;
  min-height: 70px;
  background: rgba(0, 0, 0, 0.4);
  border: 3px solid var(--rpg-bronze);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  text-align: center;
  padding: 10px;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
}

.slot-box:hover {
  border-color: var(--rpg-gold);
  background: rgba(0, 0, 0, 0.6);
  transform: translateY(-2px);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 15px rgba(212, 175, 55, 0.3);
}

.slot-box.filled {
  border-color: var(--rpg-gold-dark);
  background: rgba(50, 30, 10, 0.5);
}

.slot-box.filled:hover {
  border-color: var(--rpg-gold);
}

.empty-slot-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.slot-icon {
  font-size: 24px;
  margin-bottom: 5px;
  opacity: 0.6;
}

.slot-box.filled .slot-icon {
  opacity: 1;
  filter: drop-shadow(0 0 4px rgba(255, 215, 0, 0.5));
}

.slot-label {
  color: var(--rpg-bronze);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.item-name {
  color: var(--rpg-text-light);
  font-weight: bold;
  font-size: 12px;
  word-break: break-word;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.backpack-section {
  flex: 1;
}

.backpack-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.backpack-slot {
  aspect-ratio: 1;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid var(--rpg-bronze);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 9px;
  text-align: center;
  padding: 3px;
  transition: all 0.2s ease;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
}

.backpack-slot:hover {
  border-color: var(--rpg-gold);
  background: rgba(0, 0, 0, 0.6);
  transform: scale(1.05);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 10px rgba(212, 175, 55, 0.3);
  z-index: 1;
}

.backpack-slot.filled {
  border-color: var(--rpg-gold-dark);
  background: rgba(50, 30, 10, 0.5);
}

.backpack-slot.filled:hover {
  border-color: var(--rpg-gold);
}

.backpack-slot .item-name {
  font-size: 9px;
  line-height: 1.2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.item-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.quantity {
  position: absolute;
  bottom: 2px;
  right: 2px;
  color: var(--rpg-text-gold);
  font-weight: bold;
  font-size: 10px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.7);
  padding: 1px 4px;
  border-radius: 2px;
  min-width: 16px;
  text-align: center;
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
  font-family: 'Quattrocento', serif;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 215, 0, 0.3);
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
  font-family: 'Cinzel', serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--rpg-text-gold);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(255, 215, 0, 0.4);
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
  font-family: 'Cinzel', serif;
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
