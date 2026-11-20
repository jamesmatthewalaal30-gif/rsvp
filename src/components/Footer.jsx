import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#39251f] py-10 text-center text-[#fff8ef]">
      <div className="font-script text-4xl text-[#e2c58f]">Nate &amp; Kym</div>
      <p className="mt-2 text-[10px] uppercase tracking-[.18em] text-[#e9d8c6]">December 9, 2026 · 10:30 AM–3:00 PM</p>
      <p className="mt-2 text-[10px] text-[#e9d8c6]">Casamara Beach Resort · Baybay, Roxas City, Capiz, Philippines</p>
      <div className="mx-auto my-5 flex items-center justify-center gap-2 text-[#c5a15b]"><span className="h-px w-8 bg-[#c5a15b]/60" /><Heart size={12} /><span className="h-px w-8 bg-[#c5a15b]/60" /></div>
      <p className="text-xs text-[#e9d8c6]">With love, and can't wait to celebrate with you.</p>
      <a href="/admin" className="mt-5 inline-block text-[10px] text-[#e9d8c6]/55 transition hover:text-[#e9d8c6]">Administrator</a>
    </footer>
  );
}
