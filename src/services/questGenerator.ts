// src/services/questGenerator.ts
import type { Quest } from '../store/questStore';

type QuestCategory = 'HEALTH' | 'STUDY' | 'WORK';

interface QuestSuggestion {
  title: string;
  category: QuestCategory;
}

// Predefined quest list
const QUEST_LIBRARY: QuestSuggestion[] = [
  // HEALTH quests
  { title: '30-minute morning jog', category: 'HEALTH' },
  { title: 'Drink 8 glasses of water', category: 'HEALTH' },
  { title: '15-minute yoga session', category: 'HEALTH' },
  { title: '10,000 steps today', category: 'HEALTH' },
  { title: 'Stretch for 10 minutes', category: 'HEALTH' },
  { title: 'Prepare a healthy meal', category: 'HEALTH' },
  { title: '20 push-ups', category: 'HEALTH' },
  { title: '7-8 hours of sleep', category: 'HEALTH' },
  { title: 'Meditate for 10 minutes', category: 'HEALTH' },
  { title: 'Evening walk after dinner', category: 'HEALTH' },
  { title: 'No sugary drinks today', category: 'HEALTH' },
  { title: 'Take the stairs instead of elevator', category: 'HEALTH' },

  // STUDY quests
  { title: 'Read 20 pages of a book', category: 'STUDY' },
  { title: 'Complete one online course lesson', category: 'STUDY' },
  { title: 'Learn 10 new vocabulary words', category: 'STUDY' },
  { title: 'Practice coding for 30 minutes', category: 'STUDY' },
  { title: 'Watch an educational video', category: 'STUDY' },
  { title: 'Review notes from yesterday', category: 'STUDY' },
  { title: 'Solve 5 math problems', category: 'STUDY' },
  { title: 'Write a summary of what you learned', category: 'STUDY' },
  { title: 'Practice a musical instrument for 20 minutes', category: 'STUDY' },
  { title: 'Learn a new skill for 15 minutes', category: 'STUDY' },
  { title: 'Listen to an educational podcast', category: 'STUDY' },
  { title: 'Study a foreign language for 30 minutes', category: 'STUDY' },

  // WORK quests
  { title: 'Clear your email inbox', category: 'WORK' },
  { title: 'Organize your workspace', category: 'WORK' },
  { title: 'Plan tomorrow\'s tasks', category: 'WORK' },
  { title: 'Complete one important project task', category: 'WORK' },
  { title: 'Update your to-do list', category: 'WORK' },
  { title: 'Have a focused 2-hour work session', category: 'WORK' },
  { title: 'Review and respond to messages', category: 'WORK' },
  { title: 'Back up important files', category: 'WORK' },
  { title: 'Organize digital documents', category: 'WORK' },
  { title: 'Reach out to a colleague or client', category: 'WORK' },
  { title: 'Complete pending administrative tasks', category: 'WORK' },
  { title: 'Brainstorm ideas for a project', category: 'WORK' },
];

export async function generateQuestSuggestion(existingQuests: Quest[]): Promise<QuestSuggestion> {
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