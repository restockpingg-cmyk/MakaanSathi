import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { StatCard } from '@/components/ui/Card';
import { Header } from '@/components/shared/Header';
import { MatchCard } from '@/components/shared/MatchCard';
import { getTopMatches } from '@/lib/matching';
import { formatDate, formatRelative, isOverdue, formatCurrency, DEAL_STAGE_LABELS } from '@/lib/utils';
import { Users, Building2, HandshakeIcon, IndianRupee, Bell, CalendarCheck } from 'lucide-react';
import Link from 'next/link';
import { DealStageBadge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const broker = await getAuthenticatedBroker();
  if (!broker) redirect('/login');

  const [buyers, properties, deals, followUps, visits] = await Promise.all([
    prisma.buyer.findMany({ where: { broker_id: broker.id } }),
    prisma.property.findMany({ where: { broker_id: broker.id } }),
    prisma.deal.findMany({
      where: { broker_id: broker.id },
      include: { buyer: true, property: true },
      orderBy: { updated_at: 'desc' },
    }),
    prisma.followUp.findMany({
      where: { broker_id: broker.id, is_done: false },
      include: { buyer: true, property: true },
      orderBy: { due_at: 'asc' },
    }),
    prisma.siteVisit.findMany({
      where: { broker_id: broker.id, status: 'SCHEDULED' },
      include: { buyer: true, property: true },
      orderBy: { scheduled_at: 'asc' },
    }),
  ]);

  const activeBuyers = buyers.filter((b) => b.status === 'ACTIVE').length;
  const availableProps = properties.filter((p) => p.status === 'AVAILABLE').length;
  const activeDeals = deals.filter((d) => d.stage !== 'CLOSED_LOST' && d.stage !== 'REGISTERED').length;
  const totalCommission = deals
    .filter((d) => d.stage === 'REGISTERED')
    .reduce((s, d) => s + (d.commission_amount ?? 0), 0);

  const overdueFollowUps = followUps.filter((f) => isOverdue(f.due_at));
  const upcomingVisits = visits.slice(0, 5);

  const topMatches = getTopMatches(
    buyers.filter((b) => b.status === 'ACTIVE'),
    properties.filter((p) => p.status === 'AVAILABLE'),
    6
  );

  return (
    <div>
      <Header
        title={`Good morning, ${broker.name.split(' ')[0]} 👋`}
        subtitle="Here's what's happening with your pipeline today."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Buyers" value={activeBuyers} icon={Users} color="blue"
          trend={`${buyers.length} total`} />
        <StatCard label="Properties" value={availableProps} icon={Building2} color="purple"
          trend={`${properties.length} total`} />
        <StatCard label="Active Deals" value={activeDeals} icon={HandshakeIcon} color="orange"
          trend={`${deals.length} all time`} />
        <StatCard label="Commission Earned" value={formatCurrency(totalCommission)} icon={IndianRupee} color="green"
          trend="Registered deals" />
      </div>

      {/* Alerts row */}
      {overdueFollowUps.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <Bell className="h-5 w-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-800 font-medium text-sm">
              {overdueFollowUps.length} overdue follow-up{overdueFollowUps.length > 1 ? 's' : ''}
            </p>
            <p className="text-red-600 text-xs">{overdueFollowUps.map((f) => f.buyer?.name ?? 'Property').join(', ')}</p>
          </div>
          <Link href="/followups" className="text-red-700 text-sm font-medium hover:underline">View all →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Matches */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Top Buyer–Property Matches</h2>
            <span className="text-xs text-gray-500">{topMatches.length} matches</span>
          </div>
          {topMatches.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
              Add buyers and properties to see matches
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topMatches.map((m, i) => (
                <MatchCard key={i} buyer={m.buyer} property={m.property} score={m.score} breakdown={m.breakdown} />
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming Visits */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Upcoming Visits</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {upcomingVisits.length === 0 && (
                <p className="p-4 text-sm text-gray-400">No scheduled visits</p>
              )}
              {upcomingVisits.map((v) => (
                <div key={v.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{v.buyer.name}</p>
                  <p className="text-xs text-gray-500">{v.property.society_name} · {v.property.locality}</p>
                  <p className="text-xs text-primary-600 mt-0.5">{formatDate(v.scheduled_at)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Deals */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Recent Deals</h2>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {deals.slice(0, 5).map((d) => (
                <Link key={d.id} href={`/deals/${d.id}`} className="block px-4 py-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.buyer.name}</p>
                      <p className="text-xs text-gray-500">{d.property.society_name}</p>
                    </div>
                    <DealStageBadge stage={d.stage} />
                  </div>
                </Link>
              ))}
              {deals.length === 0 && <p className="p-4 text-sm text-gray-400">No deals yet</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
