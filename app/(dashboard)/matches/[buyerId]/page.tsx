import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { matchScore, MIN_MATCH_SCORE } from '@/lib/matching';
import { formatCurrency } from '@/lib/utils';
import { Header } from '@/components/shared/Header';
import Link from 'next/link';
import { Building2, ArrowRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function ScoreBar({ score }: { score: number }) {
  const bar = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-orange-400';
  const text = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-orange-600';
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${bar}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold w-10 text-right flex-shrink-0 ${text}`}>{score}%</span>
    </div>
  );
}

export default async function BuyerMatchesPage({ params }: { params: { buyerId: string } }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) redirect('/login');

  const buyer = await prisma.buyer.findFirst({
    where: { id: params.buyerId, broker_id: broker.id },
  });
  if (!buyer) notFound();

  const properties = await prisma.property.findMany({
    where: { broker_id: broker.id, status: 'AVAILABLE' },
  });

  const matches = properties
    .map((property) => ({ property, ...matchScore(buyer, property) }))
    .filter((m) => m.score >= MIN_MATCH_SCORE)
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <Header
        title={`Matches for ${buyer.name}`}
        subtitle={`${matches.length} propert${matches.length === 1 ? 'y' : 'ies'} matched · sorted best to worst`}
      />

      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 -mt-2">
        <ChevronLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      {/* Buyer summary strip */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg flex-shrink-0">
          {buyer.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{buyer.name}</p>
          <p className="text-sm text-gray-500 truncate">
            {buyer.bhk_requirement.join(', ')} BHK &middot; {formatCurrency(buyer.budget_min)}–{formatCurrency(buyer.budget_max)} &middot; {buyer.preferred_localities.join(', ')}
          </p>
        </div>
        <Link href={`/buyers/${buyer.id}`} className="text-xs text-primary-600 hover:underline flex-shrink-0">
          View profile &rarr;
        </Link>
      </div>

      {matches.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          No strong matches found for this buyer
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(({ property, score, breakdown }, i) => {
            const rank = i + 1;
            const cardBg = score >= 80
              ? 'bg-green-50 border-green-200'
              : score >= 50
              ? 'bg-amber-50 border-amber-200'
              : 'bg-orange-50 border-orange-200';

            return (
              <Link key={property.id} href={`/matches/${buyer.id}/${property.id}`}>
                <div className={cn('rounded-xl border p-4 hover:shadow-md transition-all group', cardBg)}>
                  <div className="flex items-start gap-3">
                    {/* Rank bubble */}
                    <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0 mt-0.5">
                      {rank}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Property name + arrow */}
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <p className="font-semibold text-gray-900 truncate">{property.society_name}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </div>

                      {/* Meta */}
                      <p className="text-sm text-gray-500 mb-2">
                        {property.locality} &middot; {property.bhk} BHK &middot; {formatCurrency(property.price)}
                      </p>

                      {/* Score bar */}
                      <ScoreBar score={score} />

                      {/* Breakdown chips */}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {breakdown.locality > 0 && (
                          <span className="text-xs bg-white/80 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                            📍 {breakdown.locality} locality
                          </span>
                        )}
                        {breakdown.bhk > 0 && (
                          <span className="text-xs bg-white/80 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                            🛏 {breakdown.bhk} BHK
                          </span>
                        )}
                        {breakdown.price > 0 && (
                          <span className="text-xs bg-white/80 text-green-700 border border-green-200 px-1.5 py-0.5 rounded">
                            💰 {breakdown.price} budget
                          </span>
                        )}
                        {breakdown.furnishing > 0 && (
                          <span className="text-xs bg-white/80 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">
                            🛋 {breakdown.furnishing} furnishing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}