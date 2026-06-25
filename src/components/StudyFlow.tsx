'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, ChevronDown, ChevronUp, Pencil, Grid2x2, Headphones, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { reviewWord } from '@/lib/actions';
import { speak } from '@/lib/tts';
import { getWordEmoji } from '@/lib/word-images';
import { CatReaction } from '@/components/CatMascot';
import type { Rating, Word } from '@/lib/types';
import { RATING_META } from '@/lib/types';

type Phase = 'prompt' | 'typing' | 'choosing' | 'listening' | 'result';

interface Props {
  initialWords: Word[];
  allWords: Word[];
  title: string;
  backHref: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getChoices(correct: Word, pool: Word[], count = 4): Word[] {
  const others = pool.filter((w) => w.id !== correct.id && w.word !== correct.word);
  const picked = shuffle(others).slice(0, count - 1);
  return shuffle([correct, ...picked]);
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/['']/g, "'");
}

export default function StudyFlow({ initialWords, allWords, title, backHref }: Props) {
  const [queue, setQueue] = useState<Word[]>(() => shuffle([...initialWords]));
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('prompt');
  const [attempt, setAttempt] = useState(0);
  const [typedValue, setTypedValue] = useState('');
  const [typeFeedback, setTypeFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [choices, setChoices] = useState<Word[]>([]);
  const [choiceFeedback, setChoiceFeedback] = useState<Record<number, 'correct' | 'wrong'>>({});
  const [wasCorrectFirstTry, setWasCorrectFirstTry] = useState(false);
  const [expandedExamples, setExpandedExamples] = useState<Set<number>>(new Set());
  const [stats, setStats] = useState({ total: 0, good: 0, bad: 0 });
  const [correctStreak, setCorrectStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [exitDir, setExitDir] = useState<'left' | 'right' | null>(null);
  const [showCatReaction, setShowCatReaction] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentWord = queue[index];
  const totalToStudy = initialWords.length;

  const moveToNext = useCallback(
    (remembered: boolean) => {
      setExitDir(remembered ? 'right' : 'left');
      setShowCatReaction(true);

      if (remembered) {
        setCorrectStreak((s) => s + 1);
      } else {
        setCorrectStreak(0);
      }

      setTimeout(() => {
        if (!remembered) {
          setQueue((q) => {
            const copy = [...q];
            const w = copy.splice(index, 1)[0];
            const insertAt = Math.min(index + 2 + Math.floor(Math.random() * 3), copy.length);
            copy.splice(insertAt, 0, w);
            return copy;
          });
        } else {
          setIndex((i) => i + 1);
        }

        setStats((s) => ({
          total: s.total + 1,
          good: s.good + (remembered ? 1 : 0),
          bad: s.bad + (remembered ? 0 : 1),
        }));

        setPhase('prompt');
        setAttempt(0);
        setTypedValue('');
        setTypeFeedback(null);
        setChoiceFeedback({});
        setWasCorrectFirstTry(false);
        setExpandedExamples(new Set());
        setExitDir(null);
        setShowCatReaction(false);

        const nextIdx = remembered ? index + 1 : index;
        if (nextIdx >= queue.length - (remembered ? 0 : 1)) {
          setDone(true);
        }
      }, 400);
    },
    [index, queue.length],
  );

  const handleRate = useCallback(
    async (rating: Rating) => {
      if (!currentWord) return;
      try {
        await reviewWord(currentWord.id!, rating);
      } catch (e) {
        console.error(e);
      }
      moveToNext(rating >= 2);
    },
    [currentWord, moveToNext],
  );

  const startTyping = useCallback(() => {
    setPhase('typing');
    setAttempt(0);
    setTypedValue('');
    setTypeFeedback(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const startChoosing = useCallback(() => {
    if (!currentWord) return;
    setPhase('choosing');
    setAttempt(0);
    setChoiceFeedback({});
    setChoices(getChoices(currentWord, allWords));
  }, [currentWord, allWords]);

  const startListening = useCallback(() => {
    if (!currentWord) return;
    setPhase('listening');
    setAttempt(0);
    setTypedValue('');
    setTypeFeedback(null);
    speak(currentWord.word);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [currentWord]);

  const checkTyping = useCallback(() => {
    if (!currentWord) return;
    const isCorrect = norm(typedValue) === norm(currentWord.word);
    if (isCorrect) {
      setTypeFeedback('correct');
      if (attempt === 0) setWasCorrectFirstTry(true);
      setTimeout(() => setPhase('result'), 600);
    } else {
      setTypeFeedback('wrong');
      const next = attempt + 1;
      setAttempt(next);
      if (next >= 3) {
        setTimeout(() => setPhase('result'), 800);
      } else {
        setTimeout(() => { setTypeFeedback(null); setTypedValue(''); inputRef.current?.focus(); }, 800);
      }
    }
  }, [currentWord, typedValue, attempt]);

  const checkChoice = useCallback(
    (chosen: Word) => {
      if (!currentWord) return;
      const isCorrect = chosen.id === currentWord.id;
      if (isCorrect) {
        setChoiceFeedback((f) => ({ ...f, [chosen.id!]: 'correct' }));
        if (attempt === 0) setWasCorrectFirstTry(true);
        setTimeout(() => setPhase('result'), 600);
      } else {
        setChoiceFeedback((f) => ({ ...f, [chosen.id!]: 'wrong' }));
        const next = attempt + 1;
        setAttempt(next);
        if (next >= 3) {
          setChoiceFeedback((f) => ({ ...f, [currentWord.id!]: 'correct' }));
          setTimeout(() => setPhase('result'), 800);
        }
      }
    },
    [currentWord, attempt],
  );

  useEffect(() => {
    if (phase === 'result' && currentWord) speak(currentWord.word);
  }, [phase, currentWord]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((phase === 'typing' || phase === 'listening') && e.key === 'Enter') {
        e.preventDefault();
        checkTyping();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, checkTyping]);

  if (done) {
    const pct = totalToStudy > 0 ? Math.round((stats.good / Math.max(stats.total, 1)) * 100) : 0;
    return (
      <div className="bg-mesh flex min-h-screen flex-col items-center justify-center px-6 pb-20 text-center safe-top">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' as const, stiffness: 200 }}
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-4 text-7xl"
          >
            {pct >= 80 ? '😻' : pct >= 50 ? '😺' : '😿'}
          </motion.div>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-extrabold text-transparent"
        >
          {pct >= 80 ? 'Потрясающе!' : pct >= 50 ? 'Хорошая работа!' : 'Не сдавайся!'}
        </motion.h2>
        <p className="mb-1 text-lg text-muted">
          Выучено <span className="font-bold text-primary">{stats.good}</span> слов
        </p>
        <p className="mb-8 text-sm text-muted">{stats.total} ответов • {pct}% правильных</p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8 flex gap-6"
        >
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-success">{stats.good}</div>
            <div className="text-xs text-muted">запомнили</div>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="text-3xl font-bold text-danger">{stats.bad}</div>
            <div className="text-xs text-muted">повторить</div>
          </div>
        </motion.div>

        <div className="flex gap-3">
          <Link href={backHref} className="glass-card rounded-2xl px-6 py-3 font-medium transition-all hover:scale-105">
            Назад
          </Link>
          <Link href="/" className="rounded-2xl bg-gradient-to-r from-primary to-accent px-6 py-3 font-medium text-white shadow-lg transition-all hover:scale-105">
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="bg-mesh flex min-h-screen items-center justify-center px-6">
        <p className="text-muted">Нет слов для изучения</p>
      </div>
    );
  }

  return (
    <div className="bg-mesh flex min-h-screen flex-col safe-top">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3">
        <Link href={backHref} className="glass rounded-xl p-2 text-muted transition-colors hover:text-foreground">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>{title}</span>
            <span>{Math.min(stats.total + 1, queue.length)} / {queue.length}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-border/30 glass">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              animate={{ width: `${((stats.total + 1) / queue.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        {correctStreak >= 3 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 rounded-full bg-warning/15 px-2 py-1 text-xs font-bold text-warning"
          >
            🔥 {correctStreak}
          </motion.div>
        )}
      </header>

      {/* Card area */}
      <div className="flex flex-1 flex-col px-4 pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentWord.id}-${index}-${phase}`}
            initial={{ opacity: 0, y: 30, rotateX: -5 }}
            animate={{
              opacity: exitDir ? 0 : 1,
              x: exitDir === 'right' ? 300 : exitDir === 'left' ? -300 : 0,
              y: exitDir ? -50 : 0,
              rotateX: exitDir ? 10 : 0,
              rotateZ: exitDir === 'right' ? 12 : exitDir === 'left' ? -12 : 0,
            }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="perspective-1200 flex flex-1 flex-col"
          >
            {phase === 'prompt' && (
              <PromptPhase word={currentWord} onType={startTyping} onChoose={startChoosing} onListen={startListening} />
            )}
            {phase === 'typing' && (
              <TypingPhase word={currentWord} value={typedValue} onChange={setTypedValue}
                onCheck={checkTyping} attempt={attempt} feedback={typeFeedback} inputRef={inputRef} />
            )}
            {phase === 'listening' && (
              <ListeningPhase word={currentWord} value={typedValue} onChange={setTypedValue}
                onCheck={checkTyping} attempt={attempt} feedback={typeFeedback} inputRef={inputRef} />
            )}
            {phase === 'choosing' && (
              <ChoosingPhase word={currentWord} choices={choices} onChoose={checkChoice}
                attempt={attempt} feedback={choiceFeedback} />
            )}
            {phase === 'result' && (
              <ResultPhase word={currentWord} wasCorrect={wasCorrectFirstTry}
                expandedExamples={expandedExamples}
                onToggleExample={(i) => setExpandedExamples((s) => {
                  const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n;
                })}
                onRate={handleRate} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Cat reaction overlay */}
        <AnimatePresence>
          {showCatReaction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            >
              <CatReaction correct={exitDir === 'right'} streak={correctStreak} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── PROMPT ─── */
function PromptPhase({ word, onType, onChoose, onListen }: {
  word: Word; onType: () => void; onChoose: () => void; onListen: () => void;
}) {
  const emoji = getWordEmoji(word.word);
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' as const, stiffness: 300 }}
        className="mb-4 text-6xl"
      >
        {emoji}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted"
      >
        {word.state === 'new' ? '✨ Новое слово' : '🔄 Повторение'}
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8 px-4 text-center text-3xl font-bold leading-tight"
      >
        {word.translation}
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex w-full max-w-xs gap-3"
      >
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onType}
          className="glass-card flex flex-1 flex-col items-center gap-2 rounded-2xl px-4 py-5">
          <Pencil size={26} className="text-primary" />
          <span className="text-sm font-semibold">Написать</span>
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onChoose}
          className="glass-card flex flex-1 flex-col items-center gap-2 rounded-2xl px-4 py-5">
          <Grid2x2 size={26} className="text-accent" />
          <span className="text-sm font-semibold">Выбрать</span>
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onListen}
          className="glass-card flex flex-1 flex-col items-center gap-2 rounded-2xl px-4 py-5">
          <Headphones size={26} className="text-success" />
          <span className="text-sm font-semibold">Слушать</span>
        </motion.button>
      </motion.div>
    </div>
  );
}

/* ─── TYPING ─── */
function TypingPhase({ word, value, onChange, onCheck, attempt, feedback, inputRef }: {
  word: Word; value: string; onChange: (v: string) => void; onCheck: () => void;
  attempt: number; feedback: 'correct' | 'wrong' | null; inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const emoji = getWordEmoji(word.word);
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2">
      <div className="mb-2 text-4xl">{emoji}</div>
      <div className="mb-2 text-sm text-muted">Напишите слово на английском</div>
      <h2 className="mb-6 text-center text-2xl font-bold">{word.translation}</h2>
      <div className="mb-4 w-full max-w-sm">
        <motion.input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Введите слово..."
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          animate={feedback === 'wrong' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={`w-full rounded-2xl border-2 px-5 py-4 text-center text-xl outline-none transition-all ${
            feedback === 'correct' ? 'border-success bg-success/10 glow-success'
              : feedback === 'wrong' ? 'border-danger bg-danger/10 glow-danger'
                : 'glass border-transparent focus:border-primary'
          }`}
        />
      </div>
      <AnimatePresence>
        {feedback === 'wrong' && attempt < 3 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 text-sm font-medium text-danger">
            Неправильно. Попробуйте ещё
          </motion.p>
        )}
        {feedback === 'wrong' && attempt >= 3 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 text-sm font-medium text-danger">
            Ответ: <span className="font-bold text-foreground">{word.word}</span>
          </motion.p>
        )}
        {feedback === 'correct' && (
          <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-3 text-sm font-bold text-success">✨ Правильно!</motion.p>
        )}
      </AnimatePresence>
      <div className="mb-4 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${
            i < attempt ? 'bg-danger/60' : i === attempt && feedback !== 'correct' ? 'bg-primary' : 'bg-border/40'
          }`} />
        ))}
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={onCheck}
        disabled={!value.trim() || feedback === 'correct' || attempt >= 3}
        className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-primary to-accent py-4 text-lg font-semibold text-white shadow-lg disabled:opacity-40">
        Проверить
      </motion.button>
    </div>
  );
}

/* ─── LISTENING ─── */
function ListeningPhase({ word, value, onChange, onCheck, attempt, feedback, inputRef }: {
  word: Word; value: string; onChange: (v: string) => void; onCheck: () => void;
  attempt: number; feedback: 'correct' | 'wrong' | null; inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => speak(word.word)}
        className="mb-6 rounded-full bg-gradient-to-r from-success to-emerald-400 p-6 text-white shadow-xl glow-success"
      >
        <Volume2 size={36} />
      </motion.button>
      <div className="mb-6 text-sm text-muted">Прослушайте и напишите услышанное слово</div>
      <div className="mb-4 w-full max-w-sm">
        <motion.input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Что вы услышали?"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          animate={feedback === 'wrong' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
          className={`w-full rounded-2xl border-2 px-5 py-4 text-center text-xl outline-none transition-all ${
            feedback === 'correct' ? 'border-success bg-success/10 glow-success'
              : feedback === 'wrong' ? 'border-danger bg-danger/10 glow-danger'
                : 'glass border-transparent focus:border-primary'
          }`}
        />
      </div>
      <AnimatePresence>
        {feedback === 'wrong' && attempt < 3 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 text-sm font-medium text-danger">
            Неправильно. Попробуйте ещё
          </motion.p>
        )}
        {feedback === 'wrong' && attempt >= 3 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 text-sm text-danger">
            Ответ: <span className="font-bold text-foreground">{word.word}</span>
            <br /><span className="text-muted">{word.translation}</span>
          </motion.p>
        )}
        {feedback === 'correct' && (
          <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            className="mb-3 text-sm font-bold text-success">🎧 Отличный слух!</motion.p>
        )}
      </AnimatePresence>
      <div className="mb-4 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 w-8 rounded-full ${
            i < attempt ? 'bg-danger/60' : i === attempt && feedback !== 'correct' ? 'bg-primary' : 'bg-border/40'
          }`} />
        ))}
      </div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={onCheck}
        disabled={!value.trim() || feedback === 'correct' || attempt >= 3}
        className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-success to-emerald-400 py-4 text-lg font-semibold text-white shadow-lg disabled:opacity-40">
        Проверить
      </motion.button>
    </div>
  );
}

