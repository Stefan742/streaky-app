// src/screens/AchievementsScreen.tsx
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import MedalUnlockAnimation from '../components/MedalUnlockAnimation';
import { Medal, useMedalStore } from '../store/MedalStore';

// Medal SVG imports
import Medal100Task from '../../assets/medals/medal_100taskFinished.svg';
import Medal30Day from '../../assets/medals/medal_30dayStreak.svg';
import Medal7Day from '../../assets/medals/medal_7dayStreak.svg';
import MedalAllFeatures from '../../assets/medals/medal_allFeatures.svg';
import MedalComeback from '../../assets/medals/medal_comeback.svg';
import MedalConsistents from '../../assets/medals/medal_consistent.svg';
import MedalFirstTask from '../../assets/medals/medal_firstTask.svg';
import MedalRoyal from '../../assets/medals/medal_royal.svg';
import MedalSuperHappy from '../../assets/medals/medal_superHappy.svg';

const medalIcons: { [key: string]: any } = {
  '1': MedalFirstTask,
  '2': Medal7Day,
  '3': MedalAllFeatures,
  '4': MedalComeback,
  '5': MedalConsistents,
  '6': Medal30Day,
  '7': Medal100Task,
  '8': MedalRoyal,
  '9': MedalSuperHappy,
};

export default function AchievementsScreen() {
  const medals = useMedalStore((state) => state.medals);
  const getUnviewedMedals = useMedalStore((state) => state.getUnviewedMedals);
  const markMedalAsViewed = useMedalStore((state) => state.markMedalAsViewed);

  const [showingUnlock, setShowingUnlock] = useState(false);
  const [currentUnlockIndex, setCurrentUnlockIndex] = useState(0);
  const [unviewedMedals, setUnviewedMedals] = useState<Medal[]>([]); // 🔥 Променето од any[] на Medal[]

  const totalUnlocked = medals.filter((m) => m.unlocked).length;

  useEffect(() => {
    // 🔥 Провери за unseen medals кога се отвора screen-от
    console.log('📱 AchievementsScreen opened');
    const unviewed = getUnviewedMedals();
    console.log('🎖️ Unviewed medals found:', unviewed.length, unviewed.map(m => m.title));
    
    if (unviewed.length > 0) {
      setUnviewedMedals(unviewed);
      setShowingUnlock(true);
      setCurrentUnlockIndex(0);
    } else {
      setShowingUnlock(false);
    }
  }, []);

  const handleUnlockComplete = () => {
    const currentMedal = unviewedMedals[currentUnlockIndex];
    console.log('✅ Marking medal as viewed:', currentMedal.title);
    
    // Mark current medal as viewed
    markMedalAsViewed(currentMedal.id);

    // Check if there are more unviewed medals
    if (currentUnlockIndex < unviewedMedals.length - 1) {
      console.log('📋 Showing next medal:', currentUnlockIndex + 1);
      setCurrentUnlockIndex(currentUnlockIndex + 1);
    } else {
      // All done
      console.log('✅ All medals viewed!');
      setShowingUnlock(false);
      setUnviewedMedals([]);
      setCurrentUnlockIndex(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>THE VAULT</Text>

        <View style={styles.totalWrapper}>
          <Text style={styles.totalLabel}>TOTAL MEDALS:</Text>
          <Text style={styles.totalNumber}>{totalUnlocked}</Text>
        </View>
      </View>

      {/* Medal grid */}
      <View style={styles.medalCardContainer}>
        <View style={styles.medalCard}>
          <FlatList
            data={medals}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.row}
            renderItem={({ item }) => {
              const MedalIcon = medalIcons[item.id];
              return (
                <View style={[styles.medalItem, !item.unlocked && styles.medalItemLocked]}>
                  <View
                    style={[styles.iconWrapper, !item.unlocked && styles.iconWrapperLocked]}
                  >
                    <MedalIcon width={200} height={200} />
                  </View>
                  <Text
                    style={[styles.medalTitle, !item.unlocked && styles.medalTitleLocked]}
                  >
                    {item.title}
                  </Text>
                </View>
              );
            }}
          />
        </View>
      </View>

      {/* 🔥 Unlock animation overlay - ИСПРАВЕНО */}
      {showingUnlock && unviewedMedals.length > 0 && unviewedMedals[currentUnlockIndex] && (
        <MedalUnlockAnimation
          visible={true}
          medal={unviewedMedals[currentUnlockIndex]}
          onClose={handleUnlockComplete}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#40b8a5',
  },

  // Header
  headerContent: {
    paddingTop: 50,
    paddingBottom: 35,
    paddingHorizontal: 20,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.8,
  },
  totalWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 10,
  },
  totalNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  medalCardContainer: {
    paddingHorizontal: 10,
    paddingTop: 20,
    paddingBottom: 30,
  },

  medalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingVertical: 28,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(200, 200, 220, 0.15)',
  },

  listContent: {
    paddingBottom: 120,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 32,
  },

  /* ---- Unlocked medal (default) ---- */
  medalItem: {
    alignItems: 'center',
    width: '48%',
  },

  iconWrapper: {
    marginBottom: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  medalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: -24,
  },

  /* ---- Locked medal overrides ---- */
  medalItemLocked: {
    opacity: 0.45,
  },

  iconWrapperLocked: {
    // Locked styling
  },

  medalTitleLocked: {
    color: '#45474c',
  },
});