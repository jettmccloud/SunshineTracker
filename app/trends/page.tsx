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
                const currentYear = new Date().getFullYear().toString();
                const currentYearData = sorted.find(d => d.label === currentYear);
                const lastYear = (new Date().getFullYear() - 1).toString();
                const lastYearData = sorted.find(d => d.label === lastYear);
                const mostRecentWithData = [...sorted].reverse().find(d => d.count > 0);
                return (
                  <>
                    <div className="mt-4 p-4 bg-[#FFDB84] rounded-lg border border-[#FFDB84]">
                      <h3 className="text-sm font-semibold text-[#8E6400] mb-2">Trend Insight</h3>
                      <p className="text-sm text-[#8E6400] leading-relaxed">
                        {pctChange > 10
                          ? `Recent filings are up roughly ${Math.round(pctChange)}% compared to earlier periods. This isn't just more lawsuits — it signals that government agencies are pushing back harder on records requests, forcing requesters into court. Across the country, agencies have been expanding their use of broad exemptions, imposing prohibitive fees, and blowing past statutory response deadlines. At the federal level, FOIA backlogs have grown even as agencies report higher request volumes. At the state level, legislatures in several states have introduced bills to narrow the scope of public records laws or add new carve-outs for law enforcement and cybersecurity records. When agencies make it harder to get records voluntarily, litigation becomes the only option — and that's what this trend reflects.`
                          : pctChange < -10
                          ? `Recent filings are down roughly ${Math.round(Math.abs(pctChange))}% compared to earlier periods — but fewer lawsuits doesn't necessarily mean better transparency. The decline more likely reflects the rising cost of litigation: hiring attorneys, paying court fees, and waiting years for resolution discourages all but the most well-funded requesters. Newsroom budget cuts have gutted the capacity of local and regional outlets to sue for records. Meanwhile, some agencies have shifted to informal stalling tactics — acknowledging requests but producing records so slowly that litigation feels futile. The drop may also reflect a chilling effect from recent court rulings that expanded government exemptions, making some cases harder to win and discouraging attorneys from taking them on.`
                          : `Filing rates have held relatively steady, which tells its own story: the underlying tension between public access rights and government resistance to disclosure hasn't eased. Agencies continue to deny, delay, and redact records at consistent rates, and requesters — journalists, advocacy groups, and citizens — continue to fight back in court at the same pace. A flat trend line means the system isn't improving. The same battles over the same types of exemptions keep producing the same volume of litigation year after year.`}
                      </p>
                    </div>

                    <div className="mt-4 bg-white border border-slate-200 rounded-lg p-5">
                      <h3 className="text-sm font-semibold text-slate-800 mb-3">Peak Year: {peak.label}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">
                        {peak.label} saw the highest volume of public records litigation in the dataset with {peak.count} case{peak.count !== 1 ? 's' : ''} filed.
                        {parseInt(peak.label) >= 2016 && parseInt(peak.label) <= 2018
                          ? ` This period coincided with heightened scrutiny of government transparency following the 2016 election cycle. Journalists, advocacy organizations, and watchdog groups significantly increased their use of FOIA and state open records laws to investigate government activities, leading to a surge in litigation when agencies resisted disclosure. Federal agencies in particular faced an unprecedented volume of records requests, and many of the resulting lawsuits challenged blanket denials, excessive redactions, and missed response deadlines.`
                          : parseInt(peak.label) >= 2020 && parseInt(peak.label) <= 2021
                          ? ` This spike likely reflects pandemic-era transparency battles. Government agencies faced intense public scrutiny over COVID-19 response decisions, emergency spending, and public health data. Many agencies cited operational disruptions to justify delays, while journalists and advocates pushed back with litigation to force disclosure of critical public health and government spending records.`
                          : ` This peak may reflect a confluence of factors including legislative changes, increased media scrutiny, or a wave of government resistance to disclosure that prompted legal challenges. Reporters should examine the specific cases from this year to identify what agencies were being sued, what records were at stake, and whether court outcomes favored public access.`}
                      </p>
                      <a
                        href={`/search?date_from=${peak.label}-01-01&date_to=${peak.label}-12-31`}
                        className="inline-block px-3 py-1.5 bg-[#93C8F7] text-sunshine-800 text-xs font-medium rounded hover:shadow transition"
                      >
                        Browse all {peak.count} cases from {peak.label} &rarr;
                      </a>
                    </div>

                    {mostRecentWithData && mostRecentWithData.label !== peak.label && (
                      <div className="mt-4 bg-white border border-slate-200 rounded-lg p-5">
                        <h3 className="text-sm font-semibold text-slate-800 mb-3">
                          {currentYearData && currentYearData.count > 0 ? `Current Year: ${currentYear}` : `Most Recent: ${mostRecentWithData.label}`}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed mb-3">
                          {currentYearData && currentYearData.count > 0 ? (
                            <>
                              So far in {currentYear}, there {currentYearData.count === 1 ? 'has been' : 'have been'} {currentYearData.count} case{currentYearData.count !== 1 ? 's' : ''} filed
                              {lastYearData ? ` compared to ${lastYearData.count} in all of ${lastYear}` : ''}.
                              {currentYearData.count >= peak.count
                                ? ` This year is already on pace to match or exceed the peak year of ${peak.label}, signaling an intensifying wave of transparency litigation. Journalists should be tracking these cases closely — a surge in filings often precedes major court decisions that reshape how agencies handle records requests.`
                                : currentYearData.count >= (peak.count * 0.5)
                                ? ` The pace of filings suggests this could be an active year for public records litigation. This level of activity indicates ongoing tensions between government agencies and those seeking transparency, and new rulings from these cases could affect how records requests are handled going forward.`
                                : ` While the year is still early, the current pace of filings reflects continued engagement with public records law. Reporters should watch whether filings accelerate — election years and major policy shifts typically drive increased transparency demands.`}
                            </>
                          ) : (
                            <>
                              The most recent year with case data is {mostRecentWithData.label}, which saw {mostRecentWithData.count} case{mostRecentWithData.count !== 1 ? 's' : ''} filed.
                              {mostRecentWithData.count > earlierAvg
                                ? ` This is above the historical average, suggesting sustained or growing demand for government transparency through litigation. Reporters should examine whether these cases are concentrated in specific jurisdictions or involve particular agencies.`
                                : mostRecentWithData.count < earlierAvg * 0.5
                                ? ` This is well below the historical average, which could indicate that agencies are complying more readily with records requests, or that advocacy groups have fewer resources to pursue litigation. It may also reflect a lag in case data — recently filed cases may not yet appear in the database.`
                                : ` This is in line with historical averages, suggesting a steady baseline of public records enforcement activity.`}
                            </>
                          )}
                        </p>
                        <a
                          href={`/search?date_from=${currentYearData && currentYearData.count > 0 ? currentYear : mostRecentWithData.label}-01-01&date_to=${currentYearData && currentYearData.count > 0 ? currentYear : mostRecentWithData.label}-12-31`}
                          className="inline-block px-3 py-1.5 bg-[#93C8F7] text-sunshine-800 text-xs font-medium rounded hover:shadow transition"
                        >
                          Browse {currentYearData && currentYearData.count > 0 ? currentYear : mostRecentWithData.label} cases &rarr;
                        </a>
                      </div>
                    )}
                  </>
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
                  Shows case distribution across court systems. Federal cases typically involve FOIA and agency transparency disputes; state cases cover sunshine laws and open records appeals. The federal-state balance reveals where major access-to-information battles occur.
                </p>
                {(() => {
                  const sorted = [...byJurisdiction].sort((a, b) => b.count - a.count);
                  const top = sorted[0];
                  const second = sorted[1];
                  if (!top || !second || top.count === second.count) return null;
                  const ratio = (top.count / Math.max(1, second.count)).toFixed(1);
                  const topIsState = top.label.toLowerCase().includes('state');
                  return (
                    <div className="mt-4 p-4 bg-[#FFDB84] rounded-lg border border-[#FFDB84]">
                      <h3 className="text-sm font-semibold text-[#8E6400] mb-2">Jurisdiction Disparity</h3>
                      <p className="text-sm text-[#8E6400] leading-relaxed">
                        {topIsState
                          ? `State-level cases outnumber federal cases by a ${ratio}:1 ratio (${top.count} state vs. ${second.count} federal). This disparity suggests that the majority of public records battles are being fought under state sunshine laws and open records acts rather than federal FOIA. For journalists, this means state courts are the primary venue for transparency enforcement — and that state-level rulings, which often receive less national attention, may have the greatest practical impact on government accountability in your coverage area.`
                          : `Federal cases outnumber state cases by a ${ratio}:1 ratio (${top.count} federal vs. ${second.count} state). This indicates that FOIA litigation at the federal level dominates the public records landscape. Federal agencies may be more resistant to disclosure, or federal courts may be the preferred venue for challenging government secrecy. Journalists covering federal agencies should pay close attention to these cases, as they often set precedents that influence how agencies nationwide handle records requests.`}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {sorted.map((item) => (
                          <a
                            key={item.label}
                            href={`/search?jurisdiction_type=${item.label}`}
                            className="inline-block px-3 py-1 bg-white text-[#8E6400] text-xs font-medium rounded hover:shadow transition"
                          >
                            Browse {item.count} {item.label} case{item.count !== 1 ? 's' : ''} &rarr;
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}
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
