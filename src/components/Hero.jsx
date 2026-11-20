import { useEffect, useState } from 'react';
import { ArrowDown, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const weddingDate = new Date('2026-12-09T10:30:00+08:00');

function getCountdown() {
  const remaining = Math.max(0, weddingDate.getTime() - Date.now());
  return {
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining / 3_600_000) % 24),
    minutes: Math.floor((remaining / 60_000) % 60),
    seconds: Math.floor((remaining / 1_000) % 60),
  };
}

export default function Hero() {
  const [countdown, setCountdown] = useState(getCountdown);
  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section id="home" className="paper-texture relative flex min-h-[760px] items-center overflow-hidden pb-16 pt-28 sm:min-h-[810px]">
      <div className="pointer-events-none absolute -left-28 top-24 h-80 w-80 rounded-full bg-[#73752d]/[.07] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-[#800020]/[.06] blur-3xl" />
      <div className="section-shell relative grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
        <motion.div className="text-center sm:text-left" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8 }}>
          <div className="mb-7 flex items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[.32em] text-[#73752d] sm:justify-start">
            <span className="h-px w-9 bg-[#c5a15b]" /> WEDDING RECEPTION <span className="h-px w-9 bg-[#c5a15b]" />
          </div>
          <p className="font-script -mb-1 text-5xl leading-none text-[#800020] sm:text-6xl">Nate &amp; Kym</p>
          <h1 className="font-display text-[2.6rem] leading-[1.18] text-[#570b19] sm:text-6xl lg:text-[4.25rem]">A day made<br />for <span className="font-script text-[3.6rem] text-[#800020] sm:text-7xl">forever</span></h1>
          <div className="ornament-line mx-auto mt-5 w-fit text-xl sm:mx-0">❧</div>
          <p className="mt-5 max-w-lg text-base leading-7 text-[#76665c] sm:text-lg">Together with their families, Nathaniel and Kimberly invite you to celebrate their marriage at their wedding reception.</p>
          <div className="mt-7 flex items-center justify-center gap-2 text-sm text-[#570b19] sm:justify-start"><MapPin className="shrink-0 text-[#c5a15b]" size={16} /> Casamara Beach Resort · Baybay, Roxas City, Capiz, Philippines</div>
          <div className="mt-8 flex flex-wrap items-end justify-center gap-x-6 gap-y-3 sm:justify-start">
            <div className="font-display text-4xl text-[#570b19]">09 <span className="text-2xl text-[#c5a15b]">·</span> DEC <span className="text-2xl text-[#c5a15b]">·</span> 2026</div>
            <div className="pb-1 text-xs uppercase tracking-[.2em] text-[#76665c]">Wednesday · 10:30 AM–3:00 PM</div>
          </div>
          <p className="mt-3 text-sm text-[#76665c]">Please arrive a little early so we can begin together.</p>
          <p className="mt-4 font-semibold text-sm text-[#570b19]">Kindly RSVP by November 30, 2026.</p>
          <div className="mt-7 flex justify-center gap-2.5 sm:justify-start sm:gap-3" aria-label="Countdown to the wedding reception">
            {Object.entries(countdown).map(([label, value]) => <div key={label} className="min-w-[59px] border-l border-[#c5a15b]/60 pl-2.5 sm:min-w-[70px] sm:pl-3">
              <span className="font-display text-xl text-[#570b19] sm:text-2xl">{String(value).padStart(2, '0')}</span>
              <span className="ml-1 text-[9px] uppercase tracking-[.1em] text-[#76665c] sm:text-[10px]">{label}</span>
            </div>)}
          </div>
          <a href="#rsvp" className="mt-9 inline-flex items-center justify-center gap-3 rounded-sm bg-[#800020] px-7 py-4 text-[11px] font-semibold tracking-[.16em] text-[#fff8ef] shadow-[0_8px_24px_rgba(87,11,25,.17)] transition hover:-translate-y-0.5 hover:bg-[#570b19]">
            CONFIRM YOUR ATTENDANCE <ArrowDown size={15} />
          </a>
        </motion.div>
        <motion.div className="mx-auto w-full max-w-[410px] lg:max-w-[450px]" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .9, delay: .15 }}>
          <div className="floral-frame relative rounded-t-[48%] rounded-b-[10px] p-2.5">
            <img className="aspect-[4/5] w-full rounded-t-[48%] rounded-b-[6px] object-cover" src="/images/wedding-invitation.png" alt="Together with their families, Nathaniel and Kimberly invite you to celebrate their marriage at their wedding reception on Wednesday, December 9, 2026, from 10:30 AM to 3:00 PM at Casamara Beach Resort, Baybay, Roxas City, Capiz, Philippines." fetchPriority="high" />
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#c5a15b]/60 bg-[#fff8ef] px-5 py-2 font-display text-sm italic text-[#570b19] shadow-sm">With love, Nate &amp; Kym</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
