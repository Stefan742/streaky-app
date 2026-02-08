import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type UserState = {
  xp: number;
  level: number;
  streak: number;
  incrementXP: (amount: number) => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      xp: 0,
      level: 1,
      streak: 1,

      incrementXP: (amount) =>
        set((state) => {
          const newXp = state.xp + amount;
          const newLevel = Math.floor(newXp / 500) + 1;

          // Import medal service dynamically to avoid circular dependencies
          import('../services/medalService').then(({ checkRoyalAchievementMedal }) => {
            checkRoyalAchievementMedal(newLevel);
          });

          return {
            xp: newXp,
            level: newLevel,
          };
        }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);