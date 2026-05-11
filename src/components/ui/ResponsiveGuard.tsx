"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DevicePhoneMobileIcon, ComputerDesktopIcon, SparklesIcon } from "@heroicons/react/24/outline";

export function ResponsiveGuard({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkSize = () => {
      // 1024px is the standard 'lg' breakpoint in Tailwind and common for tablets/laptops
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // Prevent flash on mount
  if (!mounted) return <div className="invisible">{children}</div>;

  return (
    <>
      <AnimatePresence mode="wait">
        {isMobile ? (
          <motion.div
            key="mobile-restriction"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950 p-6 text-center text-white"
          >
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-[var(--app-primary)] opacity-[0.03] blur-[120px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="relative mb-10"
            >
              <div className="flex h-32 w-32 items-center justify-center rounded-[32px] bg-zinc-900 ring-1 ring-white/10 shadow-2xl">
                <DevicePhoneMobileIcon className="h-16 w-16 text-[var(--app-primary)]" />
              </div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -right-2 h-10 w-10 flex items-center justify-center rounded-full bg-zinc-800 ring-1 ring-white/20 shadow-lg"
              >
                <SparklesIcon className="h-5 w-5 text-amber-400" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="max-w-md"
            >
              <h1 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
                Desktop Mode Required
              </h1>
              <p className="text-lg font-medium text-zinc-400 leading-relaxed">
                We're currently perfecting the experience for smaller screens. 
                Our app is in the <span className="text-white font-extrabold">Building Phase</span> for mobile.
              </p>
              
              <div className="mt-10 flex flex-col gap-4">
                <div className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/5 p-4 transition-all hover:bg-white/10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900">
                    <ComputerDesktopIcon className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-white">Use a Desktop or Tablet</p>
                    <p className="text-xs text-zinc-500">Switch to a larger screen to continue.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="mt-auto pb-12">
               <span className="text-xs font-black tracking-[0.2em] text-zinc-600 uppercase">ANSH Bookings • Beta</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="main-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full w-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
