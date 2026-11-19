import { useState } from 'react';
import { LockKeyhole, UsersRound } from 'lucide-react';
import SectionHeading from './SectionHeading.jsx';
import GuestSearch from './GuestSearch.jsx';
import RSVPForm from './RSVPForm.jsx';
import Confirmation from './Confirmation.jsx';

export default function RSVPSection() {
  const [invitation, setInvitation] = useState(null);
  const [submission, setSubmission] = useState(null);
  return (
    <section id="rsvp" className="bg-[#f5e8d9] py-24 sm:py-28">
      <div className="section-shell">
        <SectionHeading eyebrow="WE SAVED YOU A SEAT" title="Kindly RSVP" description={submission ? null : "Search for the name on your invitation to find your party. Every guest may respond individually."} />
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <article className="border border-[#c5a15b]/40 bg-white/70 p-6 text-center">
            <UsersRound className="mx-auto mb-4 text-[#800020]" size={21} strokeWidth={1.5} />
            <h3 className="font-display text-xl text-[#570b19]">Can I bring someone with me?</h3>
            <p className="mt-3 text-sm leading-6 text-[#76665c]">Due to space and seating limits, we can only welcome the people named on your invitation. Thank you for understanding.</p>
          </article>
          <article className="border border-[#c5a15b]/40 bg-white/70 p-6 text-center">
            <LockKeyhole className="mx-auto mb-4 text-[#800020]" size={21} strokeWidth={1.5} />
            <h3 className="font-display text-xl text-[#570b19]">A small privacy note</h3>
            <p className="mt-3 text-sm leading-6 text-[#76665c]">We’re keeping our celebration intimate. Please keep your invitation private and avoid forwarding or sharing it publicly.</p>
          </article>
        </div>
        {submission ? <Confirmation submission={submission} /> : invitation
          ? <RSVPForm invitation={invitation} onBack={() => setInvitation(null)} onSuccess={setSubmission} />
          : <GuestSearch onSelect={setInvitation} />}
        {!submission && !invitation && <p className="mx-auto mt-5 max-w-xl text-center text-[11px] leading-5 text-[#8d7a70]">Your guest details are private. Enter at least two letters from the name on your invitation.</p>}
      </div>
    </section>
  );
}
