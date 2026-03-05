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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
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
              <p className="mt-3 text-sm text-slate-500">
                Tracks the volume of public records and open government litigation over time. Rising case counts often reflect increased government resistance to disclosure requests, expanded use of FOIA and state sunshine laws by journalists and watchdog organizations, or legislative changes that broaden or restrict the right of access. Declines may indicate improved voluntary compliance, reduced enforcement funding, or shifts in legal strategy toward administrative appeals.
              </p>
              {byYear.length >= 2 && (() => {
                const sorted = [...byYear].sort((a, b) => a.label.localeCompare(b.label));
                const recent = sorted.slice(-3);
                const earlier = sorted.slice(0, Math.max(1, sorted.length - 3));
                const recentAvg = recent.reduce((s, d) => s + d.count, 0) / recent.length;
                const earlierAvg = earlier.reduce((s, d) => s + d.count, 0) / earlier.length;
                const pctChange = ((recentAvg - earlierAvg) / earlierAvg) * 100;
                const peak = sorted.reduce((max, d) => d.count > max.count ? d : max, sorted[0]);
                return (
                  <div className="mt-4 p-4 bg-[#FFDB84] rounded-lg border border-[#FFDB84]">
                    <h3 className="text-sm font-semibold text-[#8E6400] mb-2">Trend Insight</h3>
                    <p className="text-sm text-[#8E6400]">
                      {pctChange > 10
                        ? `Recent filings have increased by approximately ${Math.round(pctChange)}% compared to earlier periods, suggesting growing tension between public access demands and government transparency. This uptick may reflect expanded enforcement of sunshine laws or increased resistance to disclosure.`
                        : pctChange < -10
                        ? `Recent filings have decreased by approximately ${Math.round(Math.abs(pctChange))}% compared to earlier periods. This could indicate improved government compliance with open records obligations, or alternatively, reduced resources for public records litigation.`
                        : `Filing rates have remained relatively stable across the tracked period, suggesting a consistent level of public records litigation activity.`}
                      {' '}Peak activity occurred in {peak.label} with {peak.count} case{peak.count !== 1 ? 's' : ''} filed.
                    </p>
                  </div>
                );
              })()}
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
                <p className="mt-3 text-sm text-slate-500">
                  Cases are categorized by legal type. FOIA cases involve federal Freedom of Information Act requests, while Sunshine Laws encompass state-level open records and open meetings statutes. Access Denied highlights instances of government refusals to disclose, and Missing Data flags cases with incomplete public records.
                </p>
              </div>
            )}

            {byJurisdiction.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <TrendChart data={byJurisdiction} title="Cases by Jurisdiction" chartType="bar" />
                <p className="mt-3 text-sm text-slate-500">
                  Shows the distribution of cases across court systems. Federal jurisdiction typically involves FOIA and federal agency transparency disputes, while state jurisdiction covers sunshine law enforcement and state-level open records appeals. The balance between federal and state cases reflects where the most significant access-to-information battles are being fought.
                </p>
              </div>
            )}
          </div>

          {byState.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Cases by State</h2>
              <p className="text-sm text-slate-500 mb-4">
                Geographic distribution of public records litigation. States with higher case counts often have stronger sunshine laws that encourage enforcement, more active press and advocacy organizations, or larger state governments generating more records requests. States with fewer cases may have weaker open records statutes or limited legal avenues for challenging denials.
              </p>
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
