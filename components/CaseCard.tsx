import Link from 'next/link';

interface CaseCardCase {
  id: string;
  case_name: string;
  court_name: string;
  date_filed: string | null;
  jurisdiction_type: string;
  category: string;
  matched_keywords: string[];
  snippet?: string;
  source_url: string;
  state?: string;
  docket_number?: string;
}

interface CaseCardProps {
  case: CaseCardCase;
}

const CATEGORY_COLORS: Record<string, string> = {
  foia: 'bg-[#93C8F7] text-sunshine-800 border-sunshine-300',
  sunshine: 'bg-gold-100 text-gold-800 border-gold-200',
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

function formatDate(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return text.slice(0, maxLength).trimEnd() + '...';
}

export default function CaseCard({ case: caseData }: CaseCardProps) {
  const categoryClass = CATEGORY_COLORS[caseData.category] || CATEGORY_COLORS.other;
  const snippet = caseData.snippet ? truncate(stripHtml(caseData.snippet), 250) : '';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/case/${caseData.id}`} className="text-base font-semibold text-slate-900 hover:text-gold-700 transition leading-snug">
            {caseData.case_name}
          </Link>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-slate-500">
            <span>{caseData.court_name}</span>
            {caseData.date_filed && (
              <>
                <span className="text-slate-300">&middot;</span>
                <span>{formatDate(caseData.date_filed)}</span>
              </>
            )}
            {caseData.state && (
              <>
                <span className="text-slate-300">&middot;</span>
                <span>{caseData.state}</span>
              </>
            )}
            {caseData.docket_number && (
              <>
                <span className="text-slate-300">&middot;</span>
                <span className="text-slate-400">No. {caseData.docket_number}</span>
              </>
            )}
            <span className="text-slate-300">&middot;</span>
            <span className="capitalize">{caseData.jurisdiction_type}</span>
          </div>
        </div>

        <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium border ${categoryClass}`}>
          {CATEGORY_LABELS[caseData.category] || caseData.category}
        </span>
      </div>

      {snippet && (
        <p className="text-sm text-slate-600 mt-3 leading-relaxed">{snippet}</p>
      )}

      {caseData.matched_keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {caseData.matched_keywords.map((kw) => (
            <span key={kw} className="px-1.5 py-0.5 bg-gold-50 text-gold-700 text-xs rounded">
              {kw}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-sm">
        <Link href={`/case/${caseData.id}`} className="text-gold-600 hover:text-gold-700 font-medium">
          View details
        </Link>
        {caseData.source_url && (
          <a href={caseData.source_url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-600">
            CourtListener
          </a>
        )}
      </div>
    </div>
  );
}
