import type { Metadata, Viewport } from 'next';
import { Geist, Rubik } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin', 'latin-ext'] });
const rubik = Rubik({ variable: '--font-rubik', subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'WOK — Учи слова',
  description: 'Бесплатное приложение для изучения иностранных слов с интервальным повторением',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'WOK' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${geist.variable} ${rubik.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
