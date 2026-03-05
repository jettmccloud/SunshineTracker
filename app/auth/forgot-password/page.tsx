'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot-password', email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="bg-white rounded-lg shadow p-6 text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Check Your Email</h1>
          <p className="text-slate-600">
            If an account exists with that email, we sent a password reset link. Please check your inbox and spam folder.
          </p>
          <Link href="/auth/login" className="inline-block text-amber-600 hover:underline text-sm">
            Back to Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">Forgot Password</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>
        )}

        <p className="text-sm text-slate-600">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 transition disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <p className="text-sm text-center text-slate-500">
          <Link href="/auth/login" className="text-amber-600 hover:underline">
            Back to Log In
          </Link>
        </p>
      </form>
    </div>
  );
}
