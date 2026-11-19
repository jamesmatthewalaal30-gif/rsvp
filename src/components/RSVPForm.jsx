import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, LoaderCircle, LockKeyhole } from 'lucide-react';
import { submitRsvp, verifyInvitation } from '../services/googleSheets.js';

export default function RSVPForm({ invitation, onBack, onSuccess }) {
  const [verified, setVerified] = useState(null);
  const [code, setCode] = useState('');
  const [statuses, setStatuses] = useState({});
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!confirmOpen) return undefined;
    cancelButtonRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !loading) {
        setConfirmOpen(false);
        setError('');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmOpen, loading]);

  async function handleVerify(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await verifyInvitation(invitation.invitation_id, code.trim());
      const details = result.invitation;
      setVerified(details);
      setStatuses(Object.fromEntries(details.guests.map((guest) => [guest.guest_id, guest.rsvp_status || ''])));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!verified || !verified.guests.every((guest) => ['attending', 'declined'].includes(statuses[guest.guest_id]))) {
      setError('Please choose attending or not attending for every person on this invitation.');
      return;
    }
    setError('');
    setConfirmOpen(true);
  }

  async function confirmSubmission() {
    setLoading(true);
    setError('');
    try {
      const result = await submitRsvp({
        invitation_id: verified.invitation_id,
        invitation_code: code.trim(),
        responses: verified.guests.map((guest) => ({ guest_id: guest.guest_id, attendance_status: statuses[guest.guest_id] })),
        contact_number: contact.trim(),
      });
      setConfirmed(true);
      onSuccess({ invitation: verified, responses: result.responses });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  if (!verified) return <div className="mx-auto max-w-xl text-left">
    <button className="focus-ring mb-6 inline-flex items-center gap-2 text-xs font-semibold tracking-[.12em] text-[#800020]" onClick={onBack}><ArrowLeft size={15} /> BACK TO SEARCH</button>
    <div className="border border-[#c5a15b]/50 bg-white p-6 sm:p-8">
      <p className="text-[10px] font-semibold tracking-[.2em] text-[#73752d]">INVITATION FOUND</p>
      <h3 className="font-display mt-2 text-2xl text-[#570b19]">{invitation.primary_guest_name}</h3>
      <p className="mt-2 text-sm text-[#76665c]">For privacy, enter the invitation code shared with you to see the guest list and respond.</p>
      <form onSubmit={handleVerify} className="mt-6">
        <label className="mb-2 block text-xs font-semibold text-[#39251f]" htmlFor="invitation-code">Invitation code</label>
        <input id="invitation-code" value={code} onChange={(event) => setCode(event.target.value)} required maxLength={100} autoComplete="one-time-code" className="focus-ring h-12 w-full border border-[#c5a15b]/55 px-4 text-sm outline-none" placeholder="Enter the code on your invitation" />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button disabled={loading} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 bg-[#800020] text-xs font-semibold tracking-[.14em] text-white hover:bg-[#570b19] disabled:opacity-60">
          {loading ? <LoaderCircle className="animate-spin" size={16} /> : <LockKeyhole size={15} />}
          {loading ? 'CHECKING CODE' : 'VIEW INVITATION'}
        </button>
      </form>
    </div>
  </div>;

  if (confirmed) return null;

  const attendingCount = verified.guests.filter((guest) => statuses[guest.guest_id] === 'attending').length;
  const declinedCount = verified.guests.filter((guest) => statuses[guest.guest_id] === 'declined').length;

  return <>
    <div className="mx-auto max-w-2xl text-left">
      <button className="focus-ring mb-6 inline-flex items-center gap-2 text-xs font-semibold tracking-[.12em] text-[#800020]" onClick={() => { setVerified(null); onBack(); }}><ArrowLeft size={15} /> BACK TO SEARCH</button>
      <div className="border border-[#c5a15b]/50 bg-white p-6 sm:p-8">
        <p className="text-[10px] font-semibold tracking-[.2em] text-[#73752d]">YOUR INVITATION</p>
        <h3 className="font-display mt-2 text-2xl text-[#570b19]">{verified.primary_guest_name}</h3>
        <p className="mt-2 text-sm text-[#76665c]">Please let us know for each person included in your invitation.</p>
        <form onSubmit={handleSubmit} className="mt-7">
          <div className="divide-y divide-[#c5a15b]/25 border-y border-[#c5a15b]/35">
            {verified.guests.map((guest) => <fieldset key={guest.guest_id} className="py-5">
              <legend className="mb-3 w-full">
                <span className="font-display text-lg text-[#39251f]">{guest.guest_name}</span>
                <span className="ml-2 text-xs text-[#8d7a70]">{guest.guest_role}</span>
              </legend>
              <div className="flex flex-wrap gap-3">
                {[
                  ['attending', 'Joyfully accepts'],
                  ['declined', 'Regretfully declines'],
                ].map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-2 border px-3 py-2.5 text-xs transition ${statuses[guest.guest_id] === value ? 'border-[#800020] bg-[#800020]/[.045] text-[#570b19]' : 'border-[#e8d9c8] text-[#76665c]'}`}>
                  <input type="radio" name={`attendance-${guest.guest_id}`} value={value} checked={statuses[guest.guest_id] === value} onChange={() => setStatuses((current) => ({ ...current, [guest.guest_id]: value }))} className="accent-[#800020]" />
                  {label}
                </label>)}
              </div>
            </fieldset>)}
          </div>
          <div className="mt-6">
            <label className="text-xs font-semibold text-[#39251f]">Contact number <span className="font-normal text-[#8d7a70]">(optional)</span>
              <input value={contact} onChange={(event) => setContact(event.target.value)} maxLength={40} autoComplete="tel" className="focus-ring mt-2 h-11 w-full border border-[#e4d6c6] px-3 text-sm font-normal outline-none" />
            </label>
          </div>
          {error && !confirmOpen && <ErrorMessage>{error}</ErrorMessage>}
          <button type="submit" disabled={loading} className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 bg-[#800020] text-xs font-semibold tracking-[.14em] text-white transition hover:bg-[#570b19] disabled:cursor-wait disabled:opacity-60">
            CONFIRM YOUR RSVP
          </button>
          <p className="mt-3 text-center text-[11px] text-[#8d7a70]">Your responses can be updated until the RSVP deadline.</p>
        </form>
      </div>
    </div>
    {confirmOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#39251f]/55 px-4 py-8 backdrop-blur-[2px]">
      <section role="dialog" aria-modal="true" aria-labelledby="rsvp-confirm-title" aria-describedby="rsvp-confirm-description" className="my-auto w-full max-w-md border border-[#c5a15b]/60 bg-[#fff8ef] p-6 shadow-[0_24px_70px_rgba(57,37,31,.28)] sm:p-8">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#c5a15b]/55 bg-white text-[#800020]"><Check size={19} /></div>
        <p className="mt-5 text-center text-[10px] font-semibold tracking-[.22em] text-[#73752d]">ONE LAST LOOK</p>
        <h3 id="rsvp-confirm-title" className="font-display mt-2 text-center text-2xl text-[#570b19]">Confirm your RSVP</h3>
        <p id="rsvp-confirm-description" className="mt-2 text-center text-sm text-[#76665c]">You’re responding for {verified.primary_guest_name}’s invitation.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="border border-[#73752d]/25 bg-white p-4 text-center">
            <p className="font-display text-2xl text-[#73752d]">{attendingCount}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#76665c]">Attending</p>
          </div>
          <div className="border border-[#800020]/20 bg-white p-4 text-center">
            <p className="font-display text-2xl text-[#800020]">{declinedCount}</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.12em] text-[#76665c]">Not attending</p>
          </div>
        </div>
        <p className="mt-4 text-center text-xs leading-5 text-[#8d7a70]">You can update these responses again before the RSVP deadline.</p>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button ref={cancelButtonRef} type="button" disabled={loading} onClick={() => { setConfirmOpen(false); setError(''); }} className="focus-ring h-12 border border-[#c5a15b]/70 px-4 text-xs font-semibold tracking-[.1em] text-[#570b19] transition hover:bg-white disabled:opacity-50">REVIEW MY ANSWERS</button>
          <button type="button" disabled={loading} onClick={confirmSubmission} className="focus-ring inline-flex h-12 items-center justify-center gap-2 bg-[#800020] px-4 text-xs font-semibold tracking-[.1em] text-white transition hover:bg-[#570b19] disabled:cursor-wait disabled:opacity-60">
            {loading ? <LoaderCircle className="animate-spin" size={16} /> : null}
            {loading ? 'SENDING RSVP' : 'SUBMIT RSVP'}
          </button>
        </div>
      </section>
    </div>}
  </>;
}

function ErrorMessage({ children }) {
  return <div role="alert" className="mt-4 flex items-start gap-2 text-sm text-[#800020]"><AlertCircle className="mt-0.5 shrink-0" size={16} /><span>{children}</span></div>;
}
