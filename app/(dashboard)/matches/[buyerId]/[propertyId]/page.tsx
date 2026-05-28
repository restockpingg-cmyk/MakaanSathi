import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedBroker } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { matchScore } from '@/lib/matching';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Header } from '@/components/shared/Header';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle2, XCircle, MinusCircle,
  MapPin, BedDouble, IndianRupee, Sofa,
  User, Building2, Phone, Mail, ArrowRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold w-12 text-right">{value}/{max}</span>
    </div>
  );
}

function MatchRow({
  icon: Icon, label, buyerVal, propertyVal, matched, partial,
}: {
  icon: React.ElementType; label: string;
  buyerVal: string; propertyVal: string;
  matched: boolean; partial?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${matched ? 'bg-green-50 border-green-200' : partial ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
      <div className={`p-2 rounded-lg ${matched ? 'bg-green-100' : partial ? 'bg-amber-100' : 'bg-red-100'}`}>
        <Icon className={`h-4 w-4 ${matched ? 'text-green-600' : partial ? 'text-amber-600' : 'text-red-600'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-sm font-medium text-gray-700 bg-white px-2 py-0.5 rounded border">{buyerVal}</span>
          <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 bg-white px-2 py-0.5 rounded border">{propertyVal}</span>
        </div>
      </div>
      <div className="flex-shrink-0">
        {matched
          ? <CheckCircle2 className="h-6 w-6 text-green-500" />
          : partial
          ? <MinusCircle className="h-6 w-6 text-amber-500" />
          : <XCircle className="h-6 w-6 text-red-400" />}
      </div>
    </div>
  );
}

export default async function MatchDetailPage({
  params,
}: {
  params: { buyerId: string; propertyId: string };
}) {
  const broker = await getAuthenticatedBroker();
  if (!broker) redirect('/login');

  const [buyer, property] = await Promise.all([
    prisma.buyer.findFirst({ where: { id: params.buyerId, broker_id: broker.id } }),
    prisma.property.findFirst({ where: { id: params.propertyId, broker_id: broker.id } }),
  ]);

  if (!buyer || !property) notFound();

  const { score, breakdown } = matchScore(buyer, property);

  // Determine score colour
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-500';
  const scoreBg = score >= 80 ? 'bg-green-50 border-green-200' : score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';
  const scoreBar = score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-400';

  // Individual match checks
  const localityMatch = buyer.preferred_localities.some(
    (l) => l.toLowerCase().trim() === property.locality.toLowerCase().trim()
  );
  const bhkMatch = buyer.bhk_requirement.includes(property.bhk);
  const priceInBudget = property.price >= buyer.budget_min && property.price <= buyer.budget_max;
  const priceUnder = property.price < buyer.budget_min;
  const priceOver10 = !priceInBudget && !priceUnder && ((property.price - buyer.budget_max) / buyer.budget_max) <= 0.1;
  const furnishingMatch = !buyer.furnishing_preference || buyer.furnishing_preference === property.furnishing;

  // Check if a deal already exists
  const existingDeal = await prisma.deal.findFirst({
    where: { buyer_id: buyer.id, property_id: property.id, broker_id: broker.id },
  });

  return (
    <div>
      <Header
        title="Match Analysis"
        subtitle={`${buyer.name} ↔ ${property.society_name}`}
      />

      {/* Score hero */}
      <div className={`rounded-2xl border p-6 mb-6 ${scoreBg}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">Overall Match Score</p>
            <div className="flex items-end gap-2">
              <span className={`text-6xl font-black ${scoreColor}`}>{score}</span>
              <span className="text-2xl text-gray-400 font-light mb-1">/100</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {score >= 80 ? '🟢 Excellent match — highly recommended' : score >= 50 ? '🟡 Good match — worth pursuing' : '🔴 Weak match — significant gaps'}
            </p>
          </div>
          <div className="flex gap-3">
            {existingDeal ? (
              <Link href={`/deals/${existingDeal.id}`}>
                <Button variant="secondary">View Existing Deal</Button>
              </Link>
            ) : (
              <Link href={`/deals?buyer=${buyer.id}&property=${property.id}`}>
                <Button>Create Deal</Button>
              </Link>
            )}
            <Link href={`/visits?buyer=${buyer.id}&property=${property.id}`}>
              <Button variant="secondary">Schedule Visit</Button>
            </Link>
          </div>
        </div>

        {/* Score bar */}
        <div className="mt-5 bg-white/70 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Score breakdown</span>
            <span className={`text-sm font-bold ${scoreColor}`}>{score} pts</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${scoreBar}`} style={{ width: `${score}%` }} />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3 text-xs text-center text-gray-500">
            <div><span className="font-semibold text-gray-700">{breakdown.locality}</span>/40 Locality</div>
            <div><span className="font-semibold text-gray-700">{breakdown.bhk}</span>/25 BHK</div>
            <div><span className="font-semibold text-gray-700">{breakdown.price}</span>/25 Price</div>
            <div><span className="font-semibold text-gray-700">{breakdown.furnishing}</span>/10 Furnishing</div>
          </div>
        </div>
      </div>

      {/* Match criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Match Criteria</h2>
          <div className="space-y-3">
            <MatchRow
              icon={MapPin}
              label={`Locality (40 pts) — scored ${breakdown.locality}`}
              buyerVal={buyer.preferred_localities.join(', ')}
              propertyVal={property.locality}
              matched={localityMatch}
            />
            <MatchRow
              icon={BedDouble}
              label={`BHK (25 pts) — scored ${breakdown.bhk}`}
              buyerVal={buyer.bhk_requirement.join(', ')}
              propertyVal={property.bhk}
              matched={bhkMatch}
            />
            <MatchRow
              icon={IndianRupee}
              label={`Budget (25 pts) — scored ${breakdown.price}`}
              buyerVal={`${formatCurrency(buyer.budget_min)}–${formatCurrency(buyer.budget_max)}`}
              propertyVal={formatCurrency(property.price)}
              matched={priceInBudget}
              partial={priceUnder || priceOver10}
            />
            <MatchRow
              icon={Sofa}
              label={`Furnishing (10 pts) — scored ${breakdown.furnishing}`}
              buyerVal={buyer.furnishing_preference ?? 'Any'}
              propertyVal={property.furnishing}
              matched={furnishingMatch}
            />
          </div>
        </div>

        {/* Profiles side by side */}
        <div className="space-y-4">
          {/* Buyer profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                  {buyer.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{buyer.name}</p>
                  <p className="text-xs text-gray-500">Buyer</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600"><Phone className="h-3.5 w-3.5 text-gray-400" />{buyer.phone}</div>
              {buyer.email && <div className="flex items-center gap-2 text-gray-600"><Mail className="h-3.5 w-3.5 text-gray-400" />{buyer.email}</div>}
              <div className="pt-1 space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Budget</span><span className="font-medium">{formatCurrency(buyer.budget_min)}–{formatCurrency(buyer.budget_max)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">BHK</span><span className="font-medium">{buyer.bhk_requirement.join(', ')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Purpose</span><span className="font-medium">{buyer.purpose.replace('_', ' ')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Furnishing</span><span className="font-medium">{buyer.furnishing_preference ?? 'Any'}</span></div>
                {buyer.floor_preference && <div className="flex justify-between"><span className="text-gray-500">Floor</span><span className="font-medium">{buyer.floor_preference}</span></div>}
              </div>
              <div className="pt-1">
                <p className="text-gray-500 text-xs mb-1">Preferred areas</p>
                <div className="flex flex-wrap gap-1">
                  {buyer.preferred_localities.map((l) => (
                    <span key={l} className={`px-2 py-0.5 text-xs rounded-full ${property.locality === l ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-600'}`}>{l}</span>
                  ))}
                </div>
              </div>
              {buyer.notes && <p className="text-xs text-gray-500 italic pt-1">"{buyer.notes}"</p>}
              <div className="pt-2">
                <Link href={`/buyers/${buyer.id}`} className="text-xs text-primary-600 hover:underline">View full buyer profile →</Link>
              </div>
            </CardContent>
          </Card>

          {/* Property profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{property.society_name}</p>
                  <p className="text-xs text-gray-500">{property.locality}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Price</span><span className={`font-bold ${priceInBudget ? 'text-green-600' : priceOver10 ? 'text-amber-600' : 'text-red-500'}`}>{formatCurrency(property.price)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">BHK</span><span className={`font-medium ${bhkMatch ? 'text-green-600' : 'text-red-500'}`}>{property.bhk}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Furnishing</span><span className={`font-medium ${furnishingMatch ? 'text-green-600' : 'text-red-500'}`}>{property.furnishing}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Floor</span><span className="font-medium">{property.floor}/{property.total_floors}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Area</span><span className="font-medium">{property.area_sqft} sqft</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{property.property_type}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Parking</span><span className="font-medium">{property.parking ? 'Yes ✓' : 'No'}</span></div>
              </div>
              {property.amenities.length > 0 && (
                <div className="pt-1">
                  <p className="text-gray-500 text-xs mb-1">Amenities</p>
                  <div className="flex flex-wrap gap-1">
                    {property.amenities.map((a) => (
                      <span key={a} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-2">
                <Link href={`/properties/${property.id}`} className="text-xs text-primary-600 hover:underline">View full property →</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}