import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-2 mb-2">
            <Image src="/logo.jpg" alt="Makaan Sathi" width={72} height={72} className="rounded-2xl shadow-lg" />
            <span className="text-2xl font-bold text-white tracking-tight">Makaan Sathi</span>
          </div>
          <p className="text-slate-400 text-sm">Real Estate CRM for Mumbai Brokers</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">{children}</div>
      </div>
    </div>
  );
}
