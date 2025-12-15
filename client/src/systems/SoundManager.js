/**
 * SoundManager - Handles game sound effects and music
 * Provides easy-to-swap sound mappings for different game actions
 */
export class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = new Map(); // key -> Phaser.Sound
    this.music = null; // Current background music
    this.enabled = true;
    this.musicEnabled = true;
    this.volume = 0.25; // 50% of previous volume
    this.musicVolume = 0.15; // Lower volume for background music
  }

  /**
   * Music configuration - background music tracks
   */
  static MUSIC_CONFIG = {
    quest: {
      key: "music_quest",
      path: "/assets/music/quest-music.mp3",
      volume: 0.15,
    },
  };

  /**
   * Sound configuration - maps actions to sound files
   * Each action can have multiple variants that play randomly
   * Easily swappable by modifying this config
   */
  static SOUND_CONFIG = {
    // Player attacks
    player_attack_melee: {
      files: [
        "07_human_atk_sword_1",
        "07_human_atk_sword_2",
        "07_human_atk_sword_3",
      ],
      volume: 0.6,
    },
    player_attack_ranged: {
      files: ["27_sword_miss_1", "27_sword_miss_2"], // Whoosh sounds for arrows
      volume: 0.5,
    },

    // Attack impacts
    hit_melee: {
      files: ["26_sword_hit_1", "26_sword_hit_2", "26_sword_hit_3"],
      volume: 0.5,
    },
    hit_ranged: {
      files: ["26_sword_hit_1"], // Arrow impact
      volume: 0.4,
    },

    // Monster sounds
    monster_death: {
      files: ["24_orc_death_spin"],
      volume: 0.6,
    },
    monster_damage: {
      files: ["21_orc_damage_1", "21_orc_damage_2", "21_orc_damage_3"],
      volume: 0.5,
    },

    // Player sounds
    player_damage: {
      files: ["11_human_damage_1", "11_human_damage_2", "11_human_damage_3"],
      volume: 0.5,
    },
    player_death: {
      files: ["14_human_death_spin"],
      volume: 0.7,
    },

    // UI/Interaction sounds
    loot_pickup: {
      files: ["04_sack_open_1", "04_sack_open_2"],
      volume: 0.4,
    },
    chest_open: {
      files: [
        "01_chest_open_1",
        "01_chest_open_2",
        "01_chest_open_3",
        "01_chest_open_4",
      ],
      volume: 0.5,
    },
    door_open: {
      files: ["05_door_open_1", "05_door_open_2"],
      volume: 0.5,
    },
  };

  /**
   * Get all sound files that need to be loaded
   * @returns {Array<{key: string, path: string}>}
   */
  static getSoundsToLoad() {
    const sounds = [];
    const addedFiles = new Set();

    // Add sound effects
    for (const config of Object.values(SoundManager.SOUND_CONFIG)) {
      for (const file of config.files) {
        if (!addedFiles.has(file)) {
          addedFiles.add(file);
          // Determine file extension based on file name
          const ext = file.includes("door") ? "mp3" : "wav";
          sounds.push({
            key: file,
            path: `/assets/sounds/${file}.${ext}`,
          });
        }
      }
    }

    // Add music tracks
    for (const config of Object.values(SoundManager.MUSIC_CONFIG)) {
      sounds.push({
        key: config.key,
        path: config.path,
      });
    }

    return sounds;
  }

  /**
   * Initialize sounds after they're loaded
   */
  initialize() {
    const soundsToLoad = SoundManager.getSoundsToLoad();

    for (const { key } of soundsToLoad) {
      if (this.scene.cache.audio.exists(key)) {
        const sound = this.scene.sound.add(key);
        this.sounds.set(key, sound);
      }
    }

    console.log(`[SoundManager] Initialized ${this.sounds.size} sounds`);
  }

  /**
   * Play a sound by action type
   * @param {string} action - Action type (e.g., 'player_attack_melee', 'monster_death')
   * @param {Object} options - Optional overrides { volume, rate }
   */
  play(action, options = {}) {
    if (!this.enabled) return;

    const config = SoundManager.SOUND_CONFIG[action];
    if (!config) {
      console.warn(`[SoundManager] Unknown action: ${action}`);
      return;
    }

    // Pick a random variant
    const fileKey = config.files[Math.floor(Math.random() * config.files.length)];
    const sound = this.sounds.get(fileKey);

    if (!sound) {
      console.warn(`[SoundManager] Sound not loaded: ${fileKey}`);
      return;
    }

    // Play with configured volume (can be overridden)
    const volume = (options.volume ?? config.volume ?? 0.5) * this.volume;
    const rate = options.rate ?? 1;

    sound.play({ volume, rate });
  }

  /**
   * Set master volume
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable/disable all sounds
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Stop all playing sounds
   */
  stopAll() {
    this.scene.sound.stopAll();
  }

  /**
   * Play background music
   * @param {string} trackName - Music track name (e.g., 'quest')
   */
  playMusic(trackName) {
    if (!this.musicEnabled) return;

    const config = SoundManager.MUSIC_CONFIG[trackName];
    if (!config) {
      console.warn(`[SoundManager] Unknown music track: ${trackName}`);
      return;
    }

    // Stop current music if playing
    if (this.music && this.music.isPlaying) {
      this.music.stop();
    }

    // Check if music is loaded
    if (!this.scene.cache.audio.exists(config.key)) {
      console.warn(`[SoundManager] Music not loaded: ${config.key}`);
      return;
    }

    // Create and play music with loop
    this.music = this.scene.sound.add(config.key, {
      volume: config.volume * this.musicVolume,
      loop: true,
    });
    this.music.play();

    console.log(`[SoundManager] Playing music: ${trackName}`);
  }

  /**
   * Stop background music
   */
  stopMusic() {
    if (this.music && this.music.isPlaying) {
      this.music.stop();
    }
  }

  /**
   * Set music volume
   * @param {number} volume - Volume level (0-1)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      // Find the config volume for current track
      const configVolume = 0.15; // Default
      this.music.setVolume(configVolume * this.musicVolume);
    }
  }

  /**
   * Enable/disable music
   * @param {boolean} enabled
   */
  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    if (!enabled && this.music) {
      this.music.stop();
    }
  }
}
