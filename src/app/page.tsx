'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ClientLayout from './client-layout';
import CollectionCard from '@/components/CollectionCard';
import CreateCollectionModal from '@/components/CreateCollectionModal';
import { CatStreak } from '@/components/CatMascot';
import { useCollections, useTodayStats, useGlobalCounts } from '@/lib/hooks';
import { Plus, Flame, BookOpen, Trophy, GraduationCap, RotateCcw, Sparkles } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
} as const;
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

function HomePage() {
  const collections = useCollections();
  const stats = useTodayStats();
  const counts = useGlobalCounts();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="bg-mesh min-h-screen">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <motion.div variants={container} initial="hidden" animate="show">
          {/* Header */}
          <motion.header variants={item} className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-extrabold text-transparent">
                WOK
              </h1>
              <p className="text-sm text-muted">Учи слова каждый день</p>
            </div>
            {stats && stats.streak > 0 && (
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center gap-1.5 rounded-full glass px-3 py-1.5"
              >
                <Flame size={18} className="text-warning" />
                <span className="text-sm font-bold">{stats.streak}</span>
              </motion.div>
            )}
          </motion.header>

          {/* Cat mascot */}
          {stats && (
            <motion.div variants={item} className="mb-5 flex justify-center">
              <CatStreak streak={stats.streak} />
            </motion.div>
          )}

          {/* Motivational banner */}
          {stats && stats.wordsLearnedToday > 0 && (
            <motion.div
              variants={item}
              className="mb-5 overflow-hidden rounded-3xl bg-gradient-to-r from-success to-emerald-400 p-5 text-white shadow-lg glow-success"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 14, -14, 0] }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-3xl"
                >
                  🎉
                </motion.div>
                <div>
                  <div className="text-sm font-medium opacity-90">Вы молодец!</div>
                  <div className="text-lg font-bold">
                    Сегодня выучено {stats.wordsLearnedToday}{' '}
                    {stats.wordsLearnedToday === 1 ? 'слово' : stats.wordsLearnedToday < 5 ? 'слова' : 'слов'}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats cards */}
          {stats && (
            <motion.div variants={item} className="mb-6 grid grid-cols-3 gap-3">
              {[
                { icon: Flame, value: stats.streak, label: 'дней', color: 'text-warning' },
                { icon: BookOpen, value: stats.reviewsToday, label: 'сегодня', color: 'text-primary' },
                { icon: Trophy, value: stats.learnedWords, label: 'выучено', color: 'text-success' },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, rotateY: 5 }}
                  className="glass-card tilt-3d rounded-2xl p-3.5 text-center"
                >
                  <s.icon size={18} className={`mx-auto mb-1 ${s.color}`} />
                  <div className="text-lg font-bold">{s.value}</div>
                  <div className="text-[10px] text-muted">{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Main study buttons */}
          {counts && (
            <motion.div variants={item} className="mb-6 space-y-3">
              {counts.newCount > 0 && (
                <Link href="/study?mode=new">
                  <motion.div
                    whileHover={{ scale: 1.02, rotateX: 1 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-primary via-indigo-500 to-accent p-5 text-white shadow-xl glow-primary"
                  >
                    <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                      <GraduationCap size={28} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-lg font-bold">
                        Учить новые слова
                        <Sparkles size={16} className="opacity-80" />
                      </div>
                      <div className="text-sm opacity-90">{counts.newCount} новых слов</div>
                    </div>
                  </motion.div>
                </Link>
              )}

              {counts.dueCount > 0 && (
                <Link href="/study?mode=review">
                  <motion.div
                    whileHover={{ scale: 1.02, rotateX: 1 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-amber-500 to-warning p-5 text-white shadow-xl"
                  >
                    <div className="rounded-2xl bg-white/20 p-3 backdrop-blur-sm">
                      <RotateCcw size={28} />
                    </div>
                    <div className="flex-1">
                      <div className="text-lg font-bold">Повторение</div>
                      <div className="text-sm opacity-90">{counts.dueCount} слов к повторению</div>
                    </div>
                  </motion.div>
                </Link>
              )}

              {counts.newCount === 0 && counts.dueCount === 0 && counts.total > 0 && (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="glass-card rounded-3xl px-6 py-8 text-center"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mb-3 text-5xl"
                  >
                    😸
                  </motion.div>
                  <p className="text-lg font-semibold text-success">Все слова повторены!</p>
                  <p className="text-sm text-muted">Котик доволен. Возвращайтесь позже!</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Collections */}
          <motion.div variants={item} className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Коллекции</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-xl glass px-3.5 py-2 text-sm font-medium text-primary"
            >
              <Plus size={16} />
              Новая
            </motion.button>
          </motion.div>

          {collections === undefined ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : collections.length === 0 ? (
            <motion.div variants={item} className="glass-card rounded-3xl px-6 py-12 text-center">
              <div className="mb-3 text-4xl">🐱</div>
              <p className="mb-2 text-lg font-medium">Пока пусто</p>
              <p className="mb-4 text-sm text-muted">Создайте первую коллекцию</p>
              <button
                onClick={() => setShowCreate(true)}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white"
              >
                Создать
              </button>
            </motion.div>
          ) : (
            <motion.div variants={container} className="grid gap-3 pb-4">
              {collections.map((col) => (
                <motion.div key={col.id} variants={item}>
                  <CollectionCard col={col} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        <CreateCollectionModal open={showCreate} onClose={() => setShowCreate(false)} />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ClientLayout>
      <HomePage />
    </ClientLayout>
  );
}
