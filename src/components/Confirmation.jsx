import { Check, MapPin } from 'lucide-react';

export default function Confirmation({ submission }) {
  const guests = submission.responses || submission.invitation.guests;
  const attending = guests.filter((guest) => guest.attendance_status === 'attending' || guest.rsvp_status === 'attending');
  const declined = guests.filter((guest) => guest.attendance_status === 'declined' || guest.rsvp_status === 'declined');
  return <div className="mx-auto max-w-2xl border border-[#c5a15b]/55 bg-white px-6 py-10 sm:px-10">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#73752d]/10 text-[#73752d]"><Check size={23} /></div>
    <p className="mt-5 text-[10px] font-semibold tracking-[.24em] text-[#73752d]">RSVP RECEIVED</p>
    <h3 className="font-display mt-3 text-3xl text-[#570b19]">Thank you, {submission.invitation.primary_guest_name.split(' ')[0]}.</h3>
    <p className="mt-3 text-sm leading-6 text-[#76665c]">Your RSVP has been successfully recorded. We look forward to celebrating this special day with you!</p>
    <p className="mt-4 font-display text-lg text-[#570b19]">{attending.length} {attending.length === 1 ? 'guest' : 'guests'} confirmed to attend</p>
    <div className="mt-7 grid gap-5 border-y border-[#c5a15b]/30 py-6 text-left sm:grid-cols-2">
      <GuestGroup title={`Joyfully accepting · ${attending.length}`} names={attending.map((guest) => guest.guest_name)} />
      <GuestGroup title={`Regretfully declining · ${declined.length}`} names={declined.map((guest) => guest.guest_name)} />
    </div>
    <div className="mt-6 flex items-start justify-center gap-2 text-sm text-[#76665c]"><MapPin className="mt-0.5 text-[#c5a15b]" size={16} /><span>December 9, 2026 · Casamara Beach Resort<br />Baybay, Roxas City</span></div>
    <button onClick={() => window.location.reload()} className="mt-7 text-xs font-semibold tracking-[.14em] text-[#800020] underline underline-offset-4">RETURN TO THE WEDDING SITE</button>
  </div>;
}

function GuestGroup({ title, names }) {
  return <div>
    <h4 className="text-xs font-semibold text-[#570b19]">{title}</h4>
    {names.length ? <ul className="mt-2 space-y-1 text-xs text-[#76665c]">{names.map((name) => <li key={name}>{name}</li>)}</ul> : <p className="mt-2 text-xs text-[#8d7a70]">No guests in this group.</p>}
  </div>;
}
