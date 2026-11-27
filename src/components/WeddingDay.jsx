import { useState } from 'react';
import { ChevronDown, Church, Clock3, MapPin, Waves } from 'lucide-react';

const directions = [
  {
    id: 'ceremony-map',
    title: 'Ceremony Directions — Panay City Hall',
    note: 'For Ninongs and Ninangs only.',
    query: 'Panay City Hall, Roxas City-Panay Road, Panay, Capiz, Philippines',
  },
  {
    id: 'reception-map',
    title: 'Reception Directions — Casamara Beach Resort',
    note: '',
    query: 'Casamara Beach Resort, Baybay, Roxas City, Capiz, Philippines',
  },
];

function MapPanel({ panel }) {
  const [expanded, setExpanded] = useState(false);
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(panel.query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(panel.query)}`;

  return (
    <div className="border border-[#c5a15b]/50 bg-white/80">
      <button
        type="button"
        className="focus-ring flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 text-left sm:px-5"
        aria-expanded={expanded}
        aria-controls={panel.id}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-start gap-3">
          <MapPin className="mt-0.5 shrink-0 text-[#800020]" size={17} />
          <span>
            <span className="block font-display text-base text-[#570b19]">{panel.title}</span>
            {panel.note && <span className="mt-1 block text-[11px] text-[#73752d]">{panel.note}</span>}
          </span>
        </span>
        <ChevronDown className={`shrink-0 text-[#800020] transition-transform ${expanded ? 'rotate-180' : ''}`} size={18} />
      </button>
      <div id={panel.id} hidden={!expanded} className="border-t border-[#c5a15b]/30 p-3 sm:p-4">
        {expanded && <>
          <iframe
            title={panel.title}
            className="h-56 w-full border-0 sm:h-72"
            src={mapUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <a className="focus-ring mt-3 inline-block text-xs font-semibold text-[#800020] underline underline-offset-4" href={directionsUrl} target="_blank" rel="noreferrer">
            Open directions in Google Maps
          </a>
        </>}
      </div>
    </div>
  );
}

export default function WeddingDay() {
  return (
    <section id="wedding-day" className="paper-texture px-4 py-16 sm:py-24">
      <div className="section-shell">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-12">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[.28em] text-[#73752d]">Wednesday, December 9, 2026</p>
          <h2 className="font-display text-4xl leading-tight text-[#570b19] sm:text-5xl">Our Civil Wedding Day</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[.9fr_1.1fr] md:gap-x-6 md:gap-y-5">
          <article className="order-1 border border-[#c5a15b]/55 bg-white/80 p-6 md:order-none sm:p-8">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#73752d]/10 text-[#73752d]"><Church size={20} strokeWidth={1.6} /></div>
            <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#73752d]">CEREMONY</p>
            <h3 className="font-display mt-2 text-2xl text-[#570b19]">Civil Wedding Ceremony</h3>
            <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#800020]"><Clock3 size={16} /> 9:00 AM</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-[#39251f]"><MapPin size={16} className="shrink-0 text-[#c5a15b]" /> Panay City Hall</p>
            <p className="mt-3 text-sm leading-6 text-[#76665c]">For our principal sponsors, our Ninongs and Ninangs, only.</p>
          </article>
          <article className="order-3 relative overflow-hidden border border-[#c5a15b]/70 bg-[#800020] p-6 text-[#fff8ef] shadow-[0_14px_40px_rgba(87,11,25,.14)] md:order-none sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full border border-[#c5a15b]/30" />
            <div className="relative">
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-[#e2c58f]"><Waves size={20} strokeWidth={1.6} /></div>
              <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#e2c58f]">RECEPTION</p>
              <h3 className="font-display mt-2 text-2xl text-white">Wedding Reception</h3>
              <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#f1dba9]"><Clock3 size={16} /> 10:30 AM–3:00 PM</p>
              <p className="mt-2 flex items-center gap-2 text-sm text-white"><MapPin size={16} className="shrink-0 text-[#e2c58f]" /> Casamara Beach Resort</p>
              <p className="mt-1 pl-6 text-sm text-[#f6e8d9]">Baybay, Roxas City, Capiz, Philippines</p>
              <p className="mt-4 text-sm leading-6 text-[#f6e8d9]">For all invited guests. Please arrive a little early so we can begin together.</p>
            </div>
          </article>
          <div className="order-2 md:order-none">
            <MapPanel panel={directions[0]} />
          </div>
          <div className="order-4 md:order-none">
            <MapPanel panel={directions[1]} />
          </div>
        </div>
      </div>
    </section>
  );
}
