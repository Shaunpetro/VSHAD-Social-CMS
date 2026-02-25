// apps/web/src/app/components/splash-screen.tsx
'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 20;
        return Math.min(next, 95);
      });
    }, 200);

    const timer = setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setIsLoading(false), 400);
    }, 2200);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const statusText =
    progress < 25
      ? 'Initializing...'
      : progress < 50
        ? 'Connecting to AI...'
        : progress < 75
          ? 'Loading workspace...'
          : progress < 95
            ? 'Preparing dashboard...'
            : 'Ready!';

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
              <Image
                src="/assets/images/splash-bg.png"
                alt=""
                fill
                className="object-cover"
                priority
              />
              {/* Dark overlay for readability */}
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-8">
              {/* Logo with pulse animation */}
              <motion.div
                animate={{
                  scale: [1, 1.04, 1],
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Image
                  src="/assets/logos/vshad-logo.png"
                  alt="VSHAD"
                  width={120}
                  height={120}
                  priority
                  className="rounded-2xl"
                />
              </motion.div>

              {/* App Name */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="flex flex-col items-center gap-2"
              >
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  VSHAD <span className="text-white/70">RoboSocial</span>
                </h1>
                <p className="text-sm text-white/50">
                  AI-powered content automation
                </p>
              </motion.div>

              {/* Progress Bar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center gap-3 w-72"
              >
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/80 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                {/* Status Text */}
                <motion.p
                  className="text-xs text-white/40"
                  key={statusText}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {statusText}
                </motion.p>
              </motion.div>

              {/* Powered by ATG DesEng */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="flex items-center gap-2 mt-4"
              >
                <span className="text-xs text-white/30">Powered by</span>
                <Image
                  src="/assets/logos/atg-deseng-logo.png"
                  alt="ATG DesEng"
                  width={80}
                  height={24}
                  className="opacity-40"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}