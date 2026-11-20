import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const links = [
  ['The Venue', '#venue'],
  ['Attire', '#attire'],
  ['RSVP', '#rsvp'],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <nav className="section-shell flex h-[82px] items-center justify-between border-b border-[#c5a15b]/30">
        <a href="#home" className="focus-ring font-display text-xl font-semibold tracking-wide text-[#570b19]">N<span className="mx-1 text-[#c5a15b]">&amp;</span>K</a>
        <div className="hidden items-center gap-8 md:flex">
          {links.map(([label, href]) => <a className="focus-ring text-xs font-medium tracking-[.12em] text-[#58433b] transition hover:text-[#800020]" href={href} key={href}>{label}</a>)}
          <a className="rounded-full bg-[#800020] px-5 py-2.5 text-xs font-semibold tracking-[.12em] text-white transition hover:bg-[#570b19]" href="#rsvp">CONFIRM YOUR ATTENDANCE</a>
        </div>
        <button className="focus-ring rounded-full p-2 text-[#570b19] md:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && <div className="border-b border-[#c5a15b]/30 bg-[#fff8ef]/95 px-6 py-4 shadow-lg backdrop-blur md:hidden">
        {links.map(([label, href]) => <a key={href} onClick={() => setOpen(false)} className="block py-3 text-sm text-[#570b19]" href={href}>{label}</a>)}
      </div>}
    </header>
  );
}
