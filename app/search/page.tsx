'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import FilterPanel from '@/components/FilterPanel';
import CaseCard from '@/components/CaseCard';
import ExportButton from '@/components/ExportButton';
import type { SearchFilters } from '@/lib/types';

interface CaseResult {
  id: string;
  case_name: string;
  court_name: string;
  date_filed: string;
  jurisdiction_type: string;
  category: string;
  matched_keywords: string[];
  snippet?: string;
  source_url: string;
  state: string;
}

function SearchPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [cases, setCases] = useState<CaseResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [filters, setFilters] = useState<SearchFilters>({
    jurisdiction_type: searchParams.get('jurisdiction_type') || '',
    state: searchParams.get('state') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
  });

  const perPage = 20;

  const doSearch = useCallback(async (q: string, cat: string, f: SearchFilters, p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (cat) params.set('category', cat);
      if (f.jurisdiction_type) params.set('jurisdiction_type', f.jurisdiction_type);
      if (f.state) params.set('state', f.state);
      if (f.date_from) params.set('date_from', f.date_from);
      if (f.date_to) params.set('date_to', f.date_to);
      params.set('page', String(p));
      params.set('per_page', String(perPage));

      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      setCases(data.cases || []);
      setTotal(data.total || 0);

      router.replace(`/search?${params}`, { scroll: false });
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const cat = searchParams.get('category') || '';
    const hasFilters = filters.jurisdiction_type || filters.state || filters.date_from || filters.date_to;
    if (q || cat || hasFilters) {
      doSearch(q, cat, filters, 1);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSearch(q: string, cat?: string) {
    setQuery(q);
    setCategory(cat || '');
    setPage(1);
    doSearch(q, cat || '', filters, 1);
  }

  function handleFilter(f: SearchFilters) {
    setFilters(f);
    setPage(1);
    doSearch(query, category, f, 1);
  }

  function handlePage(p: number) {
    setPage(p);
    doSearch(query, category, filters, p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Search Cases</h1>

      <SearchBar onSearch={handleSearch} initialQuery={query} initialCategory={category} />

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        <aside className="lg:w-64 shrink-0">
          <FilterPanel onFilter={handleFilter} initialFilters={filters} />
        </aside>

        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-600">
                  {total > 0 ? `${total} results` : (query || category) ? 'No results found' : 'Search by keyword, or use the category buttons and filters to browse'}
                </p>
                {cases.length > 0 && (
                  <ExportButton params={{ q: query, category, ...filters }} />
                )}
              </div>

              <div className="space-y-4">
                {cases.map((c) => (
                  <CaseCard key={c.id} case={c} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePage(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-2 text-sm rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePage(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-2 text-sm rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}
