import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/shared/Sidebar';
import { getAuthenticatedBroker } from '@/lib/supabase-server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const broker = await getAuthenticatedBroker();
  if (!broker) redirect('/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar brokerName={broker.name} brokerEmail={broker.email} />
      {/* Content offset for sidebar on desktop, top-bar on mobile */}
      <main className="md:ml-60 pt-14 md:pt-0 pb-20 md:pb-0 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
