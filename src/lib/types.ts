export type WordState = 'new' | 'learning' | 'review';
export type Rating = 1 | 2 | 3 | 4;

export const RATING_META: Record<Rating, { label: string; color: string; bg: string }> = {
  1: { label: 'Не помню', color: 'text-white', bg: 'bg-danger' },
  2: { label: 'Плохо', color: 'text-white', bg: 'bg-warning' },
  3: { label: 'Хорошо', color: 'text-white', bg: 'bg-emerald-400' },
  4: { label: 'Отлично', color: 'text-white', bg: 'bg-success' },
};

export interface Collection {
  id?: number;
  name: string;
  description: string;
  emoji: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WordExample {
  en: string;
  ru: string;
}

export interface Word {
  id?: number;
  collectionId: number;
  word: string;
  translation: string;
  transcription: string;
  examples: WordExample[];
  state: WordState;
  due: Date;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewLog {
  id?: number;
  wordId: number;
  collectionId: number;
  rating: Rating;
  reviewedAt: Date;
}

export interface CollectionWithCounts extends Collection {
  totalWords: number;
  newWords: number;
  dueWords: number;
  learnedWords: number;
}

export interface ExportData {
  version: 2;
  app: 'wok-app';
  exportedAt: string;
  collections: Collection[];
  words: Word[];
}
