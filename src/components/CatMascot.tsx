'use client';

import { motion } from 'framer-motion';

type Mood = 'happy' | 'thinking' | 'sad' | 'celebrate' | 'sleeping' | 'love' | 'study';

const CATS: Record<Mood, { emoji: string; message: string }> = {
  happy: { emoji: '😺', message: 'Мяу! Отличная работа!' },
  thinking: { emoji: '🐱', message: 'Хм, давай подумаем...' },
  sad: { emoji: '😿', message: 'Ничего, попробуем ещё раз!' },
  celebrate: { emoji: '🙀', message: 'НЕВЕРОЯТНО! Ты супер!' },
  sleeping: { emoji: '😸', message: 'Пора учить слова~' },
  love: { emoji: '😻', message: 'Я горжусь тобой!' },
  study: { emoji: '🐱', message: 'Давай учиться!' },
};

interface Props {
  mood: Mood;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export default function CatMascot({ mood, message, size = 'md', animate = true }: Props) {
  const cat = CATS[mood];
  const sizeMap = { sm: 'text-3xl', md: 'text-5xl', lg: 'text-7xl' };

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={animate ? { scale: 0, rotate: -10 } : false}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
    >
      <motion.div
        className={`${sizeMap[size]} ${animate ? 'animate-float' : ''}`}
        whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
        whileTap={{ scale: 0.9 }}
      >
        {cat.emoji}
      </motion.div>
      <motion.div
        className="glass-card rounded-2xl px-4 py-2 text-center text-sm font-medium"
        initial={animate ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {message || cat.message}
      </motion.div>
    </motion.div>
  );
}

export function CatStreak({ streak }: { streak: number }) {
  let mood: Mood = 'sleeping';
  let msg = 'Начни серию!';

  if (streak >= 30) { mood = 'celebrate'; msg = `${streak} дней! Ты легенда! 🏆`; }
  else if (streak >= 14) { mood = 'love'; msg = `${streak} дней подряд! Обожаю!`; }
  else if (streak >= 7) { mood = 'happy'; msg = `${streak} дней! Так держать!`; }
  else if (streak >= 3) { mood = 'study'; msg = `${streak} дня подряд! Мяу!`; }
  else if (streak >= 1) { mood = 'thinking'; msg = `${streak} день. Продолжай!`; }

  return <CatMascot mood={mood} message={msg} size="sm" />;
}

export function CatReaction({ correct, streak }: { correct: boolean; streak?: number }) {
  if (!correct) {
    return <CatMascot mood="sad" size="sm" animate />;
  }

  if (streak && streak >= 5) {
    return <CatMascot mood="celebrate" message="Серия правильных! 🔥" size="sm" animate />;
  }

  return <CatMascot mood="happy" size="sm" animate />;
}
