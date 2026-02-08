// src/types/index.ts
export type AvatarType = 'AvatarNormal' | 'AvatarHappy' | 'AvatarCool' | 'AvatarSad' | 'AvatarWaiting';

export type QuestCategory = 'HEALTH' | 'STUDY' | 'WORK';

export interface Quest {
  id: string;
  title: string;
  category: QuestCategory;
  completed: boolean;
  completedAt?: number;
}

export interface Medal {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  viewedInVault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: AvatarType;
  xp: number;
  level: number;
  streak: number;
  friendCode: string;
  friends: string[];
}

export interface QuestData {
  quests: Quest[];
  totalCompletedQuests: number;
  todayCompletedCount: number;
  lastResetDate: string;
  updatedAt?: FirestoreTimestamp;
}

export interface MedalData {
  medals: Medal[];
  unviewedCount: number;
  updatedAt?: FirestoreTimestamp;
}

export interface ActivityData {
  activeDays: string[];
  lastActiveDate: string;
  updatedAt?: FirestoreTimestamp;
}

export interface UserFirestoreDoc extends Omit<User, 'id'> {
  createdAt?: FirestoreTimestamp;
  updatedAt?: FirestoreTimestamp;
}

// Firestore timestamp type
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}