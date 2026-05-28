'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { formatDate } from '@/lib/utils';
import { Send, MessageSquare, CheckCheck, User, Phone } from 'lucide-react';

type Log = {
  id: string; recipient_name: string; recipient_phone: string;
  message_type: string; message_body: string; sent_at: string;
};

type Buyer = { id: string; name: string; phone: string };

const TEMPLATES: Record<string, (buyerName: string, brokerName: string) => string> = {
  BUYER_FOLLOWUP: (buyerName, brokerName) =>
    `Hi ${buyerName}! 👋\n\nThis is ${brokerName}. Just checking in — are you still looking for a property? We have some great new listings that might interest you!\n\nFeel free to reply or call me anytime. 🏠`,
  REMINDER: (buyerName, brokerName) =>
    `Hi ${buyerName}! 📅\n\nThis is ${brokerName}. Just a friendly reminder about our scheduled site visit. Please confirm if the time still works for you.\n\nLooking forward to it!`,
  DEAL_UPDATE: (buyerName, brokerName) =>
    `Hi ${buyerName}! 🎉\n\nThis is ${brokerName}. I have a new update on the property you were interested in. Let's connect and discuss the next steps!\n\nPlease reply or give me a call.`,
  CUSTOM: () => '',
};

const TYPE_LABELS: Record<string, string> = {
  BUYER_FOLLOWUP: 'Follow-up',
  REMINDER: 'Reminder',
  DEAL_UPDATE: 'Deal Update',
  CUSTOM: 'Custom',
};

function formatPhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^0/, '').replace(/^(\d{10})$/, '91$1');
}

export default function WhatsAppPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [brokerName, setBrokerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageType, setMessageType] = useState('BUYER_FOLLOWUP');
  const [selectedBuyerId, setSelectedBuyerId] = useState('');
  const [customText, setCustomText] = useState('');
  const [sent, setSent] = useState(false);

  const selectedBuyer = buyers.find((b) => b.id === selectedBuyerId) ?? null;

  // Build message from template or custom text
  const messageBody = messageType === 'CUSTOM'
    ? customText
    : (selectedBuyer ? TEMPLATES[messageType](selectedBuyer.name, brokerName) : '');

  const waLink = selectedBuyer
    ? `https://wa.me/${formatPhone(selectedBuyer.phone)}?text=${encodeURIComponent(messageBody)}`
    : '#';

  async function load() {
    setLoading(true);
    const [l, b, brokerRes] = await Promise.all([
      fetch('/api/whatsapp').then((r) => r.json()),
      fetch('/api/buyers').then((r) => r.json()),
      fetch('/api/auth/me').then((r) => r.ok ? r.json() : null),
    ]);
    setLogs(l); setBuyers(b);
    if (brokerRes?.name) setBrokerName(brokerRes.name);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleOpenWhatsApp() {
    if (!selectedBuyer || !messageBody.trim()) return;

    // Log to DB
    await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyer_id: selectedBuyerId,
        message_type: messageType,
        message_body: messageBody,
      }),
    });

    // Open WhatsApp
    window.open(waLink, '_blank');

    setSent(true);
    load();
    setTimeout(() => setSent(false), 3000);
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500';
  const canSend = !!selectedBuyer && !!messageBody.trim();

  return (
    <div>
      <Header title="WhatsApp" subtitle="Open WhatsApp with a pre-typed message — just hit Send" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose */}
        <div className="space-y-4">
          {/* Buyer selector */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Buyer *</label>
            <select className={inputCls} value={selectedBuyerId} onChange={(e) => { setSelectedBuyerId(e.target.value); setSent(false); }}>
              <option value="">— choose a buyer —</option>
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>{b.name} · {b.phone}</option>
              ))}
            </select>
            {selectedBuyer && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <User className="h-3.5 w-3.5" />
                <span>{selectedBuyer.name}</span>
                <Phone className="h-3.5 w-3.5 ml-1" />
                <span>{selectedBuyer.phone}</span>
              </div>
            )}
          </div>

          {/* Message type tabs */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Message Type</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(TYPE_LABELS).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => { setMessageType(val); setCustomText(''); setSent(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    messageType === val
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {messageType === 'CUSTOM' ? (
              <textarea
                className={`${inputCls} mt-3`}
                rows={5}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your message here…"
              />
            ) : (
              /* WhatsApp bubble preview */
              <div className="mt-3 bg-[#e2ffc7] rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed shadow-sm">
                {selectedBuyer
                  ? messageBody
                  : <span className="text-gray-400 italic">Select a buyer to preview the message</span>
                }
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleOpenWhatsApp}
            disabled={!canSend}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
              canSend
                ? sent
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-[#25D366] hover:bg-[#20b858] text-white shadow-md'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sent
              ? <><CheckCheck className="h-5 w-5" /> Opened in WhatsApp</>
              : <><Send className="h-4 w-4" /> Open in WhatsApp</>
            }
          </button>

          {canSend && !sent && (
            <p className="text-xs text-center text-gray-400">
              This will open WhatsApp with the message pre-typed. Just hit Send inside WhatsApp.
            </p>
          )}
        </div>

        {/* Message Log */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Message History ({logs.length})</h2>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>No messages sent yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((l) => (
                <div key={l.id} className="bg-white border border-gray-200 rounded-xl p-3">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-medium text-sm">{l.recipient_name}</p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[l.message_type] ?? l.message_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-1.5">{l.recipient_phone}</p>
                  <p className="text-xs text-gray-600 line-clamp-2 bg-[#f0fdf4] rounded-lg px-2 py-1.5">{l.message_body}</p>
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