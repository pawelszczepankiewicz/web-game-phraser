/**
 * Quest definitions
 */

export const QUESTS = {
  sadrax_slime_hunt: {
    id: "sadrax_slime_hunt",
    name: "Slime Extermination",
    description:
      "SADRAX needs your help clearing out slimes. Defeat 3 slime monsters.",
    giver: "sadrax",
    objectives: [
      {
        type: "kill",
        target: "monster_slime",
        current: 0,
        required: 3,
        description: "Defeat slime monsters",
      },
    ],
    rewards: {
      gold: 10,
      items: [
        "potion_health",
        "potion_health",
        "potion_health",
        "potion_health",
        "potion_health",
        "ring_strength",
      ],
    },
    status: "available", // available, active, completed, rewarded
    completedAt: null,
  },

  goblin_menace: {
    id: "goblin_menace",
    name: "Goblin Menace",
    description:
      "The goblins are raiding nearby settlements. Eliminate 3 goblins to protect the area.",
    giver: "sadrax",
    objectives: [
      {
        type: "kill",
        target: "monster_goblin",
        current: 0,
        required: 3,
        description: "Defeat goblins",
      },
    ],
    rewards: {
      gold: 30,
      items: ["potion_health", "potion_health", "helmet_leather"],
    },
    status: "available",
    completedAt: null,
  },

  skeleton_curse: {
    id: "skeleton_curse",
    name: "The Skeleton Curse",
    description:
      "Undead skeletons are rising from their graves. Put 3 of them to rest.",
    giver: "sadrax",
    objectives: [
      {
        type: "kill",
        target: "monster_skeleton",
        current: 0,
        required: 3,
        description: "Defeat skeletons",
      },
    ],
    rewards: {
      gold: 60,
      items: ["potion_health", "potion_health", "armor_iron", "ring_defense"],
    },
    status: "available",
    completedAt: null,
  },

  wolf_pack: {
    id: "wolf_pack",
    name: "Wolf Pack Threat",
    description:
      "A pack of aggressive wolves is terrorizing travelers. Hunt down 3 wolves.",
    giver: "sadrax",
    objectives: [
      {
        type: "kill",
        target: "monster_wolf",
        current: 0,
        required: 3,
        description: "Defeat wolves",
      },
    ],
    rewards: {
      gold: 90,
      items: ["potion_health", "potion_health", "boots_iron", "ring_swiftness"],
    },
    status: "available",
    completedAt: null,
  },

  orc_invasion: {
    id: "orc_invasion",
    name: "Orc Invasion",
    description:
      "Brutal orcs are gathering forces for an invasion. Defeat 3 orcs to disrupt their plans.",
    giver: "sadrax",
    objectives: [
      {
        type: "kill",
        target: "monster_orc",
        current: 0,
        required: 3,
        description: "Defeat orcs",
      },
    ],
    rewards: {
      gold: 150,
      items: [
        "potion_health",
        "potion_health",
        "potion_health",
        "weapon_iron_sword",
        "helmet_steel",
      ],
    },
    status: "available",
    completedAt: null,
  },

  dark_magic: {
    id: "dark_magic",
    name: "Dark Magic Threat",
    description:
      "Dark mages are performing forbidden rituals. Stop 3 dark mages before it's too late.",
    giver: "sadrax",
    objectives: [
      {
        type: "kill",
        target: "monster_dark_mage",
        current: 0,
        required: 3,
        description: "Defeat dark mages",
      },
    ],
    rewards: {
      gold: 180,
      items: [
        "potion_health",
        "potion_health",
        "potion_health",
        "amulet_basic",
        "ring_power",
      ],
    },
    status: "available",
    completedAt: null,
  },

  troll_problem: {
    id: "troll_problem",
    name: "The Troll Problem",
    description:
      "Massive trolls are blocking important trade routes. Defeat 3 trolls to clear the way.",
    giver: "sadrax",
    objectives: [
      {
        type: "kill",
        target: "monster_troll",
        current: 0,
        required: 3,
        description: "Defeat trolls",
      },
    ],
    rewards: {
      gold: 300,
      items: [
        "potion_health",
        "potion_health",
        "potion_health",
        "potion_health",
        "shield_steel",
        "ring_vitality",
      ],
    },
    status: "available",
    completedAt: null,
  },

  wraith_haunting: {
    id: "wraith_haunting",
    name: "Wraith Haunting",
    description:
      "Vengeful wraiths are haunting the realm. Banish 3 wraiths to restore peace.",
    giver: "sadrax",
    objectives: [
      {
        type: "kill",
        target: "monster_wraith",
        current: 0,
        required: 3,
        description: "Defeat wraiths",
      },
    ],
    rewards: {
      gold: 360,
      items: [
        "potion_health",
        "potion_health",
        "potion_health",
        "boots_mithril",
        "amulet_protection",
      ],
    },
    status: "available",
    completedAt: null,
  },

  demon_uprising: {
    id: "demon_uprising",
    name: "Demon Uprising",
    description:
      "Demons from the underworld are breaking through. Slay 3 demons to push them back.",
    giver: "sadrax",
    objectives: [
      {
        type: "kill",
        target: "monster_demon",
        current: 0,
        required: 3,
        description: "Defeat demons",
      },
    ],
    rewards: {
      gold: 600,
      items: [
        "potion_health",
        "potion_health",
        "potion_health",
        "potion_health",
        "armor_mithril",
        "amulet_fury",
      ],
    },
    status: "available",
    completedAt: null,
  },

  dragon_whelp_menace: {
    id: "dragon_whelp_menace",
    name: "Dragon Whelp Menace",
    description:
      "Young dragons are growing too powerful. Defeat 3 dragon whelps before they mature.",
    giver: "sadrax",
    objectives: [
      {
        type: "kill",
        target: "monster_dragon_whelp",
        current: 0,
        required: 3,
        description: "Defeat dragon whelps",
      },
    ],
    rewards: {
      gold: 900,
      items: [
        "potion_health",
        "potion_health",
        "potion_health",
        "potion_health",
        "potion_health",
        "armor_dragon",
        "ring_ancient",
      ],
    },
    status: "available",
    completedAt: null,
  },

  // TODO: BOSS QUESTS
  // goblin_king_challenge: {
  //   id: "goblin_king_challenge",
  //   name: "Challenge the Goblin King",
  //   description:
  //     "The Goblin King rules over all goblins with an iron fist. Defeat him to break their leadership.",
  //   giver: "sadrax",
  //   objectives: [
  //     {
  //       type: "kill",
  //       target: "boss_goblin_king",
  //       current: 0,
  //       required: 1,
  //       description: "Defeat the Goblin King",
  //     },
  //   ],
  //   rewards: {
  //     gold: 800,
  //     items: [
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "armor_mithril",
  //       "weapon_steel_sword",
  //       "ring_power",
  //     ],
  //   },
  //   status: "available",
  //   completedAt: null,
  // },
  // ancient_lich_quest: {
  //   id: "ancient_lich_quest",
  //   name: "Destroy the Ancient Lich",
  //   description:
  //     "An ancient lich has awakened from its slumber, commanding armies of undead. Only you can stop it.",
  //   giver: "sadrax",
  //   objectives: [
  //     {
  //       type: "kill",
  //       target: "boss_ancient_lich",
  //       current: 0,
  //       required: 1,
  //       description: "Defeat the Ancient Lich",
  //     },
  //   ],
  //   rewards: {
  //     gold: 1500,
  //     items: [
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "armor_dragon",
  //       "weapon_dragon_sword",
  //       "amulet_archon",
  //     ],
  //   },
  //   status: "available",
  //   completedAt: null,
  // },
  // infernal_dragon_slayer: {
  //   id: "infernal_dragon_slayer",
  //   name: "Slay the Infernal Dragon",
  //   description:
  //     "The legendary Infernal Dragon threatens to consume the world in flames. This is the ultimate test of your strength.",
  //   giver: "sadrax",
  //   objectives: [
  //     {
  //       type: "kill",
  //       target: "boss_infernal_dragon",
  //       current: 0,
  //       required: 1,
  //       description: "Defeat the Infernal Dragon",
  //     },
  //   ],
  //   rewards: {
  //     gold: 3000,
  //     items: [
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "potion_health",
  //       "armor_infernal",
  //       "helmet_infernal",
  //       "weapon_infernal_blade",
  //       "ring_ancient",
  //       "amulet_archon",
  //     ],
  //   },
  //   status: "available",
  //   completedAt: null,
  // },
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
    completedAt: null,
  };
}

/**
 * Generate unique ID for quest instances
 */
function generateUniqueId() {
  return `quest_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}
