// src/services/questSyncService.ts
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuthStore } from '../store/authStore';
import { useQuestStore } from '../store/questStore';
import { QuestData } from '../types';
import { syncQueue } from './syncQueue';

/**
 * Sync quests TO Firestore (with queue)
 */
export async function syncQuestsToFirebase(): Promise<void> {
  return syncQueue.enqueue(
    async () => {
      const { currentUser, isGuest } = useAuthStore.getState();
      if (isGuest || !currentUser) {
        return;
      }

      const questState = useQuestStore.getState();

      try {
        const questRef = doc(db, 'quests', currentUser.id);

        const data: QuestData = {
          quests: questState.quests,
          totalCompletedQuests: questState.totalCompletedQuests,
          todayCompletedCount: questState.todayCompletedCount,
          lastResetDate: questState.lastResetDate,
          updatedAt: serverTimestamp() as any,
        };

        await setDoc(questRef, data, { merge: true });

        console.log('✅ Quests synced to Firebase');
      } catch (error: any) {
        if (error.code === 'unavailable') {
          console.log('⚠️ Offline - quest sync will retry');
        } else {
          console.error('❌ Error syncing quests:', error);
        }
      }
    },
    'quest-sync',
    1000
  );
}

/**
 * Sync quests FROM Firestore
 * Conflict resolution: Use totalCompletedQuests to determine authoritative source
 */
export async function syncQuestsFromFirebase(): Promise<void> {
  const { currentUser, isGuest } = useAuthStore.getState();
  if (isGuest || !currentUser) {
    return;
  }

  try {
    const questRef = doc(db, 'quests', currentUser.id);
    const questDoc = await getDoc(questRef);

    if (!questDoc.exists()) {
      console.log('No quest data on server - pushing local data');
      await syncQuestsToFirebase();
      return;
    }

    const firebaseData = questDoc.data() as QuestData;
    const localData = useQuestStore.getState();

    // Conflict resolution: Take higher totalCompletedQuests
    // Users cannot lose completed quests
    if (firebaseData.totalCompletedQuests > localData.totalCompletedQuests) {
      useQuestStore.setState({
        quests: firebaseData.quests,
        totalCompletedQuests: firebaseData.totalCompletedQuests,
        todayCompletedCount: firebaseData.todayCompletedCount,
        lastResetDate: firebaseData.lastResetDate,
      });

      console.log('✅ Quests synced from Firebase (server had more completions)');
    } else if (localData.totalCompletedQuests > firebaseData.totalCompletedQuests) {
      console.log('⚠️ Local quests ahead of server - pushing to Firebase');
      await syncQuestsToFirebase();
    } else {
      console.log('✅ Quests are in sync');
    }
  } catch (error: any) {
    if (error.code === 'unavailable') {
      console.log('⚠️ Offline - will sync quests when online');
    } else {
      console.error('❌ Error syncing quests from Firebase:', error);
    }
  }
}