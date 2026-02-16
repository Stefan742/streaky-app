// src/services/medalSyncService.ts
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuthStore } from '../store/authStore';
import { Medal, useMedalStore } from '../store/MedalStore';
import { MedalData } from '../types';
import { syncQueue } from './syncQueue';

/**
 * 🔥 Clean medal data - отстрани undefined вредности
 */
function cleanMedalData(medal: Medal): any {
  const cleaned: any = {
    id: medal.id,
    title: medal.title,
    description: medal.description,
    unlocked: medal.unlocked || false,
  };

  if (medal.unlockedAt !== undefined && medal.unlockedAt !== null) {
    cleaned.unlockedAt = medal.unlockedAt;
  }

  return cleaned;
}

/**
 * Sync medals TO Firestore (with queue)
 */
export async function syncMedalsToFirebase(): Promise<void> {
  return syncQueue.enqueue(
    async () => {
      const { currentUser, isGuest } = useAuthStore.getState();
      if (isGuest || !currentUser) {
        console.log('⚠️ User not logged in, skipping medal sync');
        return;
      }

      const medalState = useMedalStore.getState();

      try {
        const medalRef = doc(db, 'medals', currentUser.id);

        const cleanedMedals = medalState.medals.map(cleanMedalData);

        const data: MedalData = {
          medals: cleanedMedals,
          unviewedCount: medalState.unviewedCount,
          updatedAt: serverTimestamp() as any,
        };

        await setDoc(medalRef, data, { merge: true });

        console.log('✅ Medals synced to Firebase:', {
          count: cleanedMedals.length,
          unlocked: cleanedMedals.filter((m: any) => m.unlocked).length,
        });
      } catch (error: any) {
        if (error.code === 'unavailable') {
          console.log('⚠️ Offline - medal sync will retry');
        } else {
          console.error('❌ Error syncing medals:', error);
        }
      }
    },
    'medal-sync',
    1000
  );
}

/**
 * 🔥 Sync medals FROM Firestore
 * FIREBASE WINS за unlocked/unlockedAt
 * viewedInVault останува ЛОКАЛНО
 */
export async function syncMedalsFromFirebase(): Promise<void> {
  const { currentUser, isGuest } = useAuthStore.getState();
  if (isGuest || !currentUser) {
    console.log('⚠️ User not logged in, skipping medal sync');
    return;
  }

  try {
    const medalRef = doc(db, 'medals', currentUser.id);
    const medalDoc = await getDoc(medalRef);

    if (!medalDoc.exists()) {
      console.log('⚠️ No medal data on server - will upload local data');
      await syncMedalsToFirebase();
      return;
    }

    const firebaseData = medalDoc.data() as MedalData;
    const localMedals = useMedalStore.getState().medals;

    // 🔥 Merge Firebase data со локалниот viewedInVault
    const syncedMedals: Medal[] = localMedals.map((localMedal) => {
      const firebaseMedal = firebaseData.medals.find((m) => m.id === localMedal.id);

      if (!firebaseMedal) {
        return localMedal;
      }

      return {
        ...localMedal,
        unlocked: firebaseMedal.unlocked || false,
        unlockedAt: firebaseMedal.unlockedAt || undefined,
        viewedInVault: localMedal.viewedInVault, // 🔥 Зачувај локално
      };
    });

    const unviewedCount = syncedMedals.filter(
      (m) => m.unlocked && !m.viewedInVault
    ).length;

    useMedalStore.setState({
      medals: syncedMedals,
      unviewedCount,
    });

    console.log('✅ Medals loaded from Firebase:', {
      unlocked: syncedMedals.filter((m) => m.unlocked).length,
      unviewed: unviewedCount,
    });
  } catch (error: any) {
    if (error.code === 'unavailable') {
      console.log('⚠️ Offline - will sync medals when online');
    } else {
      console.error('❌ Error syncing medals from Firebase:', error);
    }
  }
}