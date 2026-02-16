// src/screens/LeaderboardScreen_expo_router.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Clipboard,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';

import AvatarCool from '../../assets/avatars/avatar_cool.svg';
import AvatarHappy from '../../assets/avatars/avatar_happy.svg';
import AvatarNormal from '../../assets/avatars/avatar_normal.svg';
import AvatarSad from '../../assets/avatars/avatar_sad.svg';
import AvatarWaiting from '../../assets/avatars/avatar_waiting.svg';

const AVATAR_COMPONENTS: Record<string, React.ComponentType<{ width: number; height: number; style?: any }>> = {
  AvatarCool,
  AvatarHappy,
  AvatarNormal,
  AvatarSad,
  AvatarWaiting,
};

// ─── Podium ──────────────────────────────────────────────────────────────────

function Podium({ topThree }: { topThree: User[] }) {
  if (topThree.length === 0) return null;

  const AvatarFirst  = AVATAR_COMPONENTS[topThree[0]?.avatar] ?? AvatarNormal;
  const AvatarSecond = topThree[1] ? (AVATAR_COMPONENTS[topThree[1].avatar] ?? AvatarHappy) : AvatarHappy;
  const AvatarThird  = topThree[2] ? (AVATAR_COMPONENTS[topThree[2].avatar] ?? AvatarSad)  : AvatarSad;

  return (
    <View style={styles.podiumContainer}>
      {topThree[1] && (
        <View style={[styles.podiumBlock, { backgroundColor: '#d1d5db', height: 120 }]}>
          <AvatarSecond width={130} height={130} />
          <Text style={styles.podiumRank}>2</Text>
          <Text style={styles.podiumName}>{topThree[1].name.split(' ')[0]}</Text>
        </View>
      )}

      <View style={[styles.podiumBlock, { backgroundColor: '#facc15', height: 160 }]}>
        <AvatarFirst width={130} height={130} />
        <Text style={styles.podiumRank}>1</Text>
        <Text style={styles.podiumName}>{topThree[0].name.split(' ')[0]}</Text>
      </View>

      {topThree[2] && (
        <View style={[styles.podiumBlock, { backgroundColor: '#c084fc', height: 100 }]}>
          <AvatarThird width={130} height={130} />
          <Text style={styles.podiumRank}>3</Text>
          <Text style={styles.podiumName}>{topThree[2].name.split(' ')[0]}</Text>
        </View>
      )}
    </View>
  );
}

// ─── FriendCodeSection ────────────────────────────────────────────────────────

