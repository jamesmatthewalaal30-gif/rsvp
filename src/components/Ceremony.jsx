import { ArrowUpRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import SectionHeading from './SectionHeading.jsx';

const mapQuery = 'HQ4V+783, Roxas City-Panay Road, Panay, Capiz';
const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

export default function Ceremony() {
  return (
    <section id="ceremony" className="paper-texture py-24 sm:py-28">
      <div className="section-shell">
        <SectionHeading eyebrow="WEDDING CEREMONY" title="Join us as we say “I do”" description="Wednesday, December 9, 2026 · 9:00 AM" />
        <motion.div className="grid overflow-hidden border border-[#c5a15b]/45 bg-[#fff8ef] md:grid-cols-[1fr_1.05fr]" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#f5e8d9] text-[#800020]"><MapPin size={20} /></div>
            <p className="text-[10px] font-semibold tracking-[.24em] text-[#73752d]">CEREMONY VENUE</p>
            <h3 className="font-display mt-3 text-3xl text-[#570b19]">Panay City Hall</h3>
            <p className="mt-3 text-sm text-[#76665c]">{mapQuery}</p>
            <a href={mapUrl} target="_blank" rel="noreferrer" className="focus-ring mt-7 inline-flex w-fit items-center gap-2 border-b border-[#800020] pb-1 text-xs font-semibold tracking-[.12em] text-[#800020]">
              OPEN IN GOOGLE MAPS <ArrowUpRight size={14} />
            </a>
          </div>
          <iframe
            title="Map showing Panay City Hall"
            className="h-[310px] w-full border-0 md:h-full md:min-h-[360px]"
            src={mapEmbedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>
      </div>
    </section>
  );
}
