import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Quest = {
  id: string;
  title: string;
  category: 'HEALTH' | 'STUDY' | 'WORK';
  completed: boolean;
  completedAt?: number; // Timestamp when completed
};

type QuestState = {
  quests: Quest[];
  totalCompletedQuests: number; // NEW: Track total completed quests
  todayCompletedCount: number; // NEW: Track quests completed today
  lastResetDate: string; // NEW: Track when daily count was reset
  
  addQuest: (title: string, category: 'HEALTH' | 'STUDY' | 'WORK') => void;
  toggleQuest: (id: string) => void;
  deleteQuest: (id: string) => void;
  resetDailyCount: () => void; // NEW: Reset daily count
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
        set((state) => ({
          quests: [
            ...state.quests,
            {
              id: Date.now().toString(),
              title,
              category,
              completed: false,
            },
          ],
        })),

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
            newTotalCompleted += 1;
            newTodayCount += 1;
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

      deleteQuest: (id) =>
        set((state) => ({
          quests: state.quests.filter((q) => q.id !== id),
        })),

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