function FriendCodeSection() {
  const { currentUser, addFriendByCode } = useAuthStore();
  const [friendCode, setFriendCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'none' | 'addFriend' | 'shareCode'>('none');

  const handleCopyCode = () => {
    if (currentUser?.friendCode) {
      Clipboard.setString(currentUser.friendCode);
      Alert.alert('Copied!', 'Your friend code has been copied to clipboard');
    }
  };

  const handleAddFriend = async () => {
    if (!friendCode.trim()) {
      Alert.alert('Error', 'Please enter a friend code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await addFriendByCode(friendCode);
      if (result.success) {
        Alert.alert('Success! 🎉', `You are now friends with ${result.friendName}`, [{ text: 'OK' }]);
        setFriendCode('');
        setExpandedSection('none');
      } else {
        Alert.alert('Error', result.error ?? 'Could not add friend');
      }
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.friendCodeContainer}>
      {expandedSection === 'none' && (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            onPress={() => setExpandedSection('addFriend')}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#40b8a5', '#6ff0d1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>+ Add New Friend</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setExpandedSection('shareCode')}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#40b8a5', '#6ff0d1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>Share My Code</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {expandedSection === 'shareCode' && (
        <View style={styles.myCodeSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionLabel}>My Friend Code</Text>
            <TouchableOpacity onPress={() => setExpandedSection('none')}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.codeDisplay}>
            <Text style={styles.codeText}>{currentUser?.friendCode ?? 'N/A'}</Text>
            <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton} activeOpacity={0.7}>
              <Text style={styles.copyButtonText}>📋 Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {expandedSection === 'addFriend' && (
        <View style={styles.addFriendSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionLabel}>Add a Friend</Text>
            <TouchableOpacity onPress={() => setExpandedSection('none')}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter friend code (e.g. STRK-AB12)"
              placeholderTextColor="#9ca3af"
              value={friendCode}
              onChangeText={setFriendCode}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={handleAddFriend}
              style={[styles.addButton, isLoading && styles.addButtonDisabled]}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#9ca3af', '#9ca3af'] : ['#40b8a5', '#6ff0d1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addButtonGradient}
              >
                <Text style={styles.addButtonText}>{isLoading ? '...' : 'Add'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── LeaderboardScreen ────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const { currentUser, isGuest } = useAuthStore();

  // Real friends fetched from Firestore
  const [friendProfiles, setFriendProfiles] = useState<User[]>([]);
  const [isFetchingFriends, setIsFetchingFriends] = useState(false);

  // Fetch friend profiles from Firestore whenever the friends list changes
  useEffect(() => {
    if (!currentUser || isGuest) {
      setFriendProfiles([]);
      return;
    }

    const friendIds: string[] = currentUser.friends ?? [];

    if (friendIds.length === 0) {
      setFriendProfiles([]);
      return;
    }

    setIsFetchingFriends(true);

    const fetchFriends = async () => {
      try {
        const promises = friendIds.map((id) => getDoc(doc(db, 'users', id)));
        const snapshots = await Promise.all(promises);

        const profiles: User[] = snapshots
          .filter((snap) => snap.exists())
          .map((snap) => ({ ...(snap.data() as User), id: snap.id }));

        setFriendProfiles(profiles);
      } catch (error) {
        console.error('❌ Failed to fetch friend profiles:', error);
      } finally {
        setIsFetchingFriends(false);
      }
    };

    fetchFriends();
  }, [currentUser?.friends, isGuest]);

  // Build sorted leaderboard: current user + friends
  const leaderboardData = useMemo<User[]>(() => {
    if (isGuest || !currentUser) return [];

    const allEntries: User[] = [currentUser, ...friendProfiles];

    return allEntries.sort((a: User, b: User) => b.xp - a.xp);
  }, [currentUser, friendProfiles, isGuest]);

  const topThree = leaderboardData.slice(0, 3);

  // ── Guest view ──────────────────────────────────────────────────────────────
  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#40b8a5', '#6ff0d1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🏆</Text>
          <Text style={styles.emptyTitle}>Login to See Friends</Text>
          <Text style={styles.emptyText}>
            Track your progress and compete with friends on the leaderboard
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/login')}
            activeOpacity={0.7}
            style={styles.loginButtonWrapper}
          >
            <LinearGradient
              colors={['#40b8a5', '#6ff0d1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <Text style={styles.registerLink}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── No friends yet ──────────────────────────────────────────────────────────
  if (leaderboardData.length === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.headerTitle}>HALL OF FAME</Text>
        <FriendCodeSection />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>👥</Text>
          <Text style={styles.emptyTitle}>No Friends Yet</Text>
          <Text style={styles.emptyText}>
            Share your friend code above to connect with friends and compete together!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Full leaderboard ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>HALL OF FAME</Text>

      <FriendCodeSection />

      <Podium topThree={topThree} />

      <FlatList<User>
        data={leaderboardData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item, index }) => {
          const AvatarComponent = AVATAR_COMPONENTS[item.avatar] ?? AvatarNormal;
          const isCurrentUser = item.id === currentUser?.id;

          return (
            <View style={[styles.row, isCurrentUser && styles.rowHighlight]}>
              <Text style={styles.rank}>{index + 1}</Text>
              <AvatarComponent width={36} height={36} style={{ marginRight: 10 }} />
              <Text style={[styles.name, isCurrentUser && styles.nameHighlight]}>
                {isCurrentUser ? 'You' : item.name}
              </Text>
              <Text style={styles.streak}>{item.streak} ⚡</Text>
              <Text style={styles.xp}>{item.xp} XP</Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#40b8a5',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Friend Code Section
  friendCodeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  myCodeSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  codeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 1,
  },
  copyButton: {
    backgroundColor: '#40b8a5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  addFriendSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Podium
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  podiumBlock: {
    width: 90,
    borderRadius: 12,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 12,
  },
  podiumRank: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },

  // Leaderboard rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  rowHighlight: {
    backgroundColor: '#e8f8f4',
    borderWidth: 2,
    borderColor: '#40b8a5',
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
    width: 30,
    textAlign: 'center',
    color: '#111827',
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  nameHighlight: {
    fontWeight: '800',
    color: '#40b8a5',
  },
  streak: {
    fontSize: 13,
    fontWeight: '600',
    color: '#40b8a5',
    marginRight: 10,
  },
  xp: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f97316',
  },

  // Empty states
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  loginButtonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    width: '80%',
  },
  loginButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '600',
    paddingHorizontal: 8,
  },
});