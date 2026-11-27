import { useEffect, useState } from 'react';
import { ArrowDown, CalendarDays } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

const weddingDate = new Date('2026-12-09T10:30:00+08:00');
const revealContainer = {
  hidden: {},
  visible: { transition: { delayChildren: 0.08, staggerChildren: 0.16 } },
};
const revealItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
};

function getCountdown() {
  const remaining = Math.max(0, weddingDate.getTime() - Date.now());
  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  };
}

export default function Hero({ isRevealed = false }) {
  const [countdown, setCountdown] = useState(getCountdown);
  const shouldReduceMotion = useReducedMotion();
  const containerVariants = shouldReduceMotion
    ? { hidden: {}, visible: { transition: { duration: 0, staggerChildren: 0 } } }
    : revealContainer;
  const itemVariants = shouldReduceMotion
    ? { hidden: { opacity: 0, y: 0 }, visible: { opacity: 1, y: 0, transition: { duration: 0 } } }
    : revealItem;
  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section id="home" className="paper-texture relative flex min-h-screen items-center overflow-hidden px-4 pb-14 pt-28 sm:pb-20">
      <div className="pointer-events-none absolute -left-28 top-24 h-80 w-80 rounded-full bg-[#73752d]/[.07] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#800020]/[.06] blur-3xl" />
      <motion.div className="relative mx-auto w-full max-w-3xl text-center" variants={containerVariants} initial="hidden" animate={isRevealed ? 'visible' : 'hidden'}>
        <motion.div variants={itemVariants}>
          <p className="font-script text-5xl leading-tight text-[#800020] sm:text-7xl">Nathaniel &amp; Kimberly</p>
          <div className="ornament-line mx-auto mt-3 w-fit text-xl">❧</div>
          <h1 className="mt-3 font-display text-2xl text-[#570b19] sm:text-3xl">A day made for forever</h1>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[.24em] text-[#73752d]">Celebrating our civil wedding</p>
        </motion.div>
        <motion.div variants={itemVariants}>
          <p className="mx-auto mt-7 max-w-xl font-display text-lg italic leading-8 text-[#76665c] sm:text-xl">“He hath made every thing beautiful in his time.”</p>
          <p className="mt-2 text-xs italic tracking-[.12em] text-[#73752d]">Ecclesiastes 3:11 · KJV</p>
        </motion.div>
        <motion.div variants={itemVariants} className="mx-auto mt-6 flex w-fit items-center gap-2 border-y border-[#c5a15b]/60 py-3 font-display text-base text-[#570b19] sm:text-lg">
          <CalendarDays size={16} className="text-[#c5a15b]" />
          Wednesday, December 9, 2026
        </motion.div>
        <motion.div variants={itemVariants} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#wedding-day" className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border border-[#800020] px-6 py-3 text-xs font-semibold tracking-[.12em] text-[#800020] transition hover:bg-[#800020]/[.06] sm:w-auto">
            View Wedding Details <ArrowDown size={14} />
          </a>
          <a href="#rsvp" className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm bg-[#800020] px-6 py-3 text-xs font-semibold tracking-[.12em] text-white shadow-[0_8px_24px_rgba(87,11,25,.17)] transition hover:-translate-y-0.5 hover:bg-[#570b19] sm:w-auto">
            Confirm Your Attendance <ArrowDown size={14} />
          </a>
        </motion.div>
        <motion.p variants={itemVariants} className="mt-6 text-sm font-medium text-[#570b19]">Kindly RSVP by November 30, 2026.</motion.p>
        <motion.div variants={itemVariants}>
          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[.24em] text-[#73752d]">Counting down to our reception</p>
          <div className="mt-3 flex justify-center gap-2.5 sm:gap-4" aria-label="Countdown to the wedding reception">
            {Object.entries(countdown).map(([label, value]) => <div key={label} className="min-w-[59px] border-l border-[#c5a15b]/60 pl-2.5 text-left sm:min-w-[70px] sm:pl-3">
              <span className="font-display text-xl text-[#570b19] sm:text-2xl">{String(value).padStart(2, '0')}</span>
              <span className="ml-1 text-[9px] uppercase tracking-[.1em] text-[#76665c] sm:text-[10px]">{label}</span>
            </div>)}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