/* ─── CHOOSING ─── */
function ChoosingPhase({ word, choices, onChoose, attempt, feedback }: {
  word: Word; choices: Word[]; onChoose: (w: Word) => void;
  attempt: number; feedback: Record<number, 'correct' | 'wrong'>;
}) {
  const emoji = getWordEmoji(word.word);
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2">
      <div className="mb-2 text-4xl">{emoji}</div>
      <div className="mb-2 text-sm text-muted">Выберите правильный перевод</div>
      <h2 className="mb-8 text-center text-2xl font-bold">{word.translation}</h2>
      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        {choices.map((c) => {
          const fb = feedback[c.id!];
          const disabled = fb === 'wrong' || feedback[word.id!] === 'correct' || attempt >= 3;
          return (
            <motion.button
              key={c.id}
              whileHover={!disabled ? { scale: 1.03 } : {}}
              whileTap={!disabled ? { scale: 0.97 } : {}}
              animate={fb === 'wrong' ? { x: [0, -6, 6, -6, 0] } : fb === 'correct' ? { scale: [1, 1.08, 1] } : {}}
              onClick={() => !disabled && onChoose(c)}
              disabled={disabled}
              className={`glass-card rounded-2xl px-4 py-5 text-center text-base font-medium transition-all ${
                fb === 'correct' ? 'border-success bg-success/15 text-success glow-success !border-success'
                  : fb === 'wrong' ? 'border-danger/40 text-danger/50 !border-danger/40'
                    : disabled ? 'opacity-40' : 'hover:border-primary/40'
              }`}
            >
              {c.word}
            </motion.button>
          );
        })}
      </div>
      {attempt > 0 && attempt < 3 && !feedback[word.id!] && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-danger">
          Неправильно. Попробуйте ещё
        </motion.p>
      )}
      <div className="mt-4 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 w-8 rounded-full ${
            i < attempt ? 'bg-danger/60' : i === attempt ? 'bg-primary' : 'bg-border/40'
          }`} />
        ))}
      </div>
    </div>
  );
}

/* ─── RESULT ─── */
function ResultPhase({ word, wasCorrect, expandedExamples, onToggleExample, onRate }: {
  word: Word; wasCorrect: boolean; expandedExamples: Set<number>;
  onToggleExample: (i: number) => void; onRate: (r: Rating) => void;
}) {
  const emoji = getWordEmoji(word.word);
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto pb-36">
        <div className="mx-auto max-w-sm pt-4">
          {/* Word header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-center"
          >
            <div className="mb-3 text-5xl">{emoji}</div>
            <div className="mb-2 flex items-center justify-center gap-3">
              <h2 className="text-3xl font-bold">{word.word}</h2>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => speak(word.word)}
                className="rounded-full bg-gradient-to-r from-primary to-accent p-2.5 text-white shadow-lg"
              >
                <Volume2 size={18} />
              </motion.button>
            </div>
            {word.transcription && (
              <p className="mb-2 text-base text-muted">{word.transcription}</p>
            )}
            <p className="text-xl font-semibold text-primary">{word.translation}</p>
            {wasCorrect && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-3 inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success"
              >
                <Sparkles size={12} />
                С первой попытки!
              </motion.div>
            )}
          </motion.div>

          {/* Examples */}
          {word.examples.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <h3 className="flex items-center gap-2 text-sm font-semibold text-muted">
                <span>📝</span> Примеры из IELTS
              </h3>
              {word.examples.map((ex, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="glass-card rounded-2xl p-4"
                >
                  <div className="flex items-start gap-2">
                    <p className="flex-1 text-sm leading-relaxed">{ex.en}</p>
                    <motion.button
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => speak(ex.en)}
                      className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:text-primary"
                    >
                      <Volume2 size={16} />
                    </motion.button>
                  </div>
                  <button
                    onClick={() => onToggleExample(i)}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-primary"
                  >
                    {expandedExamples.has(i) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {expandedExamples.has(i) ? 'Скрыть' : 'Перевод'}
                  </button>
                  <AnimatePresence>
                    {expandedExamples.has(i) && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 overflow-hidden text-sm text-muted"
                      >
                        {ex.ru}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Rating buttons */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 glass-strong px-4 pb-8 pt-4 safe-bottom"
      >
        <div className="mx-auto grid max-w-sm grid-cols-4 gap-2">
          {([1, 2, 3, 4] as Rating[]).map((r) => {
            const meta = RATING_META[r];
            return (
              <motion.button
                key={r}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onRate(r)}
                className={`rounded-xl ${meta.bg} px-2 py-3 text-center text-sm font-semibold ${meta.color} shadow-md transition-all`}
              >
                {meta.label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
