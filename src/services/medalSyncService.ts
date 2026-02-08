// src/services/medalSyncService.ts
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuthStore } from '../store/authStore';
import { useMedalStore } from '../store/MedalStore';
import { Medal, MedalData } from '../types';
import { syncQueue } from './syncQueue';

/**
 * Sync medals TO Firestore (with queue)
 */
export async function syncMedalsToFirebase(): Promise<void> {
  return syncQueue.enqueue(
    async () => {
      const { currentUser, isGuest } = useAuthStore.getState();
      if (isGuest || !currentUser) {
        return;
      }

      const medalState = useMedalStore.getState();

      try {
        const medalRef = doc(db, 'medals', currentUser.id);

        const data: MedalData = {
          medals: medalState.medals,
          unviewedCount: medalState.unviewedCount,
          updatedAt: serverTimestamp() as any,
        };

        await setDoc(medalRef, data, { merge: true });

        console.log('✅ Medals synced to Firebase');
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
 * Sync medals FROM Firestore
 * Conflict resolution: Merge unlocked medals (once unlocked, always unlocked)
 */
export async function syncMedalsFromFirebase(): Promise<void> {
  const { currentUser, isGuest } = useAuthStore.getState();
  if (isGuest || !currentUser) {
    return;
  }

  try {
    const medalRef = doc(db, 'medals', currentUser.id);
    const medalDoc = await getDoc(medalRef);

    if (!medalDoc.exists()) {
      console.log('No medal data on server - pushing local data');
      await syncMedalsToFirebase();
      return;
    }

    const firebaseData = medalDoc.data() as MedalData;
    const localMedals = useMedalStore.getState().medals;

    // Merge medals: If unlocked anywhere, it's unlocked everywhere
    // Take earliest unlock timestamp
    const mergedMedals: Medal[] = localMedals.map((localMedal) => {
      const firebaseMedal = firebaseData.medals.find((m) => m.id === localMedal.id);

      if (!firebaseMedal) {
        return localMedal;
      }

      const isUnlocked = localMedal.unlocked || firebaseMedal.unlocked;
      const earliestUnlockTime = Math.min(
        localMedal.unlockedAt || Infinity,
        firebaseMedal.unlockedAt || Infinity
      );

      return {
        ...localMedal,
        unlocked: isUnlocked,
        unlockedAt: isUnlocked && earliestUnlockTime !== Infinity
          ? earliestUnlockTime
          : undefined,
        // viewedInVault is local-only, don't sync
        viewedInVault: localMedal.viewedInVault,
      };
    });

    const unviewedCount = mergedMedals.filter((m) => m.unlocked && !m.viewedInVault).length;

    useMedalStore.setState({
      medals: mergedMedals,
      unviewedCount,
    });

    console.log('✅ Medals synced from Firebase (merged)');

    // Push merged state back to Firebase
    await syncMedalsToFirebase();
  } catch (error: any) {
    if (error.code === 'unavailable') {
      console.log('⚠️ Offline - will sync medals when online');
    } else {
      console.error('❌ Error syncing medals from Firebase:', error);
    }
  }
}