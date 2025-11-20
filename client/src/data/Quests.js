/**
 * Quest definitions
 */

export const QUESTS = {
  kill_3_monsters: {
    id: 'kill_3_monsters',
    name: 'Monster Hunter',
    description: 'Defeat 3 monsters to prove your worth',
    objectives: [
      {
        type: 'kill',
        target: 'monster',
        current: 0,
        required: 3,
        description: 'Defeat monsters'
      }
    ],
    rewards: {
      experience: 100,
      gold: 50,
      items: ['item_gold_coin']
    },
    completed: false
  }
};

/**
 * Get quest by ID
 */
export function getQuest(questId) {
  return QUESTS[questId] ? { ...QUESTS[questId] } : null;
}

/**
 * Create quest instance
 */
export function createQuestInstance(questId) {
  const questDef = getQuest(questId);
  if (!questDef) return null;

  return {
    instanceId: generateUniqueId(),
    ...questDef,
    startedAt: Date.now(),
    completedAt: null
  };
}

/**
 * Generate unique ID for quest instances
 */
function generateUniqueId() {
  return `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
