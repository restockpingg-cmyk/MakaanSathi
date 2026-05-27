'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { KanbanBoard } from '@/components/shared/KanbanBoard';

type Deal = {
  id: string; stage: string; commission_amount: number | null; notes: string | null;
  buyer: { id: string; name: string }; property: { id: string; society_name: string; locality: string; price: number };
};

type Buyer = { id: string; name: string };
type Property = { id: string; society_name: string; locality: string };

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [form, setForm] = useState({ buyer_id: '', property_id: '', stage: 'INQUIRY', expected_close_date: '', commission_amount: '', notes: '' });

  async function load() {
    setLoading(true);
    const [d, b, p] = await Promise.all([
      fetch('/api/deals').then((r) => r.json()),
      fetch('/api/buyers').then((r) => r.json()),
      fetch('/api/properties').then((r) => r.json()),
    ]);
    setDeals(d); setBuyers(b); setProperties(p);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, commission_amount: form.commission_amount ? Number(form.commission_amount) : undefined }),
    });
    if (res.ok) { setShowModal(false); load(); }
    else { const d = await res.json(); setError(d.error ?? 'Failed'); }
    setSaving(false);
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div>
      <Header
        title="Deals Pipeline"
        subtitle={`${deals.length} deal${deals.length !== 1 ? 's' : ''} in pipeline`}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setView(view === 'kanban' ? 'list' : 'kanban')}>
              {view === 'kanban' ? 'List View' : 'Kanban View'}
            </Button>
            <Button onClick={() => setShowModal(true)}><span className="text-lg leading-none">+</span> New Deal</Button>
          </div>
        }
      />

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading deals…</div>
      ) : (
        <KanbanBoard deals={deals} />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Deal" size="md">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select className={inputCls} value={form.stage} onChange={(e) => set('stage', e.target.value)}>
                {['INQUIRY','SITE_VISIT','NEGOTIATION','AGREEMENT','REGISTERED','CLOSED_LOST'].map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close</label>
              <input type="date" className={inputCls} value={form.expected_close_date} onChange={(e) => set('expected_close_date', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission (₹)</label>
            <input type="number" className={inputCls} value={form.commission_amount} onChange={(e) => set('commission_amount', e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea className={inputCls} rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Deal</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
