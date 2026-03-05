'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="bg-white rounded-lg shadow p-6 text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Invalid Reset Link</h1>
          <p className="text-slate-600">
            This password reset link is invalid. Please request a new one.
          </p>
          <Link href="/auth/forgot-password" className="inline-block text-gold-600 hover:underline text-sm">
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }
      router.push('/auth/login?reset=success');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">Reset Password</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-sunshine-500 text-white rounded hover:bg-sunshine-600 transition disabled:opacity-50"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <p className="text-sm text-center text-slate-500">
          <Link href="/auth/login" className="text-gold-600 hover:underline">
            Back to Log In
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto mt-16">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
