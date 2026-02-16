// src/store/appStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface AppState {
  hasSeenOnboarding: boolean;
  appLaunches: number;
  lastLaunchDate: string;

  setHasSeenOnboarding: (value: boolean) => void;
  incrementLaunches: () => void;
  resetOnboarding: () => void; // За testing
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasSeenOnboarding: false,
      appLaunches: 0,
      lastLaunchDate: '',

      setHasSeenOnboarding: (value: boolean) => {
        set({ hasSeenOnboarding: value });
        console.log('✅ Onboarding completed');
      },

      incrementLaunches: () => {
        const today = new Date().toISOString().split('T')[0];
        set((state) => ({
          appLaunches: state.appLaunches + 1,
          lastLaunchDate: today,
        }));
      },

      resetOnboarding: () => {
        set({
          hasSeenOnboarding: false,
          appLaunches: 0,
          lastLaunchDate: '',
        });
        console.log('🔄 Onboarding reset (for testing)');
      },
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);