import Dexie, { type Table } from 'dexie';
import type { Collection, ReviewLog, Word } from './types';

class AppDB extends Dexie {
  collections!: Table<Collection>;
  words!: Table<Word>;
  reviewLogs!: Table<ReviewLog>;

  constructor() {
    super('WokApp');

    this.version(1).stores({
      collections: '++id, name, createdAt',
      words: '++id, collectionId, state, due, createdAt',
      reviewLogs: '++id, wordId, collectionId, reviewedAt',
    });

    this.version(2)
      .stores({
        collections: '++id, name, createdAt',
        words: '++id, collectionId, state, due, createdAt',
        reviewLogs: '++id, wordId, collectionId, reviewedAt',
      })
      .upgrade((tx) => {
        tx.table('words')
          .toCollection()
          .modify((word: Record<string, unknown>) => {
            if (!Array.isArray(word.examples)) {
              const examples: Array<{ en: string; ru: string }> = [];
              if (word.example) {
                examples.push({
                  en: String(word.example),
                  ru: String(word.exampleTranslation || ''),
                });
              }
              word.examples = examples;
              delete word.example;
              delete word.exampleTranslation;
            }
          });

        tx.table('reviewLogs')
          .toCollection()
          .modify((log: Record<string, unknown>) => {
            if ('remembered' in log) {
              log.rating = log.remembered ? 3 : 1;
              delete log.remembered;
            }
          });
      });
  }
}

export const db = new AppDB();
