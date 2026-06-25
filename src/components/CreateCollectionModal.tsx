'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { addCollection } from '@/lib/actions';

const EMOJIS = ['📚', '🎓', '💬', '🌍', '🔬', '💼', '✈️', '🎵', '🍕', '⚽', '🎨', '💻', '🐱', '🚀', '🌱', '🌿'];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: number) => void;
}

export default function CreateCollectionModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const id = await addCollection(name.trim(), description.trim(), emoji);
      setName(''); setDescription(''); setEmoji('📚');
      onCreated?.(id as number);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
            className="glass-strong relative w-full max-w-md rounded-t-3xl p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Новая коллекция</h2>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                onClick={onClose} className="glass rounded-lg p-1.5 text-muted hover:text-foreground">
                <X size={20} />
              </motion.button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <motion.button key={e} type="button" whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                    onClick={() => setEmoji(e)}
                    className={`rounded-xl p-2 text-2xl transition-all ${
                      emoji === e ? 'glass glow-primary ring-2 ring-primary' : 'hover:bg-surface-hover'
                    }`}>
                    {e}
                  </motion.button>
                ))}
              </div>

              <input type="text" placeholder="Название коллекции" value={name}
                onChange={(e) => setName(e.target.value)} autoFocus required
                className="w-full rounded-xl glass border-transparent px-4 py-3 text-base outline-none placeholder:text-muted focus:ring-2 focus:ring-primary" />

              <textarea placeholder="Описание (необязательно)" value={description}
                onChange={(e) => setDescription(e.target.value)} rows={2}
                className="w-full resize-none rounded-xl glass border-transparent px-4 py-3 text-base outline-none placeholder:text-muted focus:ring-2 focus:ring-primary" />

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={loading || !name.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-primary to-accent py-3.5 font-semibold text-white shadow-lg disabled:opacity-50">
                {loading ? <Loader2 size={20} className="mx-auto animate-spin" /> : 'Создать'}
              </motion.button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
