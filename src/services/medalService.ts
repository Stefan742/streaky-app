// src/services/medalService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMedalStore } from '../store/MedalStore';

// 🔥 Helper function за auto-sync
async function syncMedalToFirebase(): Promise<void> {
  try {
    const { syncMedalsToFirebase } = await import('./medalSyncService');
    await syncMedalsToFirebase();
  } catch (error) {
    console.error('❌ Error syncing medal:', error);
  }
}

// ============================================
// STREAK MEDALS
// ============================================

export function check7DayStreakMedal(streak: number): void {
  if (streak >= 7) {
    const { unlockMedal } = useMedalStore.getState();
    unlockMedal('2');
    console.log('🏅 7-Day Streak medal unlocked!');
    syncMedalToFirebase();
  }
}

export function check30DayStreakMedal(streak: number): void {
  if (streak >= 30) {
    const { unlockMedal } = useMedalStore.getState();
    unlockMedal('6');
    console.log('🏅 30-Day Streak medal unlocked!');
    syncMedalToFirebase();
  }
}

// ============================================
// QUEST MEDALS
// ============================================

export function checkFirstTaskMedal(): void {
  const { unlockMedal } = useMedalStore.getState();
  unlockMedal('1');
  console.log('🏅 First Task Completed medal unlocked!');
  syncMedalToFirebase();
}

export function check100TasksMedal(totalCompleted: number): void {
  if (totalCompleted >= 100) {
    const { unlockMedal } = useMedalStore.getState();
    unlockMedal('7');
    console.log('🏅 100 Tasks Finished medal unlocked!');
    syncMedalToFirebase();
  }
}

export function checkSuperHappyMedal(todayCount: number): void {
  if (todayCount >= 10) {
    const { unlockMedal } = useMedalStore.getState();
    unlockMedal('9');
    console.log('🏅 Super Happy medal unlocked!');
    syncMedalToFirebase();
  }
}

export function checkQuestMedals(totalCompleted: number, todayCount: number): void {
  if (totalCompleted === 1) {
    checkFirstTaskMedal();
  }

  if (totalCompleted === 100) {
    check100TasksMedal(totalCompleted);
  }

  if (todayCount === 10) {
    checkSuperHappyMedal(todayCount);
  }
}

// ============================================
// LEVEL MEDALS
// ============================================

export function checkRoyalAchievementMedal(level: number): void {
  if (level >= 50) {
    const { unlockMedal } = useMedalStore.getState();
    unlockMedal('8');
    console.log('🏅 Royal Achievement medal unlocked!');
    syncMedalToFirebase();
  }
}

// ============================================
// COMEBACK MEDAL
// ============================================

export function checkComebackMedal(): void {
  const { unlockMedal } = useMedalStore.getState();
  unlockMedal('4');
  console.log('🏅 Comeback medal unlocked!');
  syncMedalToFirebase();
}

// ============================================
// ACTIVITY TRACKING MEDALS
// ============================================

let activeDays: string[] = [];
let lastActiveDate: string = '';

export function initializeDailyTracking(
  storedActiveDays: string[],
  storedLastActiveDate: string
): void {
  activeDays = storedActiveDays;
  lastActiveDate = storedLastActiveDate;
  console.log('✅ Daily tracking initialized:', {
    totalDays: activeDays.length,
    lastActive: lastActiveDate,
  });
}

export function trackDailyActivity(lastActive: string): {
  activeDays: string[];
  isNewDay: boolean;
} {
  const today = new Date().toISOString().split('T')[0];

  if (lastActive === today) {
    console.log('✅ Activity already tracked today');
    return { activeDays, isNewDay: false };
  }

  if (!activeDays.includes(today)) {
    activeDays.push(today);
    activeDays.sort();
    console.log(`📅 New day tracked: ${today}`);
  }

  lastActiveDate = today;
  checkConsistentUserMedal();

  return { activeDays, isNewDay: true };
}

export async function checkConsistentUserMedal(): Promise<void> {
  try {
    const activeDaysStr = await AsyncStorage.getItem('activeDays');
    const activeDaysArray: string[] = activeDaysStr ? JSON.parse(activeDaysStr) : [];

    if (activeDaysArray.length >= 30) {
      const { unlockMedal } = useMedalStore.getState();
      unlockMedal('5');
      console.log('🏅 Consistent User medal unlocked!');
      syncMedalToFirebase();
    }
  } catch (error) {
    console.error('❌ Error checking Consistent User medal:', error);
  }
}

// ============================================
// OTHER MEDALS
// ============================================

export function checkAllFeaturesExploredMedal(): void {
  const { unlockMedal } = useMedalStore.getState();
  unlockMedal('3');
  console.log('🏅 All Features Explored medal unlocked!');
  syncMedalToFirebase();
}