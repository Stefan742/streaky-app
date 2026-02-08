// src/store/medalStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Medal = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  viewedInVault: boolean; // дали е видено во AchievementsScreen
};

type MedalState = {
  medals: Medal[];
  unviewedCount: number; // број на нови медали што не се видени
  unlockMedal: (id: string) => void;
  markMedalAsViewed: (id: string) => void;
  markAllAsViewed: () => void;
  getUnviewedMedals: () => Medal[];
};

const initialMedals: Medal[] = [
  {
    id: '1',
    title: 'First Task Completed',
    description: 'Complete your first quest',
    unlocked: false,
    unlockedAt: Date.now(),
    viewedInVault: false,
  },
  {
    id: '2',
    title: '7-Day Streak',
    description: 'Maintain a 7-day streak',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '3',
    title: 'All Features Explored',
    description: 'Try every feature in the app',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '4',
    title: 'Comeback',
    description: 'Return after a break',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '5',
    title: 'Consistent User',
    description: 'Use the app for 30 days',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '6',
    title: '30-Day Streak',
    description: 'Maintain a 30-day streak',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '7',
    title: '100 Tasks Finished',
    description: 'Complete 100 quests',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '8',
    title: 'Royal Achievement',
    description: 'Reach level 50',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '9',
    title: 'Super Happy',
    description: 'Complete 10 quests in one day',
    unlocked: false,
    viewedInVault: false,
  },
];

export const useMedalStore = create<MedalState>()(
  persist(
    (set, get) => ({
      medals: initialMedals,
      unviewedCount: 0,

      unlockMedal: (id: string) =>
        set((state) => {
          const medal = state.medals.find((m) => m.id === id);
          if (!medal || medal.unlocked) return state;

          const updatedMedals = state.medals.map((m) =>
            m.id === id
              ? { ...m, unlocked: true, unlockedAt: Date.now(), viewedInVault: false }
              : m
          );

          return {
            medals: updatedMedals,
            unviewedCount: state.unviewedCount + 1,
          };
        }),

      markMedalAsViewed: (id: string) =>
        set((state) => {
          const medal = state.medals.find((m) => m.id === id);
          if (!medal || medal.viewedInVault) return state;

          const updatedMedals = state.medals.map((m) =>
            m.id === id ? { ...m, viewedInVault: true } : m
          );

          return {
            medals: updatedMedals,
            unviewedCount: Math.max(0, state.unviewedCount - 1),
          };
        }),

      markAllAsViewed: () =>
        set((state) => ({
          medals: state.medals.map((m) =>
            m.unlocked && !m.viewedInVault ? { ...m, viewedInVault: true } : m
          ),
          unviewedCount: 0,
        })),

      getUnviewedMedals: () => {
        const { medals } = get();
        return medals.filter((m) => m.unlocked && !m.viewedInVault);
      },
    
      
    }),
    {
      name: 'medal-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
