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
          eyebrow="KINDLY RSVP BY NOVEMBER 30, 2026"
          title="We’ve saved you a seat"
          description={submission ? null : "We’re keeping our celebration intimate and would love to celebrate with you. Each invited guest may bring one companion. Please register your companion’s full name and confirm attendance for both of you by November 30, 2026."}
        />
        {!submission && <>
          <p className="mx-auto -mt-6 mb-4 max-w-3xl text-center text-sm leading-6 text-[#76665c]">Only invited guests and their registered companions with confirmed RSVPs by the deadline will be accommodated.</p>
          <p className="mx-auto mb-10 max-w-3xl text-center text-sm leading-6 text-[#76665c]">Please submit one RSVP for yourself and your companion, if bringing one. Include both full names so we can reserve your seats.</p>
        </>}
        <div className="mb-10 grid gap-4 md:grid-cols-2">
          <article className="border border-[#c5a15b]/40 bg-white/70 p-6 text-center">
            <UsersRound className="mx-auto mb-4 text-[#800020]" size={21} strokeWidth={1.5} />
            <h3 className="font-display text-xl text-[#570b19]">Can I bring someone with me?</h3>
            <p className="mt-3 text-sm leading-6 text-[#76665c]">Yes, you may bring one companion. Your invitation covers a maximum of two people, including you. Please include your companion’s full name when submitting your RSVP by November 30, 2026.</p>
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
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-6 text-[#76665c]">Need help finding your invitation or updating your RSVP or companion’s name? Text Kym at <a className="font-semibold text-[#570b19] underline underline-offset-2" href="sms:09683773730">09683773730</a>.</p>
        {!submission && !invitation && <p className="mx-auto mt-5 max-w-xl text-center text-[11px] leading-5 text-[#8d7a70]">Your guest details are private. Enter at least two letters from the name on your invitation.</p>}
      </div>
    </section>
  );
}
