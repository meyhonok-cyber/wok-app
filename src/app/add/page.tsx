'use client';

import { useState, useRef } from 'react';
import ClientLayout from '@/app/client-layout';
import { useCollections } from '@/lib/hooks';
import { addCollection, addWord, importCSV } from '@/lib/actions';
import { Upload, FileText, Plus, Check, AlertCircle } from 'lucide-react';

function AddPage() {
  const collections = useCollections();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'manual' | 'csv'>('manual');
  const [collectionId, setCollectionId] = useState<number | 'new'>('new');
  const [newColName, setNewColName] = useState('');
  const [word, setWord] = useState('');
  const [translation, setTranslation] = useState('');
  const [transcription, setTranscription] = useState('');
  const [exampleEn, setExampleEn] = useState('');
  const [exampleRu, setExampleRu] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvName, setCsvName] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function getTargetCollectionId(): Promise<number> {
    if (collectionId !== 'new') return collectionId;
    if (!newColName.trim()) throw new Error('Введите название коллекции');
    return (await addCollection(newColName.trim())) as number;
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!word.trim() || !translation.trim()) return;
    setLoading(true);
    setStatus(null);

    try {
      const colId = await getTargetCollectionId();
      const examples = exampleEn.trim() ? [{ en: exampleEn.trim(), ru: exampleRu.trim() }] : [];
      await addWord(colId, word.trim(), translation.trim(), transcription.trim(), examples);
      setWord('');
      setTranslation('');
      setTranscription('');
      setExampleEn('');
      setExampleRu('');
      setStatus({ type: 'success', msg: 'Слово добавлено!' });
      if (collectionId === 'new') setCollectionId(colId);
    } catch (err: unknown) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Ошибка' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCSVImport() {
    if (!csvText.trim() || !csvName.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await importCSV(csvName.trim(), csvText.trim());
      setStatus({ type: 'success', msg: `Импортировано ${result.count} слов!` });
      setCsvText('');
      setCsvName('');
    } catch (err: unknown) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Ошибка импорта' });
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(ev.target?.result as string);
      if (!csvName) setCsvName(file.name.replace(/\.\w+$/, ''));
    };
    reader.readAsText(file);
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <h1 className="mb-6 text-2xl font-bold">Добавить слова</h1>

      <div className="mb-6 flex gap-2 rounded-xl bg-surface p-1">
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            mode === 'manual' ? 'bg-primary text-white shadow' : 'text-muted hover:text-foreground'
          }`}
        >
          Вручную
        </button>
        <button
          onClick={() => setMode('csv')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
            mode === 'csv' ? 'bg-primary text-white shadow' : 'text-muted hover:text-foreground'
          }`}
        >
          CSV / Файл
        </button>
      </div>

      {status && (
        <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
          status.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
        }`}>
          {status.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {status.msg}
        </div>
      )}

      {mode === 'manual' ? (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Коллекция</label>
            <select
              value={collectionId}
              onChange={(e) => setCollectionId(e.target.value === 'new' ? 'new' : Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-primary"
            >
              <option value="new">+ Новая коллекция</option>
              {collections?.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>

          {collectionId === 'new' && (
            <input
              type="text"
              placeholder="Название новой коллекции"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary"
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Слово *</label>
              <input type="text" value={word} onChange={(e) => setWord(e.target.value)}
                placeholder="abundant" required
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Перевод *</label>
              <input type="text" value={translation} onChange={(e) => setTranslation(e.target.value)}
                placeholder="обильный" required
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary" />
            </div>
          </div>

          <input type="text" placeholder="Транскрипция" value={transcription}
            onChange={(e) => setTranscription(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary" />

          <input type="text" placeholder="Пример (EN)" value={exampleEn}
            onChange={(e) => setExampleEn(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary" />

          <input type="text" placeholder="Перевод примера (RU)" value={exampleRu}
            onChange={(e) => setExampleRu(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary" />

          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-white transition-all hover:bg-primary-hover disabled:opacity-50 active:scale-[0.98]">
            <Plus size={18} />
            Добавить слово
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <input type="text" placeholder="Название коллекции для импорта" value={csvName}
            onChange={(e) => setCsvName(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none placeholder:text-muted focus:border-primary" />

          <div onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-border px-6 py-8 text-center transition-colors hover:border-primary/50">
            <Upload size={32} className="mx-auto mb-3 text-muted" />
            <p className="mb-1 font-medium">Загрузите CSV или TXT файл</p>
            <p className="text-sm text-muted">Формат: слово, перевод</p>
            <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} className="hidden" />
          </div>

          <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)}
            placeholder={"abundant, обильный\nacquire, приобретать\nassess, оценивать"}
            rows={6}
            className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm outline-none placeholder:text-muted focus:border-primary" />

          <button onClick={handleCSVImport} disabled={loading || !csvText.trim() || !csvName.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 font-semibold text-white transition-all hover:bg-primary-hover disabled:opacity-50 active:scale-[0.98]">
            <FileText size={18} />
            Импортировать
          </button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <ClientLayout>
      <AddPage />
    </ClientLayout>
  );
}
