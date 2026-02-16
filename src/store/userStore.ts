// src/store/userStore.ts (UPDATED STREAK LOGIC)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { EventEmitter, Events } from '../services/eventEmitter';

interface UserStore {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  
  addXP: (amount: number) => void;
  updateStreak: () => Promise<void>;
  
  // 🆕 NEW: Update streak only when first quest is completed
  updateStreakOnQuestComplete: (todayCompletedCount: number) => Promise<void>;
  
  resetProgress: () => void;
}

const XP_PER_LEVEL = 500;

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      xp: 0,
      level: 1,
      streak: 1,
      lastActiveDate: '',

      addXP: (amount: number) => {
        const { xp, level } = get();
        const newXP = xp + amount;
        const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;

        set({ xp: newXP, level: newLevel });
      },

      // 🔄 OLD METHOD: Only called on app start for streak loss detection
      updateStreak: async () => {
        const { streak, lastActiveDate } = get();
        const today = new Date().toISOString().split('T')[0];

        console.log('🔍 updateStreak called:', { lastActiveDate, today, streak });

        // Skip if already updated today
        if (lastActiveDate === today) {
          console.log('✅ Streak already updated today');
          return;
        }

        // Calculate days since last active
        if (!lastActiveDate) {
          console.log('⚠️ No lastActiveDate, skipping streak check');
          return;
        }

        const lastDate = new Date(lastActiveDate);
        const currentDate = new Date(today);
        const diffTime = currentDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        console.log('📅 Days since last active:', diffDays);

        // If negative days (future date) - reset to today
        if (diffDays < 0) {
          console.log('⚠️ Negative days detected (future date), resetting to today');
          set({ lastActiveDate: today });
          return;
        }

        // If more than 1 day gap → streak lost
        if (diffDays > 1) {
          console.log('💔 Streak lost! Resetting to 1');
          
          // 🆕 Save to AsyncStorage for HomeScreen to read
          await AsyncStorage.setItem('STREAK_LOST', JSON.stringify(streak));
          
          // Also emit event (in case HomeScreen is mounted)
          EventEmitter.emit(Events.STREAK_LOST, streak);
          
          set({
            streak: 1,
            lastActiveDate: today,
          });
        }
        // If exactly 1 day → DO NOTHING (wait for quest completion)
        else if (diffDays === 1) {
          console.log('⏳ New day, but no quest completed yet. Waiting...');
          // DON'T update streak yet - wait for first quest completion
        }
      },

      // 🆕 NEW METHOD: Called when quest is completed
      updateStreakOnQuestComplete: async (todayCompletedCount: number) => {
        const { streak, lastActiveDate } = get();
        const today = new Date().toISOString().split('T')[0];

        console.log('🎯 updateStreakOnQuestComplete called:', {
          todayCompletedCount,
          lastActiveDate,
          today,
          currentStreak: streak,
        });

        // Only update on FIRST quest completion of the day
        if (todayCompletedCount !== 1) {
          console.log('⏭️ Not first quest today, skipping streak update');
          return;
        }

        // If already updated today, skip
        if (lastActiveDate === today) {
          console.log('✅ Streak already updated today');
          return;
        }

        // Calculate days since last active
        const lastDate = lastActiveDate ? new Date(lastActiveDate) : new Date(today);
        const currentDate = new Date(today);
        const diffTime = currentDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        console.log('📅 Days since last active:', diffDays);

        // First ever quest
        if (!lastActiveDate) {
          console.log('🆕 First quest ever! Starting streak at 1');
          set({
            streak: 1,
            lastActiveDate: today,
          });
          
          // Emit streak started event
          EventEmitter.emit(Events.STREAK_UPDATED, 1);
          return;
        }

        // Consecutive day → increase streak
        if (diffDays === 1) {
          const newStreak = streak + 1;
          console.log('🔥 Consecutive day! Streak increased to', newStreak);
          
          set({
            streak: newStreak,
            lastActiveDate: today,
          });

          // Emit streak updated event (shows StreakUpdatePopup)
          EventEmitter.emit(Events.STREAK_UPDATED, newStreak);
        }
        // Same day (shouldn't happen, but just in case)
        else if (diffDays === 0) {
          console.log('📅 Same day, updating lastActiveDate');
          set({ lastActiveDate: today });
        }
        // Gap of more than 1 day → streak lost (already handled in updateStreak)
        else if (diffDays > 1) {
          console.log('💔 Gap detected, resetting streak to 1');
          
          set({
            streak: 1,
            lastActiveDate: today,
          });

          // Emit streak updated event
          EventEmitter.emit(Events.STREAK_UPDATED, 1);
        }
      },

      resetProgress: () => {
        set({
          xp: 0,
          level: 1,
          streak: 1,
          lastActiveDate: '',
        });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);