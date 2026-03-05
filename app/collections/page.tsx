'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Collection {
  id: string;
  name: string;
  description: string;
  case_count: number;
  created_at: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sunshine_token');
    setIsLoggedIn(!!token);
    if (token) loadCollections(token);
    else setLoading(false);
  }, []);

  async function loadCollections(token?: string) {
    const t = token || localStorage.getItem('sunshine_token');
    if (!t) return;
    try {
      const res = await fetch('/api/collections', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      setCollections(data.collections || []);
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoading(false);
    }
  }

  async function createCollection(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem('sunshine_token');
    if (!token || !name.trim()) return;

    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action: 'create', name: name.trim(), description: description.trim() }),
    });
    const data = await res.json();
    if (data.collection) {
      setCollections([data.collection, ...collections]);
      setName('');
      setDescription('');
      setShowForm(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Collections</h1>
        <p className="text-slate-600 mb-4">Log in to create and manage case collections.</p>
        <Link href="/auth/login" className="px-4 py-2 bg-sunshine-500 text-white rounded hover:bg-sunshine-600 transition">
          Log In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Collections</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-sunshine-500 text-white rounded hover:bg-sunshine-600 transition text-sm"
        >
          New Collection
        </button>
      </div>

      {showForm && (
        <form onSubmit={createCollection} className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                placeholder="e.g., Michigan FOIA Cases 2020-2025"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-gold-500 focus:border-gold-500 outline-none"
                rows={2}
                placeholder="Optional description..."
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-sunshine-500 text-white rounded hover:bg-sunshine-600 transition text-sm">
                Create
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {collections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.id}`}
              className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-slate-900">{col.name}</h3>
              {col.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{col.description}</p>
              )}
              <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
                <span>{col.case_count || 0} cases</span>
                <span>{new Date(col.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-slate-500">No collections yet. Create one to start organizing cases.</p>
        </div>
      )}
    </div>
  );
}
