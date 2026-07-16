import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

const HIGH_SCORE_KEY = '@flappy_modi_high_score';
const LEADERBOARD_KEY = '@flappy_modi_leaderboard';

/**
 * Loads the stored all-time high score.
 * Returns 0 if no score has been saved yet or on error.
 */
export async function getHighScore(): Promise<number> {
  try {
    const score = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    return score ? parseInt(score, 10) : 0;
  } catch (e) {
    console.error('Failed to load high score:', e);
    return 0;
  }
}

/**
 * Persists the high score if it exceeds the current high score.
 * Returns true if the high score was updated, false otherwise.
 */
export async function saveHighScore(score: number): Promise<boolean> {
  try {
    const currentHighScore = await getHighScore();
    if (score > currentHighScore) {
      await AsyncStorage.setItem(HIGH_SCORE_KEY, score.toString());
      return true;
    }
  } catch (e) {
    console.error('Failed to save high score:', e);
  }
  return false;
}

/**
 * Retrieves the list of leaderboard entries.
 * Returns an empty array if none exist or on error.
 */
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(LEADERBOARD_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('Failed to load leaderboard:', e);
    return [];
  }
}

/**
 * Saves a score entry to the leaderboard.
 * Keeps only the top 10 scores and returns the updated leaderboard.
 */
export async function saveLeaderboardEntry(name: string, score: number): Promise<LeaderboardEntry[]> {
  try {
    const leaderboard = await getLeaderboard();
    const entry: LeaderboardEntry = {
      name: name.trim(),
      score,
      date: new Date().toISOString(),
    };
    
    leaderboard.push(entry);
    leaderboard.sort((a, b) => b.score - a.score);
    const topLeaderboard = leaderboard.slice(0, 10);
    
    await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(topLeaderboard));
    return topLeaderboard;
  } catch (e) {
    console.error('Failed to save leaderboard entry:', e);
    return [];
  }
}

/**
 * Resets both the high score and the leaderboard in storage.
 */
export async function resetAllScores(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HIGH_SCORE_KEY);
    await AsyncStorage.removeItem(LEADERBOARD_KEY);
  } catch (e) {
    console.error('Failed to clear scores:', e);
  }
}
