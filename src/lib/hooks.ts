'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { isDue } from './srs';
import type { CollectionWithCounts } from './types';

export function useCollections(): CollectionWithCounts[] | undefined {
  return useLiveQuery(async () => {
    const collections = await db.collections.orderBy('createdAt').reverse().toArray();
    const now = new Date();
    return Promise.all(
      collections.map(async (col) => {
        const words = await db.words.where('collectionId').equals(col.id!).toArray();
        return {
          ...col,
          totalWords: words.length,
          newWords: words.filter((w) => w.state === 'new').length,
          dueWords: words.filter((w) => w.state !== 'new' && isDue(w, now)).length,
          learnedWords: words.filter((w) => w.state === 'review' && w.scheduledDays >= 21).length,
        };
      }),
    );
  });
}

export function useCollection(id: number) {
  return useLiveQuery(() => db.collections.get(id), [id]);
}

export function useCollectionWords(collectionId: number) {
  return useLiveQuery(
    () => db.words.where('collectionId').equals(collectionId).toArray(),
    [collectionId],
  );
}

export function useAllWords() {
  return useLiveQuery(() => db.words.toArray());
}

export function useAllNewWords() {
  return useLiveQuery(async () => {
    return db.words.where('state').equals('new').toArray();
  });
}

export function useAllDueWords() {
  return useLiveQuery(async () => {
    const words = await db.words.toArray();
    const now = new Date();
    return words.filter((w) => w.state !== 'new' && isDue(w, now));
  });
}

export function useDueWords(collectionId: number) {
  return useLiveQuery(async () => {
    const words = await db.words.where('collectionId').equals(collectionId).toArray();
    const now = new Date();
    return words.filter((w) => isDue(w, now)).sort((a, b) => {
      const order = { learning: 0, new: 1, review: 2 };
      return order[a.state] - order[b.state];
    });
  }, [collectionId]);
}

export function useGlobalCounts() {
  return useLiveQuery(async () => {
    const words = await db.words.toArray();
    const now = new Date();
    return {
      total: words.length,
      newCount: words.filter((w) => w.state === 'new').length,
      dueCount: words.filter((w) => w.state !== 'new' && isDue(w, now)).length,
      learnedCount: words.filter((w) => w.state === 'review').length,
      masteredCount: words.filter((w) => w.state === 'review' && w.scheduledDays >= 21).length,
    };
  });
}

export function useTodayStats() {
  return useLiveQuery(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await db.reviewLogs.where('reviewedAt').aboveOrEqual(today).toArray();
    const totalWords = await db.words.count();
    const learnedWords = await db.words.filter((w) => w.state === 'review').count();

    let streak = 0;
    const allLogs = await db.reviewLogs.orderBy('reviewedAt').reverse().toArray();
    if (allLogs.length > 0) {
      const days = new Set<string>();
      for (const log of allLogs) {
        days.add(new Date(log.reviewedAt).toISOString().split('T')[0]);
      }
      const check = new Date();
      check.setHours(0, 0, 0, 0);
      if (!days.has(check.toISOString().split('T')[0])) {
        check.setDate(check.getDate() - 1);
      }
      while (days.has(check.toISOString().split('T')[0])) {
        streak++;
        check.setDate(check.getDate() - 1);
      }
    }

    const wordsLearnedToday = new Set(
      logs.filter((l) => l.rating >= 3).map((l) => l.wordId),
    ).size;

    return {
      reviewsToday: logs.length,
      wordsLearnedToday,
      streak,
      totalWords,
      learnedWords,
    };
  });
}

export function useReviewHistory(days = 14) {
  return useLiveQuery(async () => {
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);

    const logs = await db.reviewLogs.where('reviewedAt').aboveOrEqual(start).toArray();
    const byDay: Record<string, { date: string; total: number; good: number }> = {};

    for (let i = 0; i <= days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - i));
      const key = d.toISOString().split('T')[0];
      byDay[key] = { date: key, total: 0, good: 0 };
    }

    for (const log of logs) {
      const key = new Date(log.reviewedAt).toISOString().split('T')[0];
      if (byDay[key]) {
        byDay[key].total++;
        if (log.rating >= 3) byDay[key].good++;
      }
    }

    return Object.values(byDay);
  }, [days]);
}

export function useMonthlyStats(year: number, month: number) {
  return useLiveQuery(async () => {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);

    const logs = await db.reviewLogs
      .where('reviewedAt')
      .between(start, end, true, false)
      .toArray();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const byDay: Array<{ day: number; total: number; good: number }> = [];

    for (let d = 1; d <= daysInMonth; d++) {
      byDay.push({ day: d, total: 0, good: 0 });
    }

    for (const log of logs) {
      const day = new Date(log.reviewedAt).getDate();
      byDay[day - 1].total++;
      if (log.rating >= 3) byDay[day - 1].good++;
    }

    const totalReviews = logs.length;
    const goodReviews = logs.filter((l) => l.rating >= 3).length;
    const uniqueWords = new Set(logs.map((l) => l.wordId)).size;

    return { byDay, totalReviews, goodReviews, uniqueWords };
  }, [year, month]);
}

export function useYearlyStats(year: number) {
  return useLiveQuery(async () => {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const logs = await db.reviewLogs
      .where('reviewedAt')
      .between(start, end, true, false)
      .toArray();

    const byMonth: Array<{ month: number; total: number; good: number; words: number }> = [];

    for (let m = 0; m < 12; m++) {
      const monthLogs = logs.filter((l) => new Date(l.reviewedAt).getMonth() === m);
      byMonth.push({
        month: m,
        total: monthLogs.length,
        good: monthLogs.filter((l) => l.rating >= 3).length,
        words: new Set(monthLogs.map((l) => l.wordId)).size,
      });
    }

    return byMonth;
  }, [year]);
}
