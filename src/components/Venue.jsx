import { ArrowUpRight, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import SectionHeading from './SectionHeading.jsx';

const mapUrl = 'https://www.google.com/maps/search/?api=1&query=Casamara+Beach+Resort+Baybay+Roxas+City+Capiz+Philippines';

export default function Venue() {
  return (
    <section id="venue" className="bg-[#570b19] py-24 sm:py-28">
      <div className="section-shell">
        <SectionHeading eyebrow="A LITTLE PIECE OF PARADISE" title="Meet us by the sea" description="A beautiful beachside setting to gather, celebrate, and make memories together." light />
        <motion.div className="grid overflow-hidden border border-[#c5a15b]/45 bg-[#fff8ef] md:grid-cols-[1fr_1.05fr]" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#f5e8d9] text-[#800020]"><MapPin size={20} /></div>
            <p className="text-[10px] font-semibold tracking-[.24em] text-[#73752d]">OUR WEDDING VENUE</p>
            <h3 className="font-display mt-3 text-3xl text-[#570b19]">Casamara Beach Resort</h3>
            <p className="mt-3 text-sm text-[#76665c]">Baybay, Roxas City, Capiz, Philippines</p>
            <p className="mt-5 max-w-md text-sm leading-7 text-[#76665c]">We can’t wait to welcome you to the shore for a heartfelt celebration with the people we love most.</p>
            <a href={mapUrl} target="_blank" rel="noreferrer" className="focus-ring mt-7 inline-flex w-fit items-center gap-2 border-b border-[#800020] pb-1 text-xs font-semibold tracking-[.12em] text-[#800020]">
              OPEN IN GOOGLE MAPS <ArrowUpRight size={14} />
            </a>
          </div>
          <iframe
            title="Map showing Casamara Beach Resort in Roxas City"
            className="h-[310px] w-full border-0 md:h-full md:min-h-[360px]"
            src="https://maps.google.com/maps?q=Casamara%20Beach%20Resort%2C%20Baybay%2C%20Roxas%20City%2C%20Capiz%2C%20Philippines&t=&z=14&ie=UTF8&iwloc=&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </motion.div>
      </div>
    </section>
  );
}
