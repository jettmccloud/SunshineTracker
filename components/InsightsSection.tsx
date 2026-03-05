import Link from 'next/link';

interface InsightItem {
  label: string;
  count: number;
  court_id?: string;
}

interface InsightsSectionProps {
  courts: InsightItem[];
  judges: InsightItem[];
  keywords: InsightItem[];
}

export default function InsightsSection({ courts, judges, keywords }: InsightsSectionProps) {
  if (courts.length === 0 && judges.length === 0 && keywords.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Most Active Courts */}
      <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#004681]">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Most Active Courts</h3>
        {courts.length > 0 ? (
          <div className="space-y-2">
            {courts.slice(0, 5).map((item) => (
              <Link
                key={item.label}
                href={`/search?court=${item.court_id || ''}`}
                className="flex items-center justify-between py-1 hover:text-[#004681] transition text-sm"
              >
                <span className="text-slate-700 truncate mr-2">{item.label}</span>
                <span className="text-slate-500 font-mono text-xs shrink-0">{item.count}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No court data yet</p>
        )}
      </div>

      {/* Most Active Judges */}
      <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#09718E]">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Most Active Judges</h3>
        {judges.length > 0 ? (
          <div className="space-y-2">
            {judges.slice(0, 5).map((item) => (
              <Link
                key={item.label}
                href={`/search?q=${encodeURIComponent(item.label)}`}
                className="flex items-center justify-between py-1 hover:text-[#09718E] transition text-sm"
              >
                <span className="text-slate-700 truncate mr-2">{item.label}</span>
                <span className="text-slate-500 font-mono text-xs shrink-0">{item.count}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No judge data yet</p>
        )}
      </div>

      {/* Common Legal Topics */}
      <div className="bg-white rounded-lg shadow p-5 border-l-4 border-[#FFDB84]">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Common Legal Topics</h3>
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {keywords.slice(0, 10).map((item) => (
              <Link
                key={item.label}
                href={`/search?q=${encodeURIComponent(item.label)}`}
                className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFDB84] text-[#8E6400] hover:bg-[#f5cf6e] transition"
              >
                {item.label} ({item.count})
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No keyword data yet</p>
        )}
      </div>
    </div>
  );
}
