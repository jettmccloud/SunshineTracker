'use client';

import { useState } from 'react';
import { CachedCase, Annotation } from '@/lib/types';

interface CaseDetailProps {
  caseData: CachedCase;
  annotations: Annotation[];
}

export default function CaseDetail({ caseData, annotations }: CaseDetailProps) {
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [addingToCollection, setAddingToCollection] = useState(false);

  const handleAddToCollection = async () => {
    const token = localStorage.getItem('sunshine_token');
    if (!token) {
      window.location.href = '/auth/login';
      return;
    }

    try {
      const res = await fetch('/api/collections', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCollections(data.collections || []);
        setShowCollectionModal(true);
      }
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  };

  const handleSelectCollection = async (collectionId: string) => {
    const token = localStorage.getItem('sunshine_token');
    if (!token) return;

    setAddingToCollection(true);
    try {
      await fetch(`/api/collections/${collectionId}/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ case_id: caseData.id }),
      });
      setShowCollectionModal(false);
    } catch (err) {
      console.error('Failed to add to collection:', err);
    } finally {
      setAddingToCollection(false);
    }
  };

  const metadataFields = [
    { label: 'Court', value: caseData.court_name },
    { label: 'Judges', value: caseData.judges?.join(', ') || 'N/A' },
    { label: 'Docket Number', value: caseData.docket_number || 'N/A' },
    { label: 'Date Filed', value: caseData.date_filed ? new Date(caseData.date_filed).toLocaleDateString() : 'N/A' },
    { label: 'Date Decided', value: caseData.date_decided ? new Date(caseData.date_decided).toLocaleDateString() : 'N/A' },
    { label: 'Status', value: caseData.status || 'N/A' },
    { label: 'Jurisdiction', value: caseData.jurisdiction_type },
    { label: 'Category', value: caseData.category },
    { label: 'State', value: caseData.state || 'N/A' },
    { label: 'Nature of Suit', value: caseData.nature_of_suit || 'N/A' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">
        {caseData.case_name}
      </h1>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleAddToCollection}
          className="bg-sunshine-500 hover:bg-sunshine-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Add to Collection
        </button>
        {caseData.source_url && (
          <a
            href={caseData.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            View on CourtListener
          </a>
        )}
      </div>

      {/* Metadata Grid */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Case Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metadataFields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                {field.label}
              </dt>
              <dd className="mt-1 text-sm text-slate-800">{field.value}</dd>
            </div>
          ))}
        </div>
      </div>

      {/* Matched Keywords */}
      {caseData.matched_keywords && caseData.matched_keywords.length > 0 && (
        <div className="bg-sunshine-50 border border-sunshine-200 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold text-sunshine-800 mb-3">Matched Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {caseData.matched_keywords.map((keyword) => (
              <span
                key={keyword}
                className="bg-sunshine-100 text-sunshine-700 border border-sunshine-300 px-3 py-1 rounded-full text-sm font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Opinion Text */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Opinion</h2>
        {caseData.opinion_html ? (
          <div
            className="prose prose-slate max-w-none text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: caseData.opinion_html }}
          />
        ) : (
          <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
            {caseData.opinion_text || 'No opinion text available.'}
          </p>
        )}
      </div>

      {/* Annotations Section */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Annotations ({annotations.length})
        </h2>
        {annotations.length > 0 ? (
          <div className="space-y-4">
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                className="border-l-4 border-sunshine-400 pl-4 py-2"
              >
                <p className="text-sm text-slate-700">{annotation.note}</p>
                {annotation.tags && annotation.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {annotation.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(annotation.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No annotations yet.</p>
        )}
      </div>

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Add to Collection
            </h3>
            {collections.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {collections.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => handleSelectCollection(col.id)}
                    disabled={addingToCollection}
                    className="w-full text-left px-4 py-3 rounded-md border border-slate-200 hover:bg-sunshine-50 hover:border-sunshine-300 transition-colors text-sm font-medium text-slate-700 disabled:opacity-50"
                  >
                    {col.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No collections found. Create one from the Collections page.
              </p>
            )}
            <button
              onClick={() => setShowCollectionModal(false)}
              className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
