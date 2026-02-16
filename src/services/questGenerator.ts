// src/services/questGenerator.ts
import * as Haptics from 'expo-haptics';
import type { Quest } from '../store/questStore';


type QuestCategory = 'HEALTH' | 'STUDY' | 'WORK';

interface QuestSuggestion {
  title: string;
  category: QuestCategory;
}

// Predefined quest list
const QUEST_LIBRARY: QuestSuggestion[] = [
  // HEALTH quests
{ title: 'Take a 20-minute walk', category: 'HEALTH' },
{ title: 'Drink enough water today', category: 'HEALTH' },
{ title: 'Do 10 minutes of stretching', category: 'HEALTH' },
{ title: 'Eat at least one healthy meal', category: 'HEALTH' },
{ title: 'Avoid junk food today', category: 'HEALTH' },
{ title: 'Go to bed before midnight', category: 'HEALTH' },
{ title: 'Spend 10 minutes in fresh air', category: 'HEALTH' },
{ title: 'Move your body for 15 minutes', category: 'HEALTH' },
{ title: 'Take a short screen break', category: 'HEALTH' },
{ title: '10 000 steps today', category: 'HEALTH' },
{ title: 'Take a bath', category: 'HEALTH' },
{ title: 'Prepare something homemade', category: 'HEALTH' },


  // STUDY quests
{ title: 'Read 20 pages of a book', category: 'STUDY' },
{ title: 'Learn something new today', category: 'STUDY' },
{ title: 'Watch an educational video', category: 'STUDY' },
{ title: 'Write down one new idea', category: 'STUDY' },
{ title: 'Reflect on what you learned today', category: 'STUDY' },
{ title: 'Practice a skill for 20 minutes', category: 'STUDY' },
{ title: 'Listen to something educational', category: 'STUDY' },
{ title: 'Review your goals', category: 'STUDY' },
{ title: 'Research a topic you’re curious about', category: 'STUDY' },
{ title: 'Improve one small skill', category: 'STUDY' },
{ title: 'Spend time reading instead of scrolling', category: 'STUDY' },
{ title: 'Take notes on something useful', category: 'STUDY' },

  // WORK quests
{ title: 'Clear your email inbox', category: 'WORK' },
{ title: 'Plan your day', category: 'WORK' },
{ title: 'Complete one important task', category: 'WORK' },
{ title: 'Organize a small area around you', category: 'WORK' },
{ title: 'Set priorities for tomorrow', category: 'WORK' },
{ title: 'Focus without distractions for 30 minutes', category: 'WORK' },
{ title: 'Finish something you started', category: 'WORK' },
{ title: 'Review your responsibilities', category: 'WORK' },
{ title: 'Take initiative on one task', category: 'WORK' },
{ title: 'Reduce one source of clutter', category: 'WORK' },
{ title: 'Plan tomorrows quests', category: 'WORK' },
{ title: 'Make progress on a long-term goal', category: 'WORK' },
];

export async function generateQuestSuggestion(existingQuests: Quest[]): Promise<QuestSuggestion> {

  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  // Get titles of existing quests to avoid duplicates
  const existingTitles = existingQuests.map(q => q.title.toLowerCase());
  
  // Filter out quests that already exist
  const availableQuests = QUEST_LIBRARY.filter(
    quest => !existingTitles.includes(quest.title.toLowerCase())
  );
  
  // If all quests are used, reset and use the full library
  const questPool = availableQuests.length > 0 ? availableQuests : QUEST_LIBRARY;
  
  // Pick a random quest
  const randomIndex = Math.floor(Math.random() * questPool.length);
  
  return questPool[randomIndex];
}