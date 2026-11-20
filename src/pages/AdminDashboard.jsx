import { useCallback, useMemo, useState } from 'react';
import { ArrowLeft, Download, LogIn, LogOut, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminRequest } from '../services/googleSheets.js';

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [summary, setSummary] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [responses, setResponses] = useState([]);
  const [query, setQuery] = useState('');
  const [invitationQuery, setInvitationQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const loadDashboard = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const data = await adminRequest('admin_dashboard', {}, password);
      setSummary(data.summary);
      setInvitations(data.invitations);
      setResponses(data.responses);
      setAuthenticated(true);
    } catch (requestError) {
      setSummary(null);
      setInvitations([]);
      setResponses([]);
      setAuthenticated(false);
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }, [password]);

  const filtered = useMemo(() => responses.filter((response) =>
    (statusFilter === 'all' || response.attendance_status === statusFilter) &&
    `${response.guest_name} ${response.invitation_id}`.toLowerCase().includes(query.toLowerCase()),
  ), [responses, statusFilter, query]);
  const filteredInvitations = useMemo(() => invitations.filter((invitation) =>
    `${invitation.primary_guest_name} ${invitation.invitation_id} ${invitation.guest_type}`.toLowerCase().includes(invitationQuery.toLowerCase()),
  ), [invitations, invitationQuery]);

  async function createInvitation(payload) {
    await adminRequest('admin_create_invitation', payload, password);
    setFormOpen(false);
    await loadDashboard();
  }

  async function editInvitation(payload) {
    await adminRequest('admin_edit_invitation', payload, password);
    await loadDashboard();
  }

  async function removeGuest(invitationId, guestId) {
    if (!window.confirm('Remove this registered companion? Their RSVP record will also be removed.')) return;
    try {
      await adminRequest('admin_remove_guest', { invitation_id: invitationId, guest_id: guestId }, password);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteInvitation(invitationId) {
    if (!window.confirm('Delete this invitation, its invited guests, and their RSVP responses? This cannot be undone.')) return;
    try {
      await adminRequest('admin_delete_invitation', { invitation_id: invitationId }, password);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function exportCsv() {
    const csvValue = (field) => {
      const value = String(field ?? '');
      return `"${/^[\s]*[=+\-@]/.test(value) ? `'${value}` : value.replaceAll('"', '""')}"`;
    };
    const rows = [
      ['Invitation ID', 'Guest', 'Role', 'Attendance', 'Contact', 'Submitted at'],
      ...filtered.map((row) => [row.invitation_id, row.guest_name, row.guest_role, row.attendance_status, row.contact_number, row.submitted_at]),
    ];
    const csv = rows.map((row) => row.map(csvValue).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wedding-rsvp-responses.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  function signOut() {
    setAuthenticated(false);
    setSummary(null);
    setInvitations([]);
    setResponses([]);
    setPassword('');
    setError('');
  }

  if (!authenticated) return <main className="paper-texture flex min-h-screen items-center justify-center p-5">
    <div className="w-full max-w-md border border-[#c5a15b]/55 bg-white p-8 sm:p-10">
      <Link to="/" className="inline-flex items-center gap-2 text-xs text-[#800020]"><ArrowLeft size={14} /> Wedding website</Link>
      <div className="mx-auto mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-[#800020]/[.06] text-[#800020]"><ShieldCheck size={22} /></div>
      <h1 className="font-display mt-4 text-center text-3xl text-[#570b19]">Administrator</h1>
      <p className="mt-2 text-center text-sm text-[#76665c]">Sign in to manage invitations and RSVP responses.</p>
      <form className="mt-7" onSubmit={(event) => { event.preventDefault(); loadDashboard(); }}>
        <label htmlFor="admin-password" className="text-xs font-semibold">Admin password</label>
        <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="focus-ring mt-2 h-12 w-full border border-[#e4d6c6] px-3 text-sm outline-none" />
        {error && <p role="alert" className="mt-3 text-sm text-[#800020]">{error}</p>}
        <button disabled={busy} className="mt-4 flex h-12 w-full items-center justify-center gap-2 bg-[#800020] text-xs font-semibold tracking-[.15em] text-white disabled:opacity-60">
          {busy ? 'VERIFYING' : <><LogIn size={15} /> SIGN IN</>}
        </button>
      </form>
    </div>
  </main>;

  return <main className="min-h-screen bg-[#fff8ef]">
    <header className="border-b border-[#c5a15b]/40 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <div><p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#73752d]">Nate &amp; Kym · December 9, 2026</p><h1 className="font-display mt-1 text-2xl text-[#570b19]">Guest dashboard</h1></div>
        <div className="flex gap-2">
          <button onClick={loadDashboard} disabled={busy} aria-label="Refresh dashboard" className="focus-ring border border-[#e4d6c6] p-2.5 text-[#570b19]"><RefreshCw className={busy ? 'animate-spin' : ''} size={17} /></button>
          <button onClick={signOut} className="focus-ring inline-flex items-center gap-2 border border-[#e4d6c6] px-3 text-xs text-[#570b19]"><LogOut size={15} /> <span className="hidden sm:inline">Sign out</span></button>
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      {error && <p role="alert" className="mb-5 border border-[#800020]/20 bg-[#800020]/[.04] p-4 text-sm text-[#800020]">{error}</p>}
      {summary && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Stat label="Invitations" value={summary.total_invitations} />
        <Stat label="Invited guests" value={summary.total_guests} />
        <Stat label="Attending" value={summary.attending} />
        <Stat label="Seats remaining" value={`${summary.capacity_remaining} / ${summary.capacity}`} />
        <Stat label="Declined" value={summary.declined} />
        <Stat label="Attendance rate" value={`${summary.attendance_percentage}%`} />
      </div>}
      <section className="mt-9 border border-[#c5a15b]/40 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="font-display text-2xl text-[#570b19]">Invitations</h2><p className="mt-1 text-xs text-[#76665c]">{summary?.pending || 0} pending guest responses</p></div>
          <button onClick={() => setFormOpen(!formOpen)} className="inline-flex items-center gap-2 bg-[#800020] px-4 py-3 text-xs font-semibold text-white"><Plus size={15} /> NEW INVITATION</button>
        </div>
        {formOpen && <InvitationForm onCancel={() => setFormOpen(false)} onSubmit={createInvitation} />}
          <label className="relative mt-5 block">
            <span className="sr-only">Search invitations</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d7a70]" size={16} />
            <input value={invitationQuery} onChange={(event) => setInvitationQuery(event.target.value)} className="focus-ring h-11 w-full border border-[#e4d6c6] pl-10 pr-3 text-sm outline-none" placeholder="Search invitations by guest, type, or ID" />
          </label>
        <div className="mt-5 space-y-3">
            {filteredInvitations.map((invitation) => <InvitationRow key={invitation.invitation_id} invitation={invitation} onRemove={removeGuest} onEdit={editInvitation} onDelete={deleteInvitation} />)}
            {!filteredInvitations.length && <p className="py-8 text-center text-sm text-[#76665c]">No invitations match your search.</p>}
        </div>
      </section>
      <section className="mt-7 border border-[#c5a15b]/40 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="font-display text-2xl text-[#570b19]">RSVP responses</h2><p className="mt-1 text-xs text-[#76665c]">Individual responses, updated in real time</p></div>
          <button onClick={exportCsv} className="inline-flex items-center gap-2 border border-[#800020] px-4 py-3 text-xs font-semibold text-[#800020]"><Download size={15} /> EXPORT CSV</button>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d7a70]" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="focus-ring h-11 w-full border border-[#e4d6c6] pl-10 pr-3 text-sm outline-none" placeholder="Search guest or invitation" /></label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="focus-ring h-11 border border-[#e4d6c6] bg-white px-3 text-sm outline-none"><option value="all">All statuses</option><option value="">Pending</option><option value="attending">Attending</option><option value="declined">Declined</option></select>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-[#e4d6c6] text-[10px] uppercase tracking-[.14em] text-[#73752d]"><th className="py-3 pr-4">Guest</th><th className="py-3 pr-4">Invitation</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Contact</th><th className="py-3">Submitted</th></tr></thead>
            <tbody>{filtered.map((response) => <tr key={response.guest_id} className="border-b border-[#eee5db] text-xs text-[#58433b]"><td className="py-3 pr-4">{response.guest_name}</td><td className="py-3 pr-4">{response.invitation_id}</td><td className="py-3 pr-4"><span className={`rounded-full px-2.5 py-1 ${response.attendance_status === 'attending' ? 'bg-[#73752d]/10 text-[#55571e]' : 'bg-[#800020]/[.07] text-[#800020]'}`}>{response.attendance_status}</span></td><td className="py-3 pr-4">{response.contact_number || '—'}</td><td className="py-3">{response.submitted_at || '—'}</td></tr>)}</tbody>
          </table>
          {!filtered.length && <p className="py-8 text-center text-sm text-[#76665c]">No responses match your filters.</p>}
        </div>
      </section>
      <p className="mt-5 text-center text-[11px] text-[#8d7a70]">All guest data is retrieved through authenticated Apps Script actions.</p>
    </div>
  </main>;
}

function Stat({ label, value }) {
  return <div className="border border-[#c5a15b]/35 bg-white p-4"><p className="text-[10px] uppercase tracking-[.15em] text-[#73752d]">{label}</p><p className="font-display mt-2 text-3xl text-[#570b19]">{value}</p></div>;
}

function InvitationRow({ invitation, onRemove, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submitEdit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    try {
      await onEdit({
        invitation_id: invitation.invitation_id,
        primary_guest_name: form.get('primary_guest_name'),
        guest_type: form.get('guest_type'),
        invitation_code: form.get('invitation_code'),
      });
      setEditing(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return <details className="group border border-[#e4d6c6]">
    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4">
      <div><p className="font-display text-lg text-[#570b19]">{invitation.primary_guest_name}</p><p className="mt-1 text-xs text-[#76665c]">{invitation.invitation_id} · {invitation.guest_type} · Up to 2 seats</p></div>
      <span className="text-xs text-[#73752d]">{invitation.guests.length} registered · {invitation.guests.filter((guest) => guest.rsvp_status).length} responded</span>
    </summary>
    <div className="flex flex-wrap gap-2 border-t border-[#e4d6c6] px-4 py-3">
      <button onClick={() => setEditing(!editing)} className="border border-[#e4d6c6] px-3 py-2 text-[10px] font-semibold tracking-[.1em] text-[#570b19]">EDIT INVITATION</button>
      <button onClick={() => onDelete(invitation.invitation_id)} className="ml-auto inline-flex items-center gap-1 border border-[#800020]/30 px-3 py-2 text-[10px] font-semibold tracking-[.1em] text-[#800020]"><Trash2 size={13} /> DELETE</button>
    </div>
    {editing && <form onSubmit={submitEdit} className="grid gap-3 border-t border-[#e4d6c6] bg-[#fff8ef] p-4 sm:grid-cols-2">
      <label className="text-xs font-semibold">Primary guest<input name="primary_guest_name" required defaultValue={invitation.primary_guest_name} className="focus-ring mt-1 h-10 w-full border border-[#e4d6c6] bg-white px-3 text-sm font-normal" /></label>
      <label className="text-xs font-semibold">Guest type<input name="guest_type" defaultValue={invitation.guest_type} className="focus-ring mt-1 h-10 w-full border border-[#e4d6c6] bg-white px-3 text-sm font-normal" /></label>
      <label className="text-xs font-semibold">Invitation code<input name="invitation_code" required defaultValue={invitation.invitation_code} className="focus-ring mt-1 h-10 w-full border border-[#e4d6c6] bg-white px-3 text-sm font-normal" /></label>
      <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={() => setEditing(false)} className="px-3 py-2 text-xs">CANCEL</button><button disabled={saving} className="bg-[#800020] px-4 py-2 text-xs font-semibold text-white">{saving ? 'SAVING…' : 'SAVE CHANGES'}</button></div>
    </form>}
    {error && <p role="alert" className="border-t border-[#e4d6c6] px-4 py-3 text-sm text-[#800020]">{error}</p>}
    <div className="divide-y divide-[#eee5db] border-t border-[#e4d6c6] px-4">
      {invitation.guests.map((guest) => <div key={guest.guest_id} className="flex items-center justify-between py-3 text-sm">
        <div><span className="text-[#39251f]">{guest.guest_name}</span><span className="ml-2 text-xs text-[#8d7a70]">{guest.guest_role}</span></div>
        <div className="flex items-center gap-3"><span className="text-xs text-[#73752d]">{guest.rsvp_status || 'Pending'}</span><button aria-label={`Remove ${guest.guest_name}`} onClick={() => onRemove(invitation.invitation_id, guest.guest_id)} className="text-[#800020]" title="Remove invited guest"><Trash2 size={15} /></button></div>
      </div>)}
    </div>
  </details>;
}

function InvitationForm({ onCancel, onSubmit }) {
  const [primary, setPrimary] = useState('');
  const [type, setType] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!primary.trim()) return;
    setSaving(true);
    setError('');
    try {
      await onSubmit({ primary_guest_name: primary.trim(), guest_type: type.trim(), invitation_code: code.trim(), guest_names: [primary.trim()] });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }
  return <form onSubmit={submit} className="mt-5 grid gap-4 border border-[#c5a15b]/40 bg-[#fff8ef] p-4 sm:grid-cols-2 sm:p-5">
    <label className="text-xs font-semibold">Primary guest name<input required value={primary} onChange={(event) => setPrimary(event.target.value)} className="focus-ring mt-2 h-10 w-full border border-[#e4d6c6] bg-white px-3 text-sm font-normal" /></label>
    <label className="text-xs font-semibold">Guest type<input value={type} onChange={(event) => setType(event.target.value)} className="focus-ring mt-2 h-10 w-full border border-[#e4d6c6] bg-white px-3 text-sm font-normal" placeholder="Family / Friend" /></label>
    <label className="text-xs font-semibold">Invitation code<input required value={code} onChange={(event) => setCode(event.target.value)} className="focus-ring mt-2 h-10 w-full border border-[#e4d6c6] bg-white px-3 text-sm font-normal" /></label>
    <p className="text-xs leading-5 text-[#76665c]">Each invitation is for one named guest and may include one companion, registered by the guest during RSVP.</p>
    {error && <p role="alert" className="text-sm text-[#800020] sm:col-span-2">{error}</p>}
    <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={onCancel} className="border border-[#e4d6c6] px-4 py-2 text-xs">CANCEL</button><button disabled={saving} className="inline-flex items-center gap-2 bg-[#800020] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60">{saving ? 'SAVING…' : <><Plus size={14} /> CREATE INVITATION</>}</button></div>
  </form>;
}
