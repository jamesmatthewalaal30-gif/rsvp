import { useState } from 'react';
import { AlertCircle, ArrowRight, LoaderCircle, Search, TicketCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { searchInvitations } from '../services/googleSheets.js';

export default function GuestSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setError('Please enter at least two letters to search.');
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError('');
    setSearched(true);
    setResults([]);
    try {
      const data = await searchInvitations(query);
      setResults(data.invitations || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label htmlFor="invitation-search" className="mx-auto mb-2 block max-w-2xl text-left text-xs font-semibold text-[#39251f]">Find Your Invitation</label>
      <form className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8d7a70]" size={18} />
          <input id="invitation-search" aria-label="Find Your Invitation" value={query} onChange={(event) => { setQuery(event.target.value); setError(''); setResults([]); setSearched(false); }} placeholder="Enter your first or last name" autoComplete="name" className="focus-ring h-14 w-full border border-[#c5a15b]/50 bg-white pl-12 pr-4 text-sm outline-none placeholder:text-[#a39287]" />
        </div>
        <button disabled={loading} className="focus-ring flex h-14 items-center justify-center gap-2 bg-[#800020] px-7 text-[11px] font-semibold tracking-[.14em] text-white transition hover:bg-[#570b19] disabled:cursor-wait disabled:opacity-70">
          {loading ? <LoaderCircle className="animate-spin" size={17} /> : <Search size={16} />}
          {loading ? 'SEARCHING' : 'Find My Invitation'}
        </button>
      </form>
      <div aria-live="polite">
        {error && <div role="alert" className="mx-auto mt-5 flex max-w-2xl items-start gap-2 rounded-sm border border-[#800020]/20 bg-[#800020]/[.04] p-4 text-left text-sm text-[#570b19]"><AlertCircle className="mt-0.5 shrink-0" size={17} /><span>{error}</span></div>}
        {!error && searched && !loading && results.length === 0 && <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-[#76665c]">We couldn’t find your invitation. Please check the spelling or text Kym at <a className="font-semibold text-[#570b19] underline underline-offset-2" href="sms:09683773730">09683773730</a> for assistance.</p>}
        {results.length > 0 && <div className="mx-auto mt-7 grid max-w-2xl gap-3 text-left">
          {results.map((invitation) => <motion.article key={invitation.invitation_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-4 border border-[#c5a15b]/45 bg-white p-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-[.16em] text-[#73752d]"><TicketCheck size={14} /> INVITATION FOUND</div>
              <h3 className="font-display text-xl text-[#570b19]">{invitation.primary_guest_name}</h3>
              <p className="mt-1 text-xs text-[#76665c]">{invitation.guest_type || 'Wedding guest'} <span className="mx-2 text-[#c5a15b]">·</span> {Number(invitation.allocated_seats) === 2 ? 'Up to 2 seats' : '1 seat'}</p>
            </div>
            <button type="button" className="focus-ring inline-flex shrink-0 items-center justify-center gap-2 border border-[#800020] px-5 py-3 text-[10px] font-semibold tracking-[.14em] text-[#800020] transition hover:bg-[#800020] hover:text-white" onClick={() => onSelect(invitation)}>
              Select Invitation <ArrowRight size={14} />
            </button>
          </motion.article>)}
        </div>}
      </div>
    </div>
  );
}
