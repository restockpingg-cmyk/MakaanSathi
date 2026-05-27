'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BuyerStatusBadge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { formatCurrency, formatRelative, MUMBAI_LOCALITIES, BHK_OPTIONS } from '@/lib/utils';
import { Plus, Phone, Search, User } from 'lucide-react';
import Link from 'next/link';

type Buyer = {
  id: string; name: string; phone: string; email: string | null;
  budget_min: number; budget_max: number; preferred_localities: string[];
  bhk_requirement: string[]; purpose: string; status: string;
  last_contacted_at: string | null; created_at: string;
};

export default function BuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', phone: '', email: '', budget_min: '', budget_max: '',
    preferred_localities: [] as string[], bhk_requirement: [] as string[],
    floor_preference: '', furnishing_preference: '', purpose: 'SELF_USE', notes: '',
  });

  async function load() {
    setLoading(true);
    const res = await fetch('/api/buyers');
    const data = await res.json();
    setBuyers(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }
  function toggleArr(key: 'preferred_localities' | 'bhk_requirement', val: string) {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const res = await fetch('/api/buyers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, budget_min: Number(form.budget_min), budget_max: Number(form.budget_max) }),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ name: '', phone: '', email: '', budget_min: '', budget_max: '', preferred_localities: [], bhk_requirement: [], floor_preference: '', furnishing_preference: '', purpose: 'SELF_USE', notes: '' });
      load();
    } else {
      const d = await res.json();
      setError(d.error ?? 'Failed to save');
    }
    setSaving(false);
  }

  const filtered = buyers.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.phone.includes(search) ||
    (b.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div>
      <Header
        title="Buyers"
        subtitle={`${buyers.length} buyer${buyers.length !== 1 ? 's' : ''} in your CRM`}
        action={<Button onClick={() => setShowModal(true)}><Plus className="h-4 w-4" /> Add Buyer</Button>}
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading buyers…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {search ? 'No buyers match your search' : 'No buyers yet — add your first one'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <Link key={b.id} href={`/buyers/${b.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{b.name}</p>
                      <p className="text-xs text-gray-500">{b.phone}</p>
                    </div>
                  </div>
                  <BuyerStatusBadge status={b.status} />
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Budget: <span className="font-medium">{formatCurrency(b.budget_min)}–{formatCurrency(b.budget_max)}</span></p>
                  <p>BHK: <span className="font-medium">{b.bhk_requirement.join(', ')}</span></p>
                  <p className="truncate">Areas: <span className="font-medium">{b.preferred_localities.join(', ')}</span></p>
                </div>
                {b.last_contacted_at && (
                  <p className="text-xs text-gray-400 mt-3">Last contact: {formatRelative(b.last_contacted_at)}</p>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Add Buyer Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Buyer" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input className={inputCls} required value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input className={inputCls} required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Min (₹) *</label>
              <input type="number" className={inputCls} required value={form.budget_min} onChange={(e) => set('budget_min', e.target.value)} placeholder="5000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Max (₹) *</label>
              <input type="number" className={inputCls} required value={form.budget_max} onChange={(e) => set('budget_max', e.target.value)} placeholder="10000000" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">BHK Required *</label>
              <div className="flex gap-2 flex-wrap">
                {BHK_OPTIONS.map((b) => (
                  <button key={b} type="button"
                    onClick={() => toggleArr('bhk_requirement', b)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${form.bhk_requirement.includes(b) ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300 text-gray-600 hover:border-primary-300'}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Localities *</label>
              <div className="flex gap-2 flex-wrap max-h-28 overflow-y-auto">
                {MUMBAI_LOCALITIES.map((l) => (
                  <button key={l} type="button"
                    onClick={() => toggleArr('preferred_localities', l)}
                    className={`px-2.5 py-1 rounded-lg text-xs border transition-colors ${form.preferred_localities.includes(l) ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300 text-gray-600 hover:border-primary-300'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
              <select className={inputCls} value={form.purpose} onChange={(e) => set('purpose', e.target.value)}>
                <option value="SELF_USE">Self Use</option>
                <option value="INVESTMENT">Investment</option>
                <option value="RENTAL">Rental</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Furnishing Preference</label>
              <select className={inputCls} value={form.furnishing_preference} onChange={(e) => set('furnishing_preference', e.target.value)}>
                <option value="">Any</option>
                <option value="FURNISHED">Furnished</option>
                <option value="SEMI">Semi-Furnished</option>
                <option value="UNFURNISHED">Unfurnished</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea className={inputCls} rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Buyer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
