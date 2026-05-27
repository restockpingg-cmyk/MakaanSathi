import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isPast } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatRelative(date: Date | string | null): string {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(date: Date | string | null): boolean {
  if (!date) return false;
  return isPast(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const DEAL_STAGE_LABELS: Record<string, string> = {
  INQUIRY: 'Inquiry',
  SITE_VISIT: 'Site Visit',
  NEGOTIATION: 'Negotiation',
  AGREEMENT: 'Agreement',
  REGISTERED: 'Registered',
  CLOSED_LOST: 'Closed Lost',
};

export const DEAL_STAGES = [
  'INQUIRY',
  'SITE_VISIT',
  'NEGOTIATION',
  'AGREEMENT',
  'REGISTERED',
  'CLOSED_LOST',
] as const;

export const STAGE_COLORS: Record<string, string> = {
  INQUIRY: 'from-blue-500 to-blue-600',
  SITE_VISIT: 'from-purple-500 to-purple-600',
  NEGOTIATION: 'from-amber-500 to-amber-600',
  AGREEMENT: 'from-orange-500 to-orange-600',
  REGISTERED: 'from-green-500 to-green-600',
  CLOSED_LOST: 'from-slate-400 to-slate-500',
};

export const BHK_OPTIONS = ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK+'];
export const MUMBAI_LOCALITIES = [
  'Andheri West', 'Andheri East', 'Versova', 'Juhu',
  'Malad West', 'Malad East', 'Goregaon West', 'Goregaon East',
  'Borivali West', 'Borivali East', 'Dahisar',
  'Kandivali West', 'Kandivali East', 'Thakur Village',
  'Thane West', 'Thane East', 'Hiranandani Estate', 'Ghodbunder Road',
  'Bandra West', 'Bandra East', 'Khar', 'Santacruz West', 'Santacruz East',
  'Powai', 'Vikhroli', 'Mulund',
];
