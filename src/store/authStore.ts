// src/store/authStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { arrayUnion, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { db } from '../config/firebaseConfig';
import {
  syncActivityFromFirebase,
  syncActivityToFirebase,
} from '../services/activitySyncService';
import {
  loginWithFirebase,
  logoutFromFirebase,
  registerWithFirebase,
} from '../services/authService';
import { syncMedalsFromFirebase, syncMedalsToFirebase } from '../services/medalSyncService';
import { syncQuestsFromFirebase, syncQuestsToFirebase } from '../services/questSyncService';
import {
  syncUserProgressFromFirebase,
  syncUserProgressToFirebase,
} from '../services/userSyncService';
import { User } from '../types';
import { useMedalStore } from './MedalStore';
import { useQuestStore } from './questStore';
import { useUserStore } from './userStore';

type AddFriendResult = {
  success: boolean;
  error?: string;
  friendName?: string;
};

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

  // Friend actions
  addFriendByCode: (code: string) => Promise<AddFriendResult>;
  
  // 🆕 RESET функција
  resetAllLocalStores: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isGuest: true,
      isLoading: false,

      /**
       * 🆕 RESET ФУНКЦИЈА - го брише ЦЕЛИОТ локален state
       */
      resetAllLocalStores: () => {
        console.log('🧹 Resetting all local stores to initial state...');
        
        // Reset UserStore
        useUserStore.setState({
          xp: 0,
          level: 1,
          streak: 1,
        });

        // Reset QuestStore
        useQuestStore.setState({
          quests: [],
          totalCompletedQuests: 0,
          todayCompletedCount: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
        });

        // Reset MedalStore
        const initialMedals = useMedalStore.getState().medals.map(m => ({
          ...m,
          unlocked: false,
          unlockedAt: undefined,
          viewedInVault: false,
        }));
        
        useMedalStore.setState({
          medals: initialMedals,
          unviewedCount: 0,
        });

        // Clear AsyncStorage activity data
        AsyncStorage.removeItem('activeDays').catch(() => {});
        AsyncStorage.removeItem('lastActiveDate').catch(() => {});

        console.log('✅ All local stores reset successfully');
      },

      setUser: (user: User | null, isGuest: boolean) => {
        set({ currentUser: user, isGuest });
      },

      /**
       * 🔥 ИСПРАВЕНА LOGIN ЛОГИКА
       */
      login: async (email: string, password: string) => {
        set({ isLoading: true });

        try {
          const result = await loginWithFirebase(email, password);

          if (!result.success) {
            set({ isLoading: false });
            return { success: false, error: result.error };
          }

          // 🔥 КРИТИЧНО: Провери дали е ист корисник или различен
          const previousUserId = get().currentUser?.id;
          const newUserId = result.user!.id;

          if (previousUserId && previousUserId !== newUserId) {
            // 🧹 Различен корисник → RESET локален state
            console.log('⚠️ Different user detected! Clearing local data...');
            get().resetAllLocalStores();
          }

          // Постави го новиот корисник
          set({
            currentUser: result.user!,
            isGuest: false,
            isLoading: false,
          });

          // 🔥 ПОТОА повлечи Firebase податоци (со await!)
          console.log('⬇️ Syncing data from Firebase...');
          await Promise.all([
            syncUserProgressFromFirebase(),
            syncQuestsFromFirebase(),
            syncMedalsFromFirebase(),
            syncActivityFromFirebase(),
          ]);

          console.log('✅ Login successful - all data synced');
          return { success: true };
        } catch (error: any) {
          console.error('❌ Login error:', error);
          set({ isLoading: false });
          return { success: false, error: error.message || 'Login failed' };
        }
      },

      /**
       * 🔥 ИСПРАВЕНА REGISTER ЛОГИКА
       */
      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true });

        try {
          const result = await registerWithFirebase(name, email, password);

          if (!result.success) {
            set({ isLoading: false });
            return { success: false, error: result.error };
          }

          // 🧹 За нов корисник, ресетирај локални податоци
          console.log('🧹 Clearing local data for new registration...');
          get().resetAllLocalStores();

          set({
            currentUser: result.user!,
            isGuest: false,
            isLoading: false,
          });

          // За нов корисник, нема податоци на Firebase → upload локални (0-те)
          console.log('⬆️ Uploading initial data to Firebase...');
          await Promise.all([
            syncUserProgressToFirebase(),
            syncQuestsToFirebase(),
            syncMedalsToFirebase(),
            syncActivityToFirebase(),
          ]);

          console.log('✅ Registration successful');
          return { success: true };
        } catch (error: any) {
          console.error('❌ Registration error:', error);
          set({ isLoading: false });
          return { success: false, error: error.message || 'Registration failed' };
        }
      },

      /**
       * 🔥 ИСПРАВЕНА LOGOUT ЛОГИКА
       */
      logout: async () => {
        try {
          const { isGuest } = get();

          if (!isGuest) {
            // Sync последни промени пред logout
            console.log('⬆️ Syncing final changes before logout...');
            await Promise.all([
              syncUserProgressToFirebase(),
              syncQuestsToFirebase(),
              syncMedalsToFirebase(),
              syncActivityToFirebase(),
            ]);

            await logoutFromFirebase();
          }

          // 🧹 Ресетирај state после logout
          console.log('🧹 Clearing state after logout...');
          get().resetAllLocalStores();

          set({
            currentUser: null,
            isGuest: true,
          });

          console.log('✅ Logout successful');
        } catch (error) {
          console.error('❌ Logout error:', error);
        }
      },

      /**
       * Add a friend by their friend code.
       * Looks up the code in Firestore, fetches their profile,
       * and updates both users' friends arrays bidirectionally.
       */
      addFriendByCode: async (code: string): Promise<AddFriendResult> => {
        const { currentUser } = get();

        if (!currentUser) {
          return { success: false, error: 'You must be logged in to add friends' };
        }

        const trimmedCode = code.trim().toUpperCase();

        if (!trimmedCode) {
          return { success: false, error: 'Please enter a friend code' };
        }

        if (trimmedCode === currentUser.friendCode) {
          return { success: false, error: "That's your own friend code!" };
        }

        try {
          // Step 1: Look up the friend code → get their userId
          const friendCodeDoc = await getDoc(doc(db, 'friendCodes', trimmedCode));

          if (!friendCodeDoc.exists()) {
            return { success: false, error: 'Friend code not found. Check the code and try again.' };
          }

          const friendUserId: string = friendCodeDoc.data().userId;

          // Step 2: Check if already friends
          const alreadyFriends = (currentUser.friends || []).includes(friendUserId);
          if (alreadyFriends) {
            return { success: false, error: 'You are already friends with this person' };
          }

          // Step 3: Fetch their user profile to get their name
          const friendUserDoc = await getDoc(doc(db, 'users', friendUserId));

          if (!friendUserDoc.exists()) {
            return { success: false, error: 'Could not find this user' };
          }

          const friendData = friendUserDoc.data() as User;

          // Step 4: Add each other as friends (bidirectional)
          await updateDoc(doc(db, 'users', currentUser.id), {
            friends: arrayUnion(friendUserId),
            updatedAt: serverTimestamp(),
          });

          await updateDoc(doc(db, 'users', friendUserId), {
            friends: arrayUnion(currentUser.id),
            updatedAt: serverTimestamp(),
          });

          // Step 5: Update local state so UI refreshes immediately
          set((state) => ({
            currentUser: state.currentUser
              ? {
                  ...state.currentUser,
                  friends: [...(state.currentUser.friends || []), friendUserId],
                }
              : null,
          }));

          return { success: true, friendName: friendData.name };
        } catch (error: any) {
          console.error('❌ addFriendByCode error:', error);
          return { success: false, error: 'Something went wrong. Please try again.' };
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);