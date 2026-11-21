import { useEffect, useState } from 'react';
import SectionHeading from './SectionHeading.jsx';
import GuestSearch from './GuestSearch.jsx';
import RSVPForm from './RSVPForm.jsx';
import Confirmation from './Confirmation.jsx';

const RSVP_DEADLINE = new Date('2026-11-30T23:59:59.999+08:00');

export default function RSVPSection() {
  const [invitation, setInvitation] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [rsvpOpen, setRsvpOpen] = useState(() => Date.now() <= RSVP_DEADLINE.getTime());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRsvpOpen(Date.now() <= RSVP_DEADLINE.getTime());
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section id="rsvp" className="bg-[#f5e8d9] px-4 py-16 sm:py-24">
      <div className="section-shell">
        {submission ? <Confirmation submission={submission} /> : <>
          <SectionHeading eyebrow="KINDLY RSVP BY NOVEMBER 30, 2026" title="We’ve saved you a seat" />
          <div className="mx-auto mb-8 -mt-7 max-w-3xl text-center text-sm leading-6 text-[#76665c]">
            <p>Kindly RSVP by November 30, 2026.</p>
            <p className="mt-2">You may bring one companion. Please include their full name when registering.</p>
            <p className="mt-2">Only invited guests and their registered companions with confirmed RSVPs by the deadline will be accommodated.</p>
          </div>
          {rsvpOpen
            ? invitation
              ? <RSVPForm invitation={invitation} onBack={() => setInvitation(null)} onSuccess={setSubmission} />
              : <GuestSearch onSelect={setInvitation} />
            : <div className="mx-auto max-w-2xl border border-[#c5a15b]/50 bg-white p-6 text-center sm:p-8">
              <h3 className="font-display text-2xl text-[#570b19]">Online RSVP is now closed.</h3>
              <p className="mt-3 text-sm leading-6 text-[#76665c]">For questions about your registration, please text Kym at <a className="font-semibold text-[#570b19] underline underline-offset-2" href="sms:09683773730">09683773730</a>.</p>
            </div>}
        </>}
        <div className="mx-auto mt-8 max-w-2xl space-y-1 text-center text-xs leading-5 text-[#76665c]">
          <p>Please keep your invitation private and avoid sharing it publicly.</p>
          <p>Need help finding your invitation or updating your RSVP? Text Kym at <a className="font-semibold text-[#570b19] underline underline-offset-2" href="sms:09683773730">09683773730</a>.</p>
        </div>
      </div>
    </section>
  );
}
