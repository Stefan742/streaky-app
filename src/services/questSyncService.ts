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
        console.log('⚠️ User not logged in, skipping quest sync');
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

        console.log('✅ Quests synced to Firebase:', {
          total: questState.totalCompletedQuests,
          today: questState.todayCompletedCount,
        });
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
 * 🔥 ИСПРАВЕНО: Sync quests FROM Firestore
 * FIREBASE WINS - земај ги Firebase податоците директно
 */
export async function syncQuestsFromFirebase(): Promise<void> {
  const { currentUser, isGuest } = useAuthStore.getState();
  if (isGuest || !currentUser) {
    console.log('⚠️ User not logged in, skipping quest sync');
    return;
  }

  try {
    const questRef = doc(db, 'quests', currentUser.id);
    const questDoc = await getDoc(questRef);

    if (!questDoc.exists()) {
      console.log('⚠️ No quest data on server - will upload local data on next change');
      await syncQuestsToFirebase();
      return;
    }

    const firebaseData = questDoc.data() as QuestData;

    // 🔥 FIREBASE WINS: Земи ги Firebase податоците директно
    useQuestStore.setState({
      quests: firebaseData.quests || [],
      totalCompletedQuests: firebaseData.totalCompletedQuests || 0,
      todayCompletedCount: firebaseData.todayCompletedCount || 0,
      lastResetDate: firebaseData.lastResetDate || new Date().toISOString().split('T')[0],
    });

    console.log('✅ Quests loaded from Firebase:', {
      total: firebaseData.totalCompletedQuests,
      today: firebaseData.todayCompletedCount,
      activeQuests: firebaseData.quests.length,
    });
  } catch (error: any) {
    if (error.code === 'unavailable') {
      console.log('⚠️ Offline - will sync quests when online');
    } else {
      console.error('❌ Error syncing quests from Firebase:', error);
    }
  }
}