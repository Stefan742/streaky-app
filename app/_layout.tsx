// app/_layout.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot } from 'expo-router';
import React, { useEffect } from 'react';

import { syncActivityFromFirebase, syncActivityToFirebase } from '../src/services/activitySyncService';
import { setupAuthListener } from '../src/services/authService';
import {
  initializeDailyTracking,
  trackDailyActivity,
} from '../src/services/medalService';
import { syncMedalsFromFirebase } from '../src/services/medalSyncService';
import {
  checkAndSendStreakWarning,
  initializeNotifications,
} from '../src/services/notificationService';
import { syncQuestsFromFirebase } from '../src/services/questSyncService';
import {
  syncUserProgressFromFirebase,
} from '../src/services/userSyncService';
import { useAuthStore } from '../src/store/authStore';
import { useQuestStore } from '../src/store/questStore';

export default function Layout() {
  useEffect(() => {
    // ИСПРАВЕНО: Користи правилен setState pattern
    const unsubscribeAuth = setupAuthListener((user, isGuest) => {
      useAuthStore.getState().setUser(user, isGuest);
    });

    // Initialize everything on app startup
    const initializeApp = async () => {
      const { currentUser, isGuest } = useAuthStore.getState();

      // Initialize notifications for all users
      await initializeNotifications();

      if (!isGuest && currentUser) {
        // Sync FROM Firebase first
        await Promise.all([
          syncUserProgressFromFirebase(),
          syncQuestsFromFirebase(),
          syncMedalsFromFirebase(),
          syncActivityFromFirebase(),
        ]);

        // Load activity data
        const storedActiveDaysStr = await AsyncStorage.getItem('activeDays');
        const storedLastActiveDate = await AsyncStorage.getItem('lastActiveDate');

        const activeDays = storedActiveDaysStr ? JSON.parse(storedActiveDaysStr) : [];
        const lastActiveDate = storedLastActiveDate || '';

        // Initialize tracking
        initializeDailyTracking(activeDays, lastActiveDate);

        // Track today's activity
        const result = trackDailyActivity(lastActiveDate);

        // Save updated data
        await AsyncStorage.setItem('activeDays', JSON.stringify(result.activeDays));
        await AsyncStorage.setItem(
          'lastActiveDate',
          new Date().toISOString().split('T')[0]
        );

        // Sync activity back to Firebase
        await syncActivityToFirebase();

        // Check streak warning
        const todayCompletedCount = useQuestStore.getState().todayCompletedCount;
        await checkAndSendStreakWarning(todayCompletedCount);
      }
    };

    initializeApp();

    return () => {
      unsubscribeAuth();
    };
  }, []);

  return <Slot />;
}