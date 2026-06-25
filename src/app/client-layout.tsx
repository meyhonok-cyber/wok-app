'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ThemeProvider } from '@/components/ThemeProvider';
import BottomNav from '@/components/BottomNav';
import { db } from '@/lib/db';
import { addCollection, addWords } from '@/lib/actions';
import { SAMPLE_COLLECTIONS } from '@/lib/sample-words';

const SEED_VERSION = 'wok-v8-verified';
let seedingPromise: Promise<void> | null = null;

function SeedGuard({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!seedingPromise) {
      seedingPromise = (async () => {
        const seeded = localStorage.getItem('wok-seed-version');
        if (seeded !== SEED_VERSION) {
          localStorage.setItem('wok-seed-version', SEED_VERSION);
          await db.reviewLogs.clear();
          await db.words.clear();
          await db.collections.clear();

          for (const col of SAMPLE_COLLECTIONS) {
            const id = await addCollection(col.name, col.description, col.emoji);
            await addWords(id as number, col.words);
          }
        }
      })();
    }
    seedingPromise.then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <SeedGuard>
        <div className="pb-20">{children}</div>
        <BottomNav />
      </SeedGuard>
    </ThemeProvider>
  );
}
