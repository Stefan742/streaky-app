// src/services/activitySyncService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuthStore } from '../store/authStore';
import { ActivityData } from '../types';
import { syncQueue } from './syncQueue';

/**
 * Sync activity TO Firestore (with queue)
 */
export async function syncActivityToFirebase(): Promise<void> {
  return syncQueue.enqueue(
    async () => {
      const { currentUser, isGuest } = useAuthStore.getState();
      if (isGuest || !currentUser) {
        return;
      }

      try {
        const activeDaysStr = await AsyncStorage.getItem('activeDays');
        const lastActiveDate = await AsyncStorage.getItem('lastActiveDate');

        const activeDays: string[] = activeDaysStr ? JSON.parse(activeDaysStr) : [];

        const activityRef = doc(db, 'activity', currentUser.id);

        const data: ActivityData = {
          activeDays,
          lastActiveDate: lastActiveDate || '',
          updatedAt: serverTimestamp() as any,
        };

        await setDoc(activityRef, data, { merge: true });

        console.log('✅ Activity synced to Firebase');
      } catch (error: any) {
        if (error.code === 'unavailable') {
          console.log('⚠️ Offline - activity sync will retry');
        } else {
          console.error('❌ Error syncing activity:', error);
        }
      }
    },
    'activity-sync',
    2000
  );
}

/**
 * Sync activity FROM Firestore
 * Merge strategy: Union of active days (users can't lose activity)
 */
export async function syncActivityFromFirebase(): Promise<void> {
  const { currentUser, isGuest } = useAuthStore.getState();
  if (isGuest || !currentUser) {
    return;
  }

  try {
    const activityRef = doc(db, 'activity', currentUser.id);
    const activityDoc = await getDoc(activityRef);

    if (!activityDoc.exists()) {
      console.log('No activity data on server - pushing local data');
      await syncActivityToFirebase();
      return;
    }

    const firebaseData = activityDoc.data() as ActivityData;

    // Get local active days
    const localActiveDaysStr = await AsyncStorage.getItem('activeDays');
    const localActiveDays: string[] = localActiveDaysStr ? JSON.parse(localActiveDaysStr) : [];

    // Merge: Union of both sets (sorted)
    const mergedActiveDays = Array.from(
      new Set([...localActiveDays, ...firebaseData.activeDays])
    ).sort();

    // Use most recent lastActiveDate
    const localLastActive = await AsyncStorage.getItem('lastActiveDate');
    const lastActiveDate =
      localLastActive && localLastActive > firebaseData.lastActiveDate
        ? localLastActive
        : firebaseData.lastActiveDate;

    // Save merged data locally
    await AsyncStorage.setItem('activeDays', JSON.stringify(mergedActiveDays));
    await AsyncStorage.setItem('lastActiveDate', lastActiveDate);

    console.log('✅ Activity synced from Firebase (merged)');

    // Push merged data back to Firebase
    await syncActivityToFirebase();
  } catch (error: any) {
    if (error.code === 'unavailable') {
      console.log('⚠️ Offline - will sync activity when online');
    } else {
      console.error('❌ Error syncing activity from Firebase:', error);
    }
  }
}