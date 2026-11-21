import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#570b19] px-4 py-16 text-center text-[#fff8ef] sm:py-20">
      <p className="font-display text-sm italic text-[#e9d8c6]">With love,</p>
      <p className="mt-3 font-script text-5xl text-[#e2c58f] sm:text-6xl">Nathaniel &amp; Kimberly</p>
      <div className="mx-auto my-5 flex items-center justify-center gap-2 text-[#c5a15b]"><span className="h-px w-8 bg-[#c5a15b]/60" /><Heart size={12} /><span className="h-px w-8 bg-[#c5a15b]/60" /></div>
      <p className="text-sm text-[#e9d8c6]">We can’t wait to celebrate with you.</p>
      <p className="mt-5 text-xs tracking-[.18em] text-[#e2c58f]">December 9, 2026</p>
    </footer>
  );
}
