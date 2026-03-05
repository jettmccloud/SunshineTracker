'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AnnotationForm from '@/components/AnnotationForm';
import CaseSummary from '@/components/CaseSummary';
import ExportButton from '@/components/ExportButton';

interface CaseData {
  id: string;
  courtlistener_id: string;
  case_name: string;
  court_name: string;
  court_id: string;
  jurisdiction_type: string;
  date_filed: string;
  date_decided: string;
  status: string;
  opinion_text: string;
  opinion_html: string;
  judges: string[];
  docket_number: string;
  nature_of_suit: string;
  source_url: string;
  matched_keywords: string[];
  category: string;
  state: string;
  citations: any;
  summary: any;
  annotations: Annotation[];
}

interface Annotation {
  id: string;
  note: string;
  tags: string[];
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  foia: 'FOIA Request',
  sunshine: 'Sunshine / Open Records',
  missing_data: 'Missing or Destroyed Records',
  access_denied: 'Access Denied / Withheld',
  other: 'Public Records Related',
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  foia: 'This case involves a Freedom of Information Act request at the federal level.',
  sunshine: 'This case involves state-level open records or sunshine law disputes.',
  missing_data: 'This case involves allegations of missing, destroyed, or unreleased government records.',
  access_denied: 'This case involves denial of access to public records or withheld documents.',
};

