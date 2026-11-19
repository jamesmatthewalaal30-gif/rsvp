import SectionHeading from './SectionHeading.jsx';

export default function AttireGuide() {
  return (
    <section id="attire" className="paper-texture py-24 sm:py-28">
      <div className="section-shell">
        <SectionHeading eyebrow="DRESS FOR THE OCCASION" title="Beach semi-formal" description="We'd love to see you in burgundy or olive. Think polished, comfortable, and ready for the seaside." />
        <div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <div className="order-2 lg:order-1">
            <div className="mb-8 grid gap-5 sm:grid-cols-2">
              <article className="border-t border-[#c5a15b] pt-5">
                <p className="text-[10px] font-semibold tracking-[.22em] text-[#73752d]">FOR WOMEN</p>
                <h3 className="font-display mt-2 text-xl text-[#570b19]">Easy, elegant, airy</h3>
                <p className="mt-2 text-sm leading-6 text-[#76665c]">Flowy midi or maxi dresses with dressy flats or wedges.</p>
              </article>
              <article className="border-t border-[#c5a15b] pt-5">
                <p className="text-[10px] font-semibold tracking-[.22em] text-[#73752d]">FOR MEN</p>
                <h3 className="font-display mt-2 text-xl text-[#570b19]">Relaxed, refined</h3>
                <p className="mt-2 text-sm leading-6 text-[#76665c]">Linen button-downs with tailored trousers and loafers.</p>
              </article>
            </div>
            <p className="mb-3 text-[10px] font-semibold tracking-[.2em] text-[#73752d]">OUR PREFERRED COLORS</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-full border border-[#800020]/20 bg-white/70 px-3 py-2 text-xs"><span className="h-4 w-4 rounded-full bg-[#800020]" /> Burgundy</div>
              <div className="flex items-center gap-2 rounded-full border border-[#73752d]/25 bg-white/70 px-3 py-2 text-xs"><span className="h-4 w-4 rounded-full bg-[#73752d]" /> Olive</div>
            </div>
          </div>
          <div className="order-1 border border-[#c5a15b]/60 bg-white p-2 shadow-[0_18px_55px_rgba(87,11,25,.08)] lg:order-2">
            <img className="h-auto w-full" src="/images/attire-guide.png" alt="Attire guide showing burgundy and olive beach semi-formal outfit inspiration" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
}
