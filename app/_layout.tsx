// app/_layout.tsx (UPDATED STREAK LOGIC)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot } from 'expo-router';
import React, { useEffect, useState } from 'react';

import OnboardingScreen from '../src/screens/OnboardingScreen';
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
import { useAppStore } from '../src/store/appStore';
import { useAuthStore } from '../src/store/authStore';
import { useQuestStore } from '../src/store/questStore';
import { useUserStore } from '../src/store/userStore';

export default function Layout() {
  const { hasSeenOnboarding, setHasSeenOnboarding, incrementLaunches } = useAppStore();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      // Setup auth listener
      const unsubscribeAuth = setupAuthListener((user, isGuest) => {
        useAuthStore.getState().setUser(user, isGuest);
      });

      const { currentUser, isGuest } = useAuthStore.getState();

      // Track app launch
      incrementLaunches();

      // Initialize notifications for all users
      await initializeNotifications();

      if (!isGuest && currentUser) {
        // 🔥 КРИТИЧНО: Sync FROM Firebase ПРВО
        await Promise.all([
          syncUserProgressFromFirebase(),
          syncQuestsFromFirebase(),
          syncMedalsFromFirebase(),
          syncActivityFromFirebase(),
        ]);

        console.log('✅ All data synced from Firebase');

        // 🔥 НОВАТА ЛОГИКА: Само провери за streak loss (не го зголемувај streak)
        const { lastActiveDate } = useUserStore.getState();
        const today = new Date().toISOString().split('T')[0];

        console.log('🔍 Checking streak:', { lastActiveDate, today });

        // Ако е нов ден → провери за streak loss
        if (lastActiveDate !== today) {
          console.log('🆕 New day detected, checking for streak loss...');
          await useUserStore.getState().updateStreak(); // Only checks for loss
        } else {
          console.log('✅ Streak already processed today');
        }

        // Load activity data за medals
        const storedActiveDaysStr = await AsyncStorage.getItem('activeDays');
        const storedLastActiveDate = await AsyncStorage.getItem('lastActiveDate');

        const activeDays = storedActiveDaysStr ? JSON.parse(storedActiveDaysStr) : [];
        const lastActive = storedLastActiveDate || '';

        // Initialize tracking
        initializeDailyTracking(activeDays, lastActive);

        // Track today's activity
        const result = trackDailyActivity(lastActive);

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

      // Check if should show onboarding
      console.log('📊 Onboarding status:', hasSeenOnboarding);
      if (!hasSeenOnboarding) {
        console.log('👋 Showing onboarding screen');
        setShowOnboarding(true);
      }

      setIsInitialized(true);

      return () => {
        unsubscribeAuth();
      };
    };

    initializeApp();
  }, []);

  const handleOnboardingComplete = () => {
    console.log('✅ Onboarding completed');
    setHasSeenOnboarding(true);
    setShowOnboarding(false);
  };

  // Show onboarding first
  if (showOnboarding) {
    console.log('🎬 Rendering OnboardingScreen');
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Show loading while initializing (optional)
  if (!isInitialized) {
    return null; // Or a loading screen
  }

  return <Slot />;
}