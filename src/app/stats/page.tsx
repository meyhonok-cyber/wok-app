'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ClientLayout from '@/app/client-layout';
import { CatStreak } from '@/components/CatMascot';
import { useTodayStats, useReviewHistory, useMonthlyStats, useYearlyStats, useGlobalCounts } from '@/lib/hooks';
import { Flame, Target, BookOpen, TrendingUp, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MONTH_SHORT = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

const anim = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, type: 'spring' as const, stiffness: 300, damping: 24 } }),
};

function StatsPage() {
  const now = new Date();
  const [tab, setTab] = useState<'week' | 'month' | 'year'>('week');
  const [monthOffset, setMonthOffset] = useState(0);
  const [yearOffset, setYearOffset] = useState(0);

  const stats = useTodayStats();
  const counts = useGlobalCounts();
  const history = useReviewHistory(14);

  const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthly = useMonthlyStats(viewMonth.getFullYear(), viewMonth.getMonth());

  const viewYear = now.getFullYear() + yearOffset;
  const yearly = useYearlyStats(viewYear);

  return (
    <div className="bg-mesh min-h-screen">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-extrabold text-transparent">
          Статистика
        </motion.h1>

        {/* Cat mascot */}
        {stats && (
          <motion.div custom={0} variants={anim} initial="hidden" animate="show" className="mb-5 flex justify-center">
            <CatStreak streak={stats.streak} />
          </motion.div>
        )}

        {/* Summary cards */}
        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            {[
              { icon: Flame, value: stats.streak, label: 'дней подряд', color: 'text-warning', i: 1 },
              { icon: Target, value: stats.reviewsToday, label: 'сегодня', color: 'text-primary', i: 2 },
              { icon: BookOpen, value: stats.learnedWords, label: 'выучено', color: 'text-success', i: 3 },
              { icon: TrendingUp, value: stats.totalWords, label: 'всего слов', color: 'text-accent', i: 4 },
            ].map((s) => (
              <motion.div key={s.label} custom={s.i} variants={anim} initial="hidden" animate="show"
                whileHover={{ scale: 1.03, rotateY: 3 }}
                className="glass-card tilt-3d rounded-2xl p-4"
              >
                <s.icon size={22} className={`mb-1.5 ${s.color}`} />
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-xs text-muted">{s.label}</div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Progress */}
        {counts && counts.total > 0 && (
          <motion.div custom={5} variants={anim} initial="hidden" animate="show"
            className="glass-card mb-6 rounded-2xl p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Zap size={16} className="text-primary" />
              Прогресс
            </div>
            <div className="mb-2 h-3 overflow-hidden rounded-full bg-border/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((counts.learnedCount / counts.total) * 100)}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-success"
              />
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>{counts.learnedCount} выучено</span>
              <span>{Math.round((counts.learnedCount / counts.total) * 100)}%</span>
              <span>{counts.newCount} новых</span>
            </div>
          </motion.div>
        )}

        {/* Tab switcher */}
        <motion.div custom={6} variants={anim} initial="hidden" animate="show"
          className="mb-4 flex gap-1 rounded-2xl glass p-1">
          {(['week', 'month', 'year'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                tab === t ? 'text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              {tab === t && (
                <motion.div layoutId="stats-tab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent"
                  transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {t === 'week' ? '2 недели' : t === 'month' ? 'Месяц' : 'Год'}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Charts */}
        <motion.div custom={7} variants={anim} initial="hidden" animate="show">
          {tab === 'week' && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="mb-4 text-sm font-semibold">Последние 14 дней</h3>
              {history ? <BarChart data={history.map((d) => ({
                label: String(new Date(d.date).getDate()),
                value: d.total,
                good: d.good,
                highlight: d.date === now.toISOString().split('T')[0],
              }))} /> : <Spinner />}
            </div>
          )}

          {tab === 'month' && (
            <div className="glass-card rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <button onClick={() => setMonthOffset((o) => o - 1)} className="glass rounded-lg p-1.5 text-muted hover:text-foreground">
                  <ChevronLeft size={18} />
                </button>
                <h3 className="text-sm font-semibold">{MONTH_NAMES[viewMonth.getMonth()]} {viewMonth.getFullYear()}</h3>
                <button onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))} disabled={monthOffset >= 0}
                  className="glass rounded-lg p-1.5 text-muted hover:text-foreground disabled:opacity-30">
                  <ChevronRight size={18} />
                </button>
              </div>
              {monthly ? (
                <>
                  <BarChart data={monthly.byDay.map((d) => ({
                    label: d.day % 5 === 0 || d.day === 1 ? String(d.day) : '',
                    value: d.total, good: d.good,
                    highlight: d.day === now.getDate() && monthOffset === 0,
                  }))} />
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="glass rounded-xl p-2">
                      <div className="text-lg font-bold">{monthly.totalReviews}</div>
                      <div className="text-[10px] text-muted">повторений</div>
                    </div>
                    <div className="glass rounded-xl p-2">
                      <div className="text-lg font-bold text-success">
                        {monthly.totalReviews > 0 ? Math.round((monthly.goodReviews / monthly.totalReviews) * 100) : 0}%
                      </div>
                      <div className="text-[10px] text-muted">правильных</div>
                    </div>
                    <div className="glass rounded-xl p-2">
                      <div className="text-lg font-bold text-primary">{monthly.uniqueWords}</div>
                      <div className="text-[10px] text-muted">слов</div>
                    </div>
                  </div>
                </>
              ) : <Spinner />}
            </div>
          )}

          {tab === 'year' && (
            <div className="glass-card rounded-2xl p-5">
              <div className="mb-4 flex items-center justify-between">
                <button onClick={() => setYearOffset((o) => o - 1)} className="glass rounded-lg p-1.5 text-muted hover:text-foreground">
                  <ChevronLeft size={18} />
                </button>
                <h3 className="text-sm font-semibold">{viewYear}</h3>
                <button onClick={() => setYearOffset((o) => Math.min(o + 1, 0))} disabled={yearOffset >= 0}
                  className="glass rounded-lg p-1.5 text-muted hover:text-foreground disabled:opacity-30">
                  <ChevronRight size={18} />
                </button>
              </div>
              {yearly ? (
                <>
                  <BarChart data={yearly.map((m) => ({
                    label: MONTH_SHORT[m.month], value: m.total, good: m.good,
                    highlight: m.month === now.getMonth() && yearOffset === 0,
                  }))} />
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <div className="glass rounded-xl p-2">
                      <div className="text-lg font-bold">{yearly.reduce((s, m) => s + m.total, 0)}</div>
                      <div className="text-[10px] text-muted">за год</div>
                    </div>
                    <div className="glass rounded-xl p-2">
                      <div className="text-lg font-bold text-success">{yearly.reduce((s, m) => s + m.good, 0)}</div>
                      <div className="text-[10px] text-muted">правильных</div>
                    </div>
                    <div className="glass rounded-xl p-2">
                      <div className="text-lg font-bold text-accent">{Math.max(...yearly.map((m) => m.words), 0)}</div>
                      <div className="text-[10px] text-muted">макс. слов/мес</div>
                    </div>
                  </div>
                </>
              ) : <Spinner />}
            </div>
          )}
        </motion.div>

        {/* Fun fact with cat */}
        {stats && stats.totalWords > 0 && (
          <motion.div custom={8} variants={anim} initial="hidden" animate="show"
            className="mt-4 glass-card rounded-2xl p-5 text-center">
            <div className="mb-2 text-3xl">🐱</div>
            <p className="text-sm text-muted">
              {stats.learnedWords >= 100
                ? 'Котик считает тебя полиглотом! 🌍'
                : stats.learnedWords >= 50
                  ? 'Котик впечатлён твоим прогрессом! 📚'
                  : stats.learnedWords >= 10
                    ? 'Котик верит в тебя! Продолжай! 💪'
                    : 'Котик ждёт, когда ты начнёшь учить! 😸'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function BarChart({ data }: {
  data: Array<{ label: string; value: number; good?: number; highlight?: boolean }>;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-[3px]" style={{ height: 110 }}>
      {data.map((d, i) => {
        const h = d.value > 0 ? (d.value / max) * 100 : 3;
        return (
          <div key={i} className="group relative flex flex-1 flex-col items-center">
            <div className="invisible absolute -top-8 z-10 rounded-lg glass-strong px-2 py-1 text-[10px] font-medium group-hover:visible whitespace-nowrap">
              {d.value} {d.good !== undefined ? `(${d.good}✓)` : ''}
            </div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.5, delay: i * 0.02 }}
              className={`w-full max-w-[18px] rounded-t-sm ${
                d.highlight
                  ? 'bg-gradient-to-t from-primary to-accent'
                  : d.value > 0 ? 'bg-primary/30' : 'bg-border/20'
              }`}
              style={{ minHeight: 3 }}
            />
            {d.label && (
              <span className={`mt-1 text-[8px] leading-none ${d.highlight ? 'font-bold text-primary' : 'text-muted'}`}>
                {d.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex h-[110px] items-center justify-center">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function Page() {
  return (
    <ClientLayout>
      <StatsPage />
    </ClientLayout>
  );
}
