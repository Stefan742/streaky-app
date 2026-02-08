// src/services/medalService.ts
import { useMedalStore } from '../store/MedalStore';

/**
 * Centralized medal unlocking service
 * Call these functions from screens/hooks when relevant events occur
 */

// Track daily activity for medal '5' and '9'
type DailyActivity = {
  activeDays: Set<string>; // Set of dates in 'YYYY-MM-DD' format
  todayQuestCount: number;
  lastActiveDate: string;
};

let dailyActivityCache: DailyActivity = {
  activeDays: new Set(),
  todayQuestCount: 0,
  lastActiveDate: '',
};

// Helper to get today's date string
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper to count days between two dates
function daysBetween(date1: Date, date2: Date): number {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc2 - utc1) / MS_PER_DAY);
}

/**
 * MEDAL 1: First Task Completed
 * Call after completing the first quest ever
 */
export function checkFirstTaskMedal(totalCompletedQuests: number) {
  if (totalCompletedQuests === 1) {
    useMedalStore.getState().unlockMedal('1');
  }
}

/**
 * MEDAL 2: 7-Day Streak
 * MEDAL 6: 30-Day Streak
 * Call whenever streak is updated
 */
export function checkStreakMedals(currentStreak: number) {
  const { unlockMedal } = useMedalStore.getState();

  if (currentStreak >= 7) {
    unlockMedal('2');
  }

  if (currentStreak >= 30) {
    unlockMedal('6');
  }
}

/**
 * MEDAL 3: All Features Explored
 * Call this when tracking screen visits
 * Required screens: Home, Leaderboard, Achievements, Profile/Settings
 */
export function checkAllFeaturesExploredMedal(visitedScreens: Set<string>) {
  const requiredScreens = ['Home', 'Leaderboard', 'Achievements', 'Profile'];
  const allExplored = requiredScreens.every((screen) => visitedScreens.has(screen));

  if (allExplored) {
    useMedalStore.getState().unlockMedal('3');
  }
}

/**
 * MEDAL 4: Comeback
 * Call on app launch/foreground
 * Unlocks if user returns after 7+ days of inactivity
 */
export function checkComebackMedal(lastActiveDate: Date) {
  const today = new Date();
  const daysInactive = daysBetween(lastActiveDate, today);

  // User was inactive for 7+ days and now returned
  if (daysInactive >= 7) {
    useMedalStore.getState().unlockMedal('4');
  }
}

/**
 * MEDAL 5: Consistent User
 * Call when tracking daily activity (app launch)
 * Unlocks after using app on 30 different days (non-consecutive)
 */
export function checkConsistentUserMedal(activeDaysSet: Set<string>) {
  if (activeDaysSet.size >= 30) {
    useMedalStore.getState().unlockMedal('5');
  }
}

/**
 * MEDAL 7: 100 Tasks Finished
 * Call after completing any quest
 */
export function check100TasksMedal(totalCompletedQuests: number) {
  if (totalCompletedQuests >= 100) {
    useMedalStore.getState().unlockMedal('7');
  }
}

/**
 * MEDAL 8: Royal Achievement
 * Call whenever user levels up
 */
export function checkRoyalAchievementMedal(currentLevel: number) {
  if (currentLevel >= 50) {
    useMedalStore.getState().unlockMedal('8');
  }
}

/**
 * MEDAL 9: Super Happy
 * Call after completing any quest (tracks daily quest count)
 */
export function checkSuperHappyMedal(questsCompletedToday: number) {
  if (questsCompletedToday >= 10) {
    useMedalStore.getState().unlockMedal('9');
  }
}

/**
 * Convenience function: Check all quest-related medals at once
 * Call this after completing a quest
 */
export function checkQuestMedals(
  totalCompleted: number,
  todayCompleted: number
) {
  checkFirstTaskMedal(totalCompleted);
  check100TasksMedal(totalCompleted);
  checkSuperHappyMedal(todayCompleted);
}

/**
 * Initialize daily activity tracking
 * Call on app startup
 */
export function initializeDailyTracking(
  storedActiveDays: string[],
  lastActiveDate: string
) {
  dailyActivityCache = {
    activeDays: new Set(storedActiveDays),
    todayQuestCount: 0,
    lastActiveDate,
  };
}

/**
 * Track daily activity and check relevant medals
 * Call on app launch/foreground
 */
export function trackDailyActivity(lastActiveDate: string): {
  activeDays: string[];
  shouldCheckComeback: boolean;
} {
  const today = getTodayString();
  const lastActive = new Date(lastActiveDate);

  // Check comeback medal if applicable
  if (lastActiveDate && lastActiveDate !== today) {
    checkComebackMedal(lastActive);
  }

  // Add today to active days
  dailyActivityCache.activeDays.add(today);
  dailyActivityCache.lastActiveDate = today;

  // Reset daily quest count if it's a new day
  if (dailyActivityCache.lastActiveDate !== today) {
    dailyActivityCache.todayQuestCount = 0;
  }

  // Check consistent user medal
  checkConsistentUserMedal(dailyActivityCache.activeDays);

  return {
    activeDays: Array.from(dailyActivityCache.activeDays),
    shouldCheckComeback: lastActiveDate !== today,
  };
}

/**
 * Increment today's quest count
 * Call after completing a quest
 */
export function incrementTodayQuestCount(): number {
  dailyActivityCache.todayQuestCount += 1;
  return dailyActivityCache.todayQuestCount;
}

/**
 * Get current daily activity data for persistence
 */
export function getDailyActivityData() {
  return {
    activeDays: Array.from(dailyActivityCache.activeDays),
    todayQuestCount: dailyActivityCache.todayQuestCount,
    lastActiveDate: dailyActivityCache.lastActiveDate,
  };
}