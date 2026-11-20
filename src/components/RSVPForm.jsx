import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, LoaderCircle, LockKeyhole } from 'lucide-react';
import { submitRsvp, verifyInvitation } from '../services/googleSheets.js';

export default function RSVPForm({ invitation, onBack, onSuccess }) {
  const [verified, setVerified] = useState(null);
  const [code, setCode] = useState('');
  const [attendance, setAttendance] = useState('');
  const [bringCompanion, setBringCompanion] = useState(null);
  const [companionAttendance, setCompanionAttendance] = useState('');
  const [companionName, setCompanionName] = useState('');
  const [editingCompanionName, setEditingCompanionName] = useState(false);
  const [contact, setContact] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
      const primary = details.guests.find((guest) => guest.guest_role === 'Primary Guest');
      const companion = details.guests.find((guest) => guest.guest_role === 'Companion');
      setVerified(details);
      setEditingCompanionName(false);
      setAttendance(primary?.rsvp_status || '');
      setCompanionAttendance(companion?.rsvp_status || '');
      setBringCompanion(companion ? null : primary?.rsvp_status === 'attending' ? false : null);
      setCompanionName(companion?.guest_name || '');
      setContact(details.contact_number || '');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!verified || !['attending', 'declined'].includes(attendance)) {
      setError('Please choose Joyfully accepts or Regretfully declines.');
      return;
    }
    if (!contact.trim()) {
      setError('Please enter one mobile number for this invitation.');
      return;
    }
    const hasRegisteredCompanion = verified.guests.some((guest) => guest.guest_role === 'Companion');
    const allowsAdditionalGuest = Number(verified.allocated_seats) > 1;
    if (hasRegisteredCompanion && !['attending', 'declined'].includes(companionAttendance)) {
      setError('Please choose Joyfully accepts or Regretfully declines for your guest.');
      return;
    }
    if (!hasRegisteredCompanion && allowsAdditionalGuest && attendance === 'attending' && typeof bringCompanion !== 'boolean') {
      setError('Please choose Yes or No for bringing an additional guest.');
      return;
    }
    if (hasRegisteredCompanion && !companionName.trim()) {
      setError('Please enter your guest’s full name.');
      return;
    }
    if (!hasRegisteredCompanion && attendance === 'attending' && bringCompanion && !companionName.trim()) {
      setError('Please enter your guest’s full name.');
      return;
    }
    setError('');
    setConfirmOpen(true);
  }

  async function confirmSubmission() {
    setLoading(true);
    setError('');
    try {
      const hasRegisteredCompanion = verified.guests.some((guest) => guest.guest_role === 'Companion');
      const allowsAdditionalGuest = Number(verified.allocated_seats) > 1;
      const includeCompanion = hasRegisteredCompanion ||
        (allowsAdditionalGuest && attendance === 'attending' && bringCompanion === true);
      const result = await submitRsvp({
        invitation_id: verified.invitation_id,
        invitation_code: code.trim(),
        attendance_status: attendance,
        bring_companion: includeCompanion,
        companion_name: includeCompanion ? companionName.trim() : '',
        companion_attendance_status: hasRegisteredCompanion
          ? companionAttendance
          : includeCompanion
            ? 'attending'
            : '',
        contact_number: contact.trim(),
      });
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

  const hasRegisteredCompanion = verified.guests.some((guest) => guest.guest_role === 'Companion');
  const allowsAdditionalGuest = Number(verified.allocated_seats) > 1;
  const primaryAttending = attendance === 'attending';
  const companionAttending = hasRegisteredCompanion
    ? companionAttendance === 'attending'
    : allowsAdditionalGuest && primaryAttending && bringCompanion === true;
  const seatsReserved = (primaryAttending ? 1 : 0) + (companionAttending ? 1 : 0);

  return <>
    <div className="mx-auto max-w-2xl text-left">
      <button className="focus-ring mb-6 inline-flex items-center gap-2 text-xs font-semibold tracking-[.12em] text-[#800020]" onClick={() => { setVerified(null); onBack(); }}><ArrowLeft size={15} /> BACK TO SEARCH</button>
      <div className="border border-[#c5a15b]/50 bg-white p-6 sm:p-8">
        <p className="text-[10px] font-semibold tracking-[.2em] text-[#73752d]">YOUR INVITATION</p>
        <h3 className="font-display mt-2 text-2xl text-[#570b19]">{verified.primary_guest_name}</h3>
        <p className="mt-2 text-sm text-[#76665c]">{allowsAdditionalGuest ? 'Please submit one RSVP for yourself and your guest, if bringing one.' : 'Please submit your RSVP for yourself.'}</p>
        <form onSubmit={handleSubmit} className="mt-7">
          <fieldset>
            <legend className="mb-3 text-xs font-semibold text-[#39251f]">Your response</legend>
            <div className="flex flex-wrap gap-3">
              {[
                ['attending', 'Joyfully accepts'],
                ['declined', 'Regretfully declines'],
              ].map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-2 border px-3 py-2.5 text-xs transition ${attendance === value ? 'border-[#800020] bg-[#800020]/[.045] text-[#570b19]' : 'border-[#e8d9c8] text-[#76665c]'}`}>
                <input type="radio" name="attendance" value={value} checked={attendance === value} onChange={() => {
                  if (!hasRegisteredCompanion) {
                    if (value === 'declined') {
                      setBringCompanion(false);
                    } else if (attendance === 'declined') {
                      setBringCompanion(null);
                    }
                  }
                  setAttendance(value);
                }} className="accent-[#800020]" />
                {label}
              </label>)}
            </div>
          </fieldset>
          {!hasRegisteredCompanion && allowsAdditionalGuest && attendance === 'attending' && <fieldset className="mt-6">
            <legend className="mb-3 text-xs font-semibold text-[#39251f]">Will you bring one additional guest?</legend>
            <div className="flex gap-3">
              {[['yes', true], ['no', false]].map(([label, value]) => <label key={label} className={`flex cursor-pointer items-center gap-2 border px-4 py-2.5 text-xs transition ${bringCompanion === value ? 'border-[#800020] bg-[#800020]/[.045] text-[#570b19]' : 'border-[#e8d9c8] text-[#76665c]'}`}>
                <input type="radio" name="bring-companion" checked={bringCompanion === value} onChange={() => setBringCompanion(value)} className="accent-[#800020]" />
                {label === 'yes' ? 'Yes' : 'No'}
              </label>)}
            </div>
          </fieldset>}
          {!hasRegisteredCompanion && !allowsAdditionalGuest && attendance === 'attending' && <p className="mt-6 text-sm text-[#76665c]">This invitation is for the named guest only.</p>}
          {hasRegisteredCompanion && <>
            <div className="mt-7 border-t border-[#e4d6c6] pt-6">
              {companionName && !editingCompanionName
                ? <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[.2em] text-[#73752d]">ADDITIONAL GUEST</p>
                    <h4 className="font-display mt-2 text-2xl text-[#570b19]">{companionName}</h4>
                  </div>
                  <button type="button" onClick={() => setEditingCompanionName(true)} className="focus-ring text-[10px] font-semibold tracking-[.08em] text-[#800020]">EDIT GUEST NAME</button>
                </div>
                : <>
                  <label className="block text-xs font-semibold text-[#39251f]" htmlFor="companion-name">Guest’s full name</label>
                  <input id="companion-name" value={companionName} onChange={(event) => setCompanionName(event.target.value)} required maxLength={120} autoComplete="name" className="focus-ring mt-2 h-11 w-full border border-[#e4d6c6] px-3 text-sm font-normal outline-none" />
                  {companionName && <button type="button" onClick={() => setEditingCompanionName(false)} className="focus-ring mt-2 text-[10px] font-semibold tracking-[.08em] text-[#800020]">DONE</button>}
                </>}
            </div>
            <fieldset className="mt-6">
              <legend className="mb-3 text-xs font-semibold text-[#39251f]">Guest’s response</legend>
              <div className="flex flex-wrap gap-3">
                {[
                  ['attending', 'Joyfully accepts'],
                  ['declined', 'Regretfully declines'],
                ].map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-2 border px-3 py-2.5 text-xs transition ${companionAttendance === value ? 'border-[#800020] bg-[#800020]/[.045] text-[#570b19]' : 'border-[#e8d9c8] text-[#76665c]'}`}>
                  <input type="radio" name="companion-attendance" value={value} checked={companionAttendance === value} onChange={() => setCompanionAttendance(value)} className="accent-[#800020]" />
                  {label}
                </label>)}
              </div>
            </fieldset>
          </>}
          {!hasRegisteredCompanion && attendance === 'attending' && bringCompanion && <div className="mt-5">
            <label className="block text-xs font-semibold text-[#39251f]" htmlFor="companion-name">Guest’s full name</label>
            <input id="companion-name" value={companionName} onChange={(event) => setCompanionName(event.target.value)} required maxLength={120} autoComplete="name" className="focus-ring mt-2 h-11 w-full border border-[#e4d6c6] px-3 text-sm font-normal outline-none" />
          </div>}
          <div className="mt-6">
            <label className="text-xs font-semibold text-[#39251f]">Mobile number
              <input value={contact} onChange={(event) => setContact(event.target.value)} required maxLength={40} autoComplete="tel" inputMode="tel" className="focus-ring mt-2 h-11 w-full border border-[#e4d6c6] px-3 text-sm font-normal outline-none" />
            </label>
          </div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <button type="submit" disabled={loading} className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 bg-[#800020] text-xs font-semibold tracking-[.14em] text-white transition hover:bg-[#570b19] disabled:cursor-wait disabled:opacity-60">
            CONFIRM YOUR ATTENDANCE
          </button>
          <p className="mt-3 text-center text-[11px] text-[#8d7a70]">Please RSVP by November 30, 2026.</p>
        </form>
      </div>
    </div>
    {confirmOpen && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#39251f]/55 px-4 py-8 backdrop-blur-[2px]">
      <section role="dialog" aria-modal="true" aria-labelledby="rsvp-confirm-title" aria-describedby="rsvp-confirm-description" className="my-auto w-full max-w-md border border-[#c5a15b]/60 bg-[#fff8ef] p-6 shadow-[0_24px_70px_rgba(57,37,31,.28)] sm:p-8">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#c5a15b]/55 bg-white text-[#800020]"><Check size={19} /></div>
        <p className="mt-5 text-center text-[10px] font-semibold tracking-[.22em] text-[#73752d]">ONE LAST LOOK</p>
        <h3 id="rsvp-confirm-title" className="font-display mt-2 text-center text-2xl text-[#570b19]">Confirm your RSVP</h3>
        <p id="rsvp-confirm-description" className="mt-2 text-center text-sm text-[#76665c]">You’re responding for {verified.primary_guest_name}.</p>
        <p className="mt-5 text-center text-sm text-[#76665c]">{seatsReserved ? `Seats reserved: ${seatsReserved}` : 'Regretfully declines'}</p>
        {primaryAttending && <p className="mt-1 text-center text-sm text-[#570b19]">{verified.primary_guest_name}</p>}
        {companionAttending && <p className="mt-1 text-center text-sm text-[#570b19]">{companionName}</p>}
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
