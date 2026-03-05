'use client';

import { CaseSummary as CaseSummaryType } from '@/lib/types';

interface CaseSummaryProps {
  summary: CaseSummaryType;
}

const SEVERITY_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  high: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', icon: 'text-red-600' },
  medium: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800', icon: 'text-amber-600' },
  low: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800', icon: 'text-blue-600' },
};

export default function CaseSummary({ summary }: CaseSummaryProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">AI Case Summary</h2>
        <span className="text-xs text-slate-400">
          {summary.method === 'claude_api' ? 'Claude AI' : 'Automated extraction'} &middot;{' '}
          {new Date(summary.generated_at).toLocaleDateString()}
        </span>
      </div>

      {/* Flags — most prominent */}
      {summary.flags.length > 0 && (
        <div className="mb-5 space-y-2">
          {summary.flags.map((flag, i) => {
            const colors = SEVERITY_COLORS[flag.severity] || SEVERITY_COLORS.low;
            return (
              <div key={i} className={`${colors.bg} ${colors.border} border rounded-lg p-3`}>
                <div className="flex items-center gap-2">
                  <svg className={`h-4 w-4 ${colors.icon} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className={`font-semibold text-sm ${colors.text}`}>{flag.label}</span>
                </div>
                <p className={`text-sm ${colors.text} mt-1 ml-6 opacity-80`}>{flag.description}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Key Facts */}
      {summary.key_facts.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Key Facts</h3>
          <ul className="space-y-1">
            {summary.key_facts.map((fact, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-slate-400 flex-shrink-0">&bull;</span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Outcome */}
      {summary.outcome && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Outcome</h3>
          <p className="text-sm text-slate-600 bg-slate-50 rounded p-3">{summary.outcome}</p>
        </div>
      )}

      {/* Parties */}
      {summary.parties.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Parties</h3>
          <div className="flex flex-wrap gap-1.5">
            {summary.parties.map((party, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full">{party}</span>
            ))}
          </div>
        </div>
      )}

      {/* Legal Issues */}
      {summary.legal_issues.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Legal Issues</h3>
          <div className="flex flex-wrap gap-1.5">
            {summary.legal_issues.map((issue, i) => (
              <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">{issue}</span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {summary.timeline.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Timeline</h3>
          <div className="space-y-2 border-l-2 border-slate-200 pl-4">
            {summary.timeline.map((event, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[21px] top-1.5 w-2 h-2 bg-slate-400 rounded-full" />
                <p className="text-xs text-slate-400 font-medium">{event.date}</p>
                <p className="text-sm text-slate-600">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
