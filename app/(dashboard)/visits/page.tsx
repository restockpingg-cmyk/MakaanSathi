'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { VisitStatusBadge } from '@/components/ui/Badge';
import { formatDate, formatRelative } from '@/lib/utils';
import { Plus, Calendar, User, Building2 } from 'lucide-react';

type Visit = {
  id: string; scheduled_at: string; status: string;
  buyer_feedback: string | null; broker_notes: string | null;
  buyer: { id: string; name: string; phone: string };
  property: { id: string; society_name: string; locality: string };
};

type Buyer = { id: string; name: string };
type Property = { id: string; society_name: string; locality: string };

export default function VisitsPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ buyer_id: '', property_id: '', scheduled_at: '', broker_notes: '' });

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

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowModal(false); load(); }
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
        action={<Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Schedule Visit</Button>}
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
                {scheduled.map((v) => (
                  <div key={v.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                    <div className="bg-primary-50 rounded-lg p-3 text-center min-w-14 flex-shrink-0">
                      <p className="text-xs text-primary-600 font-medium">{new Date(v.scheduled_at).toLocaleDateString('en-IN', { month: 'short' })}</p>
                      <p className="text-xl font-bold text-primary-700">{new Date(v.scheduled_at).getDate()}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium text-sm">{v.buyer.name}</span>
                        <span className="text-gray-400 text-xs">{v.buyer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm text-gray-600">{v.property.society_name} · {v.property.locality}</span>
                      </div>
                      {v.broker_notes && <p className="text-xs text-gray-500 mt-1">{v.broker_notes}</p>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(v.id, 'COMPLETED')}>Completed</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(v.id, 'CANCELLED')}>Cancel</Button>
                    </div>
                  </div>
                ))}
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
                      <p className="font-medium text-sm">{v.buyer.name} → {v.property.society_name}</p>
                      <p className="text-xs text-gray-500">{formatDate(v.scheduled_at)}</p>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Schedule Site Visit" size="md">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
            <input type="datetime-local" className={inputCls} required value={form.scheduled_at} onChange={(e) => set('scheduled_at', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className={inputCls} rows={2} value={form.broker_notes} onChange={(e) => set('broker_notes', e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Schedule</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
