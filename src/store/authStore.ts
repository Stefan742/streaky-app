// src/store/authStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  loginWithFirebase,
  logoutFromFirebase,
  registerWithFirebase,
} from '../services/authService';
import { User } from '../types';

type AuthState = {
  currentUser: User | null;
  isGuest: boolean;
  isLoading: boolean;

  // Internal setState method for auth listener
  setUser: (user: User | null, isGuest: boolean) => void;

  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isGuest: true,
      isLoading: false,

      // ИСПРАВЕНО: Правилен setState pattern за auth listener
      setUser: (user: User | null, isGuest: boolean) => {
        set({ currentUser: user, isGuest });
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true });

        const result = await loginWithFirebase(email, password);

        if (!result.success) {
          set({ isLoading: false });
          return { success: false, error: result.error };
        }

        set({
          currentUser: result.user!,
          isGuest: false,
          isLoading: false,
        });

        // Sync data from Firebase after login
        import('../services/userSyncService').then(({ syncUserProgressFromFirebase }) => {
          syncUserProgressFromFirebase();
        });
        import('../services/questSyncService').then(({ syncQuestsFromFirebase }) => {
          syncQuestsFromFirebase();
        });
        import('../services/medalSyncService').then(({ syncMedalsFromFirebase }) => {
          syncMedalsFromFirebase();
        });
        import('../services/activitySyncService').then(({ syncActivityFromFirebase }) => {
          syncActivityFromFirebase();
        });

        return { success: true };
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true });

        const result = await registerWithFirebase(name, email, password);

        if (!result.success) {
          set({ isLoading: false });
          return { success: false, error: result.error };
        }

        set({
          currentUser: result.user!,
          isGuest: false,
          isLoading: false,
        });

        return { success: true };
      },

      logout: async () => {
        await logoutFromFirebase();
        set({
          currentUser: null,
          isGuest: true,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);