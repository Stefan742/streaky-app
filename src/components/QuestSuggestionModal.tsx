// src/components/QuestSuggestionModal.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Category icons
import BookIcon from '../../assets/icons/icon_book.svg';
import LaptopIcon from '../../assets/icons/icon_laptop.svg';
import ShoeIcon from '../../assets/icons/icon_shoe.svg';

type Props = {
  visible: boolean;
  quest: { title: string; category: 'HEALTH' | 'STUDY' | 'WORK' } | null;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate: () => void;
};

const colors = {
  HEALTH: '#D1FAE5',
  STUDY: '#E0E7FF',
  WORK: '#FFE4B5',
};

const QuestSuggestionModal = ({ visible, quest, onAccept, onReject, onRegenerate }: Props) => {

  if (!quest) return null;

  const categoryIcons = {
    HEALTH: <ShoeIcon width={80} height={60} />,
    STUDY: <BookIcon width={80} height={60} />,
    WORK: <LaptopIcon width={80} height={60} />,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onReject}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>✨ Quest Suggestion</Text>
          
          <View style={[styles.questPreview, { backgroundColor: colors[quest.category] }]}>
            <View style={styles.iconContainer}>
              {categoryIcons[quest.category]}
            </View>
            
            <Text style={styles.questTitle}>{quest.title}</Text>
            
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{quest.category}</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>Add this quest to your list?</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={onRegenerate}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>🔄 New Idea</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.rejectButton} 
              onPress={onReject}
              activeOpacity={0.7}
            >
              <Text style={styles.rejectButtonText}>Skip</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={onAccept}
            activeOpacity={0.8}
            style={styles.acceptButtonWrapper}
          >
            <LinearGradient
              colors={['#40b8a5', '#6ff0d1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.acceptButton}
            >
         
              <Text style={styles.acceptButtonText}>✓ Add Quest</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  questPreview: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 12,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  acceptButtonWrapper: {
    width: '100%',
  },
  acceptButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#40b8a5',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
});

export default QuestSuggestionModal;