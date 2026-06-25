'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import ClientLayout from '@/app/client-layout';
import AddWordForm from '@/components/AddWordForm';
import { useCollection, useCollectionWords, useDueWords } from '@/lib/hooks';
import { deleteCollection, deleteWord } from '@/lib/actions';
import { formatInterval } from '@/lib/srs';
import { getWordEmoji } from '@/lib/word-images';
import {
  ArrowLeft, Play, Trash2, ChevronDown, ChevronUp, MoreHorizontal,
} from 'lucide-react';
import type { Word } from '@/lib/types';

function stateLabel(w: Word) {
  if (w.state === 'new') return { text: 'Новое', cls: 'bg-primary/10 text-primary' };
  if (w.state === 'learning') return { text: 'Учу', cls: 'bg-warning/10 text-warning' };
  if (w.scheduledDays >= 21) return { text: 'Выучено', cls: 'bg-success/10 text-success' };
  return { text: formatInterval(w.scheduledDays), cls: 'bg-surface-hover text-muted' };
}

function CollectionContent() {
  const searchParams = useSearchParams();
  const id = Number(searchParams.get('id'));
  const router = useRouter();
  const collection = useCollection(id);
  const words = useCollectionWords(id);
  const dueWords = useDueWords(id);
  const [showAdd, setShowAdd] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!id || collection === undefined || words === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="mb-4 text-muted">Коллекция не найдена</p>
        <Link href="/" className="text-primary hover:underline">На главную</Link>
      </div>
    );
  }

  const dueCount = dueWords?.length ?? 0;

  async function handleDeleteCollection() {
    await deleteCollection(id);
    router.push('/');
  }

  return (
    <div className="bg-mesh min-h-screen">
      <div className="mx-auto max-w-lg px-4 pt-4">
        <header className="mb-4 flex items-center gap-3">
          <Link href="/" className="glass rounded-lg p-2 text-muted transition-colors hover:text-foreground">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{collection.emoji} {collection.name}</h1>
            {collection.description && <p className="text-sm text-muted">{collection.description}</p>}
          </div>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-foreground">
              <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => { setShowMenu(false); setConfirmDelete(false); }} />
                <div className="absolute right-0 top-full z-50 mt-1 w-48 glass-card rounded-xl py-1 shadow-xl">
                  {!confirmDelete ? (
                    <button onClick={() => setConfirmDelete(true)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-surface-hover">
                      <Trash2 size={16} /> Удалить коллекцию
                    </button>
                  ) : (
                    <button onClick={handleDeleteCollection}
                      className="w-full px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/10">
                      Подтвердить удаление
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {dueCount > 0 && (
          <Link href={`/study?collection=${id}`}>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="mb-6 flex items-center justify-center gap-3 rounded-3xl bg-gradient-to-r from-primary via-indigo-500 to-accent px-6 py-4 text-lg font-semibold text-white shadow-xl glow-primary">
              <Play size={22} fill="white" />
              Учить ({dueCount} слов)
            </motion.div>
          </Link>
        )}

        <div className="mb-4">
          <button onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-2 text-sm font-medium text-primary">
            {showAdd ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Добавить слово
          </button>
        </div>

        {showAdd && (
          <div className="mb-6 glass-card rounded-2xl p-4">
            <AddWordForm collectionId={id} />
          </div>
        )}

        <div className="mb-3">
          <h2 className="text-base font-semibold">Слова ({words.length})</h2>
        </div>

        {words.length === 0 ? (
          <div className="glass-card rounded-3xl px-6 py-12 text-center">
            <div className="mb-2 text-3xl">🐱</div>
            <p className="text-muted">Добавьте первое слово</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {words.map((w, i) => {
              const label = stateLabel(w);
              const emoji = getWordEmoji(w.word);
              return (
                <motion.div key={w.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.5) }}
                  className="group glass-card flex items-center gap-3 rounded-xl px-4 py-3 transition-all hover:scale-[1.01]">
                  <span className="text-xl">{emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{w.word}</span>
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${label.cls}`}>{label.text}</span>
                    </div>
                    <p className="truncate text-sm text-muted">{w.translation}</p>
                  </div>
                  <button onClick={() => deleteWord(w.id!)}
                    className="rounded-lg p-1.5 text-muted opacity-0 transition-all hover:bg-danger/10 hover:text-danger group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ClientLayout>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
        <CollectionContent />
      </Suspense>
    </ClientLayout>
  );
}
