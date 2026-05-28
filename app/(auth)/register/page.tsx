'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { MUMBAI_LOCALITIES } from '@/lib/utils';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';

// ── 6-box OTP input ──────────────────────────────────────────────────────────
function OtpInput({
  digits,
  onChange,
}: {
  digits: string[];
  onChange: (digits: string[]) => void;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first empty box on mount
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function set(i: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = digit;
    onChange(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits];
        next[i] = '';
        onChange(next);
      } else if (i > 0) {
        const next = [...digits];
        next[i - 1] = '';
        onChange(next);
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === 'ArrowRight' && i < 5) {
      refs.current[i + 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = Array(6).fill('').map((_, i) => pasted[i] ?? '');
    onChange(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  const filled = digits.filter(Boolean).length;

  return (
    <div className="flex gap-2.5 justify-center" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-100 ${
            d
              ? 'border-primary-500 text-primary-700 bg-primary-50'
              : 'border-gray-300 text-gray-900 bg-white focus:border-primary-400'
          }`}
          style={{ height: '3.25rem' }}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
      {/* Progress dots */}
      <span className="sr-only">{filled} of 6 digits entered</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type Step = 'form' | 'otp';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '', office_area: '', rera_number: '',
  });
  const router = useRouter();

  function setField(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const otp = digits.join('');
  const otpComplete = digits.every((d) => d.length === 1);

  // ── Step 1: register ────────────────────────────────────────────────────────
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setStep('otp');
    setLoading(false);
  }

  // ── Step 2: verify OTP ──────────────────────────────────────────────────────
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!otpComplete) { setError('Please enter all 6 digits'); return; }
    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { data, error: otpError } = await supabase.auth.verifyOtp({
      email: form.email,
      token: otp,
      type: 'signup',
    });

    if (otpError || !data.user) {
      setError(otpError?.message ?? 'Invalid code — please try again');
      setDigits(['', '', '', '', '', '']);
      setLoading(false);
      return;
    }

    // Create broker profile now that email is confirmed
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supabase_uid: data.user.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        office_area: form.office_area,
        rera_number: form.rera_number || undefined,
      }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Failed to create profile');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  async function handleResend() {
    setResent(false);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.resend({ type: 'signup', email: form.email });
    setDigits(['', '', '', '', '', '']);
    setError('');
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  }

  // ── OTP screen ──────────────────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <form onSubmit={handleVerify} className="space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-7 w-7 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verify your email</h1>
          <p className="text-gray-500 text-sm mt-2">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-gray-800">{form.email}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {resent && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg border border-green-200 text-center">
            New code sent — check your inbox
          </div>
        )}

        <OtpInput digits={digits} onChange={setDigits} />

        <Button
          type="submit"
          loading={loading}
          className="w-full"
          size="lg"
          disabled={!otpComplete}
        >
          Verify &amp; Create Account
        </Button>

        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500">
            Didn&apos;t receive it?{' '}
            <button
              type="button"
              onClick={handleResend}
              className="text-primary-600 font-medium hover:underline inline-flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Resend code
            </button>
          </p>
          <button
            type="button"
            onClick={() => { setStep('form'); setDigits(['', '', '', '', '', '']); setError(''); }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to registration
          </button>
        </div>
      </form>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────────
  const inputCls = 'w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  return (
    <form onSubmit={handleRegister} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="text-gray-500 text-sm mt-1">Set up Makaan Sathi in minutes</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text" required value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Rajesh Mehta"
            className={inputCls}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email" required value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="rajesh@example.com"
            className={inputCls}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
          <input
            type="password" required minLength={8} value={form.password}
            onChange={(e) => setField('password', e.target.value)}
            placeholder="Min 8 characters"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
          <input
            type="tel" required value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            placeholder="9820000000"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">RERA Number</label>
          <input
            type="text" value={form.rera_number}
            onChange={(e) => setField('rera_number', e.target.value)}
            placeholder="Optional"
            className={inputCls}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Office Area *</label>
          <select
            required value={form.office_area}
            onChange={(e) => setField('office_area', e.target.value)}
            className={inputCls}
          >
            <option value="">Select area</option>
            {MUMBAI_LOCALITIES.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Continue →
      </Button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
