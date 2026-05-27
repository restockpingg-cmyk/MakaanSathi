'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDate, isOverdue } from '@/lib/utils';
import { Plus, CheckCircle2, Circle, Phone, MessageSquare, MapPin, AlertTriangle } from 'lucide-react';

type FollowUp = {
  id: string; due_at: string; type: string; note: string | null; is_done: boolean;
  buyer: { id: string; name: string } | null;
  property: { id: string; society_name: string } | null;
};

type Buyer = { id: string; name: string };
type Property = { id: string; society_name: string; locality: string };

const TYPE_ICONS: Record<string, React.ElementType> = { CALL: Phone, WHATSAPP: MessageSquare, SITE_VISIT: MapPin };

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'done'>('pending');
  const [form, setForm] = useState({ buyer_id: '', property_id: '', due_at: '', type: 'CALL', note: '' });

  async function load() {
    setLoading(true);
    const [f, b, p] = await Promise.all([
      fetch('/api/followups').then((r) => r.json()),
      fetch('/api/buyers').then((r) => r.json()),
      fetch('/api/properties').then((r) => r.json()),
    ]);
    setFollowups(f); setBuyers(b); setProperties(p);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function toggleDone(id: string, current: boolean) {
    await fetch(`/api/followups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_done: !current }),
    });
    load();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, buyer_id: form.buyer_id || undefined, property_id: form.property_id || undefined }),
    });
    if (res.ok) { setShowModal(false); load(); }
    setSaving(false);
  }

  const filtered = followups.filter((f) => {
    if (filter === 'pending') return !f.is_done && !isOverdue(f.due_at);
    if (filter === 'overdue') return !f.is_done && isOverdue(f.due_at);
    if (filter === 'done') return f.is_done;
    return true;
  });

  const overdueCount = followups.filter((f) => !f.is_done && isOverdue(f.due_at)).length;
  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div>
      <Header
        title="Follow-ups"
        subtitle={`${overdueCount > 0 ? `${overdueCount} overdue · ` : ''}${followups.filter((f) => !f.is_done).length} pending`}
        action={<Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Add Follow-up</Button>}
      />

      {overdueCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-700 font-medium">{overdueCount} overdue follow-up{overdueCount > 1 ? 's' : ''}</p>
          <button onClick={() => setFilter('overdue')} className="ml-auto text-red-600 text-xs underline">View</button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'overdue', 'done'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-primary-500 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-primary-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 && <p className="text-center py-12 text-gray-400">No follow-ups in this category</p>}
          {filtered.map((f) => {
            const Icon = TYPE_ICONS[f.type] ?? Phone;
            const overdue = !f.is_done && isOverdue(f.due_at);
            return (
              <div key={f.id} className={`bg-white border rounded-xl p-4 flex items-start gap-3 ${overdue ? 'border-red-200' : 'border-gray-200'}`}>
                <button onClick={() => toggleDone(f.id, f.is_done)} className="mt-0.5 flex-shrink-0">
                  {f.is_done
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                    : <Circle className={`h-5 w-5 ${overdue ? 'text-red-400' : 'text-gray-300'}`} />
                  }
                </button>
                <div className={`p-1.5 rounded-lg flex-shrink-0 ${f.type === 'CALL' ? 'bg-blue-100 text-blue-600' : f.type === 'WHATSAPP' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {f.buyer && <p className="font-medium text-sm text-gray-900">{f.buyer.name}</p>}
                      {f.property && <p className="text-xs text-gray-500">{f.property.society_name}</p>}
                      {f.note && <p className="text-sm text-gray-600 mt-0.5">{f.note}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-medium ${overdue ? 'text-red-600' : f.is_done ? 'text-green-600' : 'text-gray-500'}`}>
                        {overdue ? '⚠ ' : ''}{formatDate(f.due_at)}
                      </p>
                      <span className="text-xs text-gray-400">{f.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Follow-up" size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
              <select className={inputCls} value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="CALL">Call</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SITE_VISIT">Site Visit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input type="date" className={inputCls} required value={form.due_at} onChange={(e) => set('due_at', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Buyer</label>
            <select className={inputCls} value={form.buyer_id} onChange={(e) => set('buyer_id', e.target.value)}>
              <option value="">None</option>
              {buyers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select className={inputCls} value={form.property_id} onChange={(e) => set('property_id', e.target.value)}>
              <option value="">None</option>
              {properties.map((p) => <option key={p.id} value={p.id}>{p.society_name} — {p.locality}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea className={inputCls} rows={2} value={form.note} onChange={(e) => set('note', e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
