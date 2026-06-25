'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import StudyFlow from '@/components/StudyFlow';
import { useAllNewWords, useAllDueWords, useAllWords, useDueWords, useCollection } from '@/lib/hooks';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

function StudyContent() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'new';
  const collectionId = searchParams.get('collection');

  const newWords = useAllNewWords();
  const dueWords = useAllDueWords();
  const allWords = useAllWords();
  const colId = collectionId ? Number(collectionId) : 0;
  const collectionDueWords = useDueWords(colId);
  const collection = useCollection(colId);

  if (allWords === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  let words: typeof newWords;
  let title: string;
  let backHref: string;

  if (collectionId) {
    words = collectionDueWords;
    title = collection ? `${collection.emoji} ${collection.name}` : 'Коллекция';
    backHref = `/collection?id=${collectionId}`;
  } else {
    words = mode === 'review' ? dueWords : newWords;
    title = mode === 'review' ? 'Повторение' : 'Новые слова';
    backHref = '/';
  }

  if (words === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-5xl">🎊</div>
        <h2 className="mb-2 text-xl font-bold">
          {mode === 'review' ? 'Нет слов для повторения!' : 'Нет новых слов!'}
        </h2>
        <p className="mb-6 text-muted">
          {mode === 'review'
            ? 'Все слова повторены. Возвращайтесь позже!'
            : 'Добавьте новые слова через коллекции'}
        </p>
        <Link href={backHref}
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white">
          <ArrowLeft size={18} />
          Назад
        </Link>
      </div>
    );
  }

  return (
    <StudyFlow
      initialWords={words}
      allWords={allWords}
      title={title}
      backHref={backHref}
    />
  );
}

export default function Page() {
  return (
    <ThemeProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        <StudyContent />
      </Suspense>
    </ThemeProvider>
  );
}
