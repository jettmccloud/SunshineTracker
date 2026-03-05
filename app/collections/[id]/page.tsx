'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CaseCard from '@/components/CaseCard';
import ExportButton from '@/components/ExportButton';

interface CaseData {
  id: string;
  case_name: string;
  court_name: string;
  date_filed: string | null;
  jurisdiction_type: string;
  category: string;
  matched_keywords: string[];
  source_url: string;
  state: string;
  snippet?: string;
}

interface CollectionDetail {
  id: string;
  name: string;
  description: string;
  created_at: string;
  cases: CaseData[];
}

export default function CollectionDetailPage() {
  const params = useParams();
  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('sunshine_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/collections?id=${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCollection(data.collection);
      } catch (err) {
        console.error('Failed to load collection:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function removeCase(caseId: string) {
    const token = localStorage.getItem('sunshine_token');
    if (!token || !collection) return;
    await fetch('/api/collections', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ collection_id: collection.id, case_id: caseId }),
    });
    setCollection({
      ...collection,
      cases: collection.cases.filter((c) => c.id !== caseId),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl text-slate-600">Collection not found</h2>
        <Link href="/collections" className="text-amber-600 hover:underline mt-2 inline-block">
          Back to collections
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/collections" className="text-sm text-amber-600 hover:underline mb-4 inline-block">
        &larr; Back to collections
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{collection.name}</h1>
          {collection.description && (
            <p className="text-slate-600 mt-1">{collection.description}</p>
          )}
          <p className="text-sm text-slate-500 mt-1">{collection.cases.length} cases</p>
        </div>
        <ExportButton params={{ collection_id: collection.id }} />
      </div>

      <div className="space-y-4">
        {collection.cases.map((c) => (
          <div key={c.id} className="relative">
            <CaseCard case={c} />
            <button
              onClick={() => removeCase(c.id)}
              className="absolute top-4 right-4 text-xs text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      {collection.cases.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-slate-500">
            No cases in this collection yet.{' '}
            <Link href="/search" className="text-amber-600 hover:underline">
              Search for cases
            </Link>{' '}
            and add them here.
          </p>
        </div>
      )}
    </div>
  );
}
