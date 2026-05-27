'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { DealStageBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate, DEAL_STAGE_LABELS, DEAL_STAGES } from '@/lib/utils';
import { CheckCircle2, Circle, ArrowRight, Clock, FileText } from 'lucide-react';

type Deal = {
  id: string; stage: string; commission_amount: number | null; notes: string | null;
  expected_close_date: string | null; created_at: string; updated_at: string;
  buyer: { id: string; name: string; phone: string };
  property: { id: string; society_name: string; locality: string; price: number; bhk: string };
  documents: { id: string; document_name: string; required_from: string; is_received: boolean; received_at: string | null }[];
  stage_history: { id: string; stage: string; moved_at: string; note: string | null }[];
};

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  async function load() {
    const res = await fetch(`/api/deals/${id}`);
    if (res.ok) setDeal(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function advanceStage() {
    if (!deal) return;
    const idx = DEAL_STAGES.indexOf(deal.stage as typeof DEAL_STAGES[number]);
    if (idx >= DEAL_STAGES.length - 1) return;
    setAdvancing(true);
    await fetch(`/api/deals/${id}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: DEAL_STAGES[idx + 1] }),
    });
    await load();
    setAdvancing(false);
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

  const currentIdx = DEAL_STAGES.indexOf(deal.stage as typeof DEAL_STAGES[number]);
  const canAdvance = currentIdx < DEAL_STAGES.length - 1 && deal.stage !== 'CLOSED_LOST';
  const docsReceived = deal.documents.filter((d) => d.is_received).length;

  return (
    <div>
      <Header
        title={`${deal.buyer.name} ↔ ${deal.property.society_name}`}
        subtitle={deal.property.locality}
        action={
          canAdvance ? (
            <Button onClick={advanceStage} loading={advancing}>
              Move to {DEAL_STAGE_LABELS[DEAL_STAGES[currentIdx + 1]]} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : undefined
        }
      />

      {/* Stage progress */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {DEAL_STAGES.map((s, i) => {
            const done = i < currentIdx;
            const current = i === currentIdx;
            return (
              <div key={s} className="flex items-center gap-1 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${current ? 'bg-primary-500 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                  {DEAL_STAGE_LABELS[s]}
                </div>
                {i < DEAL_STAGES.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader><h2 className="font-semibold">Deal Info</h2></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Buyer</span><span className="font-medium">{deal.buyer.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{deal.buyer.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Property</span><span className="font-medium text-right">{deal.property.society_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Price</span><span className="font-bold text-primary-600">{formatCurrency(deal.property.price)}</span></div>
              {deal.commission_amount && (
                <div className="flex justify-between"><span className="text-gray-500">Commission</span><span className="font-medium text-green-600">{formatCurrency(deal.commission_amount)}</span></div>
              )}
              {deal.expected_close_date && (
                <div className="flex justify-between"><span className="text-gray-500">Expected Close</span><span>{formatDate(deal.expected_close_date)}</span></div>
              )}
            </CardContent>
          </Card>

          {deal.notes && (
            <Card>
              <CardHeader><h2 className="font-semibold">Notes</h2></CardHeader>
              <CardContent><p className="text-sm text-gray-600">{deal.notes}</p></CardContent>
            </Card>
          )}

          {/* Stage History */}
          <Card>
            <CardHeader><h2 className="font-semibold">Stage History</h2></CardHeader>
            <CardContent className="space-y-2">
              {deal.stage_history.map((h) => (
                <div key={h.id} className="flex items-center gap-2 text-sm">
                  <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">{DEAL_STAGE_LABELS[h.stage]}</span>
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
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${deal.documents.length > 0 ? (docsReceived / deal.documents.length) * 100 : 0}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
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
                            : <Circle className="h-5 w-5 text-gray-300 hover:text-primary-400" />
                          }
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
    </div>
  );
}
