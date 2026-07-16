import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export default function HighScoresScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('@flappy_modi_leaderboard');
      if (stored) {
        setLeaderboard(JSON.parse(stored));
      } else {
        setLeaderboard([]);
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
    } finally {
      setLoading(false);
    }
  };

  // Reload leaderboard whenever the screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadLeaderboard();
    });
    loadLeaderboard();
    return unsubscribe;
  }, [navigation]);

  const handleClearScores = () => {
    Alert.alert(
      'Reset Scores',
      'Are you sure you want to clear all high scores? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@flappy_modi_leaderboard');
              await AsyncStorage.removeItem('@flappy_modi_high_score');
              setLeaderboard([]);
              Alert.alert('Reset Complete', 'All high scores have been cleared.');
            } catch (e) {
              console.error(e);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#A855F7" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText type="title" style={[styles.title, { fontFamily: Platform.OS === 'ios' ? 'SF Pro Rounded' : 'normal' }]}>
              Leaderboard
            </ThemedText>
            <ThemedText style={styles.subtitle}>Top Flappers</ThemedText>
          </View>

          {leaderboard.length > 0 && (
            <Pressable 
              onPress={handleClearScores}
              style={[styles.clearBtn, { backgroundColor: isDark ? 'rgba(255,59,48,0.1)' : 'rgba(255,59,48,0.08)' }]}
            >
              <IconSymbol name="trash" size={18} color="#FF3B30" />
            </Pressable>
          )}
        </View>

        {/* List of High Scores */}
        {leaderboard.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="trophy" size={80} color={isDark ? '#2C2C2E' : '#E5E5EA'} />
            <ThemedText style={styles.emptyText}>No Scores Recorded Yet</ThemedText>
            <ThemedText style={styles.emptySubText}>
              Play the game and set a new score to be the first on the board!
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={leaderboard}
            keyExtractor={(_: LeaderboardEntry, index: number) => index.toString()}
            contentContainerStyle={styles.listContainer}
            renderItem={({ item, index }: { item: LeaderboardEntry; index: number }) => {
              const rank = index + 1;
              const isTopThree = rank <= 3;
              const trophyColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze

              return (
                <View style={[
                  styles.entryCard,
                  isDark ? styles.cardDark : styles.cardLight,
                  rank === 1 && { borderColor: '#FFD700', borderWidth: 1 }
                ]}>
                  {/* Rank Display */}
                  <View style={styles.rankContainer}>
                    {isTopThree ? (
                      <IconSymbol name="trophy" size={24} color={trophyColors[rank - 1]} />
                    ) : (
                      <ThemedText style={styles.rankNumber}>{rank}</ThemedText>
                    )}
                  </View>

                  {/* Name and Date */}
                  <View style={styles.nameContainer}>
                    <ThemedText style={styles.playerName}>{item.name}</ThemedText>
                    <ThemedText style={styles.playerDate}>{formatDate(item.date)}</ThemedText>
                  </View>

                  {/* Score */}
                  <View style={styles.scoreContainer}>
                    <ThemedText style={styles.scoreText}>{item.score}</ThemedText>
                  </View>
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
  },
  clearBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 8,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  cardLight: {
    backgroundColor: '#F2F2F7',
  },
  cardDark: {
    backgroundColor: '#1C1C1E',
  },
  rankContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8e8e93',
  },
  nameContainer: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerDate: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },
  scoreContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#A855F7',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
