'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatDate, formatCurrency, isOverdue } from '@/lib/utils';
import {
  Plus, CheckCircle2, Circle, Phone, MessageSquare, MapPin,
  AlertTriangle, CalendarCheck, ChevronDown, ChevronUp,
  Mail, IndianRupee, BedDouble, Building2, Sofa, User,
} from 'lucide-react';

type Buyer = {
  id: string; name: string; phone: string; email: string | null;
  budget_min: number; budget_max: number;
  bhk_requirement: string[]; preferred_localities: string[];
  furnishing_preference: string | null; purpose: string; notes: string | null;
};

type Property = {
  id: string; society_name: string; locality: string;
  bhk: string; price: number; furnishing: string; property_type: string;
};

type FollowUp = {
  id: string; due_at: string; type: string; note: string | null; is_done: boolean;
  buyer: Buyer | null;
  property: Property | null;
};

type BuyerForSelect = { id: string; name: string };
type PropertyForSelect = { id: string; society_name: string; locality: string };

const TYPE_ICONS: Record<string, React.ElementType> = { CALL: Phone, WHATSAPP: MessageSquare, SITE_VISIT: MapPin };

function BuyerDetail({ buyer, property }: { buyer: Buyer; property: Property | null }) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      {/* Quick actions */}
      <div className="flex gap-2 flex-wrap">
        <a href={`tel:${buyer.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
          <Phone className="h-3.5 w-3.5" /> Call {buyer.phone}
        </a>
        <a href={`https://wa.me/91${buyer.phone.replace(/\D/g, '')}`}
          target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors">
          <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
        </a>
        {buyer.email && (
          <a href={`mailto:${buyer.email}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors">
            <Mail className="h-3.5 w-3.5" /> {buyer.email}
          </a>
        )}
      </div>

      {/* Buyer info grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-gray-600">
          <IndianRupee className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span className="text-gray-400">Budget:</span>
          <span className="font-medium">{formatCurrency(buyer.budget_min)}–{formatCurrency(buyer.budget_max)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <BedDouble className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span className="text-gray-400">BHK:</span>
          <span className="font-medium">{buyer.bhk_requirement.join(', ')}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-600">
          <User className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span className="text-gray-400">Purpose:</span>
          <span className="font-medium capitalize">{buyer.purpose.replace('_', ' ').toLowerCase()}</span>
        </div>
        {buyer.furnishing_preference && (
          <div className="flex items-center gap-1.5 text-gray-600">
            <Sofa className="h-3 w-3 text-gray-400 flex-shrink-0" />
            <span className="text-gray-400">Furnishing:</span>
            <span className="font-medium capitalize">{buyer.furnishing_preference.replace('_', ' ').toLowerCase()}</span>
          </div>
        )}
      </div>

      {buyer.preferred_localities.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1">Preferred areas</p>
          <div className="flex flex-wrap gap-1">
            {buyer.preferred_localities.map((l) => (
              <span key={l} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{l}</span>
            ))}
          </div>
        </div>
      )}

      {buyer.notes && (
        <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2">"{buyer.notes}"</p>
      )}

      {/* Property they visited */}
      {property && (
        <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <div className="text-xs">
            <span className="font-medium text-gray-700">{property.society_name}</span>
            <span className="text-gray-400"> · {property.locality} · {property.bhk} · {formatCurrency(property.price)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [buyersForSelect, setBuyersForSelect] = useState<BuyerForSelect[]>([]);
  const [propertiesForSelect, setPropertiesForSelect] = useState<PropertyForSelect[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'done'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({ buyer_id: '', property_id: '', due_at: '', type: 'CALL', note: '' });

  async function load() {
    setLoading(true);
    const [f, b, p] = await Promise.all([
      fetch('/api/followups').then((r) => r.json()),
      fetch('/api/buyers').then((r) => r.json()),
      fetch('/api/properties').then((r) => r.json()),
    ]);
    setFollowups(f); setBuyersForSelect(b); setPropertiesForSelect(p);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function toggleDone(e: React.MouseEvent, id: string, current: boolean) {
    e.stopPropagation();
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

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
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
            const isPostVisit = f.note?.startsWith('Post-visit follow-up:');
            const isExpanded = expandedId === f.id;
            const hasBuyerDetail = !!f.buyer;

            return (
              <div
                key={f.id}
                onClick={() => hasBuyerDetail && toggleExpand(f.id)}
                className={`bg-white border rounded-xl p-4 transition-all ${hasBuyerDetail ? 'cursor-pointer' : ''} ${
                  overdue ? 'border-red-200 bg-red-50/30' :
                  isPostVisit && !f.is_done ? 'border-purple-200 bg-purple-50/30' :
                  isExpanded ? 'border-primary-200 bg-primary-50/20' :
                  'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Card header row */}
                <div className="flex items-start gap-3">
                  {/* Done toggle */}
                  <button onClick={(e) => toggleDone(e, f.id, f.is_done)} className="mt-0.5 flex-shrink-0">
                    {f.is_done
                      ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                      : <Circle className={`h-5 w-5 ${overdue ? 'text-red-400' : isPostVisit ? 'text-purple-400' : 'text-gray-300'}`} />
                    }
                  </button>

                  {/* Type icon */}
                  <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${f.type === 'CALL' ? 'bg-blue-100 text-blue-600' : f.type === 'WHATSAPP' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {f.buyer
                            ? <p className="font-semibold text-sm text-gray-900">{f.buyer.name}</p>
                            : <p className="font-medium text-sm text-gray-500 italic">No buyer linked</p>
                          }
                          {isPostVisit && !f.is_done && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                              <CalendarCheck className="h-3 w-3" /> After site visit
                            </span>
                          )}
                        </div>
                        {f.buyer && (
                          <p className="text-xs text-gray-400 mt-0.5">{f.buyer.phone}</p>
                        )}
                        {f.property && (
                          <p className="text-xs text-gray-500 mt-0.5">{f.property.society_name} &middot; {f.property.locality}</p>
                        )}
                        {f.note && !isPostVisit && (
                          <p className="text-xs text-gray-600 mt-1">{f.note}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-xs font-medium ${overdue ? 'text-red-600' : f.is_done ? 'text-green-600' : 'text-gray-500'}`}>
                            {overdue ? '⚠ ' : ''}{formatDate(f.due_at)}
                          </p>
                          <span className="text-xs text-gray-400 capitalize">{f.type.toLowerCase()}</span>
                        </div>
                        {hasBuyerDetail && (
                          isExpanded
                            ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded buyer details */}
                {isExpanded && f.buyer && (
                  <BuyerDetail buyer={f.buyer} property={f.property} />
                )}
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
              {buyersForSelect.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
            <select className={inputCls} value={form.property_id} onChange={(e) => set('property_id', e.target.value)}>
              <option value="">None</option>
              {propertiesForSelect.map((p) => <option key={p.id} value={p.id}>{p.society_name} — {p.locality}</option>)}
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