'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { CollectionWithCounts } from '@/lib/types';

export default function CollectionCard({ col }: { col: CollectionWithCounts }) {
  const dueTotal = col.newWords + col.dueWords;
  const progress = col.totalWords > 0
    ? Math.round(((col.totalWords - col.newWords) / col.totalWords) * 100)
    : 0;

  return (
    <Link href={`/collection?id=${col.id}`}>
      <motion.div
        whileHover={{ scale: 1.02, rotateX: 1, rotateY: -1 }}
        whileTap={{ scale: 0.98 }}
        className="glass-card tilt-3d rounded-2xl p-5 transition-all"
      >
        <div className="mb-3 flex items-start justify-between">
          <motion.span
            className="text-3xl"
            whileHover={{ scale: 1.3, rotate: 10 }}
          >
            {col.emoji}
          </motion.span>
          {dueTotal > 0 && (
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary backdrop-blur-sm">
              {dueTotal}
            </span>
          )}
        </div>

        <h3 className="mb-1 text-base font-semibold leading-tight">{col.name}</h3>

        {col.description && (
          <p className="mb-3 line-clamp-2 text-sm text-muted">{col.description}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted">
          <span>{col.totalWords} слов</span>
          {col.learnedWords > 0 && (
            <span className="text-success">{col.learnedWords} выучено</span>
          )}
        </div>

        {col.totalWords > 0 && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-border/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            />
          </div>
        )}
      </motion.div>
    </Link>
  );
}
