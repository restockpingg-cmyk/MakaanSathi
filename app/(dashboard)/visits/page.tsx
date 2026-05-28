'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { VisitStatusBadge } from '@/components/ui/Badge';
import { formatDate, formatDateTime } from '@/lib/utils';
import { Plus, User, Building2, Clock, Copy, CheckCheck, MessageCircle } from 'lucide-react';

type Broker = { name: string; phone: string; rera_number: string | null; office_area: string };

type Visit = {
  id: string; scheduled_at: string; status: string;
  buyer_feedback: string | null; broker_notes: string | null;
  buyer: { id: string; name: string; phone: string };
  property: { id: string; society_name: string; locality: string };
};

type CreatedVisit = Visit & { broker: Broker };

type Buyer = { id: string; name: string };
type Property = { id: string; society_name: string; locality: string };

function buildWhatsAppMessage(visit: CreatedVisit): string {
  const d = new Date(visit.scheduled_at);
  const dateStr = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const rera = visit.broker.rera_number ? `\nRERA: ${visit.broker.rera_number}` : '';

  return `🏠 *Site Visit Confirmation*

Hello ${visit.buyer.name},

Your site visit has been confirmed! Here are the details:

📍 *Property:* ${visit.property.society_name}, ${visit.property.locality}
📅 *Date:* ${dateStr}
⏰ *Time:* ${timeStr}

Please be ready at the property at the mentioned time. Carry a valid ID proof.

If you have any questions, feel free to reach out.

Regards,
*${visit.broker.name}*
📞 ${visit.broker.phone}${rera}
📌 ${visit.broker.office_area}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
      {copied ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function VisitsPageInner() {
  const searchParams = useSearchParams();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createdVisit, setCreatedVisit] = useState<CreatedVisit | null>(null);
  const [form, setForm] = useState({ buyer_id: '', property_id: '', scheduled_at: '', broker_notes: '' });
  const autoOpened = useRef(false);

  async function load() {
    setLoading(true);
    const [v, b, p] = await Promise.all([
      fetch('/api/visits').then((r) => r.json()),
      fetch('/api/buyers').then((r) => r.json()),
      fetch('/api/properties').then((r) => r.json()),
    ]);
    setVisits(v); setBuyers(b); setProperties(p);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Auto-fill and open modal from URL params (from match detail "Schedule Visit" button)
  useEffect(() => {
    if (autoOpened.current) return;
    const buyerId = searchParams.get('buyer');
    const propertyId = searchParams.get('property');
    if (buyerId || propertyId) {
      autoOpened.current = true;
      setForm((f) => ({ ...f, buyer_id: buyerId ?? '', property_id: propertyId ?? '' }));
      setShowModal(true);
    }
  }, [searchParams]);

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  function openNew() {
    setForm({ buyer_id: '', property_id: '', scheduled_at: '', broker_notes: '' });
    setCreatedVisit(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setCreatedVisit(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data: CreatedVisit = await res.json();
      setCreatedVisit(data);
      load();
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/visits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const scheduled = visits.filter((v) => v.status === 'SCHEDULED');
  const past = visits.filter((v) => v.status !== 'SCHEDULED');
  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div>
      <Header
        title="Site Visits"
        subtitle={`${scheduled.length} upcoming, ${past.length} past`}
        action={<Button onClick={openNew}><Plus className="h-4 w-4" /> Schedule Visit</Button>}
      />

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading visits…</div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Upcoming ({scheduled.length})</h2>
            {scheduled.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">No scheduled visits</div>
            ) : (
              <div className="space-y-3">
                {scheduled.map((v) => {
                  const d = new Date(v.scheduled_at);
                  return (
                    <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Date block */}
                        <div className="bg-primary-50 rounded-xl p-3 text-center min-w-14 sm:min-w-16 flex-shrink-0">
                          <p className="text-xs text-primary-500 font-medium uppercase">{d.toLocaleDateString('en-IN', { month: 'short' })}</p>
                          <p className="text-2xl font-black text-primary-700 leading-none">{d.getDate()}</p>
                          <p className="text-xs text-primary-600 font-semibold mt-1">
                            {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="font-semibold text-sm text-gray-900">{v.buyer.name}</span>
                            <span className="text-gray-400 text-xs">{v.buyer.phone}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600">{v.property.society_name} &middot; {v.property.locality}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="h-3 w-3" />
                            <span>{formatDateTime(v.scheduled_at)}</span>
                          </div>
                          {v.broker_notes && <p className="text-xs text-gray-500 mt-1.5 italic">{v.broker_notes}</p>}
                        </div>
                        {/* Buttons — desktop only (right column) */}
                        <div className="hidden sm:flex flex-col gap-2 flex-shrink-0">
                          <Button size="sm" variant="secondary" onClick={() => updateStatus(v.id, 'COMPLETED')}>Completed</Button>
                          <Button size="sm" variant="ghost" onClick={() => updateStatus(v.id, 'CANCELLED')}>Cancel</Button>
                        </div>
                      </div>
                      {/* Buttons — mobile only (full-width row below) */}
                      <div className="flex gap-2 mt-3 sm:hidden">
                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => updateStatus(v.id, 'COMPLETED')}>Completed</Button>
                        <Button size="sm" variant="ghost" className="flex-1" onClick={() => updateStatus(v.id, 'CANCELLED')}>Cancel</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">Past Visits ({past.length})</h2>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {past.map((v) => (
                  <div key={v.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{v.buyer.name} &rarr; {v.property.society_name}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(v.scheduled_at)}</p>
                      {v.buyer_feedback && <p className="text-xs text-gray-600 mt-0.5 italic">"{v.buyer_feedback}"</p>}
                    </div>
                    <VisitStatusBadge status={v.status} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule / Success modal */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title={createdVisit ? 'Visit Scheduled!' : 'Schedule Site Visit'}
        size={createdVisit ? 'md' : 'md'}
      >
        {createdVisit ? (
          // Success state — show WhatsApp message
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Visit confirmed for {createdVisit.buyer.name}</p>
                <p className="text-sm text-green-600">{createdVisit.property.society_name} &middot; {formatDateTime(createdVisit.scheduled_at)}</p>
              </div>
            </div>

            {/* WhatsApp message */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-semibold text-gray-700">WhatsApp Message</p>
                </div>
                <CopyButton text={buildWhatsAppMessage(createdVisit)} />
              </div>
              <div className="bg-[#e8f5e9] border border-green-200 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed text-xs max-h-72 overflow-y-auto">
                {buildWhatsAppMessage(createdVisit)}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Copy and paste this into WhatsApp to send to the client.</p>
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <Button variant="secondary" onClick={() => { setCreatedVisit(null); setForm({ buyer_id: '', property_id: '', scheduled_at: '', broker_notes: '' }); }}>
                Schedule Another
              </Button>
              <Button onClick={closeModal}>Done</Button>
            </div>
          </div>
        ) : (
          // Schedule form
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buyer *</label>
              <select className={inputCls} required value={form.buyer_id} onChange={(e) => set('buyer_id', e.target.value)}>
                <option value="">Select buyer</option>
                {buyers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
              <select className={inputCls} required value={form.property_id} onChange={(e) => set('property_id', e.target.value)}>
                <option value="">Select property</option>
                {properties.map((p) => <option key={p.id} value={p.id}>{p.society_name} — {p.locality}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date &amp; Time *</label>
              <input type="datetime-local" className={inputCls} required value={form.scheduled_at} onChange={(e) => set('scheduled_at', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className={inputCls} rows={2} value={form.broker_notes} onChange={(e) => set('broker_notes', e.target.value)} placeholder="Entry gate instructions, parking info…" />
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
              <Button type="submit" loading={saving}>Schedule Visit</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default function VisitsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">Loading…</div>}>
      <VisitsPageInner />
    </Suspense>
  );
}