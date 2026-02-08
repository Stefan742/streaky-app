// src/components/AddQuestModal.tsx
import { useAudioPlayer } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView, // ✅ FIX: added to push sheet above keyboard
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const categories = ['HEALTH', 'STUDY', 'WORK'] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (title: string, category: 'HEALTH' | 'STUDY' | 'WORK') => void;
};

const categoryColors = {
  HEALTH: { bg: '#D1FAE5', text: '#065F46' },
  STUDY:  { bg: '#E0E7FF', text: '#3730A3' },
  WORK:   { bg: '#FFE4B5', text: '#92400E' },
};

export default function AddQuestModal({ visible, onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'HEALTH' | 'STUDY' | 'WORK'>('HEALTH');

  const player = useAudioPlayer(require('../../assets/sounds/task_created.mp3'));

  const handleCreate = () => {
    if (title.trim().length === 0) return;
    onCreate(title.trim(), category);
    setTitle('');
    try {
              
      player.seekTo(0);
      player.play();
    } catch (error) {
      console.log('Audio playback skipped:', error);
      // Continue without audio - not critical
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>

        {/* Tap outside to dismiss */}
        <TouchableOpacity style={styles.backdropTap} onPress={onClose} activeOpacity={1} />

        {/* ✅ FIX: KeyboardAvoidingView wraps the sheet so it slides up
            above the keyboard on both iOS and Android */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kavWrapper}
        >
          <View style={styles.sheet}>
            {/* Drag handle */}
            <View style={styles.handle} />

            {/* Title row */}
            <View style={styles.titleRow}>
              <Text style={styles.sheetTitle}>New Quest</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Input */}
            <TextInput
              style={styles.input}
              placeholder="What do you want to accomplish?"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              autoFocus
              maxLength={60}
            />

            {/* Category pills */}
            <Text style={styles.labelCategory}>Category</Text>
            <View style={styles.categoryRow}>
              {categories.map((c) => {
                const selected = category === c;
                const colors = categoryColors[c];
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCategory(c)}
                    activeOpacity={0.7}
                    style={[
                      styles.categoryPill,
                      { backgroundColor: selected ? colors.bg : '#F3F4F6' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        {
                          color: selected ? colors.text : '#6B7280',
                          fontWeight: selected ? '700' : '500',
                        },
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Create button */}
            <TouchableOpacity
              onPress={handleCreate}
              activeOpacity={title.trim().length === 0 ? 1 : 0.7}
              disabled={title.trim().length === 0}
              style={styles.createWrapper}
            >
              <LinearGradient
                colors={
                  title.trim().length > 0
                    ? ['#40b8a5', '#6ff0d1']
                    : ['#C4C9D4', '#C4C9D4']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createBtn}
              >
                <Text style={styles.createBtnText}>Create Quest</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  /* ---- Backdrop ---- */
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    flex: 1,
  },

  /* ---- KeyboardAvoidingView needs full width ---- */
  kavWrapper: {
    width: '100%',
  },

  /* ---- Bottom Sheet ---- */
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 12,
  },

  /* ---- Handle ---- */
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 18,
  },

  /* ---- Title + Close ---- */
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  closeBtn: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  /* ---- TextInput ---- */
  input: {
    height: 52,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
    marginBottom: 22,
  },

  /* ---- Category ---- */
  labelCategory: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  categoryPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 14,
  },
  categoryPillText: {
    fontSize: 13,
    letterSpacing: 0.3,
  },

  /* ---- Create Button ---- */
  createWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  createBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 16,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});