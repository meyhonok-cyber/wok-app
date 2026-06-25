'use client';

import { motion } from 'framer-motion';

interface Props {
  onStart: () => void;
}

export default function Hero({ onStart }: Props) {
  return (
    <section
      className="relative flex min-h-screen flex-col items-center overflow-hidden"
      style={{ backgroundColor: '#21346e' }}
    >
      {/* Background video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-30"
        poster=""
      >
        <source
          src="https://cdn.pixabay.com/video/2020/05/25/39643-424930942_large.mp4"
          type="video/mp4"
        />
      </video>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#21346e]/60 via-[#21346e]/30 to-[#21346e]/90" />

      {/* Content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-between px-6 pb-16 pt-24">
        {/* Top area with text */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-6 text-6xl"
            >
              😸
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-[var(--font-rubik)] text-white"
            style={{ fontFamily: 'var(--font-rubik), sans-serif' }}
          >
            <span className="block text-5xl font-extrabold uppercase tracking-wide sm:text-7xl">
              NEW ERA
            </span>
            <span className="block text-5xl font-extrabold uppercase tracking-wide sm:text-7xl">
              OF DESIGN
            </span>
            <span className="block text-5xl font-extrabold uppercase tracking-wide sm:text-7xl">
              STARTS NOW
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-6 max-w-md text-lg text-white/70"
            style={{ fontFamily: 'var(--font-rubik), sans-serif' }}
          >
            Учи английские слова каждый день.
            <br />
            Бесплатно. С котиками.
          </motion.p>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, type: 'spring' as const, stiffness: 200 }}
          className="mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="group relative"
            style={{ width: 184, height: 65 }}
          >
            {/* SVG background shape */}
            <svg
              className="absolute inset-0 h-full w-full transition-all group-hover:drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]"
              viewBox="0 0 184 65"
              fill="none"
            >
              <rect
                x="1" y="1" width="182" height="63" rx="31.5"
                fill="url(#btn-gradient)"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
              />
              <defs>
                <linearGradient id="btn-gradient" x1="0" y1="0" x2="184" y2="65" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span
              className="relative z-10 text-lg font-bold uppercase tracking-wider text-white"
              style={{ fontFamily: 'var(--font-rubik), sans-serif' }}
            >
              Начать
            </span>
          </motion.button>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-8"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-white/40 text-sm"
            style={{ fontFamily: 'var(--font-rubik), sans-serif' }}
          >
            ↓
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
