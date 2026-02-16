import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useUserStore } from '../store/userStore';

export type Quest = {
  id: string;
  title: string;
  category: 'HEALTH' | 'STUDY' | 'WORK';
  completed: boolean;
  completedAt?: number; // Timestamp when completed
};

type QuestState = {
  quests: Quest[];
  totalCompletedQuests: number;
  todayCompletedCount: number;
  lastResetDate: string;
  
  addQuest: (title: string, category: 'HEALTH' | 'STUDY' | 'WORK') => void;
  toggleQuest: (id: string) => void;
  deleteQuest: (id: string) => void;
  resetDailyCount: () => void;
};

// Helper to get today's date string
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      quests: [
        { id: '1', title: 'Morning Run', category: 'HEALTH', completed: false },
        { id: '2', title: 'Read 10 pages', category: 'STUDY', completed: false },
        { id: '3', title: 'Finish report', category: 'WORK', completed: false },
      ],
      totalCompletedQuests: 0,
      todayCompletedCount: 0,
      lastResetDate: getTodayString(),

      addQuest: (title, category) =>
        set((state) => {
          const newState = {
            quests: [
              ...state.quests,
              {
                id: Date.now().toString(),
                title,
                category,
                completed: false,
              },
            ],
          };
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          // 🔄 SYNC TO FIREBASE
          import('../services/questSyncService').then(({ syncQuestsToFirebase }) => {
            syncQuestsToFirebase();
          });

          return newState;
        }),

      toggleQuest: (id) =>
        set((state) => {
          const quest = state.quests.find((q) => q.id === id);
          if (!quest) return state;

          const today = getTodayString();
          let newTotalCompleted = state.totalCompletedQuests;
          let newTodayCount = state.todayCompletedCount;
          let newLastResetDate = state.lastResetDate;

          // Reset daily count if it's a new day
          if (state.lastResetDate !== today) {
            newTodayCount = 0;
            newLastResetDate = today;
          }

          // If completing a quest (not uncompleting)
          if (!quest.completed) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            newTotalCompleted += 1;
            newTodayCount += 1;

            // 🔥 STREAK UPDATE (само при завршување на quest!)
            useUserStore.getState().updateStreak();

            // 🏅 MEDAL CHECKS
            import('../services/medalService').then(({ 
              checkFirstTaskMedal, 
              check100TasksMedal, 
              checkSuperHappyMedal 
            }) => {
              // First task medal
              if (newTotalCompleted === 1) {
                checkFirstTaskMedal();
              }

              // 100 tasks medal
              if (newTotalCompleted === 100) {
                check100TasksMedal(newTotalCompleted);
              }

              // Super Happy medal (10 in one day)
              if (newTodayCount === 10) {
                checkSuperHappyMedal(newTodayCount);
              }
            });

            // 🎁 XP REWARD
            useUserStore.getState().addXP(50); // +50 XP per quest

            // 🔄 SYNC TO FIREBASE
            import('../services/questSyncService').then(({ syncQuestsToFirebase }) => {
              syncQuestsToFirebase();
            });
          }

          return {
            quests: state.quests.map((q) =>
              q.id === id
                ? {
                    ...q,
                    completed: !q.completed,
                    completedAt: !q.completed ? Date.now() : undefined,
                  }
                : q
            ),
            totalCompletedQuests: newTotalCompleted,
            todayCompletedCount: newTodayCount,
            lastResetDate: newLastResetDate,
          };
        }),

      /**
       * 🔥 ИСПРАВЕНО: deleteQuest со Firebase sync
       */
      deleteQuest: (id) =>
        set((state) => {
          const newState = {
            quests: state.quests.filter((q) => q.id !== id),
          };

          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

          // 🔄 SYNC TO FIREBASE (КРИТИЧНО!)
          import('../services/questSyncService').then(({ syncQuestsToFirebase }) => {
            syncQuestsToFirebase();
          });

          return newState;
        }),

      resetDailyCount: () =>
        set({
          todayCompletedCount: 0,
          lastResetDate: getTodayString(),
        }),
    }),
    {
      name: 'quest-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);