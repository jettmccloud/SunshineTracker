'use client';

import { useEffect, useState } from 'react';
import TrendChart from '@/components/TrendChart';

interface TrendItem {
  label: string;
  count: number;
}

export default function TrendsPage() {
  const [byYear, setByYear] = useState<TrendItem[]>([]);
  const [byJurisdiction, setByJurisdiction] = useState<TrendItem[]>([]);
  const [byState, setByState] = useState<TrendItem[]>([]);
  const [byCategory, setByCategory] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [yearRes, jurRes, stateRes, catRes] = await Promise.all([
          fetch('/api/trends?group_by=year'),
          fetch('/api/trends?group_by=jurisdiction'),
          fetch('/api/trends?group_by=state'),
          fetch('/api/trends?group_by=category'),
        ]);
        const [yearData, jurData, stateData, catData] = await Promise.all([
          yearRes.json(),
          jurRes.json(),
          stateRes.json(),
          catRes.json(),
        ]);
        setByYear(yearData.data || []);
        setByJurisdiction(jurData.data || []);
        setByState(stateData.data || []);
        setByCategory(catData.data || []);
      } catch (err) {
        console.error('Failed to load trends:', err);
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

  const CATEGORY_LABELS: Record<string, string> = {
    foia: 'FOIA',
    sunshine: 'Sunshine Laws',
    missing_data: 'Missing Data',
    access_denied: 'Access Denied',
    other: 'Other',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Trend Analysis</h1>

      {byYear.length === 0 && byCategory.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-slate-500">
            No trend data available yet. Search and cache cases to see trends.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {byYear.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <TrendChart data={byYear} title="Cases Filed Over Time" chartType="line" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {byCategory.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <TrendChart
                  data={byCategory.map(d => ({ ...d, label: CATEGORY_LABELS[d.label] || d.label }))}
                  title="Cases by Category"
                  chartType="bar"
                />
              </div>
            )}

            {byJurisdiction.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <TrendChart data={byJurisdiction} title="Cases by Jurisdiction" chartType="bar" />
              </div>
            )}
          </div>

          {byState.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Cases by State</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600 font-medium">State</th>
                      <th className="text-right py-2 px-3 text-slate-600 font-medium">Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byState
                      .sort((a, b) => b.count - a.count)
                      .map((item) => (
                        <tr key={item.label} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-3 text-slate-800">{item.label || 'Unknown'}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-600">{item.count}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
