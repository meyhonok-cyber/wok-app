import type { Rating, Word, WordState } from './types';

const DECAY = -0.5;
const FACTOR = 19 / 81;

const W = [
  0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046,
  1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315,
  2.9898, 0.51655, 0.6621,
];

const DESIRED_RETENTION = 0.9;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function retrievability(elapsed: number, stability: number) {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * elapsed) / stability, DECAY);
}

function initDifficulty(rating: Rating): number {
  return clamp(W[4] - Math.exp(W[5] * (rating - 1)) + 1, 1, 10);
}

function initStability(rating: Rating): number {
  return Math.max(W[rating - 1], 0.1);
}

function nextInterval(stability: number): number {
  return Math.max(
    1,
    Math.round((stability / FACTOR) * (Math.pow(DESIRED_RETENTION, 1 / DECAY) - 1)),
  );
}

export interface ScheduleResult {
  state: WordState;
  due: Date;
  stability: number;
  difficulty: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
}

export function scheduleWord(
  word: Word,
  rating: Rating,
  now = new Date(),
): ScheduleResult {
  const elapsed =
    word.state === 'new'
      ? 0
      : Math.max(
          0,
          (now.getTime() - new Date(word.due).getTime()) / 86400000 +
            word.scheduledDays,
        );

  let s: number;
  let d: number;
  let state: WordState;
  let days: number;
  let lapses = word.lapses;

  if (word.state === 'new') {
    d = initDifficulty(rating);
    s = initStability(rating);

    if (rating === 1) {
      state = 'learning';
      days = 0;
    } else {
      state = 'review';
      days = nextInterval(s);
    }
  } else {
    const r = retrievability(elapsed, word.stability);

    const d0ForGood = initDifficulty(3);
    d = clamp(
      W[7] * d0ForGood + (1 - W[7]) * (word.difficulty - W[6] * (rating - 3)),
      1,
      10,
    );

    if (rating === 1) {
      s =
        W[11] *
        Math.pow(word.difficulty, -W[12]) *
        (Math.pow(word.stability + 1, W[13]) - 1) *
        Math.exp((1 - r) * W[14]);
      state = 'learning';
      days = 0;
      lapses++;
    } else {
      const hardPenalty = rating === 2 ? W[15] : 1;
      const easyBonus = rating === 4 ? W[16] : 1;
      s =
        word.stability *
        (1 +
          Math.exp(W[8]) *
            (11 - word.difficulty) *
            Math.pow(word.stability, -W[9]) *
            (Math.exp((1 - r) * W[10]) - 1) *
            hardPenalty *
            easyBonus);
      state = 'review';
      days = nextInterval(s);
    }
  }

  const due = new Date(now);
  if (days === 0) {
    due.setMinutes(due.getMinutes() + 1);
  } else {
    due.setDate(due.getDate() + days);
    due.setHours(4, 0, 0, 0);
  }

  return {
    state,
    due,
    stability: s,
    difficulty: d,
    scheduledDays: days,
    reps: word.reps + 1,
    lapses,
  };
}

export function isDue(word: Word, now = new Date()): boolean {
  if (word.state === 'new') return true;
  return new Date(word.due) <= now;
}

export function formatInterval(days: number): string {
  if (days === 0) return 'сейчас';
  if (days === 1) return '1 день';
  if (days < 5) return `${days} дня`;
  if (days < 21) return `${days} дней`;
  if (days < 30) {
    const m = days % 10;
    return `${days} ${m === 1 ? 'день' : m < 5 && m > 0 ? 'дня' : 'дней'}`;
  }
  if (days < 365) return `${Math.round(days / 30)} мес.`;
  return `${(days / 365).toFixed(1)} г.`;
}
