import { Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const GAME_CONFIG = {
  // General layout
  BIRD_X: 60,
  BIRD_SIZE: 55,
  HITBOX_PADDING: 4, // 4px padding on each side reduces hitbox size by ~14% area for fair, forgiving collisions
  PIPE_WIDTH: 68,
  FLOOR_HEIGHT: 100,

  // Easy mode base parameters (Score 0)
  BASE_GRAVITY: 0.33,         // ~17% reduction from 0.40
  BASE_JUMP_STRENGTH: -7.0,   // ~12% reduction from -8.0
  BASE_PIPE_GAP: 215,         // ~26% increase from 170
  BASE_PIPE_SPEED: 2.8,       // ~20% reduction from 3.5
  BASE_SPAWN_OFFSET: 120,     // wider pipe spacing (further offscreen initial layout)

  // Hard mode target parameters (Score 40+)
  TARGET_GRAVITY: 0.44,       // increased gravity for fast fall speeds
  TARGET_JUMP_STRENGTH: -8.2, // stronger jumps matching the high gravity
  TARGET_PIPE_GAP: 165,       // tighter gap for challenging clears
  TARGET_PIPE_SPEED: 4.1,     // faster pipe movement speed
  TARGET_SPAWN_OFFSET: 0,     // narrow spacing for quick succession

  // Difficulty ceiling
  MAX_PROGRESSION_SCORE: 40,
};

/**
 * Calculates game difficulty parameters dynamically based on the current score.
 * Seamlessly interpolates values between base (easy) and target (hard) ceilings.
 */
export function getDifficultyParams(score: number) {
  'worklet';
  const progress = Math.min(GAME_CONFIG.MAX_PROGRESSION_SCORE, score);
  const t = progress / GAME_CONFIG.MAX_PROGRESSION_SCORE; // Interpolation factor (0.0 to 1.0)

  return {
    gravity: GAME_CONFIG.BASE_GRAVITY + (GAME_CONFIG.TARGET_GRAVITY - GAME_CONFIG.BASE_GRAVITY) * t,
    jumpStrength: GAME_CONFIG.BASE_JUMP_STRENGTH + (GAME_CONFIG.TARGET_JUMP_STRENGTH - GAME_CONFIG.BASE_JUMP_STRENGTH) * t,
    pipeGap: GAME_CONFIG.BASE_PIPE_GAP + (GAME_CONFIG.TARGET_PIPE_GAP - GAME_CONFIG.BASE_PIPE_GAP) * t,
    pipeSpeed: GAME_CONFIG.BASE_PIPE_SPEED + (GAME_CONFIG.TARGET_PIPE_SPEED - GAME_CONFIG.BASE_PIPE_SPEED) * t,
    spawnOffset: GAME_CONFIG.BASE_SPAWN_OFFSET + (GAME_CONFIG.TARGET_SPAWN_OFFSET - GAME_CONFIG.BASE_SPAWN_OFFSET) * t,
  };
}
