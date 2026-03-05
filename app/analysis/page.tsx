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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
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

  const courts = data.nodes.filter((n: any) => n.type === 'court');
  const judges = data.nodes.filter((n: any) => n.type === 'judge');
  const categories = data.nodes.filter((n: any) => n.type === 'category');

  // Find the most connected court (highest case count)
  const topCourt = courts.length > 0
    ? courts.reduce((max: any, n: any) => n.size > max.size ? n : max, courts[0])
    : null;

  // Find the most active judge
  const topJudge = judges.length > 0
    ? judges.reduce((max: any, n: any) => n.size > max.size ? n : max, judges[0])
    : null;

  // Find the dominant category
  const topCategory = categories.length > 0
    ? categories.reduce((max: any, n: any) => n.size > max.size ? n : max, categories[0])
    : null;

  // Count edges to measure connectivity
  const avgEdgesPerNode = data.edges.length > 0
    ? (data.edges.length / data.nodes.length).toFixed(1)
    : '0';

  // Check for concentration: does top court handle >30% of cases?
  const topCourtPct = topCourt ? Math.round((topCourt.size / data.totalCases) * 100) : 0;

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
          <p className="text-2xl font-bold text-[#8E6400]">
            {courts.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Judges</p>
          <p className="text-2xl font-bold text-sunshine-500">
            {judges.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide">Categories</p>
          <p className="text-2xl font-bold text-[#09718E]">
            {categories.length}
          </p>
        </div>
      </div>

      {/* Analysis & Insights */}
      <div className="mt-6 space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">What This Network Reveals</h2>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            This network maps the relationships between {courts.length} court{courts.length !== 1 ? 's' : ''}, {judges.length} judge{judges.length !== 1 ? 's' : ''}, and {categories.length} case categor{categories.length !== 1 ? 'ies' : 'y'} across {data.totalCases} public records cases. Larger nodes indicate higher case volume. Dense clusters reveal where transparency litigation concentrates — these are the courts, judges, and legal issues that matter most to reporters covering government accountability.
          </p>
          <p className="text-sm text-slate-500 leading-relaxed">
            Nodes with many connections sit at the intersection of multiple case types and jurisdictions. These are often the most consequential actors in public records law — the courts that set precedent and the judges whose rulings shape how sunshine laws are interpreted and enforced.
          </p>
        </div>

        {/* Key Findings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {topCourt && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Most Active Court</h3>
              <p className="text-lg font-bold text-[#8E6400]">{topCourt.label}</p>
              <p className="text-sm text-slate-500 mt-1">{topCourt.size} case{topCourt.size !== 1 ? 's' : ''} ({topCourtPct}% of all tracked cases)</p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                {topCourtPct > 30
                  ? `This court handles a disproportionate share of public records litigation, making it a critical venue for journalists to monitor. Rulings here are likely to influence how agencies in its jurisdiction respond to records requests.`
                  : `Case volume is distributed across multiple courts, suggesting public records disputes are being fought on many fronts rather than concentrated in a single venue.`}
              </p>
            </div>
          )}

          {topJudge && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Most Active Judge</h3>
              <p className="text-lg font-bold text-sunshine-500">{topJudge.label}</p>
              <p className="text-sm text-slate-500 mt-1">{topJudge.size} case{topJudge.size !== 1 ? 's' : ''}</p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                {topJudge.size >= 5
                  ? `This judge has presided over a significant number of public records cases. Their rulings may establish important patterns in how FOIA exemptions, disclosure timelines, and fee waivers are handled. Reporters should review this judge's track record for insight into likely outcomes.`
                  : `No single judge dominates the case network, which means public records rulings are coming from a broad bench. This makes it harder to predict outcomes but also means no one judge is a single point of failure for transparency enforcement.`}
              </p>
            </div>
          )}
        </div>

        {topCategory && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Dominant Case Category</h3>
            <p className="text-lg font-bold text-[#09718E] capitalize">{topCategory.label}</p>
            <p className="text-sm text-slate-500 mt-1">{topCategory.size} case{topCategory.size !== 1 ? 's' : ''} out of {data.totalCases} total</p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              {topCategory.label.includes('foia')
                ? `FOIA cases dominate the network, indicating that federal transparency disputes are the primary battleground. This often reflects systemic issues with federal agency responsiveness to records requests — a signal that investigative reporters should track which agencies are most frequently sued and whether court orders are driving improved compliance.`
                : topCategory.label.includes('sunshine')
                ? `State-level open records and sunshine law disputes lead the network. This suggests active enforcement of state transparency statutes, which varies widely by state. Journalists should look for patterns in which states produce the most litigation and whether court outcomes are strengthening or weakening public access rights.`
                : topCategory.label.includes('access')
                ? `Access denied cases are the most common category, pointing to a pattern of government agencies refusing disclosure. This is a strong indicator of systemic resistance to transparency that warrants investigative attention — reporters should examine which agencies appear most often and whether denials cluster around specific exemption types.`
                : `Missing or destroyed records cases feature prominently. This raises serious concerns about government record-keeping practices and potential evidence destruction. Journalists should investigate whether these cases reveal patterns of negligence or deliberate obstruction across specific agencies or jurisdictions.`}
            </p>
          </div>
        )}

        <div className="bg-[#FFDB84] rounded-lg p-6 border border-[#FFDB84]">
          <h3 className="text-sm font-semibold text-[#8E6400] mb-2">Takeaway for Journalists</h3>
          <p className="text-sm text-[#8E6400] leading-relaxed">
            Use this network to identify where public records battles are being fought, who the key players are, and which types of disputes are most common. Courts and judges with large, well-connected nodes are the ones shaping transparency law in practice. If you&apos;re investigating a specific agency or jurisdiction, look for its cluster in the graph — the connected nodes will reveal related cases, judges, and legal strategies that can inform your reporting. The network connectivity ({avgEdgesPerNode} connections per entity on average) shows how tightly linked these actors are — higher connectivity means the same courts and judges keep appearing across different types of public records disputes.
          </p>
        </div>
      </div>
    </div>
  );
}
