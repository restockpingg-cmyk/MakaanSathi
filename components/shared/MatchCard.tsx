import { cn, formatCurrency } from '@/lib/utils';
import { Building2, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function getColor(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 50) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

interface MatchCardProps {
  buyer: { id: string; name: string; bhk_requirement: string[]; budget_min: number; budget_max: number };
  property: { id: string; society_name: string; locality: string; bhk: string; price: number };
  score: number;
  breakdown: { locality: number; bhk: number; price: number; furnishing: number };
}

export function MatchCard({ buyer, property, score, breakdown }: MatchCardProps) {
  return (
    <Link href={`/matches/${buyer.id}/${property.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group">
        {/* Score + breakdown chips */}
        <div className="flex items-center justify-between mb-3">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold border', getColor(score))}>
            {score}/100
          </span>
          <div className="flex gap-1">
            {breakdown.locality > 0 && (
              <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">📍 Locality</span>
            )}
            {breakdown.bhk > 0 && (
              <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">🛏 BHK</span>
            )}
            {breakdown.price > 0 && (
              <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">💰 Budget</span>
            )}
          </div>
        </div>

        {/* Buyer */}
        <div className="flex items-center gap-2 text-sm mb-1.5">
          <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-900">{buyer.name}</span>
          <span className="text-gray-400 text-xs">· {buyer.bhk_requirement.join(', ')}</span>
        </div>

        {/* Property */}
        <div className="flex items-center gap-2 text-sm">
          <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-900">{property.society_name}</span>
          <span className="text-gray-400 text-xs">· {property.locality}</span>
        </div>

        {/* Price vs budget */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
          <span>Budget: {formatCurrency(buyer.budget_min)}–{formatCurrency(buyer.budget_max)}</span>
          <span className="font-medium text-gray-700">{formatCurrency(property.price)}</span>
        </div>

        {/* View detail hint */}
        <div className="mt-2 flex items-center gap-1 text-xs text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>View match details</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>
    </Link>
  );
}