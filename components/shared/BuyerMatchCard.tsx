import { cn, formatCurrency } from '@/lib/utils';
import { Building2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

function scoreBadgeClass(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 50) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-orange-100 text-orange-800 border-orange-200';
}

function scoreTextClass(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-orange-600';
}

interface PropertyMatch {
  property: { id: string; society_name: string; locality: string; bhk: string; price: number };
  score: number;
}

interface BuyerMatchCardProps {
  buyer: { id: string; name: string; bhk_requirement: string[]; budget_min: number; budget_max: number };
  matches: PropertyMatch[];
  topScore: number;
}

export function BuyerMatchCard({ buyer, matches, topScore }: BuyerMatchCardProps) {
  const preview = matches.slice(0, 3);

  return (
    <Link href={`/matches/${buyer.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group">
        {/* Buyer header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm flex-shrink-0">
              {buyer.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{buyer.name}</p>
              <p className="text-xs text-gray-400 truncate">
                {buyer.bhk_requirement.join(', ')} BHK &middot; {formatCurrency(buyer.budget_min)}–{formatCurrency(buyer.budget_max)}
              </p>
            </div>
          </div>
          <span className={cn('ml-2 flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold border', scoreBadgeClass(topScore))}>
            {topScore}%
          </span>
        </div>

        {/* Top matched properties */}
        <div className="space-y-1.5">
          {preview.map(({ property, score }) => (
            <div key={property.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <Building2 className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700 truncate">{property.society_name}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">&middot; {property.locality}</span>
              </div>
              <span className={cn('ml-2 flex-shrink-0 text-xs font-bold', scoreTextClass(score))}>
                {score}%
              </span>
            </div>
          ))}
          {matches.length > 3 && (
            <p className="text-xs text-gray-400 pl-1">+{matches.length - 3} more propert{matches.length - 3 === 1 ? 'y' : 'ies'}</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {matches.length} {matches.length === 1 ? 'property' : 'properties'} matched
          </span>
          <span className="text-xs text-primary-500 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            View all <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}