// src/store/activityStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ActivityState = {
  activeDays: string[];
  lastActiveDate: string;
};

export const useActivityStore = create<ActivityState>()(
  persist(
    () => ({
      activeDays: [] as string[],
      lastActiveDate: '',
    }),
    {
      name: 'activity-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
