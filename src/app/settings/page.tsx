'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import ClientLayout from '@/app/client-layout';
import { useTheme } from '@/components/ThemeProvider';
import { exportAllData, importData } from '@/lib/actions';
import { db } from '@/lib/db';
import { Sun, Moon, Download, Upload, Trash2, Check, AlertCircle, Info, Cat } from 'lucide-react';

const item = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, type: 'spring' as const, stiffness: 300, damping: 24 } }),
};

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  async function handleExport() {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wok-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: 'success', msg: 'Данные экспортированы! 📦' });
    } catch {
      setStatus({ type: 'error', msg: 'Ошибка экспорта' });
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await importData(await file.text());
      setStatus({ type: 'success', msg: 'Данные импортированы! 🎉' });
    } catch (err: unknown) {
      setStatus({ type: 'error', msg: err instanceof Error ? err.message : 'Ошибка импорта' });
    }
    e.target.value = '';
  }

  async function handleReset() {
    await db.delete();
    window.location.reload();
  }

  return (
    <div className="bg-mesh min-h-screen">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl font-extrabold text-transparent">
          Настройки
        </motion.h1>

        {status && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`mb-4 flex items-center gap-2 glass-card rounded-xl px-4 py-3 text-sm ${
              status.type === 'success' ? 'text-success' : 'text-danger'
            }`}>
            {status.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            {status.msg}
          </motion.div>
        )}

        <div className="space-y-3">
          {/* Theme toggle */}
          <motion.div custom={1} variants={item} initial="hidden" animate="show">
            <button onClick={toggle} className="glass-card tilt-3d flex w-full items-center gap-4 rounded-2xl px-5 py-4">
              <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.5 }}>
                {theme === 'dark' ? <Moon size={22} className="text-primary" /> : <Sun size={22} className="text-warning" />}
              </motion.div>
              <div className="flex-1 text-left">
                <div className="font-medium">Тема</div>
                <div className="text-sm text-muted">{theme === 'dark' ? 'Тёмная' : 'Светлая'}</div>
              </div>
              <div className={`h-7 w-12 rounded-full p-0.5 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-border'}`}>
                <motion.div layout className={`h-6 w-6 rounded-full bg-white shadow-md ${theme === 'dark' ? 'ml-5' : 'ml-0'}`} />
              </div>
            </button>
          </motion.div>

          {/* Export/Import */}
          <motion.div custom={2} variants={item} initial="hidden" animate="show"
            className="glass-card rounded-2xl overflow-hidden">
            <button onClick={handleExport}
              className="flex w-full items-center gap-4 border-b border-border/30 px-5 py-4 transition-colors hover:bg-surface-hover/50">
              <Download size={20} className="text-primary" />
              <div className="flex-1 text-left">
                <div className="font-medium">Экспорт данных</div>
                <div className="text-sm text-muted">Сохранить в JSON</div>
              </div>
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="flex w-full items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-hover/50">
              <Upload size={20} className="text-primary" />
              <div className="flex-1 text-left">
                <div className="font-medium">Импорт данных</div>
                <div className="text-sm text-muted">Загрузить из JSON</div>
              </div>
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          </motion.div>

          {/* Reset */}
          <motion.div custom={3} variants={item} initial="hidden" animate="show"
            className="glass-card rounded-2xl border-danger/20">
            {!confirmReset ? (
              <button onClick={() => setConfirmReset(true)}
                className="flex w-full items-center gap-4 px-5 py-4 hover:bg-danger/5">
                <Trash2 size={20} className="text-danger" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-danger">Сбросить всё</div>
                  <div className="text-sm text-muted">Удалить все данные</div>
                </div>
              </button>
            ) : (
              <div className="px-5 py-4">
                <p className="mb-3 text-sm font-medium text-danger">Вы уверены? Котик будет грустить! 😿</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmReset(false)}
                    className="glass flex-1 rounded-xl py-2.5 text-sm font-medium hover:bg-surface-hover">Отмена</button>
                  <button onClick={handleReset}
                    className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-medium text-white">Удалить</button>
                </div>
              </div>
            )}
          </motion.div>

          {/* About */}
          <motion.div custom={4} variants={item} initial="hidden" animate="show"
            className="glass-card rounded-2xl px-5 py-5">
            <div className="flex items-start gap-3">
              <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-3xl">
                😸
              </motion.div>
              <div className="text-sm text-muted">
                <p className="mb-1 font-semibold text-foreground">WOK</p>
                <p>Бесплатное приложение для изучения слов с алгоритмом FSRS и котиками.</p>
                <p className="mt-1">Все данные хранятся локально в браузере.</p>
                <p className="mt-2 text-xs opacity-60">v2.0 • Made with 💜 and 🐱</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ClientLayout>
      <SettingsPage />
    </ClientLayout>
  );
}
