import SectionHeading from './SectionHeading.jsx';

export default function AttireGuide() {
  return (
    <section id="attire" className="paper-texture py-24 sm:py-28">
      <div className="section-shell">
        <SectionHeading eyebrow="DRESS FOR THE OCCASION" title="Beach semi-formal" description="Burgundy or olive are preferred." />
        <div className="mx-auto max-w-3xl border border-[#c5a15b]/60 bg-white p-2 shadow-[0_18px_55px_rgba(87,11,25,.08)]">
          <img className="h-auto w-full" src="/images/attire-guide.png" alt="Attire guide showing burgundy and olive beach semi-formal outfit inspiration" loading="lazy" />
        </div>
      </div>
    </section>
  );
}
