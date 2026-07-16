import React from 'react';
import { StyleSheet, View, Pressable, Dimensions } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GameOverOverlayProps {
  visible: boolean;
  score: number;
  sessionBest: number;
  highScore: number;
  onRestart: () => void;
  onHome: () => void;
}

export function GameOverOverlay({
  visible,
  score,
  sessionBest,
  highScore,
  onRestart,
  onHome,
}: GameOverOverlayProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!visible) return null;

  return (
    <View style={styles.overlayContainer}>
      <ThemedText type="title" style={[styles.gameOverText, { color: '#FF3B30' }]}>
        GAME OVER
      </ThemedText>
      
      <View style={[styles.resultsBoard, isDark ? styles.boardDark : styles.boardLight]}>
        <View style={styles.resultItem}>
          <ThemedText style={styles.resultLabel}>Score</ThemedText>
          <ThemedText style={styles.resultVal}>{score}</ThemedText>
        </View>
        <View style={styles.resultItem}>
          <ThemedText style={styles.resultLabel}>Session Best</ThemedText>
          <ThemedText style={styles.resultVal}>{sessionBest}</ThemedText>
        </View>
        <View style={styles.resultItem}>
          <ThemedText style={styles.resultLabel}>High Score</ThemedText>
          <ThemedText style={styles.resultVal}>{highScore}</ThemedText>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Pressable 
          style={[styles.actionButton, styles.restartButton]}
          onPress={onRestart}
        >
          <IconSymbol name="refresh" size={20} color="#fff" />
          <ThemedText style={styles.buttonText}>TRY AGAIN</ThemedText>
        </Pressable>

        <Pressable 
          style={[styles.actionButton, styles.homeButton, isDark ? styles.homeButtonDark : styles.homeButtonLight]}
          onPress={onHome}
        >
          <IconSymbol name="house.fill" size={20} color={isDark ? '#fff' : '#000'} />
          <ThemedText style={[styles.buttonText, { color: isDark ? '#fff' : '#000' }]}>HOME</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 20,
    padding: 24,
  },
  gameOverText: {
    fontSize: 44,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 2,
    marginBottom: 10,
  },
  resultsBoard: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 20,
    padding: 24,
    marginVertical: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: '#543847',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  boardLight: {
    backgroundColor: '#ffffff',
  },
  boardDark: {
    backgroundColor: '#1E1E1E',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 16,
    color: '#8e8e93',
    fontWeight: '600',
  },
  resultVal: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
    maxWidth: 300,
    justifyContent: 'center',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  restartButton: {
    backgroundColor: '#A855F7',
    shadowColor: '#A855F7',
  },
  homeButton: {
    borderWidth: 2,
  },
  homeButtonLight: {
    backgroundColor: '#fff',
    borderColor: '#e5e5ea',
    shadowColor: '#000',
  },
  homeButtonDark: {
    backgroundColor: '#2c2c2e',
    borderColor: '#3a3a3c',
    shadowColor: '#000',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
