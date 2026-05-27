'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { MUMBAI_LOCALITIES } from '@/lib/utils';

type Broker = {
  id: string; name: string; email: string; phone: string;
  rera_number: string | null; office_area: string; profile_photo: string | null;
};

export default function SettingsPage() {
  const [broker, setBroker] = useState<Broker | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', rera_number: '', office_area: '' });

  async function load() {
    const res = await fetch('/api/auth/me');
    if (res.ok) {
      const data = await res.json();
      setBroker(data);
      setForm({ name: data.name, phone: data.phone, rera_number: data.rera_number ?? '', office_area: data.office_area });
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) setSuccess('Profile updated successfully!');
    setSaving(false);
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  if (loading) return <div className="text-center py-20 text-gray-400">Loading…</div>;

  return (
    <div>
      <Header title="Settings" subtitle="Manage your broker profile" />

      <div className="max-w-xl">
        <Card>
          <CardHeader><h2 className="font-semibold">Broker Profile</h2></CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              {success && <p className="text-green-600 text-sm">{success}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input className={inputCls} required value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input className={inputCls} disabled value={broker?.email ?? ''} />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed here — manage via Supabase Auth</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input className={inputCls} required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RERA Number</label>
                <input className={inputCls} value={form.rera_number} onChange={(e) => set('rera_number', e.target.value)} placeholder="Optional" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Area *</label>
                <select className={inputCls} required value={form.office_area} onChange={(e) => set('office_area', e.target.value)}>
                  <option value="">Select area</option>
                  {MUMBAI_LOCALITIES.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>

              <div className="pt-2">
                <Button type="submit" loading={saving}>Save Changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><h2 className="font-semibold text-red-600">Danger Zone</h2></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              To delete your account or reset data, contact support or manage directly via your Supabase dashboard.
            </p>
            <p className="text-xs text-gray-400">BrokerBook · Version 1.0.0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
