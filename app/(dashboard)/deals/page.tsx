'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { KanbanBoard } from '@/components/shared/KanbanBoard';
import { User, Building2, Sparkles } from 'lucide-react';

type Deal = {
  id: string; stage: string; commission_amount: number | null; notes: string | null;
  expected_close_date: string | null;
  buyer: { id: string; name: string }; property: { id: string; society_name: string; locality: string; price: number };
};

type Buyer = { id: string; name: string };
type Property = { id: string; society_name: string; locality: string };

const STAGE_LABELS: Record<string, string> = {
  INQUIRY: 'Fresh Lead', SITE_VISIT: 'Site Visit', NEGOTIATION: 'Negotiating',
  REGISTERED: 'Closed Won', CLOSED_LOST: 'Lost',
};

function DealsPageInner() {
  const searchParams = useSearchParams();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    buyer_id: '', property_id: '', stage: 'INQUIRY',
    expected_close_date: '', commission_amount: '', notes: '',
  });
  const autoOpened = useRef(false);

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

  // Auto-fill from URL params (from match detail "Create Deal" button)
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
    setForm({ buyer_id: '', property_id: '', stage: 'INQUIRY', expected_close_date: '', commission_amount: '', notes: '' });
    setError('');
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        commission_amount: form.commission_amount ? Number(form.commission_amount) : undefined,
      }),
    });
    if (res.ok) { setShowModal(false); load(); }
    else { const d = await res.json(); setError(d.error ?? 'Failed to create deal'); }
    setSaving(false);
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  // Resolve names from IDs for the pre-fill banner
  const prefillBuyer = form.buyer_id ? buyers.find((b) => b.id === form.buyer_id) : null;
  const prefillProperty = form.property_id ? properties.find((p) => p.id === form.property_id) : null;
  const isPreFilled = !!(searchParams.get('buyer') || searchParams.get('property'));

  return (
    <div>
      <Header
        title="Deals Pipeline"
        subtitle={`${deals.length} deal${deals.length !== 1 ? 's' : ''} in pipeline`}
        action={
          <Button onClick={openNew}>
            <span className="text-lg leading-none">+</span> New Deal
          </Button>
        }
      />

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading deals…</div>
      ) : (
        <KanbanBoard deals={deals} />
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Deal" size="md">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          {/* Pre-fill banner when coming from match page */}
          {isPreFilled && (prefillBuyer || prefillProperty) && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-primary-800">
                <p className="font-medium mb-1">Pre-filled from match</p>
                {prefillBuyer && (
                  <div className="flex items-center gap-1.5 text-primary-700">
                    <User className="h-3.5 w-3.5" />
                    <span>{prefillBuyer.name}</span>
                  </div>
                )}
                {prefillProperty && (
                  <div className="flex items-center gap-1.5 text-primary-700 mt-0.5">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>{prefillProperty.society_name} &middot; {prefillProperty.locality}</span>
                  </div>
                )}
              </div>
            </div>
          )}

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
                {Object.entries(STAGE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
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

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-400">Loading…</div>}>
      <DealsPageInner />
    </Suspense>
  );
}