import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

// Domain-specific badge helpers
export function BuyerStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = { ACTIVE: 'success', CLOSED: 'default', ON_HOLD: 'warning' };
  const labels: Record<string, string> = { ACTIVE: 'Active', CLOSED: 'Closed', ON_HOLD: 'On Hold' };
  return <Badge variant={map[status] ?? 'default'}>{labels[status] ?? status}</Badge>;
}

export function PropertyStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = { AVAILABLE: 'success', RENTED: 'info', SOLD: 'default', ON_HOLD: 'warning' };
  const labels: Record<string, string> = { AVAILABLE: 'Available', RENTED: 'Rented', SOLD: 'Sold', ON_HOLD: 'On Hold' };
  return <Badge variant={map[status] ?? 'default'}>{labels[status] ?? status}</Badge>;
}

export function DealStageBadge({ stage }: { stage: string }) {
  const map: Record<string, BadgeVariant> = {
    INQUIRY: 'info', SITE_VISIT: 'purple', NEGOTIATION: 'warning',
    AGREEMENT: 'warning', REGISTERED: 'success', CLOSED_LOST: 'danger',
  };
  const labels: Record<string, string> = {
    INQUIRY: 'Inquiry', SITE_VISIT: 'Site Visit', NEGOTIATION: 'Negotiation',
    AGREEMENT: 'Agreement', REGISTERED: 'Registered', CLOSED_LOST: 'Closed Lost',
  };
  return <Badge variant={map[stage] ?? 'default'}>{labels[stage] ?? stage}</Badge>;
}

export function VisitStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = { SCHEDULED: 'info', COMPLETED: 'success', CANCELLED: 'danger' };
  return <Badge variant={map[status] ?? 'default'}>{status}</Badge>;
}
