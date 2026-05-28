import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { Header } from '@/components/shared/Header';
import { formatDate, DEAL_STAGE_LABELS } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  ArrowRightCircle, CalendarCheck, Bell, CheckCircle2,
  Clock, XCircle, Trophy,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type TimelineEvent =
  | { kind: 'stage'; date: Date; stage: string; dealId: string; buyerName: string; propertyName: string }
  | { kind: 'visit'; date: Date; status: string; buyerName: string; propertyName: string; visitId: string }
  | { kind: 'followup'; date: Date; isDone: boolean; note: string; buyerName: string; followupId: string };

function EventIcon({ kind, stage, isDone }: { kind: string; stage?: string; isDone?: boolean }) {
  if (kind === 'stage') {
    if (stage === 'REGISTERED') return <Trophy className="h-4 w-4 text-green-600" />;
    if (stage === 'CLOSED_LOST') return <XCircle className="h-4 w-4 text-red-400" />;
    return <ArrowRightCircle className="h-4 w-4 text-primary-500" />;
  }
  if (kind === 'visit') return <CalendarCheck className="h-4 w-4 text-purple-500" />;
  if (kind === 'followup') return isDone
    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
    : <Bell className="h-4 w-4 text-amber-500" />;
  return <Clock className="h-4 w-4 text-gray-400" />;
}

function eventBg(kind: string, stage?: string, isDone?: boolean) {
  if (kind === 'stage') {
    if (stage === 'REGISTERED') return 'bg-green-50 border-green-200';
    if (stage === 'CLOSED_LOST') return 'bg-red-50 border-red-200';
    return 'bg-blue-50 border-blue-200';
  }
  if (kind === 'visit') return 'bg-purple-50 border-purple-200';
  if (kind === 'followup') return isDone ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200';
  return 'bg-gray-50 border-gray-200';
}

function EventCard({ event }: { event: TimelineEvent }) {
  const bg = eventBg(
    event.kind,
    event.kind === 'stage' ? event.stage : undefined,
    event.kind === 'followup' ? event.isDone : undefined,
  );

  const content = (() => {
    if (event.kind === 'stage') {
      const label = DEAL_STAGE_LABELS[event.stage] ?? event.stage;
      return (
        <Link href={`/deals/${event.dealId}`} className="hover:underline">
          <span className="font-medium text-gray-900">{event.buyerName}</span>
          <span className="text-gray-500"> deal moved to </span>
          <span className="font-semibold">{label}</span>
          <span className="text-gray-400 text-xs"> &middot; {event.propertyName}</span>
        </Link>
      );
    }
    if (event.kind === 'visit') {
      return (
        <span>
          <span className="font-medium text-gray-900">{event.buyerName}</span>
          <span className="text-gray-500"> site visit </span>
          <span className={`font-semibold ${event.status === 'COMPLETED' ? 'text-green-700' : event.status === 'CANCELLED' ? 'text-red-600' : 'text-purple-700'}`}>
            {event.status.toLowerCase()}
          </span>
          <span className="text-gray-400 text-xs"> &middot; {event.propertyName}</span>
        </span>
      );
    }
    if (event.kind === 'followup') {
      return (
        <span>
          <span className="font-medium text-gray-900">{event.buyerName}</span>
          <span className="text-gray-500"> follow-up {event.isDone ? 'completed' : 'due'}</span>
          {event.note && <span className="text-gray-400 text-xs"> &middot; {event.note}</span>}
        </span>
      );
    }
  })();

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${bg}`}>
      <div className="mt-0.5 flex-shrink-0">
        <EventIcon
          kind={event.kind}
          stage={event.kind === 'stage' ? event.stage : undefined}
          isDone={event.kind === 'followup' ? event.isDone : undefined}
        />
      </div>
      <div className="flex-1 min-w-0 text-sm">{content}</div>
      <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{formatDate(event.date)}</span>
    </div>
  );
}

export default async function HistoryPage() {
  const broker = await getAuthenticatedBroker();
  if (!broker) redirect('/login');

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [stageHistory, visits, followUps] = await Promise.all([
    prisma.stageHistory.findMany({
      where: { deal: { broker_id: broker.id }, moved_at: { gte: oneYearAgo } },
      include: { deal: { include: { buyer: true, property: true } } },
      orderBy: { moved_at: 'desc' },
    }),
    prisma.siteVisit.findMany({
      where: { broker_id: broker.id, scheduled_at: { gte: oneYearAgo } },
      include: { buyer: true, property: true },
      orderBy: { scheduled_at: 'desc' },
    }),
    prisma.followUp.findMany({
      where: { broker_id: broker.id, due_at: { gte: oneYearAgo } },
      include: { buyer: true },
      orderBy: { due_at: 'desc' },
    }),
  ]);

  // Merge into unified timeline
  const events: TimelineEvent[] = [
    ...stageHistory.map((h) => ({
      kind: 'stage' as const,
      date: new Date(h.moved_at),
      stage: h.stage,
      dealId: h.deal_id,
      buyerName: h.deal.buyer.name,
      propertyName: h.deal.property.society_name,
    })),
    ...visits.map((v) => ({
      kind: 'visit' as const,
      date: new Date(v.scheduled_at),
      status: v.status,
      buyerName: v.buyer.name,
      propertyName: v.property.society_name,
      visitId: v.id,
    })),
    ...followUps.map((f) => ({
      kind: 'followup' as const,
      date: new Date(f.due_at),
      isDone: f.is_done,
      note: f.note ?? '',
      buyerName: f.buyer?.name ?? 'Unknown',
      followupId: f.id,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  // Group by month
  const groups: { label: string; events: TimelineEvent[] }[] = [];
  for (const event of events) {
    const label = format(event.date, 'MMMM yyyy');
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.events.push(event);
    } else {
      groups.push({ label, events: [event] });
    }
  }

  return (
    <div>
      <Header
        title="Activity History"
        subtitle={`Last 12 months · ${events.length} event${events.length !== 1 ? 's' : ''}`}
      />

      {events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          No activity in the last 12 months
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(({ label, events: groupEvents }) => (
            <div key={label}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-gray-500">{label}</span>
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">{groupEvents.length} events</span>
              </div>
              <div className="space-y-2">
                {groupEvents.map((event, i) => (
                  <EventCard key={i} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}