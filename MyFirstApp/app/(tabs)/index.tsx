import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Pressable, Dimensions, Alert, Modal, TextInput, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useFrameCallback, 
  runOnJS,
  FadeIn
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Game constants
const BIRD_X = 60;
const BIRD_SIZE = 55;
const PIPE_WIDTH = 68;
const PIPE_GAP = 170; // gap height
const GRAVITY = 0.4;
const JUMP_STRENGTH = -8;
const PIPE_SPEED = 3.5;
const FLOOR_HEIGHT = 100;


// Session storage fallback for native platforms
let nativeSessionScores: number[] = [];

export default function GameScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Game States: 'IDLE' | 'PLAYING' | 'GAME_OVER'
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [sessionBest, setSessionBest] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [isHighScoreModalVisible, setIsHighScoreModalVisible] = useState(false);

  // Shared values for high-performance physics loop
  const scoreSV = useSharedValue(0);
  const isGameOverSV = useSharedValue(false);
  const birdY = useSharedValue(SCREEN_HEIGHT / 2 - 100);
  const birdVelocity = useSharedValue(0);
  
  // Pipe 1 shared values
  const pipe1X = useSharedValue(SCREEN_WIDTH + 100);
  const pipe1GapY = useSharedValue(SCREEN_HEIGHT / 2 - 50); // Center of gap
  
  // Pipe 2 shared values
  const pipe2X = useSharedValue(SCREEN_WIDTH + 100 + (SCREEN_WIDTH + PIPE_WIDTH) / 2);
  const pipe2GapY = useSharedValue(SCREEN_HEIGHT / 2 - 50);

  // Audio elements
  const bgSoundRef = useRef<Audio.Sound | null>(null);
  const crashSoundRef = useRef<Audio.Sound | null>(null);

  // Track scoring state
  const pipe1Scored = useRef(false);
  const pipe2Scored = useRef(false);

  // Load High Score
  useEffect(() => {
    const loadHighScore = async () => {
      try {
        const storedScore = await AsyncStorage.getItem('@flappy_modi_high_score');
        if (storedScore) {
          setHighScore(parseInt(storedScore));
        }
      } catch (e) {
        console.error('Failed to load high score:', e);
      }
    };
    loadHighScore();

    // Configure Audio mode
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    return () => {
      // Cleanup sounds on unmount
      stopAudio();
    };
  }, []);

  // Audio Control helpers
  const playBgMusic = async () => {
    try {
      if (bgSoundRef.current) {
        await bgSoundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/audio/flight_music.m4a'),
        { shouldPlay: true, isLooping: true, volume: 0.55 }
      );
      bgSoundRef.current = sound;
    } catch (e) {
      console.log('Error starting BG music:', e);
    }
  };

  const playCrashMusic = async () => {
    try {
      if (crashSoundRef.current) {
        await crashSoundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/audio/crash_sound.m4a'),
        { shouldPlay: true, volume: 0.8 }
      );
      crashSoundRef.current = sound;
    } catch (e) {
      console.log('Error starting crash music:', e);
    }
  };

  const stopAudio = async () => {
    try {
      if (bgSoundRef.current) {
        await bgSoundRef.current.stopAsync();
        await bgSoundRef.current.unloadAsync();
        bgSoundRef.current = null;
      }
      if (crashSoundRef.current) {
        await crashSoundRef.current.stopAsync();
        await crashSoundRef.current.unloadAsync();
        crashSoundRef.current = null;
      }
    } catch (e) {
      console.log('Error cleaning up audio:', e);
    }
  };

  // Triggers device haptics
  const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Medium) => {
    try {
      Haptics.impactAsync(style).catch((e: any) => console.log('Haptics failed:', e));
    } catch {
      // Ignored on web/simulator
    }
  };

  // JS Callbacks from Reanimated Frame loop
  const onScoreIncrement = (currentScore: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setScore(currentScore);
  };

  const onGameOver = async (finalScore: number) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
    setGameState('GAME_OVER');
    
    // Stop bg music and play defeat sound
    try {
      if (bgSoundRef.current) {
        await bgSoundRef.current.stopAsync();
        await bgSoundRef.current.unloadAsync();
        bgSoundRef.current = null;
      }
    } catch (e) {
      console.log('Error stopping background music on game over:', e);
    }

    try {
      await playCrashMusic();
    } catch (e) {
      console.log('Error playing crash sound on game over:', e);
    }

    // Session storage score logging
    let currentSessionBest = finalScore;
    if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
      try {
        const storedScores = window.sessionStorage.getItem('@flappy_modi_session_scores');
        let sessionScores = storedScores ? JSON.parse(storedScores) : [];
        sessionScores.push(finalScore);
        window.sessionStorage.setItem('@flappy_modi_session_scores', JSON.stringify(sessionScores));
        currentSessionBest = Math.max(...sessionScores);
      } catch (e) {
        console.error(e);
      }
    } else {
      nativeSessionScores.push(finalScore);
      currentSessionBest = Math.max(...nativeSessionScores);
    }
    setSessionBest(currentSessionBest);

    if (finalScore > highScore) {
      setHighScore(finalScore);
      await AsyncStorage.setItem('@flappy_modi_high_score', finalScore.toString());
      setIsHighScoreModalVisible(true);
    }
  };

  // Jump Action
  const jump = () => {
    if (gameState === 'IDLE') {
      startGame();
    } else if (gameState === 'PLAYING') {
      birdVelocity.value = JUMP_STRENGTH;
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const startGame = () => {
    // Reset positions
    birdY.value = SCREEN_HEIGHT / 2 - 100;
    birdVelocity.value = 0;
    pipe1X.value = SCREEN_WIDTH + 100;
    pipe1GapY.value = getRandomGapY();
    pipe2X.value = SCREEN_WIDTH + 100 + (SCREEN_WIDTH + PIPE_WIDTH) / 2;
    pipe2GapY.value = getRandomGapY();

    pipe1Scored.current = false;
    pipe2Scored.current = false;
    scoreSV.value = 0;
    isGameOverSV.value = false;
    setScore(0);

    // Stop crash music if still playing
    try {
      if (crashSoundRef.current) {
        crashSoundRef.current.stopAsync();
        crashSoundRef.current.unloadAsync();
        crashSoundRef.current = null;
      }
    } catch (e) {
      console.log('Error stopping crash sound in startGame:', e);
    }

    setGameState('PLAYING');

    // Start background song
    playBgMusic();
  };

  const getRandomGapY = () => {
    // Return center coordinates for the pipe gap
    const minGapY = 180;
    const maxGapY = SCREEN_HEIGHT - FLOOR_HEIGHT - 180;
    return Math.floor(Math.random() * (maxGapY - minGapY)) + minGapY;
  };

  // High score save handler
  const saveHighScoreEntry = async () => {
    if (!playerName.trim()) return;
    
    try {
      const name = playerName.trim();
      const scoreEntry = {
        name,
        score,
        date: new Date().toISOString(),
      };

      const storedScores = await AsyncStorage.getItem('@flappy_modi_leaderboard');
      let leaderboard = [];
      if (storedScores) {
        leaderboard = JSON.parse(storedScores);
      }
      
      leaderboard.push(scoreEntry);
      // Sort and keep top 10
      leaderboard.sort((a: any, b: any) => b.score - a.score);
      leaderboard = leaderboard.slice(0, 10);

      await AsyncStorage.setItem('@flappy_modi_leaderboard', JSON.stringify(leaderboard));
      setIsHighScoreModalVisible(false);
      setPlayerName('');
      Alert.alert('Saved!', 'Your score is now on the Leaderboard!');
    } catch (e) {
      console.error('Failed to save score entry:', e);
    }
  };

  // Reanimated Physics Frame Loop
  const frameCallback = useFrameCallback((frameInfo: any) => {
    if (isGameOverSV.value) return;

    // Calculate delta time relative to 60 FPS (16.666 ms per frame)
    const timeDelta = frameInfo.timeSincePreviousFrame ?? 16.666;
    // Clamp delta to avoid huge jumps if there are frame drops
    const deltaTime = Math.min(3, timeDelta / 16.666);

    const canvasHeight = SCREEN_HEIGHT - FLOOR_HEIGHT;

    // Apply gravity
    birdVelocity.value += GRAVITY * deltaTime;
    birdY.value += birdVelocity.value * deltaTime;

    // Move Pipe 1
    pipe1X.value -= PIPE_SPEED * deltaTime;
    if (pipe1X.value < -PIPE_WIDTH) {
      pipe1X.value = SCREEN_WIDTH;
      pipe1GapY.value = getRandomGapY();
      pipe1Scored.current = false;
    }

    // Move Pipe 2
    pipe2X.value -= PIPE_SPEED * deltaTime;
    if (pipe2X.value < -PIPE_WIDTH) {
      pipe2X.value = SCREEN_WIDTH;
      pipe2GapY.value = getRandomGapY();
      pipe2Scored.current = false;
    }

    // Collisions Check: Ground/Ceiling
    if (birdY.value < 0 || birdY.value > canvasHeight - BIRD_SIZE) {
      isGameOverSV.value = true;
      frameCallback.setActive(false);
      runOnJS(onGameOver)(scoreSV.value);
      return;
    }

    // Collisions Check: Pipe 1
    const p1X = pipe1X.value;
    const p1Gap = pipe1GapY.value;
    if (BIRD_X + BIRD_SIZE >= p1X && BIRD_X <= p1X + PIPE_WIDTH) {
      if (birdY.value < p1Gap - PIPE_GAP / 2 || birdY.value + BIRD_SIZE > p1Gap + PIPE_GAP / 2) {
        isGameOverSV.value = true;
        frameCallback.setActive(false);
        runOnJS(onGameOver)(scoreSV.value);
        return;
      }
    }

    // Collisions Check: Pipe 2
    const p2X = pipe2X.value;
    const p2Gap = pipe2GapY.value;
    if (BIRD_X + BIRD_SIZE >= p2X && BIRD_X <= p2X + PIPE_WIDTH) {
      if (birdY.value < p2Gap - PIPE_GAP / 2 || birdY.value + BIRD_SIZE > p2Gap + PIPE_GAP / 2) {
        isGameOverSV.value = true;
        frameCallback.setActive(false);
        runOnJS(onGameOver)(scoreSV.value);
        return;
      }
    }

    // Scoring check
    if (!pipe1Scored.current && p1X + PIPE_WIDTH < BIRD_X) {
      pipe1Scored.current = true;
      scoreSV.value = scoreSV.value + 1;
      runOnJS(onScoreIncrement)(scoreSV.value);
    }
    if (!pipe2Scored.current && p2X + PIPE_WIDTH < BIRD_X) {
      pipe2Scored.current = true;
      scoreSV.value = scoreSV.value + 1;
      runOnJS(onScoreIncrement)(scoreSV.value);
    }
  });

  // Enable/disable the frame loop depending on state
  useEffect(() => {
    if (gameState === 'PLAYING') {
      frameCallback.setActive(true);
    } else {
      frameCallback.setActive(false);
    }
  }, [gameState, frameCallback]);

  // Animated styles
  const birdStyle = useAnimatedStyle(() => {
    // Rotation angle based on velocity
    const rotation = Math.max(-30, Math.min(70, birdVelocity.value * 6.5));
    return {
      top: birdY.value,
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const pipe1TopStyle = useAnimatedStyle(() => {
    // Height of top pipe is the center gap position minus half the gap size
    const topHeight = Math.max(0, pipe1GapY.value - PIPE_GAP / 2);
    return {
      left: pipe1X.value,
      height: topHeight,
    };
  });

  const pipe1BottomStyle = useAnimatedStyle(() => {
    // Height of bottom pipe is canvas height minus center gap position minus half the gap size
    const bottomHeight = Math.max(0, (SCREEN_HEIGHT - FLOOR_HEIGHT) - (pipe1GapY.value + PIPE_GAP / 2));
    return {
      left: pipe1X.value,
      height: bottomHeight,
    };
  });

  const pipe2TopStyle = useAnimatedStyle(() => {
    const topHeight = Math.max(0, pipe2GapY.value - PIPE_GAP / 2);
    return {
      left: pipe2X.value,
      height: topHeight,
    };
  });

  const pipe2BottomStyle = useAnimatedStyle(() => {
    const bottomHeight = Math.max(0, (SCREEN_HEIGHT - FLOOR_HEIGHT) - (pipe2GapY.value + PIPE_GAP / 2));
    return {
      left: pipe2X.value,
      height: bottomHeight,
    };
  });

  return (
    <Pressable style={styles.container} onPress={jump}>
      {/* Sky Background */}
      <View style={[styles.sky, isDark ? styles.skyDark : styles.skyLight]}>
        {/* Simple decorative clouds */}
        <View style={[styles.cloud, { top: 80, left: 40, opacity: isDark ? 0.1 : 0.6 }]} />
        <View style={[styles.cloud, { top: 180, right: 60, width: 140, height: 40, opacity: isDark ? 0.1 : 0.6 }]} />
        <View style={[styles.cloud, { top: 320, left: '40%', width: 160, height: 48, opacity: isDark ? 0.1 : 0.6 }]} />
      </View>

      {/* Pipes 1 */}
      <Animated.View style={[styles.pipe, styles.pipeTop, pipe1TopStyle]} />
      <Animated.View style={[styles.pipe, styles.pipeBottom, pipe1BottomStyle]} />

      {/* Pipes 2 */}
      <Animated.View style={[styles.pipe, styles.pipeTop, pipe2TopStyle]} />
      <Animated.View style={[styles.pipe, styles.pipeBottom, pipe2BottomStyle]} />

      {/* Ground Floor */}
      <View style={[styles.floor, isDark ? styles.floorDark : styles.floorLight]}>
        <View style={styles.floorPattern} />
      </View>

      {/* Modi Bird */}
      <Animated.View style={[styles.birdContainer, birdStyle]}>
        <Image
          source={require('@/assets/images/modi-bird.png')}
          style={styles.birdImage}
          contentFit="cover"
        />
      </Animated.View>

      {/* Interface Overlays */}
      <SafeAreaView style={styles.safeOverlay} pointerEvents="none">
        {/* Score indicator */}
        {gameState === 'PLAYING' && (
          <View style={styles.scoreContainer}>
            <ThemedText style={styles.scoreText}>{score}</ThemedText>
          </View>
        )}
      </SafeAreaView>

      {/* Start Screen (IDLE) */}
      {gameState === 'IDLE' && (
        <View style={styles.overlayContainer}>
          <ThemedText type="title" style={styles.gameTitle}>
            FLAPPY MODI
          </ThemedText>
          <ThemedText style={styles.highScoreText}>
            High Score: {highScore}
          </ThemedText>
          
          <Animated.View 
            entering={FadeIn.delay(300).duration(800)}
            style={styles.tapToPlayContainer}
          >
            <IconSymbol name="play" size={64} color="#A855F7" />
            <ThemedText style={styles.tapToPlayText}>
              TAP TO FLAP & START
            </ThemedText>
          </Animated.View>

          <View style={styles.characterPreview}>
            <Image
              source={require('@/assets/images/modi-bird.png')}
              style={styles.previewImage}
            />
          </View>
        </View>
      )}

      {/* Game Over Screen */}
      {gameState === 'GAME_OVER' && (
        <View style={styles.overlayContainer}>
          <ThemedText type="title" style={[styles.gameOverText, { color: '#FF3B30' }]}>
            TRY AGAIN
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
              <ThemedText style={styles.resultLabel}>All-Time Best</ThemedText>
              <ThemedText style={styles.resultVal}>{highScore}</ThemedText>
            </View>
          </View>

          <Pressable 
            style={[styles.restartButton, { backgroundColor: '#A855F7' }]}
            onPress={startGame}
          >
            <IconSymbol name="refresh" size={24} color="#fff" />
            <ThemedText style={styles.restartText}>TRY AGAIN</ThemedText>
          </Pressable>
        </View>
      )}

      {/* High Score Name Dialog */}
      <Modal
        visible={isHighScoreModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalBackdrop}>
          <ThemedView style={[styles.modalContent, isDark ? styles.modalDark : styles.modalLight]}>
            <IconSymbol name="trophy" size={44} color="#FFD700" style={{ alignSelf: 'center' }} />
            <ThemedText type="subtitle" style={styles.modalTitle}>New High Score!</ThemedText>
            <ThemedText style={styles.modalSubtitle}>You scored {score} points. Enter your name for the leaderboard:</ThemedText>

            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="Your Name"
              placeholderTextColor="#8e8e93"
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={15}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <Pressable 
                style={[styles.modalBtn, styles.saveBtn, !playerName.trim() && { opacity: 0.5 }]} 
                onPress={saveHighScoreEntry}
                disabled={!playerName.trim()}
              >
                <ThemedText style={styles.saveBtnText}>Save Score</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: FLOOR_HEIGHT,
  },
  skyLight: {
    backgroundColor: '#70c5cf',
  },
  skyDark: {
    backgroundColor: '#1A2F3B',
  },
  cloud: {
    position: 'absolute',
    backgroundColor: '#fff',
    width: 120,
    height: 36,
    borderRadius: 18,
  },
  floor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: FLOOR_HEIGHT,
  },
  floorLight: {
    backgroundColor: '#ded895',
    borderTopWidth: 4,
    borderTopColor: '#543847',
  },
  floorDark: {
    backgroundColor: '#524A32',
    borderTopWidth: 4,
    borderTopColor: '#3A2E2F',
  },
  floorPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    borderBottomWidth: 10,
    borderBottomColor: '#000',
  },
  birdContainer: {
    position: 'absolute',
    left: BIRD_X,
    width: BIRD_SIZE,
    height: BIRD_SIZE,
    borderRadius: BIRD_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  birdImage: {
    width: '100%',
    height: '100%',
    borderRadius: BIRD_SIZE / 2,
  },
  pipe: {
    position: 'absolute',
    width: PIPE_WIDTH,
    backgroundColor: '#73c739',
    borderWidth: 4,
    borderColor: '#543847',
    borderRadius: 8,
    zIndex: 5,
  },
  pipeTop: {
    top: -4, // overlap ceiling slightly
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  pipeBottom: {
    bottom: FLOOR_HEIGHT - 4, // overlap floor slightly
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  safeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 15,
  },
  scoreContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  scoreText: {
    fontSize: 54,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 20,
    padding: 24,
  },
  gameTitle: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
    textShadowColor: '#A855F7',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
  highScoreText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  tapToPlayContainer: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  tapToPlayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  characterPreview: {
    marginTop: 40,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  gameOverText: {
    fontSize: 48,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
  },
  resultsBoard: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 16,
    padding: 20,
    marginVertical: 24,
    gap: 12,
    borderWidth: 2,
    borderColor: '#543847',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  boardLight: {
    backgroundColor: '#fff',
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
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  restartText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    gap: 16,
  },
  modalLight: {
    backgroundColor: '#fff',
  },
  modalDark: {
    backgroundColor: '#1C1C1E',
  },
  modalTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalSubtitle: {
    textAlign: 'center',
    color: '#8e8e93',
    lineHeight: 20,
  },
  input: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    textAlign: 'center',
  },
  inputLight: {
    backgroundColor: '#F2F2F7',
    borderColor: '#E5E5EA',
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
    color: '#fff',
  },
  modalButtons: {
    marginTop: 8,
  },
  modalBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: '#A855F7',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});