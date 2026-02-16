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
        console.log('⚠️ User not logged in, skipping activity sync');
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

        console.log('✅ Activity synced to Firebase:', {
          days: activeDays.length,
          lastActive: lastActiveDate,
        });
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
 * 🔥 ИСПРАВЕНО: Sync activity FROM Firestore
 * FIREBASE WINS - земај ги Firebase податоците директно
 */
export async function syncActivityFromFirebase(): Promise<void> {
  const { currentUser, isGuest } = useAuthStore.getState();
  if (isGuest || !currentUser) {
    console.log('⚠️ User not logged in, skipping activity sync');
    return;
  }

  try {
    const activityRef = doc(db, 'activity', currentUser.id);
    const activityDoc = await getDoc(activityRef);

    if (!activityDoc.exists()) {
      console.log('⚠️ No activity data on server - will upload local data on next activity');
      await syncActivityToFirebase();
      return;
    }

    const firebaseData = activityDoc.data() as ActivityData;

    // 🔥 FIREBASE WINS: Зачувај ги Firebase податоците локално
    await AsyncStorage.setItem(
      'activeDays',
      JSON.stringify(firebaseData.activeDays || [])
    );
    await AsyncStorage.setItem(
      'lastActiveDate',
      firebaseData.lastActiveDate || ''
    );

    console.log('✅ Activity loaded from Firebase:', {
      days: firebaseData.activeDays?.length || 0,
      lastActive: firebaseData.lastActiveDate,
    });
  } catch (error: any) {
    if (error.code === 'unavailable') {
      console.log('⚠️ Offline - will sync activity when online');
    } else {
      console.error('❌ Error syncing activity from Firebase:', error);
    }
  }
}