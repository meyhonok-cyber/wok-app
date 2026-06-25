'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, Settings, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Главная' },
  { href: '/stats', icon: BarChart3, label: 'Стат.' },
  { href: '/add', icon: Plus, label: 'Добавить' },
  { href: '/settings', icon: Settings, label: 'Ещё' },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith('/study')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-strong safe-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-xs transition-colors"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={{ type: 'spring' as const, stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className={`relative z-10 ${active ? 'text-primary' : 'text-muted'}`}
              />
              <span className={`relative z-10 font-medium ${active ? 'text-primary' : 'text-muted'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
