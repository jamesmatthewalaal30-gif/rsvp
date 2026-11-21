import { useState } from 'react';
import { Check, Download, MapPin } from 'lucide-react';

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[character]));
}

export default function Confirmation({ submission }) {
  const [downloadError, setDownloadError] = useState('');
  const responses = submission.responses || [];
  const attendees = responses.filter((guest) => guest.attendance_status === 'attending');
  const accepted = attendees.length > 0;

  function saveConfirmation() {
    try {
      const names = attendees.map((guest) => `<text x="600" y="${665 + attendees.indexOf(guest) * 55}" class="name">${escapeXml(guest.guest_name)}</text>`).join('');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600" viewBox="0 0 1200 1600"><rect width="1200" height="1600" fill="#fff8ef"/><rect x="48" y="48" width="1104" height="1504" rx="8" fill="none" stroke="#c5a15b" stroke-width="3"/><text x="600" y="250" class="eyebrow">NATHANIEL &amp; KIMBERLY</text><path d="M330 310h540" stroke="#c5a15b" stroke-width="2"/><text x="600" y="420" class="title">Your RSVP is confirmed!</text><text x="600" y="510" class="body">We’ve reserved ${attendees.length} ${attendees.length === 1 ? 'seat' : 'seats'} for:</text>${names}<text x="600" y="900" class="title">Wedding Reception</text><text x="600" y="990" class="body">Wednesday, December 9, 2026</text><text x="600" y="1050" class="body">10:30 AM–3:00 PM</text><text x="600" y="1160" class="body">Casamara Beach Resort</text><text x="600" y="1220" class="body">Baybay, Roxas City</text><path d="M420 1320h360" stroke="#c5a15b" stroke-width="2"/><text x="600" y="1400" class="footer">We can’t wait to celebrate with you!</text><text x="600" y="1460" class="sign">Nathaniel &amp; Kimberly</text><style>text{font-family:Georgia,serif;text-anchor:middle;fill:#570b19}.eyebrow{font-size:30px;letter-spacing:8px;fill:#73752d}.title{font-size:54px}.body{font-size:34px;fill:#76665c}.name{font-size:38px}.footer{font-size:30px;font-style:italic}.sign{font-size:42px;font-style:italic;fill:#800020}</style></svg>`;
      const objectUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'nathaniel-and-kimberly-rsvp-confirmation.svg';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setDownloadError('');
    } catch (error) {
      setDownloadError('We couldn’t download your confirmation. Please take a screenshot of this card.');
    }
  }

  return <article className="mx-auto max-w-2xl border border-[#c5a15b]/55 bg-[#fffdf8] px-6 py-9 text-center shadow-[0_12px_35px_rgba(87,11,25,.07)] sm:px-10 sm:py-12">
    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${accepted ? 'bg-[#73752d]/10 text-[#73752d]' : 'bg-[#800020]/[.07] text-[#800020]'}`}><Check size={23} /></div>
    {accepted ? <>
      <h3 className="font-display mt-5 text-2xl text-[#570b19] sm:text-3xl">Your RSVP is confirmed!</h3>
      <p className="mt-3 text-sm leading-6 text-[#76665c]">We’ve reserved {attendees.length} {attendees.length === 1 ? 'seat' : 'seats'} for:</p>
      <ul className="mt-4 space-y-1 font-display text-lg text-[#570b19]">{attendees.map((guest) => <li key={guest.guest_id || guest.guest_name}>{guest.guest_name}</li>)}</ul>
      <div className="mx-auto mt-7 max-w-md border-y border-[#c5a15b]/55 py-5">
        <p className="font-display text-xl text-[#570b19]">Wedding Reception</p>
        <p className="mt-3 text-sm leading-6 text-[#76665c]">Wednesday, December 9, 2026<br />10:30 AM–3:00 PM</p>
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-[#570b19]"><MapPin size={16} className="text-[#c5a15b]" /> Casamara Beach Resort</p>
        <p className="text-sm text-[#76665c]">Baybay, Roxas City</p>
      </div>
      <p className="mt-6 font-display text-lg text-[#570b19]">We can’t wait to celebrate with you!</p>
      <p className="mt-3 font-script text-3xl text-[#800020]">Nathaniel &amp; Kimberly</p>
      <button type="button" onClick={saveConfirmation} className="focus-ring mt-7 inline-flex h-12 items-center justify-center gap-2 bg-[#800020] px-6 text-xs font-semibold tracking-[.1em] text-white transition hover:bg-[#570b19]">
        <Download size={16} /> Save Confirmation
      </button>
      {downloadError && <p role="alert" className="mt-3 text-xs text-[#800020]">{downloadError}</p>}
    </> : <>
      <h3 className="font-display mt-5 text-2xl text-[#570b19]">Thank you for letting us know.</h3>
      <p className="mt-3 text-sm leading-6 text-[#76665c]">We’ll miss you and appreciate your warm wishes.</p>
      <p className="mt-6 font-display text-sm italic text-[#76665c]">With love,</p>
      <p className="mt-2 font-script text-3xl text-[#800020]">Nathaniel &amp; Kimberly</p>
    </>}
  </article>;
}
