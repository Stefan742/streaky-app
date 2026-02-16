// src/store/MedalStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type Medal = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  viewedInVault: boolean; // дали е видено во AchievementsScreen
};

type MedalState = {
  medals: Medal[];
  unviewedCount: number;
  unlockMedal: (id: string) => void;
  markMedalAsViewed: (id: string) => void;
  markAllAsViewed: () => void;
  getUnviewedMedals: () => Medal[];
  initializeMedals: () => Promise<void>;
  setMedals: (medals: Medal[]) => void;
};

const initialMedals: Medal[] = [
  {
    id: '1',
    title: 'First Task Completed',
    description: 'Complete your first quest',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '2',
    title: '7-Day Streak',
    description: 'Maintain a 7-day streak',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '3',
    title: 'All Features Explored',
    description: 'Try every feature in the app',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '4',
    title: 'Comeback',
    description: 'Return after a break',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '5',
    title: 'Consistent User',
    description: 'Use the app for 30 days',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '6',
    title: '30-Day Streak',
    description: 'Maintain a 30-day streak',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '7',
    title: '100 Tasks Finished',
    description: 'Complete 100 quests',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '8',
    title: 'Royal Achievement',
    description: 'Reach level 50',
    unlocked: false,
    viewedInVault: false,
  },
  {
    id: '9',
    title: 'Super Happy',
    description: 'Complete 10 quests in one day',
    unlocked: false,
    viewedInVault: false,
  },
];

// 🔥 Зачувај viewedInVault статус во AsyncStorage
async function saveViewedStatus(medals: Medal[]): Promise<void> {
  try {
    const viewedMap: Record<string, boolean> = {};
    medals.forEach((medal) => {
      if (medal.unlocked) {
        viewedMap[medal.id] = medal.viewedInVault;
      }
    });
    await AsyncStorage.setItem('medalViewedStatus', JSON.stringify(viewedMap));
    console.log('✅ Viewed status saved:', viewedMap);
  } catch (error) {
    console.error('❌ Error saving viewed status:', error);
  }
}

// 🔥 Вчитај viewedInVault статус од AsyncStorage
async function loadViewedStatus(): Promise<Record<string, boolean>> {
  try {
    const data = await AsyncStorage.getItem('medalViewedStatus');
    const viewedMap = data ? JSON.parse(data) : {};
    console.log('✅ Viewed status loaded:', viewedMap);
    return viewedMap;
  } catch (error) {
    console.error('❌ Error loading viewed status:', error);
    return {};
  }
}

export const useMedalStore = create<MedalState>((set, get) => ({
  medals: initialMedals,
  unviewedCount: 0,

  unlockMedal: (id: string) => {
    const medals = get().medals;
    const medal = medals.find((m) => m.id === id);

    if (!medal || medal.unlocked) {
      console.log(`⚠️ Medal ${id} already unlocked or not found`);
      return;
    }

    const updatedMedals = medals.map((m) =>
      m.id === id
        ? {
            ...m,
            unlocked: true,
            unlockedAt: Date.now(),
            viewedInVault: false, // 🔥 Нов medal = unseen
          }
        : m
    );

    const unviewedCount = updatedMedals.filter(
      (m) => m.unlocked && !m.viewedInVault
    ).length;

    set({ medals: updatedMedals, unviewedCount });

    console.log(`🏅 Medal ${id} unlocked! Unviewed count: ${unviewedCount}`);

    // 🔥 Зачувај viewedInVault
    saveViewedStatus(updatedMedals);
  },

  markMedalAsViewed: (id: string) => {
    const medals = get().medals;
    const medal = medals.find((m) => m.id === id);

    if (!medal || medal.viewedInVault) {
      console.log(`⚠️ Medal ${id} already viewed or not found`);
      return;
    }

    const updatedMedals = medals.map((m) =>
      m.id === id ? { ...m, viewedInVault: true } : m
    );

    const unviewedCount = updatedMedals.filter(
      (m) => m.unlocked && !m.viewedInVault
    ).length;

    set({ medals: updatedMedals, unviewedCount });

    console.log(`✅ Medal ${id} marked as viewed! Remaining: ${unviewedCount}`);

    // 🔥 Зачувај viewedInVault
    saveViewedStatus(updatedMedals);
  },

  markAllAsViewed: () => {
    const medals = get().medals;
    const updatedMedals = medals.map((m) =>
      m.unlocked ? { ...m, viewedInVault: true } : m
    );

    set({ medals: updatedMedals, unviewedCount: 0 });

    console.log('✅ All medals marked as viewed');

    // 🔥 Зачувај viewedInVault
    saveViewedStatus(updatedMedals);
  },

  getUnviewedMedals: () => {
    const { medals } = get();
    const unviewed = medals.filter((m) => m.unlocked && !m.viewedInVault);
    console.log(`📋 Unviewed medals: ${unviewed.length}`, unviewed.map(m => m.id));
    return unviewed;
  },

  setMedals: (medals: Medal[]) => {
    const unviewedCount = medals.filter(
      (m) => m.unlocked && !m.viewedInVault
    ).length;
    set({ medals, unviewedCount });
    console.log(`📝 Medals updated: ${medals.length} total, ${unviewedCount} unviewed`);
  },

  initializeMedals: async () => {
    try {
      console.log('🔄 Initializing medals...');
      
      // 🔥 Вчитај viewedInVault од AsyncStorage
      const viewedMap = await loadViewedStatus();

      const medals = initialMedals.map((medal) => ({
        ...medal,
        viewedInVault: viewedMap[medal.id] || false,
      }));

      const unviewedCount = medals.filter(
        (m) => m.unlocked && !m.viewedInVault
      ).length;

      set({ medals, unviewedCount });
      
      console.log('✅ Medals initialized:', {
        total: medals.length,
        unlocked: medals.filter(m => m.unlocked).length,
        unviewed: unviewedCount,
      });
    } catch (error) {
      console.error('❌ Error initializing medals:', error);
    }
  },
}));