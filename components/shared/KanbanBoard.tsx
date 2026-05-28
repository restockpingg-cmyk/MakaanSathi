'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DndContext, DragOverlay, useDroppable, useDraggable,
  PointerSensor, useSensors, useSensor,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { DEAL_STAGE_LABELS, ACTIVE_DEAL_STAGES, STAGE_COLORS, formatCurrency, formatDate } from '@/lib/utils';
import { Building2, User, Trophy, XCircle, GripVertical } from 'lucide-react';

type KanbanDeal = {
  id: string;
  stage: string;
  commission_amount: number | null;
  expected_close_date: string | null;
  buyer: { name: string };
  property: { society_name: string; locality: string; price: number };
};

// Pure card content — rendered both inline and inside DragOverlay
function DealCardContent({ deal, dragging }: { deal: KanbanDeal; dragging?: boolean }) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-3 transition-shadow ${
        dragging
          ? 'shadow-2xl border-primary-300 rotate-1 scale-105'
          : 'shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-900 truncate">{deal.buyer.name}</span>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-600 truncate">{deal.property.society_name}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{deal.property.locality}</span>
        <span className="text-xs font-semibold text-primary-600">{formatCurrency(deal.property.price)}</span>
      </div>
      {deal.commission_amount != null && deal.commission_amount > 0 && (
        <div className="mt-1.5 text-xs text-green-700 font-medium">
          Commission: {formatCurrency(deal.commission_amount)}
        </div>
      )}
      {deal.expected_close_date && (
        <div className="mt-1 text-xs text-gray-400">Close: {formatDate(deal.expected_close_date)}</div>
      )}
    </div>
  );
}

// Draggable wrapper — grip handle triggers drag, card body is still a Link
function DraggableDealCard({ deal }: { deal: KanbanDeal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={transform ? { transform: CSS.Translate.toString(transform) } : undefined}
      className={isDragging ? 'opacity-25' : ''}
    >
      <div className="relative group">
        {/* Grip handle — only this triggers drag */}
        <div
          {...listeners}
          {...attributes}
          className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 rounded-l-lg"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        {/* Card — click navigates to deal detail */}
        <Link href={`/deals/${deal.id}`} className="block pl-1">
          <DealCardContent deal={deal} />
        </Link>
      </div>
    </div>
  );
}

// Droppable column
function KanbanColumn({ stage, deals }: { stage: string; deals: KanbanDeal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div className="flex-shrink-0 w-72">
      <div className={`bg-gradient-to-r ${STAGE_COLORS[stage]} rounded-t-xl px-4 py-3`}>
        <h3 className="text-white font-semibold text-sm">{DEAL_STAGE_LABELS[stage]}</h3>
        <p className="text-white/80 text-xs mt-0.5">
          {deals.length} deal{deals.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div
        ref={setNodeRef}
        className={`rounded-b-xl p-2 space-y-2 min-h-32 transition-all ${
          isOver
            ? 'bg-primary-50 ring-2 ring-inset ring-primary-400'
            : 'bg-gray-100'
        }`}
      >
        {deals.map((deal) => (
          <DraggableDealCard key={deal.id} deal={deal} />
        ))}
        {deals.length === 0 && (
          <div className={`text-center py-8 text-xs ${isOver ? 'text-primary-400 font-medium' : 'text-gray-400'}`}>
            {isOver ? 'Drop here' : 'No deals'}
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ deals: propDeals }: { deals: KanbanDeal[] }) {
  const [deals, setDeals] = useState(propDeals);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync when parent reloads (after new deal is created)
  useEffect(() => {
    setDeals(propDeals);
  }, [propDeals]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px movement before a drag starts — lets clicks through
      activationConstraint: { distance: 8 },
    }),
  );

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as string;
    const deal = deals.find((d) => d.id === dealId);

    if (!deal || deal.stage === newStage) return;
    // Prevent dropping into Closed columns (those aren't droppable zones anyway)
    if (!(ACTIVE_DEAL_STAGES as readonly string[]).includes(newStage)) return;

    // Optimistic update
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)),
    );

    const res = await fetch(`/api/deals/${dealId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });

    if (!res.ok) {
      // Revert on failure
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage: deal.stage } : d)),
      );
    }
  }

  const activeDeal = activeId ? (deals.find((d) => d.id === activeId) ?? null) : null;
  const legacyDeals = deals.filter((d) => d.stage === 'AGREEMENT');
  const wonDeals = deals.filter((d) => d.stage === 'REGISTERED');
  const lostDeals = deals.filter((d) => d.stage === 'CLOSED_LOST');
  const wonCommission = wonDeals.reduce((s, d) => s + (d.commission_amount ?? 0), 0);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Swipe hint — mobile only */}
        <p className="text-xs text-gray-400 text-center sm:hidden mb-1">← Swipe to see all stages →</p>
        {/* Active pipeline — horizontal scroll */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {ACTIVE_DEAL_STAGES.map((stage) => {
            const extra = stage === 'NEGOTIATION' ? legacyDeals : [];
            return (
              <KanbanColumn
                key={stage}
                stage={stage}
                deals={[...deals.filter((d) => d.stage === stage), ...extra]}
              />
            );
          })}
        </div>

        {/* Closed section */}
        {(wonDeals.length > 0 || lostDeals.length > 0) && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Closed Deals
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-700 text-sm">
                    Closed Won ({wonDeals.length})
                  </span>
                  {wonCommission > 0 && (
                    <span className="ml-auto text-xs text-green-600 font-medium">
                      {formatCurrency(wonCommission)} earned
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {wonDeals.length === 0 && (
                    <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">No won deals yet</p>
                  )}
                  {wonDeals.map((deal) => (
                    <Link key={deal.id} href={`/deals/${deal.id}`}>
                      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 hover:shadow-sm transition-shadow flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{deal.buyer.name}</p>
                          <p className="text-xs text-gray-500">
                            {deal.property.society_name} · {deal.property.locality}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className="text-sm font-bold text-green-700">
                            {formatCurrency(deal.property.price)}
                          </p>
                          {deal.commission_amount != null && deal.commission_amount > 0 && (
                            <p className="text-xs text-green-600">
                              {formatCurrency(deal.commission_amount)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-gray-500 text-sm">Lost ({lostDeals.length})</span>
                </div>
                <div className="space-y-2">
                  {lostDeals.length === 0 && (
                    <p className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">No lost deals</p>
                  )}
                  {lostDeals.map((deal) => (
                    <Link key={deal.id} href={`/deals/${deal.id}`}>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:shadow-sm transition-shadow flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">{deal.buyer.name}</p>
                          <p className="text-xs text-gray-400">
                            {deal.property.society_name} · {deal.property.locality}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-3">
                          {formatCurrency(deal.property.price)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating card shown while dragging */}
      <DragOverlay
        dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}
      >
        {activeDeal ? <DealCardContent deal={activeDeal} dragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
