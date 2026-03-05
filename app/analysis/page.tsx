'use client';

import { useEffect, useState } from 'react';
import NetworkGraph from '@/components/NetworkGraph';

interface GraphData {
  nodes: any[];
  edges: any[];
  totalCases: number;
}

export default function AnalysisPage() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/analysis');
        if (!res.ok) throw new Error('Failed to load analysis data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Analysis load error:', err);
        setError('Failed to load analysis data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl text-slate-600">{error}</h2>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Case Network Analysis</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-slate-500">No case data available yet. Search for cases first to build the network graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Case Network Analysis</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visualizing connections between {data.nodes.length} entities across {data.totalCases} cases.
          Click any node to view a related case.
        </p>
      </div>

      <NetworkGraph nodes={data.nodes} edges={data.edges} />

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Courts</p>
          <p className="text-2xl font-bold text-amber-600">
            {data.nodes.filter((n: any) => n.type === 'court').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Judges</p>
          <p className="text-2xl font-bold text-indigo-600">
            {data.nodes.filter((n: any) => n.type === 'judge').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Categories</p>
          <p className="text-2xl font-bold text-emerald-600">
            {data.nodes.filter((n: any) => n.type === 'category').length}
          </p>
        </div>
      </div>
    </div>
  );
}
