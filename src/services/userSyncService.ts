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
        console.log('⚠️ User not logged in, skipping sync');
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

        console.log('✅ User progress synced to Firebase:', { xp, level, streak });
      } catch (error: any) {
        if (error.code === 'unavailable') {
          console.log('⚠️ Offline - sync will retry when online');
        } else {
          console.error('❌ Error syncing user progress:', error);
        }
      }
    },
    'user-progress-sync',
    1500
  );
}

/**
 * 🔥 ИСПРАВЕНО: Sync user progress FROM Firestore
 * FIREBASE WINS - секогаш земај ги Firebase податоците
 */
export async function syncUserProgressFromFirebase(): Promise<void> {
  const { currentUser, isGuest } = useAuthStore.getState();
  if (isGuest || !currentUser) {
    console.log('⚠️ User not logged in, skipping sync');
    return;
  }

  try {
    const userRef = doc(db, 'users', currentUser.id);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('⚠️ User document does not exist on Firebase');
      return;
    }

    const firebaseData = userDoc.data() as UserProgressData;

    // 🔥 FIREBASE WINS: Земи ги Firebase податоците директно
    useUserStore.setState({
      xp: firebaseData.xp || 0,
      level: firebaseData.level || 1,
      streak: firebaseData.streak || 1,
    });

    console.log('✅ User progress loaded from Firebase:', {
      xp: firebaseData.xp,
      level: firebaseData.level,
      streak: firebaseData.streak,
    });
  } catch (error: any) {
    if (error.code === 'unavailable') {
      console.log('⚠️ Offline - will sync when online');
    } else {
      console.error('❌ Error syncing from Firebase:', error);
    }
  }
}