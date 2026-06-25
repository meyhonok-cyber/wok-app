'use client';

import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { addWord } from '@/lib/actions';

interface Props {
  collectionId: number;
  onAdded?: () => void;
}

export default function AddWordForm({ collectionId, onAdded }: Props) {
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [transcription, setTranscription] = useState('');
  const [exampleEn, setExampleEn] = useState('');
  const [exampleRu, setExampleRu] = useState('');
  const [loading, setLoading] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) return;

    setLoading(true);
    try {
      const examples = exampleEn.trim()
        ? [{ en: exampleEn.trim(), ru: exampleRu.trim() }]
        : [];
      await addWord(collectionId, word.trim(), translation.trim(), transcription.trim(), examples);
      setWord('');
      setTranslation('');
      setTranscription('');
      setExampleEn('');
      setExampleRu('');
      onAdded?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Слово"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary"
          required
        />
        <input
          type="text"
          placeholder="Перевод"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary"
          required
        />
      </div>

      {showExtra && (
        <>
          <input
            type="text"
            placeholder="Транскрипция"
            value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary"
          />
          <input
            type="text"
            placeholder="Пример (EN)"
            value={exampleEn}
            onChange={(e) => setExampleEn(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary"
          />
          <input
            type="text"
            placeholder="Перевод примера (RU)"
            value={exampleRu}
            onChange={(e) => setExampleRu(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary"
          />
        </>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setShowExtra(!showExtra)} className="text-sm text-primary hover:underline">
          {showExtra ? 'Скрыть доп. поля' : 'Доп. поля'}
        </button>
        <div className="flex-1" />
        <button
          type="submit"
          disabled={loading || !word.trim() || !translation.trim()}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-white transition-all hover:bg-primary-hover disabled:opacity-50 active:scale-95"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          Добавить
        </button>
      </div>
    </form>
  );
}
