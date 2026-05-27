'use client';

import Link from 'next/link';
import { DEAL_STAGE_LABELS, DEAL_STAGES, STAGE_COLORS, formatCurrency } from '@/lib/utils';
import { DealStageBadge } from '@/components/ui/Badge';
import { Building2, User } from 'lucide-react';

type KanbanDeal = {
  id: string;
  stage: string;
  commission_amount: number | null;
  buyer: { name: string };
  property: { society_name: string; locality: string; price: number };
};

interface KanbanBoardProps {
  deals: KanbanDeal[];
}

export function KanbanBoard({ deals }: KanbanBoardProps) {
  const byStage = DEAL_STAGES.reduce<Record<string, KanbanDeal[]>>((acc, stage) => {
    acc[stage] = deals.filter((d) => d.stage === stage);
    return acc;
  }, {} as Record<string, KanbanDeal[]>);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
      {DEAL_STAGES.map((stage) => {
        const stageDeals = byStage[stage] ?? [];
        const total = stageDeals.reduce((s, d) => s + (d.commission_amount ?? 0), 0);
        return (
          <div key={stage} className="flex-shrink-0 w-64">
            {/* Column header */}
            <div className={`bg-gradient-to-r ${STAGE_COLORS[stage]} rounded-t-xl px-4 py-3`}>
              <h3 className="text-white font-semibold text-sm">{DEAL_STAGE_LABELS[stage]}</h3>
              <p className="text-white/80 text-xs mt-0.5">{stageDeals.length} deal{stageDeals.length !== 1 ? 's' : ''}</p>
            </div>

            {/* Cards */}
            <div className="bg-gray-100 rounded-b-xl p-2 space-y-2 min-h-32">
              {stageDeals.map((deal) => (
                <Link key={deal.id} href={`/deals/${deal.id}`}>
                  <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-200 cursor-pointer">
                    <div className="flex items-center gap-1.5 mb-2">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900 truncate">{deal.buyer.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-xs text-gray-600 truncate">{deal.property.society_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{deal.property.locality}</span>
                      <span className="text-xs font-semibold text-primary-600">
                        {formatCurrency(deal.property.price)}
                      </span>
                    </div>
                    {deal.commission_amount && (
                      <div className="mt-1.5 text-xs text-green-700 font-medium">
                        Commission: {formatCurrency(deal.commission_amount)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              {stageDeals.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-xs">No deals</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
