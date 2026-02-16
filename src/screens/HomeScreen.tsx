// src/screens/HomeScreen.tsx (FINAL VERSION)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddQuestModal from '../components/AddQuestModal';
import ConfettiCannon from '../components/ConfettiCannon';
import LevelUpPopup from '../components/LevelUpPopup';
import LostStreakPopup from '../components/LostStreakPopup';
import ParticleBurst from '../components/ParticleBurst';
import ProfileButton from '../components/ProfileButton_expo_router';
import QuestCard from '../components/QuestCard';
import QuestSuggestionModal from '../components/QuestSuggestionModal';
import StreakUpdatePopup from '../components/StreakUpdatePopup';
import XPBar from '../components/XPBar';

import { EventEmitter, Events } from '../services/eventEmitter';
import { checkQuestMedals } from '../services/medalService';
import { checkAndSendStreakWarning } from '../services/notificationService';
import { generateQuestSuggestion } from '../services/questGenerator';
import { syncQuestsToFirebase } from '../services/questSyncService';
import { syncUserProgressToFirebase } from '../services/userSyncService';

import { useAuthStore } from '../store/authStore';
import { useQuestStore } from '../store/questStore';
import { useUserStore } from '../store/userStore';

import AvatarHappy from '../../assets/avatars/avatar_happy.svg';
import AvatarNormal from '../../assets/avatars/avatar_normal.svg';
import Add from '../../assets/icons/icon_newTask.svg';

type Props = {
  navigation: any;
};

