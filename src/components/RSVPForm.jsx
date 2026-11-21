import { useState } from 'react';
import { AlertCircle, ArrowLeft, Check, LoaderCircle, LockKeyhole } from 'lucide-react';
import { submitRsvp, verifyInvitation } from '../services/googleSheets.js';

export default function RSVPForm({ invitation, onBack, onSuccess }) {
  const [verified, setVerified] = useState(null);
  const [code, setCode] = useState('');
  const [attendance, setAttendance] = useState('');
  const [bringCompanion, setBringCompanion] = useState(null);
  const [companionName, setCompanionName] = useState('');
  const [contact, setContact] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      setAttendance(primary?.rsvp_status || '');
      setBringCompanion(companion
        ? companion.rsvp_status === 'attending'
        : primary?.rsvp_status === 'attending' ? false : null);
      setCompanionName(companion?.guest_name || '');
      setContact(details.contact_number || '');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;
    const nextErrors = {};
    if (!['attending', 'declined'].includes(attendance)) {
      nextErrors.attendance = 'Please choose if you can join us.';
    }
    if (attendance === 'attending' && !contact.trim()) {
      nextErrors.contact = 'Please enter your mobile number.';
    }
    const allowsAdditionalGuest = Number(verified.allocated_seats) > 1;
    if (attendance === 'attending' && allowsAdditionalGuest && typeof bringCompanion !== 'boolean') {
      nextErrors.bringCompanion = 'Please choose Yes or No.';
    }
    if (attendance === 'attending' && bringCompanion === true && !companionName.trim()) {
      nextErrors.companionName = 'Please enter your companion’s full name.';
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setError('');
    setLoading(true);
    try {
      const hasRegisteredCompanion = verified.guests.some((guest) => guest.guest_role === 'Companion');
      const includeCompanion = hasRegisteredCompanion ||
        (attendance === 'attending' && allowsAdditionalGuest && bringCompanion === true);
      const result = await submitRsvp({
        invitation_id: verified.invitation_id,
        invitation_code: code.trim(),
        attendance_status: attendance,
        bring_companion: includeCompanion,
        companion_name: includeCompanion ? companionName.trim() : '',
        companion_attendance_status: hasRegisteredCompanion
          ? attendance === 'attending' && bringCompanion === true ? 'attending' : 'declined'
          : includeCompanion ? 'attending' : '',
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
    <button type="button" className="focus-ring mb-4 inline-flex items-center gap-2 text-xs font-semibold tracking-[.1em] text-[#800020]" onClick={onBack}><ArrowLeft size={15} /> BACK TO SEARCH</button>
    <div className="border border-[#c5a15b]/50 bg-white p-6 sm:p-8">
      <p className="text-[10px] font-semibold tracking-[.2em] text-[#73752d]">INVITATION SELECTED</p>
      <h3 className="font-display mt-2 text-2xl text-[#570b19]">{invitation.primary_guest_name}</h3>
      <p className="mt-2 text-sm leading-6 text-[#76665c]">To protect your invitation, enter the private invitation code shared with you.</p>
      <form onSubmit={handleVerify} className="mt-5">
        <label className="mb-2 block text-xs font-semibold text-[#39251f]" htmlFor="invitation-code">Invitation code</label>
        <input id="invitation-code" value={code} onChange={(event) => { setCode(event.target.value); setError(''); }} required maxLength={100} autoComplete="one-time-code" className="focus-ring h-12 w-full border border-[#c5a15b]/55 px-4 text-sm outline-none" placeholder="Enter the code on your invitation" />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <button type="submit" disabled={loading} className="focus-ring mt-4 inline-flex h-12 w-full items-center justify-center gap-2 bg-[#800020] text-xs font-semibold tracking-[.1em] text-white hover:bg-[#570b19] disabled:opacity-60">
          {loading ? <LoaderCircle className="animate-spin" size={16} /> : <LockKeyhole size={15} />}
          {loading ? 'CHECKING CODE' : 'CONTINUE TO RSVP'}
        </button>
      </form>
    </div>
  </div>;

  const firstName = verified.primary_guest_name.trim().split(/\s+/)[0] || 'Guest';
  const hasRegisteredCompanion = verified.guests.some((guest) => guest.guest_role === 'Companion');
  const allowsAdditionalGuest = Number(verified.allocated_seats) > 1;
  const companionAccepted = attendance === 'attending' && bringCompanion === true;
  const totalAttending = attendance === 'attending' ? 1 + (companionAccepted ? 1 : 0) : 0;

  return <div className="mx-auto max-w-2xl text-left">
    <button type="button" className="focus-ring mb-4 inline-flex items-center gap-2 text-xs font-semibold tracking-[.1em] text-[#800020]" onClick={() => { setVerified(null); onBack(); }}><ArrowLeft size={15} /> BACK TO SEARCH</button>
    <div className="border border-[#c5a15b]/50 bg-white p-5 sm:p-8">
      <h3 className="font-display text-2xl text-[#570b19]">Hello, {firstName}!</h3>
      <p className="mt-1 text-sm text-[#76665c]">Please let us know if you can join us.</p>
      <form noValidate onSubmit={handleSubmit} className="mt-6">
        <fieldset>
          <legend className="mb-3 text-xs font-semibold text-[#39251f]">Will you be joining us?</legend>
          <div className="flex flex-wrap gap-3">
            {[['attending', 'Joyfully accepts'], ['declined', 'Regretfully declines']].map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-2 border px-3 py-2.5 text-xs transition ${attendance === value ? 'border-[#800020] bg-[#800020]/[.045] text-[#570b19]' : 'border-[#e8d9c8] text-[#76665c]'}`}>
              <input type="radio" name="attendance" value={value} checked={attendance === value} onChange={() => {
                setAttendance(value);
                setErrors({});
                setError('');
                if (value === 'declined') setBringCompanion(false);
                else if (attendance === 'declined') setBringCompanion(null);
              }} className="accent-[#800020]" />
              {label}
            </label>)}
          </div>
          {errors.attendance && <FieldError>{errors.attendance}</FieldError>}
        </fieldset>

        <div className="mt-5">
          <label className="block text-xs font-semibold text-[#39251f]" htmlFor="mobile-number">Mobile number
            <input id="mobile-number" value={contact} onChange={(event) => { setContact(event.target.value); setErrors((current) => ({ ...current, contact: '' })); }} required={attendance === 'attending'} maxLength={40} autoComplete="tel" inputMode="tel" className="focus-ring mt-2 h-11 w-full border border-[#e4d6c6] px-3 text-sm font-normal outline-none" />
          </label>
          {attendance === 'attending' && errors.contact && <FieldError>{errors.contact}</FieldError>}
        </div>

        {allowsAdditionalGuest && attendance === 'attending' && <fieldset className="mt-5">
          <legend className="mb-3 text-xs font-semibold text-[#39251f]">Will you bring one companion?</legend>
          <div className="flex gap-3">
            {[['yes', true], ['no', false]].map(([label, value]) => <label key={label} className={`flex cursor-pointer items-center gap-2 border px-4 py-2.5 text-xs transition ${bringCompanion === value ? 'border-[#800020] bg-[#800020]/[.045] text-[#570b19]' : 'border-[#e8d9c8] text-[#76665c]'}`}>
              <input type="radio" name="bring-companion" checked={bringCompanion === value} onChange={() => { setBringCompanion(value); setErrors((current) => ({ ...current, bringCompanion: '' })); }} className="accent-[#800020]" />
              {label === 'yes' ? 'Yes' : 'No'}
            </label>)}
          </div>
          {errors.bringCompanion && <FieldError>{errors.bringCompanion}</FieldError>}
        </fieldset>}

        {allowsAdditionalGuest && attendance === 'attending' && bringCompanion === true && <div className="mt-5">
          <label className="block text-xs font-semibold text-[#39251f]" htmlFor="companion-name">Companion’s full name
            <input id="companion-name" value={companionName} onChange={(event) => { setCompanionName(event.target.value); setErrors((current) => ({ ...current, companionName: '' })); }} required maxLength={120} autoComplete="name" className="focus-ring mt-2 h-11 w-full border border-[#e4d6c6] px-3 text-sm font-normal outline-none" />
          </label>
          <p className="mt-2 text-xs leading-5 text-[#76665c]">Please enter your companion’s complete name so we can reserve their seat.</p>
          {errors.companionName && <FieldError>{errors.companionName}</FieldError>}
        </div>}

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {attendance && <div className="mt-6 border border-[#c5a15b]/45 bg-[#fff8ef] p-4">
          <div className="mb-3 flex items-center gap-2 text-[#800020]"><Check size={16} /><h4 className="font-display text-base text-[#570b19]">Your RSVP</h4></div>
          <p className="text-sm text-[#76665c]">Guest — <span className="font-medium text-[#39251f]">{verified.primary_guest_name}</span></p>
          {companionAccepted && <p className="mt-1 text-sm text-[#76665c]">Companion — <span className="font-medium text-[#39251f]">{companionName || 'Name required'}</span></p>}
          <p className="mt-1 text-sm text-[#76665c]">Total attending — <span className="font-medium text-[#39251f]">{totalAttending}</span></p>
        </div>}

        <button type="submit" disabled={loading} className="focus-ring mt-5 inline-flex h-12 w-full items-center justify-center gap-2 bg-[#800020] text-xs font-semibold tracking-[.1em] text-white transition hover:bg-[#570b19] disabled:cursor-wait disabled:opacity-60">
          {loading && <LoaderCircle className="animate-spin" size={16} />}
          {loading ? 'SENDING RESPONSE' : attendance === 'declined' ? 'Submit Response' : 'Confirm RSVP'}
        </button>
      </form>
    </div>
  </div>;
}

function FieldError({ children }) {
  return <p role="alert" className="mt-1.5 text-xs leading-5 text-[#800020]">{children}</p>;
}

function ErrorMessage({ children }) {
  return <div role="alert" className="mt-4 flex items-start gap-2 text-sm text-[#800020]"><AlertCircle className="mt-0.5 shrink-0" size={16} /><span>{children}</span></div>;
}
