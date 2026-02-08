//XPBar
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useUserStore } from '../store/userStore';

const XPBar = () => {
  const { xp = 0, level = 1 } = useUserStore();
  const currentXp = xp % 500;
  const progress = currentXp / 500;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.level}>Level {level}</Text>

      <View style={styles.bar}>
        <LinearGradient
          colors={['#40b8a5', '#6ff0d1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${progress * 100}%` }]}
        />
        <View style={styles.innerBorder} />
      </View>

      <Text style={styles.xpRow}>
        <Text style={styles.xpCurrent}>{currentXp} / 500 XP</Text>
      </Text>

      <Text style={styles.hint}>Complete 1 quest to level up.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 2,
  },

  level: {
    fontWeight: '800',
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },

  bar: {
    height: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },

  fill: {
    height: '100%',
    borderRadius: 6,
  },

  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },

  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  xpCurrent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  hint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

export default XPBar;