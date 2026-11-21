import ImageLightbox from './ImageLightbox.jsx';

const invitationImage = '/images/wedding-invitation.png';
const invitationAlt = 'Nathaniel and Kimberly wedding invitation with the reception time, 10:30 AM–3:00 PM, on December 9, 2026.';

export default function Welcome() {
  return (
    <section className="paper-texture px-4 py-14 sm:py-20">
      <div className="section-shell text-center">
        <div className="ornament-line mx-auto w-fit text-xl">❧</div>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#76665c] sm:text-lg">
          Together with our families, we invite you to celebrate our marriage. We’re grateful to share this special day with the people who mean so much to us.
        </p>
        <div className="mx-auto mt-8 max-w-[500px] border border-[#c5a15b]/60 bg-white p-2 shadow-[0_18px_55px_rgba(87,11,25,.1)]">
          <ImageLightbox src={invitationImage} alt={invitationAlt} label="wedding invitation" imageClassName="h-auto w-full" />
        </div>
        <a
          href={invitationImage}
          download="nathaniel-and-kimberly-invitation.png"
          className="focus-ring mt-4 inline-block text-xs font-semibold tracking-[.1em] text-[#800020] underline decoration-[#c5a15b] underline-offset-4"
        >
          Download Invitation
        </a>
      </div>
    </section>
  );
}