export default function CaseDetailPage() {
  const params = useParams();
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddToCollection, setShowAddToCollection] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('sunshine_token'));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/cases/${params.id}`);
        if (!res.ok) {
          setError('Case not found');
          setLoading(false);
          return;
        }
        const data = await res.json();
        // API returns flat object with annotations included
        const { annotations: anns, ...rest } = data;
        setCaseData(data);
        setAnnotations(anns || []);
      } catch (err) {
        console.error('Failed to load case:', err);
        setError('Failed to load case');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function loadCollections() {
    const token = localStorage.getItem('sunshine_token');
    if (!token) return;
    const res = await fetch('/api/collections', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setCollections(data.collections || []);
  }

  async function addToCollection(collectionId: string) {
    const token = localStorage.getItem('sunshine_token');
    await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'add_case', collection_id: collectionId, case_id: params.id }),
    });
    setShowAddToCollection(false);
  }

  async function handleAnnotation(note: string, tags: string[]) {
    const token = localStorage.getItem('sunshine_token');
    if (!token) return;
    const res = await fetch('/api/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ case_id: params.id, note, tags }),
    });
    const data = await res.json();
    if (data.annotation) {
      setAnnotations([data.annotation, ...annotations]);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl text-slate-600">{error || 'Case not found'}</h2>
        <Link href="/search" className="text-[#8E6400] hover:underline mt-2 inline-block">
          Back to search
        </Link>
      </div>
    );
  }

  const filedDate = caseData.date_filed ? new Date(caseData.date_filed).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/search" className="text-sm text-[#8E6400] hover:underline mb-4 inline-block">
        &larr; Back to search results
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">{caseData.case_name}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-medium text-slate-700">{caseData.court_name || 'Court unknown'}</span>
          {filedDate && (
            <>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">{filedDate}</span>
            </>
          )}
          {caseData.docket_number && (
            <>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">No. {caseData.docket_number}</span>
            </>
          )}
        </div>

        {/* Category context — why this case matters to a journalist */}
        <div className="mt-4 p-3 bg-[#FFDB84] border border-[#FFDB84] rounded-lg">
          <span className="text-sm font-semibold text-[#8E6400]">{CATEGORY_LABELS[caseData.category] || 'Public Records'}</span>
          <p className="text-sm text-[#8E6400] mt-0.5">
            {CATEGORY_DESCRIPTIONS[caseData.category] || 'This case is related to public records access.'}
          </p>
          {caseData.matched_keywords?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {caseData.matched_keywords.map((kw) => (
                <span key={kw} className="px-2 py-0.5 bg-[#FFDB84] bg-opacity-70 text-[#8E6400] text-xs rounded font-medium">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Key details grid */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          {caseData.jurisdiction_type && (
            <div>
              <span className="text-slate-400 block text-xs uppercase tracking-wide">Jurisdiction</span>
              <span className="text-slate-800 font-medium capitalize">{caseData.jurisdiction_type}</span>
            </div>
          )}
          {caseData.state && (
            <div>
              <span className="text-slate-400 block text-xs uppercase tracking-wide">State</span>
              <span className="text-slate-800 font-medium">{caseData.state}</span>
            </div>
          )}
          {caseData.judges?.length > 0 && caseData.judges[0] && (
            <div>
              <span className="text-slate-400 block text-xs uppercase tracking-wide">Judge(s)</span>
              <span className="text-slate-800 font-medium">{caseData.judges.join(', ')}</span>
            </div>
          )}
          {caseData.status && (
            <div>
              <span className="text-slate-400 block text-xs uppercase tracking-wide">Status</span>
              <span className="text-slate-800 font-medium">{caseData.status}</span>
            </div>
          )}
          {caseData.nature_of_suit && (
            <div className="col-span-2">
              <span className="text-slate-400 block text-xs uppercase tracking-wide">Nature of Suit</span>
              <span className="text-slate-800 font-medium">{caseData.nature_of_suit}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-slate-100">
          {caseData.source_url && (
            <a
              href={caseData.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm bg-slate-800 text-white rounded hover:bg-slate-900 transition"
            >
              Read Full Opinion on CourtListener
            </a>
          )}
          {isLoggedIn && (
            <button
              onClick={() => { setShowAddToCollection(!showAddToCollection); if (!showAddToCollection) loadCollections(); }}
              className="px-4 py-2 text-sm bg-[#FFDB84] bg-opacity-70 text-[#8E6400] rounded hover:bg-[#FFDB84] transition"
            >
              Save to Collection
            </button>
          )}
          <ExportButton params={{ case_id: caseData.id, format: 'report' }} label="Download Report" />
          <ExportButton params={{ case_id: caseData.id, format: 'foia' }} label="Generate FOIA Template" />
        </div>

        {showAddToCollection && (
          <div className="mt-4 p-4 bg-[#FFDB84] rounded-lg">
            <h3 className="font-medium text-sm mb-2">Select a collection:</h3>
            {collections.length > 0 ? (
              <div className="space-y-2">
                {collections.map((col) => (
                  <button key={col.id} onClick={() => addToCollection(col.id)} className="block w-full text-left px-3 py-2 text-sm bg-white rounded border hover:border-[#FFDB84] transition">
                    {col.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No collections yet. <Link href="/collections" className="text-[#8E6400] hover:underline">Create one</Link></p>
            )}
          </div>
        )}
      </div>

      {/* AI Summary */}
      {caseData.summary && <CaseSummary summary={caseData.summary} />}

      {/* Opinion text */}
      {(caseData.opinion_html || caseData.opinion_text) && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Court Opinion</h2>
          {caseData.opinion_html ? (
            <div className="prose max-w-none text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: caseData.opinion_html }} />
          ) : (
            <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">{caseData.opinion_text}</div>
          )}
        </div>
      )}

      {/* Research notes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Research Notes</h2>
        <p className="text-sm text-slate-500 mb-4">Add private notes and tags to organize your research on this case.</p>

        {isLoggedIn && (
          <div className="mb-6">
            <AnnotationForm caseId={caseData.id} onSubmit={handleAnnotation} />
          </div>
        )}

        {annotations.length > 0 ? (
          <div className="space-y-4">
            {annotations.map((ann) => (
              <div key={ann.id} className="border border-slate-200 rounded p-4">
                <p className="text-sm text-slate-700">{ann.note}</p>
                {ann.tags?.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {ann.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-2">{new Date(ann.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">{isLoggedIn ? 'No notes yet. Add one above to track your research.' : 'Log in to add research notes.'}</p>
        )}
      </div>
    </div>
  );
}
