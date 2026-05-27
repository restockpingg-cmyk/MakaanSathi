import { cn, formatCurrency, getScoreColor } from '@/lib/utils';
import { getScoreColor as scoreColor } from '@/lib/matching';
import { Building2, User } from 'lucide-react';
import Link from 'next/link';

// Re-export from matching for use in components
function getColor(score: number) {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

interface MatchCardProps {
  buyer: { id: string; name: string; bhk_requirement: string[]; budget_min: number; budget_max: number };
  property: { id: string; society_name: string; locality: string; bhk: string; price: number };
  score: number;
  breakdown: { locality: number; bhk: number; price: number; furnishing: number };
}

export function MatchCard({ buyer, property, score, breakdown }: MatchCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold', getColor(score))}>
          {score}/100
        </span>
        <div className="flex gap-1">
          {breakdown.locality > 0 && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Locality ✓</span>}
          {breakdown.bhk > 0 && <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">BHK ✓</span>}
          {breakdown.price > 0 && <span className="text-xs bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Budget ✓</span>}
        </div>
      </div>
      <div className="space-y-2">
        <Link href={`/buyers/${buyer.id}`} className="flex items-center gap-2 text-sm hover:text-primary-600">
          <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-900">{buyer.name}</span>
          <span className="text-gray-500 text-xs">· {buyer.bhk_requirement.join(', ')}</span>
        </Link>
        <Link href={`/properties/${property.id}`} className="flex items-center gap-2 text-sm hover:text-primary-600">
          <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="font-medium text-gray-900">{property.society_name}</span>
          <span className="text-gray-500 text-xs">· {property.locality}</span>
        </Link>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
        <span>Budget: {formatCurrency(buyer.budget_min)}–{formatCurrency(buyer.budget_max)}</span>
        <span className="font-medium text-gray-700">{formatCurrency(property.price)}</span>
      </div>
    </div>
  );
}
