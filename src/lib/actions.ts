import { db } from './db';
import { scheduleWord } from './srs';
import type { Collection, ExportData, Rating, Word, WordExample } from './types';

export async function addCollection(name: string, description = '', emoji = '📚') {
  const now = new Date();
  return db.collections.add({ name, description, emoji, createdAt: now, updatedAt: now });
}

export async function updateCollection(id: number, data: Partial<Collection>) {
  return db.collections.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteCollection(id: number) {
  await db.transaction('rw', [db.collections, db.words, db.reviewLogs], async () => {
    const wordIds = await db.words.where('collectionId').equals(id).primaryKeys();
    if (wordIds.length) await db.reviewLogs.where('wordId').anyOf(wordIds).delete();
    await db.words.where('collectionId').equals(id).delete();
    await db.collections.delete(id);
  });
}

export async function addWord(
  collectionId: number,
  word: string,
  translation: string,
  transcription = '',
  examples: WordExample[] = [],
) {
  const now = new Date();
  return db.words.add({
    collectionId,
    word,
    translation,
    transcription,
    examples,
    state: 'new',
    due: now,
    stability: 0,
    difficulty: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    createdAt: now,
    updatedAt: now,
  });
}

export async function addWords(
  collectionId: number,
  words: Array<{
    word: string;
    translation: string;
    transcription?: string;
    examples?: WordExample[];
  }>,
) {
  const now = new Date();
  const entries: Word[] = words.map((w) => ({
    collectionId,
    word: w.word,
    translation: w.translation,
    transcription: w.transcription || '',
    examples: w.examples || [],
    state: 'new' as const,
    due: now,
    stability: 0,
    difficulty: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    createdAt: now,
    updatedAt: now,
  }));
  return db.words.bulkAdd(entries);
}

export async function updateWord(
  id: number,
  data: Partial<Pick<Word, 'word' | 'translation' | 'transcription' | 'examples'>>,
) {
  return db.words.update(id, { ...data, updatedAt: new Date() });
}

export async function deleteWord(id: number) {
  await db.transaction('rw', [db.words, db.reviewLogs], async () => {
    await db.reviewLogs.where('wordId').equals(id).delete();
    await db.words.delete(id);
  });
}

export async function reviewWord(wordId: number, rating: Rating) {
  const word = await db.words.get(wordId);
  if (!word) throw new Error('Word not found');

  const now = new Date();
  const result = scheduleWord(word, rating, now);

  await db.transaction('rw', [db.words, db.reviewLogs], async () => {
    await db.words.update(wordId, {
      state: result.state,
      due: result.due,
      stability: result.stability,
      difficulty: result.difficulty,
      scheduledDays: result.scheduledDays,
      reps: result.reps,
      lapses: result.lapses,
      updatedAt: now,
    });

    await db.reviewLogs.add({
      wordId,
      collectionId: word.collectionId,
      rating,
      reviewedAt: now,
    });
  });

  return result;
}

export async function exportAllData(): Promise<string> {
  const [collections, words] = await Promise.all([
    db.collections.toArray(),
    db.words.toArray(),
  ]);
  const data: ExportData = {
    version: 2,
    app: 'wok-app',
    exportedAt: new Date().toISOString(),
    collections,
    words,
  };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonStr: string) {
  const data = JSON.parse(jsonStr);
  if (data.app !== 'wok-app') throw new Error('Неподдерживаемый формат файла');

  await db.transaction('rw', [db.collections, db.words, db.reviewLogs], async () => {
    await db.reviewLogs.clear();
    await db.words.clear();
    await db.collections.clear();

    for (const c of data.collections) {
      c.createdAt = new Date(c.createdAt);
      c.updatedAt = new Date(c.updatedAt);
    }
    for (const w of data.words) {
      w.due = new Date(w.due);
      w.createdAt = new Date(w.createdAt);
      w.updatedAt = new Date(w.updatedAt);
      if (!Array.isArray(w.examples)) w.examples = [];
    }

    await db.collections.bulkAdd(data.collections);
    await db.words.bulkAdd(data.words);
  });
}

export async function importCSV(collectionName: string, csv: string) {
  const lines = csv.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) throw new Error('CSV пуст');

  const first = lines[0].toLowerCase();
  const hasHeader = first.includes('word') || first.includes('слово');
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const colId = await addCollection(collectionName, '', '📄');
  let count = 0;

  for (const line of dataLines) {
    const sep = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
    const parts = line.split(sep).map((p) => p.trim().replace(/^"|"$/g, ''));
    if (parts.length >= 2 && parts[0] && parts[1]) {
      await addWord(colId as number, parts[0], parts[1], parts[2] || '', []);
      count++;
    }
  }

  return { collectionId: colId, count };
}
