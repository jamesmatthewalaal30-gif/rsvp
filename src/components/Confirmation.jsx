import { Check, MapPin } from 'lucide-react';

export default function Confirmation({ submission }) {
  const responses = submission.responses || [];
  const attending = responses.filter((guest) => guest.attendance_status === 'attending');
  const accepted = attending.length > 0;
  const names = attending.map((guest) => guest.guest_name);
  return <div className="mx-auto max-w-2xl border border-[#c5a15b]/55 bg-white px-6 py-10 sm:px-10">
    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${accepted ? 'bg-[#73752d]/10 text-[#73752d]' : 'bg-[#800020]/[.07] text-[#800020]'}`}><Check size={23} /></div>
    {accepted ? <>
      <h3 className="font-display mt-5 text-3xl text-[#570b19]">Your attendance is confirmed!</h3>
      <p className="mt-3 text-sm leading-6 text-[#76665c]">Thank you for celebrating with us. We’ve reserved {names.length} {names.length === 1 ? 'seat' : 'seats'} for:</p>
      <ul className="mt-4 space-y-1 font-display text-lg text-[#570b19]">{names.map((name) => <li key={name}>{name}</li>)}</ul>
      <div className="mt-7 flex items-start justify-center gap-2 text-sm leading-6 text-[#76665c]"><MapPin className="mt-1 shrink-0 text-[#c5a15b]" size={16} /><span>December 9, 2026 · 10:30 AM–3:00 PM<br />Casamara Beach Resort, Baybay, Roxas City</span></div>
      <p className="mt-6 font-display text-lg text-[#570b19]">We can’t wait to celebrate with you!</p>
    </> : <>
      <h3 className="font-display mt-5 text-2xl leading-snug text-[#570b19]">Thank you for letting us know. We’ll miss you and appreciate your warm wishes.</h3>
    </>}
    <p className="mt-4 font-script text-3xl text-[#800020]">Nate &amp; Kym</p>
    <button onClick={() => window.location.reload()} className="mt-7 text-xs font-semibold tracking-[.14em] text-[#800020] underline underline-offset-4">RETURN TO THE WEDDING SITE</button>
  </div>;
}
