/**
 * Quest definitions
 */

export const QUESTS = {
  sadrax_slime_hunt: {
    id: 'sadrax_slime_hunt',
    name: 'Slime Extermination',
    description: 'SADRAX needs your help clearing out slimes. Defeat 3 slime monsters.',
    giver: 'sadrax',
    objectives: [
      {
        type: 'kill',
        target: 'monster_slime',
        current: 0,
        required: 3,
        description: 'Defeat slime monsters'
      }
    ],
    rewards: {
      gold: 10,
      items: ['potion_health', 'potion_health', 'potion_health', 'potion_health', 'potion_health', 'ring_strength']
    },
    status: 'available', // available, active, completed, rewarded
    completedAt: null
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
