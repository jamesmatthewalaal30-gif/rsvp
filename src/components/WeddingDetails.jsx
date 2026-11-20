import { CalendarDays, Clock3, MapPin, Waves } from 'lucide-react';
import { motion } from 'framer-motion';
import SectionHeading from './SectionHeading.jsx';

const cards = [
  { icon: CalendarDays, label: 'THE DATE', title: 'Wednesday', detail: 'December 9, 2026' },
  { icon: Clock3, label: 'THE TIME', title: '10:30 AM–3:00 PM', detail: 'Please arrive a little early so we can begin together.' },
  { icon: Waves, label: 'THE CELEBRATION', title: 'Wedding reception', detail: 'A joyful day by the sea' },
];

export default function WeddingDetails() {
  return (
    <section id="our-day" className="bg-white py-24 sm:py-28">
      <div className="section-shell">
        <SectionHeading eyebrow="THE BEGINNING OF FOREVER" title="Our wedding day" description="We are so grateful to have you in our lives. It would mean the world to celebrate this day together." />
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map(({ icon: Icon, label, title, detail }, index) => <motion.article key={label} className="border border-[#c5a15b]/35 bg-[#fff8ef]/60 px-6 py-8 text-center" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .1 }}>
            <Icon className="mx-auto mb-5 text-[#800020]" size={22} strokeWidth={1.4} />
            <p className="text-[10px] font-semibold tracking-[.22em] text-[#73752d]">{label}</p>
            <h3 className="font-display mt-3 text-xl text-[#570b19]">{title}</h3>
            <p className="mt-2 text-sm text-[#76665c]">{detail}</p>
          </motion.article>)}
        </div>
      </div>
    </section>
  );
}
