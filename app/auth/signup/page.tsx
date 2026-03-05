'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ action: 'signup', email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
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
      <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">Sign Up</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
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
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-sunshine-500 text-white rounded hover:bg-sunshine-600 transition disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <p className="text-sm text-center text-slate-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-gold-600 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
