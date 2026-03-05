'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CasePreview {
  id: string;
  case_name: string;
  court_name: string;
  date_filed: string;
  category: string;
  jurisdiction_type: string;
  state: string;
  matched_keywords: string[];
  docket_number: string;
}

interface DashboardStats {
  total_cases: number;
  by_category: { label: string; count: number }[];
  by_jurisdiction: { label: string; count: number }[];
  recent_cases: CasePreview[];
}

const CATEGORY_COLORS: Record<string, string> = {
  foia: 'bg-blue-100 text-blue-800 border-blue-200',
  sunshine: 'bg-amber-100 text-amber-800 border-amber-200',
  missing_data: 'bg-red-100 text-red-800 border-red-200',
  access_denied: 'bg-purple-100 text-purple-800 border-purple-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

const CATEGORY_LABELS: Record<string, string> = {
  foia: 'FOIA',
  sunshine: 'Open Records',
  missing_data: 'Missing Records',
  access_denied: 'Access Denied',
  other: 'Other',
};

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [catRes, jurRes, casesRes] = await Promise.all([
          fetch('/api/trends?group_by=category'),
          fetch('/api/trends?group_by=jurisdiction'),
          fetch('/api/search?per_page=15'),
        ]);
        const catData = await catRes.json();
        const jurData = await jurRes.json();
        const casesData = await casesRes.json();

        const totalCases = (catData.data || []).reduce((sum: number, d: any) => sum + d.count, 0);
        setStats({
          total_cases: totalCases,
          by_category: catData.data || [],
          by_jurisdiction: jurData.data || [],
          recent_cases: casesData.cases || [],
        });
      } catch (err) {
        console.error('Failed to load dashboard:', err);
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

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">SunshineTracker</h1>
        <p className="mt-2 text-lg text-slate-600">
          Find court cases where government agencies were sued over public records access, FOIA denials, missing data, and open meetings violations.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Built for journalists investigating government transparency. Powered by CourtListener&apos;s database of {stats?.total_cases ? `${stats.total_cases.toLocaleString()}+ cached` : ''} court opinions.
        </p>
      </div>

      {/* Search categories — what journalists are looking for */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href="/search?category=foia" className="block p-5 bg-white border-l-4 border-blue-500 rounded-lg shadow-sm hover:shadow-md transition">
          <h3 className="font-semibold text-slate-900">FOIA Lawsuits</h3>
          <p className="text-sm text-slate-500 mt-1">Federal agencies sued for withholding records under the Freedom of Information Act</p>
          {stats?.by_category.find(c => c.label === 'foia') && (
            <p className="text-xs text-blue-600 mt-2 font-medium">{stats.by_category.find(c => c.label === 'foia')!.count} cases tracked</p>
          )}
        </Link>
        <Link href="/search?category=sunshine" className="block p-5 bg-white border-l-4 border-amber-500 rounded-lg shadow-sm hover:shadow-md transition">
          <h3 className="font-semibold text-slate-900">Open Records Disputes</h3>
          <p className="text-sm text-slate-500 mt-1">State and local agencies challenged under sunshine laws, open records acts, and public meetings laws</p>
          {stats?.by_category.find(c => c.label === 'sunshine') && (
            <p className="text-xs text-amber-600 mt-2 font-medium">{stats.by_category.find(c => c.label === 'sunshine')!.count} cases tracked</p>
          )}
        </Link>
        <Link href="/search?category=missing_data" className="block p-5 bg-white border-l-4 border-red-500 rounded-lg shadow-sm hover:shadow-md transition">
          <h3 className="font-semibold text-slate-900">Missing / Destroyed Records</h3>
          <p className="text-sm text-slate-500 mt-1">Cases alleging records were lost, destroyed, or never produced by government entities</p>
          {stats?.by_category.find(c => c.label === 'missing_data') && (
            <p className="text-xs text-red-600 mt-2 font-medium">{stats.by_category.find(c => c.label === 'missing_data')!.count} cases tracked</p>
          )}
        </Link>
        <Link href="/search?category=access_denied" className="block p-5 bg-white border-l-4 border-purple-500 rounded-lg shadow-sm hover:shadow-md transition">
          <h3 className="font-semibold text-slate-900">Access Denied</h3>
          <p className="text-sm text-slate-500 mt-1">Records requests denied, heavily redacted, or delayed — and the court battles that followed</p>
          {stats?.by_category.find(c => c.label === 'access_denied') && (
            <p className="text-xs text-purple-600 mt-2 font-medium">{stats.by_category.find(c => c.label === 'access_denied')!.count} cases tracked</p>
          )}
        </Link>
      </div>

      {/* Recent cases — the main content journalists want */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Recent Cases</h2>
          <Link href="/search" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
            Search all cases &rarr;
          </Link>
        </div>
        {stats && stats.recent_cases.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recent_cases.map((c) => (
              <Link key={c.id} href={`/case/${c.id}`} className="block px-6 py-4 hover:bg-slate-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 hover:text-amber-700 transition">{c.case_name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-slate-500">
                      <span>{c.court_name}</span>
                      {c.date_filed && (
                        <>
                          <span className="text-slate-300">&middot;</span>
                          <span>{formatDate(c.date_filed)}</span>
                        </>
                      )}
                      {c.state && (
                        <>
                          <span className="text-slate-300">&middot;</span>
                          <span>{c.state}</span>
                        </>
                      )}
                      {c.docket_number && (
                        <>
                          <span className="text-slate-300">&middot;</span>
                          <span className="text-slate-400">No. {c.docket_number}</span>
                        </>
                      )}
                    </div>
                    {c.matched_keywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.matched_keywords.map((kw) => (
                          <span key={kw} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">{kw}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[c.category] || CATEGORY_COLORS.other}`}>
                    {CATEGORY_LABELS[c.category] || c.category}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-slate-500">No cases cached yet. <Link href="/search" className="text-amber-600 hover:underline">Search CourtListener</Link> to start building your research database.</p>
          </div>
        )}
      </div>

      {/* Quick stats */}
      {stats && (stats.by_jurisdiction.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">By Jurisdiction</h3>
            <div className="space-y-2">
              {stats.by_jurisdiction.map((item) => (
                <Link key={item.label} href={`/search?jurisdiction_type=${item.label}`} className="flex items-center justify-between py-1 hover:text-amber-700 transition">
                  <span className="text-slate-700 capitalize">{item.label}</span>
                  <span className="text-slate-500 font-mono text-sm">{item.count}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link href="/trends" className="block text-amber-700 hover:text-amber-800 font-medium">View trend analysis &rarr;</Link>
              <Link href="/search?state=California" className="block text-slate-600 hover:text-amber-700">California public records cases</Link>
              <Link href="/search?state=Texas" className="block text-slate-600 hover:text-amber-700">Texas public records cases</Link>
              <Link href="/search?state=New York" className="block text-slate-600 hover:text-amber-700">New York public records cases</Link>
              <Link href="/search?state=Florida" className="block text-slate-600 hover:text-amber-700">Florida public records cases</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
