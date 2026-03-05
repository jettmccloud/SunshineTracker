'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      localStorage.setItem('sunshine_token', data.token);
      localStorage.setItem('sunshine_email', data.email);
      window.dispatchEvent(new Event('auth-change'));
      router.push('/');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">Log In</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        {resetSuccess && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded">Password reset successfully. Please log in with your new password.</div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
            required
          />
        </div>

        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-sm text-gold-600 hover:underline">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-sunshine-500 text-white rounded hover:bg-sunshine-600 transition disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>

        <p className="text-sm text-center text-slate-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-gold-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
