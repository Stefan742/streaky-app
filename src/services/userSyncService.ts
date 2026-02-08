// src/services/userSyncService.ts
import { doc, getDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { syncQueue } from './syncQueue';

interface UserProgressData {
  xp: number;
  level: number;
  streak: number;
  updatedAt?: Timestamp;
}

/**
 * Sync user progress TO Firestore (with queue)
 */
export async function syncUserProgressToFirebase(): Promise<void> {
  return syncQueue.enqueue(
    async () => {
      const { currentUser, isGuest } = useAuthStore.getState();
      if (isGuest || !currentUser) {
        console.log('User not logged in, skipping sync');
        return;
      }

      const { xp, level, streak } = useUserStore.getState();

      try {
        const userRef = doc(db, 'users', currentUser.id);

        await updateDoc(userRef, {
          xp,
          level,
          streak,
          updatedAt: serverTimestamp(),
        });

        console.log('✅ User progress synced to Firebase');
      } catch (error: any) {
        if (error.code === 'unavailable') {
          console.log('⚠️ Offline - sync will retry when online');
        } else {
          console.error('❌ Error syncing user progress:', error);
        }
      }
    },
    'user-progress-sync', // debounce key
    1500 // 1.5s debounce
  );
}

/**
 * Sync user progress FROM Firestore
 * Conflict resolution: Use server timestamp to determine newer data
 */
export async function syncUserProgressFromFirebase(): Promise<void> {
  const { currentUser, isGuest } = useAuthStore.getState();
  if (isGuest || !currentUser) {
    return;
  }

  try {
    const userRef = doc(db, 'users', currentUser.id);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('User document does not exist');
      return;
    }

    const firebaseData = userDoc.data() as UserProgressData;
    const localData = useUserStore.getState();

    // Conflict resolution: Take higher XP (user cannot lose progress)
    // This is safe because XP only increases
    if (firebaseData.xp > localData.xp) {
      useUserStore.setState({
        xp: firebaseData.xp,
        level: firebaseData.level,
        streak: firebaseData.streak,
      });

      console.log('✅ Local progress updated from Firebase (server had higher XP)');
    } else if (localData.xp > firebaseData.xp) {
      // Local is ahead - push to Firebase
      console.log('⚠️ Local progress ahead of server - pushing to Firebase');
      await syncUserProgressToFirebase();
    } else {
      console.log('✅ Local and server progress are in sync');
    }
  } catch (error: any) {
    if (error.code === 'unavailable') {
      console.log('⚠️ Offline - will sync when online');
    } else {
      console.error('❌ Error syncing from Firebase:', error);
    }
  }
}