import SectionHeading from './SectionHeading.jsx';
import ImageLightbox from './ImageLightbox.jsx';

export default function AttireGuide() {
  return (
    <section id="attire" className="paper-texture px-4 py-16 sm:py-24">
      <div className="section-shell">
        <SectionHeading eyebrow="DRESS FOR THE OCCASION" title="Beach Semi-Formal" />
        <p className="mb-7 -mt-7 flex flex-wrap items-center justify-center gap-2 text-center text-sm text-[#76665c]">
          We’d love to see you in burgundy or olive.
          <span className="inline-flex items-center gap-1.5" aria-label="Preferred colors: burgundy and olive">
            <span className="h-3.5 w-3.5 rounded-full border border-[#800020]/20 bg-[#800020]" />
            <span className="h-3.5 w-3.5 rounded-full border border-[#73752d]/20 bg-[#73752d]" />
          </span>
        </p>
        <div className="mx-auto max-w-3xl border border-[#c5a15b]/60 bg-white p-2 shadow-[0_18px_55px_rgba(87,11,25,.08)]">
          <ImageLightbox
            src="/images/attire-guide.png"
            alt="Illustrated attire guide showing burgundy and olive beach semi-formal outfit inspiration"
            label="attire guide"
            imageClassName="h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
