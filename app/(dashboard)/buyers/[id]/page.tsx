import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { BuyerStatusBadge, DealStageBadge, VisitStatusBadge } from '@/components/ui/Badge';
import { formatCurrency, formatDate, formatRelative } from '@/lib/utils';
import { Phone, Mail, MapPin, Home, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BuyerDetailPage({ params }: { params: { id: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) redirect('/login');

  const buyer = await prisma.buyer.findFirst({
    where: { id: params.id, broker_id: broker.id },
    include: {
      site_visits: { include: { property: true }, orderBy: { scheduled_at: 'desc' } },
      deals: { include: { property: true }, orderBy: { created_at: 'desc' } },
      follow_ups: { orderBy: { due_at: 'asc' } },
    },
  });

  if (!buyer) notFound();

  return (
    <div>
      <Header title={buyer.name} subtitle={`Added ${formatRelative(buyer.created_at)}`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact Details */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Contact</h2>
                <BuyerStatusBadge status={buyer.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="h-4 w-4 text-gray-400" /> {buyer.phone}
              </div>
              {buyer.email && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4 text-gray-400" /> {buyer.email}
                </div>
              )}
              {buyer.last_contacted_at && (
                <p className="text-gray-500 text-xs">Last contact: {formatRelative(buyer.last_contacted_at)}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Requirements</h2></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Budget</span>
                <span className="font-medium">{formatCurrency(buyer.budget_min)}–{formatCurrency(buyer.budget_max)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">BHK</span>
                <span className="font-medium">{buyer.bhk_requirement.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Purpose</span>
                <span className="font-medium">{buyer.purpose.replace('_', ' ')}</span>
              </div>
              {buyer.furnishing_preference && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Furnishing</span>
                  <span className="font-medium">{buyer.furnishing_preference}</span>
                </div>
              )}
              {buyer.floor_preference && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Floor</span>
                  <span className="font-medium">{buyer.floor_preference}</span>
                </div>
              )}
              <div>
                <p className="text-gray-500 mb-1">Localities</p>
                <div className="flex flex-wrap gap-1">
                  {buyer.preferred_localities.map((l) => (
                    <span key={l} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{l}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {buyer.notes && (
            <Card>
              <CardHeader><h2 className="font-semibold text-gray-900">Notes</h2></CardHeader>
              <CardContent><p className="text-sm text-gray-600">{buyer.notes}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Right: Deals, Visits, Follow-ups */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Deals ({buyer.deals.length})</h2></CardHeader>
            <CardContent className="p-0">
              {buyer.deals.length === 0 ? (
                <p className="px-6 py-4 text-sm text-gray-400">No deals yet</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {buyer.deals.map((d) => (
                    <div key={d.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{d.property.society_name}</p>
                        <p className="text-xs text-gray-500">{d.property.locality} · {formatDate(d.created_at)}</p>
                      </div>
                      <DealStageBadge stage={d.stage} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Site Visits ({buyer.site_visits.length})</h2></CardHeader>
            <CardContent className="p-0">
              {buyer.site_visits.length === 0 ? (
                <p className="px-6 py-4 text-sm text-gray-400">No visits yet</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {buyer.site_visits.map((v) => (
                    <div key={v.id} className="px-6 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{v.property.society_name}</p>
                        <VisitStatusBadge status={v.status} />
                      </div>
                      <p className="text-xs text-gray-500">{formatDate(v.scheduled_at)}</p>
                      {v.buyer_feedback && <p className="text-xs text-gray-600 mt-1 italic">"{v.buyer_feedback}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><h2 className="font-semibold text-gray-900">Follow-ups ({buyer.follow_ups.length})</h2></CardHeader>
            <CardContent className="p-0">
              {buyer.follow_ups.length === 0 ? (
                <p className="px-6 py-4 text-sm text-gray-400">No follow-ups</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {buyer.follow_ups.map((f) => (
                    <div key={f.id} className="px-6 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{f.type} · {f.note}</p>
                        <p className="text-xs text-gray-500">Due: {formatDate(f.due_at)}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${f.is_done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {f.is_done ? 'Done' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
