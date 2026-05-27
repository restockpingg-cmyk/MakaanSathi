'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatDate } from '@/lib/utils';
import { Send, MessageSquare } from 'lucide-react';

type Log = {
  id: string; recipient_name: string; recipient_phone: string;
  message_type: string; message_body: string; sent_at: string;
};

type Buyer = { id: string; name: string; phone: string };

const MESSAGE_TYPES = [
  { value: 'BUYER_FOLLOWUP', label: 'Buyer Follow-up' },
  { value: 'DEAL_UPDATE', label: 'Deal Update' },
  { value: 'REMINDER', label: 'Reminder' },
];

export default function WhatsAppPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ buyer_id: '', message_type: 'BUYER_FOLLOWUP', custom_message: '' });

  async function load() {
    setLoading(true);
    const [l, b] = await Promise.all([
      fetch('/api/whatsapp').then((r) => r.json()),
      fetch('/api/buyers').then((r) => r.json()),
    ]);
    setLogs(l); setBuyers(b);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })); }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(''); setSuccess('');
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setSuccess('Message sent successfully!');
      setForm({ buyer_id: '', message_type: 'BUYER_FOLLOWUP', custom_message: '' });
      load();
    } else {
      const d = await res.json();
      setError(d.error ?? 'Failed to send message');
    }
    setSending(false);
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';

  return (
    <div>
      <Header title="WhatsApp" subtitle="Send messages to buyers and owners via Twilio" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <h2 className="font-semibold">Send Message</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              {success && <p className="text-green-600 text-sm">{success}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient (Buyer) *</label>
                <select className={inputCls} required value={form.buyer_id} onChange={(e) => set('buyer_id', e.target.value)}>
                  <option value="">Select buyer</option>
                  {buyers.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.phone}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message Type *</label>
                <select className={inputCls} value={form.message_type} onChange={(e) => set('message_type', e.target.value)}>
                  {MESSAGE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom Message</label>
                <textarea className={inputCls} rows={4} value={form.custom_message}
                  onChange={(e) => set('custom_message', e.target.value)}
                  placeholder="Leave blank to use the default template for the selected type…" />
              </div>
              <Button type="submit" loading={sending} className="w-full">
                <Send className="h-4 w-4" /> Send via WhatsApp
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Message Log */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Message History ({logs.length})</h2>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">No messages sent yet</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((l) => (
                <div key={l.id} className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm">{l.recipient_name}</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{l.message_type.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1.5">{l.recipient_phone}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{l.message_body}</p>
                  <p className="text-xs text-gray-400 mt-1.5">{formatDate(l.sent_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
