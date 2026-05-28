'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate, DEAL_STAGE_LABELS } from '@/lib/utils';
import { CheckCircle2, Circle, ArrowRight, Clock, XCircle, Trophy, Pencil } from 'lucide-react';

const PROGRESS_STEPS = ['INQUIRY', 'SITE_VISIT', 'NEGOTIATION', 'REGISTERED'] as const;

type Deal = {
  id: string; stage: string; commission_amount: number | null; notes: string | null;
  expected_close_date: string | null; created_at: string; updated_at: string;
  buyer: { id: string; name: string; phone: string; purpose: string };
  property: { id: string; society_name: string; locality: string; price: number; bhk: string };
  documents: { id: string; document_name: string; required_from: string; is_received: boolean; received_at: string | null }[];
  stage_history: { id: string; stage: string; moved_at: string; note: string | null }[];
};

function nextActiveStage(current: string): string | null {
  const normalised = current === 'AGREEMENT' ? 'NEGOTIATION' : current;
  const idx = PROGRESS_STEPS.indexOf(normalised as typeof PROGRESS_STEPS[number]);
  if (idx < 0 || idx >= PROGRESS_STEPS.length - 1) return null;
  return PROGRESS_STEPS[idx + 1];
}

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [markingLost, setMarkingLost] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ commission_amount: '', expected_close_date: '', notes: '' });

  async function load() {
    const res = await fetch(`/api/deals/${id}`);
    if (res.ok) {
      const data = await res.json();
      setDeal(data);
      setEditForm({
        commission_amount: data.commission_amount ? String(data.commission_amount) : '',
        expected_close_date: data.expected_close_date ? data.expected_close_date.slice(0, 10) : '',
        notes: data.notes ?? '',
      });
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function changeStage(stage: string) {
    await fetch(`/api/deals/${id}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    await load();
  }

  async function advanceStage() {
    if (!deal) return;
    const next = nextActiveStage(deal.stage);
    if (!next) return;
    setAdvancing(true);
    await changeStage(next);
    setAdvancing(false);
  }

  async function markLost() {
    if (!deal || !confirm('Mark as lost? Buyer will return to Active and property back to Available.')) return;
    setMarkingLost(true);
    await changeStage('CLOSED_LOST');
    setMarkingLost(false);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!deal) return;
    setSaving(true);
    await fetch(`/api/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commission_amount: editForm.commission_amount ? Number(editForm.commission_amount) : null,
        expected_close_date: editForm.expected_close_date || null,
        notes: editForm.notes || null,
      }),
    });
    await load();
    setShowEdit(false);
    setSaving(false);
  }

  async function toggleDocument(docId: string, current: boolean) {
    await fetch(`/api/deals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: docId, is_received: !current }),
    });
    load();
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading deal…</div>;
  if (!deal) return <div className="text-center py-20 text-gray-400">Deal not found</div>;

  const isWon = deal.stage === 'REGISTERED';
  const isLost = deal.stage === 'CLOSED_LOST';
  const isClosed = isWon || isLost;
  const next = nextActiveStage(deal.stage);
  const docsReceived = deal.documents.filter((d) => d.is_received).length;
  const displayStage = deal.stage === 'AGREEMENT' ? 'NEGOTIATION' : deal.stage;
  const currentStepIdx = PROGRESS_STEPS.indexOf(displayStage as typeof PROGRESS_STEPS[number]);
  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div>
      <Header
        title={`${deal.buyer.name} ↔ ${deal.property.society_name}`}
        subtitle={deal.property.locality}
        action={
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            {!isClosed && next && (
              <Button onClick={advanceStage} loading={advancing} size="sm">
                Move to {DEAL_STAGE_LABELS[next]} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {!isClosed && (
              <Button variant="secondary" size="sm" onClick={markLost} loading={markingLost} className="text-red-600 border-red-200 hover:bg-red-50">
                <XCircle className="h-4 w-4" /> Mark Lost
              </Button>
            )}
          </div>
        }
      />

      {/* Status banner */}
      {isWon && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Trophy className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Deal Closed Won!</p>
            <p className="text-sm text-green-600">
              Buyer marked Closed &middot; Property marked {deal.buyer.purpose === 'RENTAL' ? 'Rented' : 'Sold'}
            </p>
          </div>
          {deal.commission_amount && (
            <span className="ml-auto font-bold text-green-700 text-lg flex-shrink-0">{formatCurrency(deal.commission_amount)}</span>
          )}
        </div>
      )}
      {isLost && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <p className="text-gray-500">Deal lost &middot; Buyer reactivated &middot; Property back on market</p>
        </div>
      )}

      {/* 4-step progress bar */}
      {!isLost && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {PROGRESS_STEPS.map((s, i) => {
              const done = i < currentStepIdx || isWon;
              const current = i === currentStepIdx && !isWon;
              return (
                <div key={s} className="flex items-center gap-1 flex-shrink-0">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    current ? 'bg-primary-500 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                    {DEAL_STAGE_LABELS[s]}
                  </div>
                  {i < PROGRESS_STEPS.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader><h2 className="font-semibold">Deal Info</h2></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Buyer</span><span className="font-medium">{deal.buyer.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{deal.buyer.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Property</span><span className="font-medium text-right">{deal.property.society_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">BHK</span><span>{deal.property.bhk}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-bold text-primary-600">{formatCurrency(deal.property.price)}</span></div>
              {deal.commission_amount != null && (
                <div className="flex justify-between"><span className="text-gray-500">Commission</span><span className="font-medium text-green-600">{formatCurrency(deal.commission_amount)}</span></div>
              )}
              {deal.expected_close_date && (
                <div className="flex justify-between"><span className="text-gray-500">Expected Close</span><span>{formatDate(deal.expected_close_date)}</span></div>
              )}
              {deal.notes && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-gray-500 text-xs mb-1">Notes</p>
                  <p className="text-gray-700">{deal.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold">Timeline</h2></CardHeader>
            <CardContent className="space-y-2">
              {deal.stage_history.length === 0 && (
                <p className="text-xs text-gray-400">No history yet</p>
              )}
              {deal.stage_history.map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-sm">
                  <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">{DEAL_STAGE_LABELS[h.stage] ?? h.stage}</span>
                  <span className="text-gray-400 text-xs ml-auto">{formatDate(h.moved_at)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Documents */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Documents Checklist</h2>
                <span className="text-sm text-gray-500">{docsReceived}/{deal.documents.length} received</span>
              </div>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${deal.documents.length > 0 ? (docsReceived / deal.documents.length) * 100 : 0}%` }} />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {deal.documents.length === 0 && (
                <p className="px-6 py-4 text-sm text-gray-400">No documents added yet</p>
              )}
              {['BUYER', 'SELLER', 'SOCIETY'].map((from) => {
                const docs = deal.documents.filter((d) => d.required_from === from);
                if (docs.length === 0) return null;
                return (
                  <div key={from}>
                    <p className="px-6 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">{from}</p>
                    {docs.map((doc) => (
                      <div key={doc.id} className="px-6 py-3 flex items-center gap-3 border-b border-gray-100 last:border-0">
                        <button onClick={() => toggleDocument(doc.id, doc.is_received)} className="flex-shrink-0">
                          {doc.is_received
                            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                            : <Circle className="h-5 w-5 text-gray-300 hover:text-primary-400" />}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${doc.is_received ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {doc.document_name}
                          </p>
                          {doc.received_at && <p className="text-xs text-green-600">Received {formatDate(doc.received_at)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Deal" size="sm">
        <form onSubmit={saveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission (₹)</label>
            <input
              type="number"
              className={inputCls}
              value={editForm.commission_amount}
              onChange={(e) => setEditForm((f) => ({ ...f, commission_amount: e.target.value }))}
              placeholder="e.g. 150000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Close Date</label>
            <input
              type="date"
              className={inputCls}
              value={editForm.expected_close_date}
              onChange={(e) => setEditForm((f) => ({ ...f, expected_close_date: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className={inputCls}
              rows={3}
              value={editForm.notes}
              onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Any notes about this deal…"
            />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <Button type="button" variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}