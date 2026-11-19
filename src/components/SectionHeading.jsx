import { motion } from 'framer-motion';

export default function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <motion.div
      className="mx-auto mb-12 max-w-2xl text-center"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55 }}
    >
      <p className={`mb-3 text-[11px] font-semibold uppercase tracking-[.28em] ${light ? 'text-[#e7d2ab]' : 'text-[#73752d]'}`}>{eyebrow}</p>
      <h2 className={`font-display text-4xl leading-tight sm:text-5xl ${light ? 'text-[#fff8ef]' : 'text-[#570b19]'}`}>{title}</h2>
      {description && <p className={`mt-4 leading-7 ${light ? 'text-[#f6e8d9]' : 'text-[#76665c]'}`}>{description}</p>}
    </motion.div>
  );
}
