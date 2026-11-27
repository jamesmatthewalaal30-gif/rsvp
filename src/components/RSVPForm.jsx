import { useState } from 'react';
import { AlertCircle, ArrowLeft, Check, LoaderCircle, LockKeyhole } from 'lucide-react';
import { submitRsvp, verifyInvitation } from '../services/googleSheets.js';

export default function RSVPForm({ invitation, onBack, onSuccess }) {
  const [verified, setVerified] = useState(null);
  const [code, setCode] = useState('');
  const [attendance, setAttendance] = useState('');
  const [registeredCompanions, setRegisteredCompanions] = useState([]);
  const [newCompanionCount, setNewCompanionCount] = useState('');
  const [newCompanionNames, setNewCompanionNames] = useState([]);
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
      setVerified(details);
      setAttendance(primary?.rsvp_status || '');
      setRegisteredCompanions(details.guests
        .filter((guest) => guest.guest_role === 'Companion')
        .map((guest) => ({
          guest_id: guest.guest_id,
          guest_name: guest.guest_name,
          attendance_status: guest.rsvp_status || '',
        })));
      setNewCompanionCount('');
      setNewCompanionNames([]);
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
    const remainingCompanionSlots = Math.max(0, Number(verified.allocated_seats) - 1 - registeredCompanions.length);
    if (!['attending', 'declined'].includes(attendance)) {
      nextErrors.attendance = 'Please choose if you can join us.';
    }
    registeredCompanions.forEach((companion) => {
      if (!['attending', 'declined'].includes(companion.attendance_status)) {
        nextErrors[`companionAttendance-${companion.guest_id}`] = 'Please choose if this companion can join us.';
      }
    });
    if (attendance === 'attending' && !contact.trim()) {
      nextErrors.contact = 'Please enter your mobile number.';
    }
    if (remainingCompanionSlots > 0 &&
        (newCompanionCount === '' || Number(newCompanionCount) !== newCompanionNames.length)) {
      nextErrors.newCompanionCount = 'Please choose how many additional companions you are bringing.';
    }
    newCompanionNames.forEach((name, index) => {
      if (!name.trim()) {
        nextErrors[`newCompanionName-${index}`] = 'Please enter this companion’s full name.';
      } else if (name.includes(',')) {
        nextErrors[`newCompanionName-${index}`] = 'Enter one companion’s name only; multiple names are not allowed.';
      }
    });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setError('');
    setLoading(true);
    try {
      const result = await submitRsvp({
        invitation_id: verified.invitation_id,
        invitation_code: code.trim(),
        attendance_status: attendance,
        registered_companions: registeredCompanions.map((companion) => ({
          guest_id: companion.guest_id,
          guest_name: companion.guest_name.trim(),
          attendance_status: companion.attendance_status,
        })),
        new_companion_names: newCompanionNames.map((name) => name.trim()),
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
  const remainingCompanionSlots = Math.max(0, Number(verified.allocated_seats) - 1 - registeredCompanions.length);
  const isFamilyGuest = ['family', 'family guest'].includes((verified.guest_type || '').trim().toLowerCase());
  const acceptedCompanions = registeredCompanions.filter((companion) => companion.attendance_status === 'attending').length;
  const newAttendingCount = newCompanionNames.length;
  const totalAttending = (attendance === 'attending' ? 1 : 0) + acceptedCompanions + newAttendingCount;

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
              <input type="radio" name="attendance" value={value} required checked={attendance === value} onChange={() => {
                setAttendance(value);
                setErrors({});
                setError('');
              }} className="accent-[#800020]" />
              {label}
            </label>)}
          </div>
          {errors.attendance && <FieldError>{errors.attendance}</FieldError>}
        </fieldset>

        {registeredCompanions.map((companion) => <fieldset key={companion.guest_id} className="mt-5">
          <legend className="mb-3 text-xs font-semibold text-[#39251f]">Will {companion.guest_name || 'this companion'} be joining us?</legend>
          <div className="flex flex-wrap gap-3">
            {[['attending', 'Joyfully accepts'], ['declined', 'Regretfully declines']].map(([value, label]) => <label key={value} className={`flex cursor-pointer items-center gap-2 border px-3 py-2.5 text-xs transition ${companion.attendance_status === value ? 'border-[#800020] bg-[#800020]/[.045] text-[#570b19]' : 'border-[#e8d9c8] text-[#76665c]'}`}>
              <input type="radio" name={`companion-attendance-${companion.guest_id}`} value={value} required checked={companion.attendance_status === value} onChange={() => {
                setRegisteredCompanions((current) => current.map((item) => item.guest_id === companion.guest_id
                  ? { ...item, attendance_status: value }
                  : item));
                setErrors((current) => ({ ...current, [`companionAttendance-${companion.guest_id}`]: '' }));
              }} className="accent-[#800020]" />
              {label}
            </label>)}
          </div>
          {errors[`companionAttendance-${companion.guest_id}`] && <FieldError>{errors[`companionAttendance-${companion.guest_id}`]}</FieldError>}
          <p className="mt-4 text-xs text-[#39251f]">Companion’s full name</p>
          <p className="mt-2 border border-[#e4d6c6] bg-[#fff8ef] px-3 py-3 text-sm text-[#76665c]">{companion.guest_name}</p>
        </fieldset>)}

        <div className="mt-5">
          <label className="block text-xs font-semibold text-[#39251f]" htmlFor="mobile-number">Mobile number
            <input id="mobile-number" value={contact} onChange={(event) => { setContact(event.target.value); setErrors((current) => ({ ...current, contact: '' })); }} required={attendance === 'attending'} maxLength={40} autoComplete="tel" inputMode="tel" className="focus-ring mt-2 h-11 w-full border border-[#e4d6c6] px-3 text-sm font-normal outline-none" />
          </label>
          {attendance === 'attending' && errors.contact && <FieldError>{errors.contact}</FieldError>}
        </div>

        {remainingCompanionSlots > 0 && <div className="mt-5">
          <label className="block text-xs font-semibold text-[#39251f]" htmlFor="new-companion-count">How many additional companions will attend?
            <select id="new-companion-count" value={newCompanionCount} onChange={(event) => {
              const count = event.target.value === '' ? '' : Number(event.target.value);
              setNewCompanionCount(count);
              setNewCompanionNames((current) => Array.from({ length: Number(count) || 0 }, (_, index) => current[index] || ''));
              setErrors((current) => ({ ...current, newCompanionCount: '' }));
            }} required className="focus-ring mt-2 h-11 w-full border border-[#e4d6c6] bg-white px-3 text-sm font-normal outline-none">
              <option value="">Choose a number</option>
              {Array.from({ length: remainingCompanionSlots + 1 }, (_, count) => <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          {errors.newCompanionCount && <FieldError>{errors.newCompanionCount}</FieldError>}
          {isFamilyGuest && <p className="mt-2 text-xs leading-5 text-[#76665c]">Family Guest invitations allow up to 3 people total: the named guest and up to 2 companions. {registeredCompanions.length > 0 ? `There ${registeredCompanions.length === 1 ? 'is' : 'are'} already ${registeredCompanions.length} companion${registeredCompanions.length === 1 ? '' : 's'} listed, so you can add up to ${remainingCompanionSlots} more.` : ''}</p>}
        </div>}

        {newCompanionNames.map((name, index) => <div key={index} className="mt-4">
          <label className="block text-xs font-semibold text-[#39251f]" htmlFor={`new-companion-name-${index}`}>Additional companion {index + 1} full name
            <input id={`new-companion-name-${index}`} value={name} onChange={(event) => {
              setNewCompanionNames((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item));
              setErrors((current) => ({ ...current, [`newCompanionName-${index}`]: '' }));
            }} required pattern="[^,]+" maxLength={120} autoComplete="name" className="focus-ring mt-2 h-11 w-full border border-[#e4d6c6] px-3 text-sm font-normal outline-none" />
          </label>
          {errors[`newCompanionName-${index}`] && <FieldError>{errors[`newCompanionName-${index}`]}</FieldError>}
        </div>)}

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {attendance && <div className="mt-6 border border-[#c5a15b]/45 bg-[#fff8ef] p-4">
          <div className="mb-3 flex items-center gap-2 text-[#800020]"><Check size={16} /><h4 className="font-display text-base text-[#570b19]">Your RSVP</h4></div>
          <p className="text-sm text-[#76665c]">Guest — <span className="font-medium text-[#39251f]">{verified.primary_guest_name}</span> <span>({attendance === 'attending' ? 'accepts' : 'declines'})</span></p>
          {registeredCompanions.map((companion) => <p key={companion.guest_id} className="mt-1 text-sm text-[#76665c]">Companion — <span className="font-medium text-[#39251f]">{companion.guest_name}</span> <span>({companion.attendance_status || 'response required'})</span></p>)}
          {newCompanionNames.map((name, index) => <p key={index} className="mt-1 text-sm text-[#76665c]">Companion — <span className="font-medium text-[#39251f]">{name || 'Name required'}</span> <span>(accepts)</span></p>)}
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