const HomeScreen = ({ navigation }: Props) => {
  const quests = useQuestStore((state) => state.quests);
  const addQuest = useQuestStore((state) => state.addQuest);
  const toggleQuest = useQuestStore((state) => state.toggleQuest);
  const deleteQuest = useQuestStore((state) => state.deleteQuest);
  const totalCompletedQuests = useQuestStore((state) => state.totalCompletedQuests);
  const todayCompletedCount = useQuestStore((state) => state.todayCompletedCount);

  const { level, streak } = useUserStore();
  const { currentUser, isGuest } = useAuthStore();

  const player = useAudioPlayer(require('../../assets/sounds/task_finished.mp3'));

  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [suggestedQuest, setSuggestedQuest] = useState<{
    title: string;
    category: 'HEALTH' | 'STUDY' | 'WORK';
  } | null>(null);

  const [showLevelUpPopup, setShowLevelUpPopup] = useState(false);
  const [showParticleBurst, setShowParticleBurst] = useState(false);
  const [avatarHappy, setAvatarHappy] = useState(false);
  const prevLevel = useRef(level);

  // Streak popups
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [showLostStreakPopup, setShowLostStreakPopup] = useState(false);
  const [lostStreakNumber, setLostStreakNumber] = useState(0);

  const avatarBounce = useRef(new Animated.Value(0)).current;
  const avatarRotate = useRef(new Animated.Value(0)).current;

  // 🔥 LISTEN FOR STREAK UPDATES (gained streak)
  useEffect(() => {
    const unsubscribe = EventEmitter.on(Events.STREAK_UPDATED, (newStreak: number) => {
      console.log('🔥 Streak updated event received:', newStreak);
      setCurrentStreak(newStreak);
      setShowStreakPopup(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 💔 LISTEN FOR STREAK LOST
  useEffect(() => {
    const unsubscribe = EventEmitter.on(Events.STREAK_LOST, (oldStreak: number) => {
      console.log('💔 Streak lost event received:', oldStreak);
      setLostStreakNumber(oldStreak);
      setShowLostStreakPopup(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // 🆕 CHECK ASYNCSTORAGE FOR LOST STREAK ON MOUNT
  useEffect(() => {
    const checkLostStreak = async () => {
      try {
        const lostStreakData = await AsyncStorage.getItem('STREAK_LOST');
        if (lostStreakData) {
          const lostStreak = JSON.parse(lostStreakData);
          console.log('💔 Lost streak detected from AsyncStorage:', lostStreak);
          
          // Show popup
          setLostStreakNumber(lostStreak);
          setShowLostStreakPopup(true);
          
          // Clear flag
          await AsyncStorage.removeItem('STREAK_LOST');
        }
      } catch (error) {
        console.error('Error checking lost streak:', error);
      }
    };

    checkLostStreak();
  }, []);

  useEffect(() => {
    const checkStreakWarning = async () => {
      if (!isGuest) {
        await checkAndSendStreakWarning(todayCompletedCount);
      }
    };

    checkStreakWarning();
  }, [todayCompletedCount, isGuest]);

  useEffect(() => {
    if (level > prevLevel.current) {
      triggerLevelUpCelebration();
      prevLevel.current = level;
    }
  }, [level]);

  const triggerLevelUpCelebration = () => {
    setAvatarHappy(true);
    setShowParticleBurst(true);
    setTimeout(() => setShowParticleBurst(false), 1500);

    setShowLevelUpPopup(true);
    setTimeout(() => setShowLevelUpPopup(false), 3000);

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(avatarBounce, {
          toValue: -30,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(avatarRotate, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(avatarBounce, {
          toValue: 0,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(avatarRotate, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    setTimeout(() => setAvatarHappy(false), 4000);
  };

  const triggerQuestCelebration = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2000);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(avatarBounce, {
          toValue: -20,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(avatarRotate, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(avatarBounce, {
          toValue: 0,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(avatarRotate, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const handleGenerateQuest = async () => {
    try {
      const suggestion = await generateQuestSuggestion(quests);
      setSuggestedQuest(suggestion);
      setShowSuggestionModal(true);
    } catch (error) {
      console.error('Failed to generate quest:', error);
    }
  };

  const handleAcceptSuggestion = () => {
    if (suggestedQuest) {
      addQuest(suggestedQuest.title, suggestedQuest.category);
      setShowSuggestionModal(false);
      setSuggestedQuest(null);
    }
  };

  const handleComplete = (id: string) => {
    const quest = quests.find((q) => q.id === id);
    if (!quest || quest.completed) return;

    try {
      player.seekTo(0);
      player.play();
    } catch {}

    triggerQuestCelebration();
    toggleQuest(id);

    setTimeout(() => {
      const questState = useQuestStore.getState();
      const userState = useUserStore.getState();

      // 🆕 UPDATE STREAK ON FIRST QUEST COMPLETION
      userState.updateStreakOnQuestComplete(questState.todayCompletedCount);

      checkQuestMedals(
        questState.totalCompletedQuests,
        questState.todayCompletedCount
      );

      if (!isGuest) {
        syncQuestsToFirebase();
        syncUserProgressToFirebase();
      }
    }, 100);
  };

  const renderRightActions = (id: string) => (
    <RectButton style={styles.rightAction} onPress={() => deleteQuest(id)}>
      <Text style={styles.actionText}>✕</Text>
    </RectButton>
  );

  const avatarRotation = avatarRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '12deg'],
  });

  const AvatarComponent = avatarHappy ? AvatarHappy : AvatarNormal;
  const displayName = isGuest ? 'Guest User' : currentUser?.name || 'Guest';

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#40b8a5', '#6ff0d1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.greenBanner}
      />

      {showConfetti && <ConfettiCannon />}
      <LevelUpPopup visible={showLevelUpPopup} level={level} />
      {showParticleBurst && <ParticleBurst active={showParticleBurst} />}

      {/* 🔥 STREAK UPDATE POPUP (gained streak) */}
      <StreakUpdatePopup
        visible={showStreakPopup}
        streak={currentStreak}
        onClose={() => setShowStreakPopup(false)}
      />

      {/* 💔 LOST STREAK POPUP */}
      <LostStreakPopup
        visible={showLostStreakPopup}
        lostStreak={lostStreakNumber}
        onClose={() => setShowLostStreakPopup(false)}
      />

      <View style={styles.profileButtonContainer}>
        <ProfileButton />
      </View>

      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Animated.View
            style={[
              styles.avatarWrap,
              {
                transform: [{ translateY: avatarBounce }, { rotate: avatarRotation }],
              },
            ]}
          >
            <AvatarComponent width="140%" height="140%" />
          </Animated.View>

          <View style={styles.headerTextWrap}>
            <Text style={styles.dayText}>Day {streak} 🔥</Text>
            <Text style={styles.streakText}>{displayName}</Text>
          </View>
        </View>

        <View style={styles.divider} />
        <XPBar />
      </View>

      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>TODAY'S QUESTS</Text>
            <Text style={styles.sectionSubtitle}>Consistency beats motivation.</Text>
          </View>

          <TouchableOpacity onPress={handleGenerateQuest} activeOpacity={0.7}>
            <LinearGradient
              colors={['#40b8a5', '#6ff0d1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.generateBtn}
            >
              <Text style={styles.generateText}>✦ Generate</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={quests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Swipeable renderRightActions={() => renderRightActions(item.id)}>
            <QuestCard
              id={item.id}
              title={item.title}
              category={item.category}
              completed={item.completed}
              onPress={() => {}}
              onComplete={() => handleComplete(item.id)}
            />
          </Swipeable>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          setShowModal(true);
        }}
      >
        <View style={styles.fabInner}>
          <Add width={120} height={120} />
        </View>
      </TouchableOpacity>

      <AddQuestModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onCreate={(title, category) => {
          addQuest(title, category);
          setShowModal(false);
        }}
      />

      <QuestSuggestionModal
        visible={showSuggestionModal}
        quest={suggestedQuest}
        onAccept={handleAcceptSuggestion}
        onReject={() => setShowSuggestionModal(false)}
        onRegenerate={handleGenerateQuest}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 20,
  },
  greenBanner: {
    position: 'absolute',
    top: 0,
    left: -40,
    right: -40,
    height: 250,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },
  profileButtonContainer: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 50,
    top: 60,
    right: 20,
    zIndex: 100,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    backgroundColor: '#e8f8f4',
    borderRadius: 50,
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    marginLeft: 14,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E8EBF0',
    marginVertical: 14,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 30,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },
  generateBtn: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#40b8a5',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  generateText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  fab: {
    position: 'absolute',
    bottom: 15,
    alignSelf: 'center',
  },
  fabInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  rightAction: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 50,
    top: 20,
  },
  actionText: {
    color: '#ffff',
    fontWeight: '700',
    fontSize: 14,
    justifyContent: 'center',
  },
});

export default HomeScreen;