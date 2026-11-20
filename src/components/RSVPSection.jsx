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
        <SectionHeading
          eyebrow="KINDLY RSVP ON OR BEFORE NOVEMBER 30, 2026"
          title="We’ve saved you a seat"
          description={submission ? null : 'Kindly confirm your attendance by November 30, 2026.'}
        />
        {!submission && <>
          <p className="mx-auto -mt-6 mb-10 max-w-3xl text-center text-sm leading-6 text-[#76665c]">Only guests with confirmed registrations by the deadline will be accommodated.</p>
        </>}
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <article className="border border-[#c5a15b]/40 bg-white/70 p-6 text-center">
            <UsersRound className="mx-auto mb-4 text-[#800020]" size={21} strokeWidth={1.5} />
            <h3 className="font-display text-xl text-[#570b19]">Can I bring someone with me?</h3>
            <p className="mt-3 text-sm leading-6 text-[#76665c]">Yes, you may bring one guest. Your invitation covers a maximum of two people, including you.</p>
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
        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-5 text-[#8d7a70]">Please keep your invitation private.</p>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm leading-6 text-[#76665c]">Need help? Text Kym at <a className="font-semibold text-[#570b19] underline underline-offset-2" href="sms:09683773730">09683773730</a>.</p>
      </div>
    </section>
  );
}
