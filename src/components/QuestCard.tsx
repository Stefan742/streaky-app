// src/components/QuestCard.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CompletedIcon from '../../assets/icons/icon_completed.svg';

// Category icons
import BookIcon from '../../assets/icons/icon_book.svg';
import LaptopIcon from '../../assets/icons/icon_laptop.svg';
import ShoeIcon from '../../assets/icons/icon_shoe.svg';

type Props = {
  id: string;
  title: string;
  category: 'HEALTH' | 'STUDY' | 'WORK';
  completed?: boolean;
  onPress: () => void;
  onComplete?: () => void;
};

const colors = {
  HEALTH: '#D1FAE5',
  STUDY: '#E0E7FF',
  WORK: '#FFE4B5',
};

// ✅ Removed the stray Quest / QuestCategory / QuestStore type definitions
//    that were copy-pasted in here by mistake — those live in questStore.ts only.

export default function QuestCard({ title, category, completed, onPress, onComplete }: Props) {
  const categoryIcons = {
    HEALTH: <ShoeIcon width={60} height={40} />,
    STUDY: <BookIcon width={60} height={40} />,
    WORK: <LaptopIcon width={60} height={40} />,
  };

  return (
    <View style={[styles.card, completed && styles.cardCompleted]}>
      {/* +20 XP badge — only shows when completed */}
      {completed && (
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>+50 XP</Text>
        </View>
      )}

      <View style={styles.row}>
        {/* Left: Icon + Title + Category Badge */}
        <View style={styles.leftContent}>
          <View style={styles.iconWrap}>
            {categoryIcons[category]}
          </View>

          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
              <Text style={styles.title}>{title}</Text>
            </TouchableOpacity>

            <View style={[styles.badge, { backgroundColor: colors[category] }]}>
              <Text style={styles.badgeText}>{category}</Text>
            </View>
          </View>
        </View>

        {/* Right: Complete toggle */}
        <TouchableOpacity onPress={onComplete} activeOpacity={0.8} style={styles.completeBtn}>
          {completed ? (
            <CompletedIcon width={54} height={54} />
          ) : (
            <View style={styles.circle} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'visible',
  },

  cardCompleted: {
    backgroundColor: '#f0fdf7',
  },

  /* ---- +20 XP Badge (top-right corner) ---- */
  xpBadge: {
    position: 'absolute',
    top: 0,
    right: 5,
    backgroundColor: '#40b8a5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    zIndex: 2,
  },

  xpBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  /* ---- Row ---- */
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconWrap: {
    marginRight: 10,
  },

  /* ---- Category badge ---- */
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },

  /* ---- Title ---- */
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },

  /* ---- Complete button ---- */
  completeBtn: {
    marginLeft: 12,
  },

  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#C4C9D4',
    backgroundColor: '#fff',
  },
});